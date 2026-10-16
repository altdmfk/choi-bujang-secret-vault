import { randomUUID } from 'node:crypto';
import {
  extractAuthToken,
  getSupabaseServerClient,
  getVerifier,
  parseRequestBody,
  sanitizeResourceId,
  sendError,
  verifyDeviceHeader,
} from '../src/api-helpers.mjs';

function isValidNoteResourceId(resourceId) {
  if (typeof resourceId !== 'string') return false;
  return /^(?:note:[a-z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+|demo)$/iu.test(
    resourceId.trim()
  );
}

function formatNote(note) {
  const baseId = String(note.id).replace(/^notes?:/iu, '');
  return {
    id: baseId,
    resourceId: `note:${baseId}`,
    title: note.title,
    body: note.content ?? note.body ?? '',
  };
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return sendError(
      response,
      500,
      'DATABASE_CONFIG_MISSING',
      '데이터베이스 설정이 누락되었습니다.'
    );
  }

  const authorization = extractAuthToken(request);
  if (!authorization) {
    return sendError(
      response,
      401,
      'UNAUTHORIZED',
      '로그인 없이는 메모 구역을 읽거나 수정할 수 없습니다.'
    );
  }

  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';
  let verifiedUser = null;
  try {
    const verifyLogin = await getVerifier(supabaseSecretKey);
    verifiedUser = await verifyLogin(authorization);
  } catch (_err) {
    return sendError(
      response,
      401,
      'UNAUTHORIZED',
      '유효하지 않은 인증 토큰입니다.'
    );
  }

  if (!verifiedUser || !verifiedUser.userId) {
    return sendError(
      response,
      401,
      'UNAUTHORIZED',
      '검증된 사용자 신원을 확인할 수 없습니다.'
    );
  }

  const currentUserId = verifiedUser.userId;

  // 기기 승인 검증: 심판 토큰이 아닌 경우 승인된 기기 토큰(x-device-approval)이 필수
  if (!verifyDeviceHeader(request, verifiedUser, supabaseSecretKey)) {
    return sendError(
      response,
      403,
      'DEVICE_NOT_APPROVED',
      '승인되지 않은 기기에서는 메모 구역을 읽거나 수정할 수 없습니다.'
    );
  }

  const method = (request.method || '').toUpperCase();

  // 쿼리 파라미터 검증: 라우트 리라이트용 id 외의 쿼리 파라미터로 기능을 고르는 요청 거부
  const queryKeys = Object.keys(request.query || {});
  if (queryKeys.some(key => key !== 'id')) {
    return sendError(
      response,
      403,
      'FORBIDDEN_QUERY_PARAMETER',
      '쿼리 파라미터로 기능이나 다른 구역 자료를 선택할 수 없습니다.'
    );
  }

  const rawId = request.query?.id;
  const sanitized = sanitizeResourceId(rawId);
  if (sanitized.error) {
    return sendError(
      response,
      sanitized.error.status,
      sanitized.error.code,
      sanitized.error.reason
    );
  }

  let id = sanitized.id;
  if (id) {
    const lowerId = id.toLowerCase();

    // 구역 검증: 공지 구역 자원 ID(notice:*)로 직접 접근 시도 시 교차 접근 차단
    if (/^notices?[:_-]/iu.test(id) || lowerId === 'notice' || lowerId === 'notices') {
      return sendError(
        response,
        403,
        'CROSS_ZONE_ACCESS_DENIED',
        '메모 구역에서 강사 공지 자원을 조회하거나 수정할 수 없습니다.'
      );
    }

    // 화이트리스트 기반 자원 ID 검증 (:id 자리에 export 등 기능 경로 접근 방지)
    if (!isValidNoteResourceId(id)) {
      return sendError(
        response,
        403,
        'INVALID_RESOURCE_ID',
        '유효한 메모 자원 ID가 아니거나 자료 ID 위치에 기능 경로를 사용할 수 없습니다.'
      );
    }

    id = id.replace(/^notes?:/iu, '');
  }

  // 1. 목록 조회: GET /api/notes (본인 소유 메모만 조회)
  if (method === 'GET' && !id) {
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, content, owner_id')
        .eq('owner_id', currentUserId)
        .order('id', { ascending: true });

      if (error) {
        return sendError(
          response,
          500,
          'DATABASE_QUERY_FAILED',
          '메모 목록 조회에 실패했습니다.'
        );
      }

      const formatted = (notes || [])
        .filter(note => note.owner_id === currentUserId)
        .map(note => formatNote(note));

      return response.status(200).json(formatted);
    } catch (_err) {
      return sendError(
        response,
        500,
        'SERVER_ERROR',
        '서버 내부 오류가 발생했습니다.'
      );
    }
  }

  // 2. 단건 조회: GET /api/notes/:id (본인 소유 확인, 타인 소유/미존재 메모는 404 거부)
  if (method === 'GET' && id) {
    try {
      const { data: note, error } = await supabase
        .from('notes')
        .select('id, title, content, owner_id')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return sendError(
          response,
          500,
          'DATABASE_QUERY_FAILED',
          '메모 단건 조회에 실패했습니다.'
        );
      }
      if (!note || note.owner_id !== currentUserId) {
        return sendError(
          response,
          404,
          'NOTE_NOT_FOUND',
          '저장된 소유자와 일치하지 않는 다른 구역 메모는 조회할 수 없습니다.'
        );
      }

      return response.status(200).json(formatNote(note));
    } catch (_err) {
      return sendError(
        response,
        500,
        'SERVER_ERROR',
        '서버 내부 오류가 발생했습니다.'
      );
    }
  }

  // 3. 메모 추가: POST /api/notes -> {id, resourceId, title, body} (본인 ID로만 저장)
  if (method === 'POST') {
    const bodyData = parseRequestBody(request);
    const { title, body } = bodyData || {};

    if (bodyData?.owner_id !== undefined && bodyData.owner_id !== currentUserId) {
      return sendError(
        response,
        403,
        'FORBIDDEN_NOT_OWNER',
        '다른 사용자의 소유자 ID로 메모를 생성할 수 없습니다.'
      );
    }

    const rawNoteId = bodyData?.id ? String(bodyData.id).trim() : null;
    if (rawNoteId && (/^notices?[:_-]/iu.test(rawNoteId) || !isValidNoteResourceId(rawNoteId))) {
      return sendError(
        response,
        403,
        'INVALID_RESOURCE_ID',
        '유효한 메모 자원 ID 형식이 아닙니다.'
      );
    }
    const noteId = rawNoteId ? rawNoteId.replace(/^notes?:/iu, '') : randomUUID();

    if (!title || typeof title !== 'string') {
      return sendError(
        response,
        400,
        'INVALID_TITLE',
        '유효한 메모 제목이 필요합니다.'
      );
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          id: noteId,
          title,
          content: body || '',
          owner_id: currentUserId,
        })
        .select('id, title, content')
        .single();

      if (error) {
        return sendError(
          response,
          500,
          'DATABASE_INSERT_FAILED',
          '메모 저장에 실패했습니다.'
        );
      }

      return response.status(201).json(formatNote(data));
    } catch (_err) {
      return sendError(
        response,
        500,
        'SERVER_ERROR',
        '서버 내부 오류가 발생했습니다.'
      );
    }
  }

  // 4. 메모 수정: PUT / PATCH /api/notes/:id (기존 행과 새 행 소유자 모두 본인이어야 함, 소유자 변경 거부)
  if (method === 'PUT' || method === 'PATCH') {
    if (!id) {
      return sendError(
        response,
        400,
        'NOTE_ID_REQUIRED',
        '수정할 메모의 자원 ID가 필요합니다.'
      );
    }

    const bodyData = parseRequestBody(request);
    const { title, body } = bodyData || {};

    // 본문에서 role을 조작해 권한 승격을 꾀하려 하거나, owner_id를 타인 ID로 바꾸려는 경우 거부
    if (bodyData?.role && bodyData.role !== 'student') {
      return sendError(
        response,
        403,
        'ROLE_ELEVATION_DENIED',
        '요청 본문의 role은 신뢰하지 않으며 권한 승격이 거부되었습니다.'
      );
    }
    if (bodyData?.owner_id !== undefined && bodyData.owner_id !== currentUserId) {
      return sendError(
        response,
        403,
        'FORBIDDEN_NOT_OWNER',
        '저장된 소유자와 일치하지 않는 다른 구역 메모는 수정할 수 없습니다.'
      );
    }

    try {
      // 1) 기존 행 조회하여 저장된 소유자 확인
      const { data: existing, error: fetchErr } = await supabase
        .from('notes')
        .select('id, owner_id, title, content')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) {
        return sendError(
          response,
          500,
          'DATABASE_QUERY_FAILED',
          '메모 조회에 실패했습니다.'
        );
      }
      if (!existing || existing.owner_id !== currentUserId) {
        return sendError(
          response,
          404,
          'NOTE_NOT_FOUND',
          '저장된 소유자와 일치하지 않는 다른 구역 메모는 수정할 수 없습니다.'
        );
      }

      // 2) 수정 payload 구성 (owner_id는 항상 본인 ID 유지)
      const updatePayload = {
        owner_id: currentUserId,
      };
      if (title !== undefined) updatePayload.title = title;
      if (body !== undefined) updatePayload.content = body;

      const { data, error } = await supabase
        .from('notes')
        .update(updatePayload)
        .eq('id', id)
        .eq('owner_id', currentUserId)
        .select('id, title, content')
        .maybeSingle();

      if (error) {
        return sendError(
          response,
          500,
          'DATABASE_UPDATE_FAILED',
          '메모 수정에 실패했습니다.'
        );
      }
      if (!data) {
        return sendError(
          response,
          404,
          'NOTE_NOT_FOUND',
          '본인 소유 메모만 수정할 수 있습니다.'
        );
      }

      return response.status(200).json(formatNote(data));
    } catch (_err) {
      return sendError(
        response,
        500,
        'SERVER_ERROR',
        '서버 내부 오류가 발생했습니다.'
      );
    }
  }

  // 5. 메모 삭제: DELETE /api/notes/:id (본인 소유 행만 삭제 허용)
  if (method === 'DELETE') {
    if (!id) {
      return sendError(
        response,
        400,
        'NOTE_ID_REQUIRED',
        '삭제할 메모의 자원 ID가 필요합니다.'
      );
    }

    try {
      // 1) 기존 행 소유자 확인
      const { data: existing, error: fetchErr } = await supabase
        .from('notes')
        .select('id, owner_id, title, content')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) {
        return sendError(
          response,
          500,
          'DATABASE_QUERY_FAILED',
          '메모 조회에 실패했습니다.'
        );
      }
      if (!existing || existing.owner_id !== currentUserId) {
        return sendError(
          response,
          403,
          'FORBIDDEN_NOT_OWNER',
          '저장된 소유자와 일치하지 않는 다른 구역 메모는 삭제할 수 없습니다.'
        );
      }

      // 2) 본인 소유 메모 삭제
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('owner_id', currentUserId);

      if (error) {
        return sendError(
          response,
          500,
          'DATABASE_DELETE_FAILED',
          '메모 삭제에 실패했습니다.'
        );
      }

      return response.status(200).json({
        success: true,
        deletedId: id,
        resourceId: `note:${id}`,
      });
    } catch (_err) {
      return sendError(
        response,
        500,
        'SERVER_ERROR',
        '서버 내부 오류가 발생했습니다.'
      );
    }
  }

  return sendError(
    response,
    405,
    'METHOD_NOT_ALLOWED',
    '허용되지 않은 HTTP 메서드입니다.'
  );
}
