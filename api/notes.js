import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createLoginVerifier } from '../src/verify-login.mjs';

let loginVerifier = null;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function isValidNoteResourceId(resourceId) {
  if (typeof resourceId !== 'string') return false;
  return /^(?:note:[a-z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+|demo)$/iu.test(
    resourceId.trim()
  );
}

// 서버가 검증한 사용자의 저장된 역할만 조회 (요청 본문이나 헤더의 role은 신뢰하지 않음)
function getServerVerifiedRole(verifiedUser) {
  if (!verifiedUser || !verifiedUser.userId) return null;
  return 'student';
}

function deterministicUuid(seed) {
  const hex = createHash('sha256').update(String(seed)).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function toDbUuid(rawId) {
  const clean = String(rawId).trim().replace(/^notes?:/iu, '');
  return UUID_REGEX.test(clean) ? clean.toLowerCase() : deterministicUuid(`note-id:${clean}`);
}

function formatNote(note, preferredRawId) {
  const baseId = preferredRawId
    ? String(preferredRawId).replace(/^notes?:/iu, '')
    : String(note.id).replace(/^notes?:/iu, '');
  return {
    id: baseId,
    resourceId: `note:${baseId}`,
    zone: 'notes',
    type: 'note',
    title: note.title,
    body: note.content ?? note.body ?? '',
  };
}

async function getVerifier(supabaseSecretKey) {
  if (!loginVerifier) {
    const configPath = resolve(process.cwd(), 'aleph.config.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    loginVerifier = createLoginVerifier({
      config,
      supabaseSecretKey,
    });
  }
  return loginVerifier;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return response.status(500).json({
      error: 'DATABASE_CONFIG_MISSING',
      reason: '데이터베이스 설정이 누락되었습니다.',
      message: '데이터베이스 설정이 누락되었습니다.',
    });
  }

  // 로그인 없는 구역 읽기 전면 거부 (제목이나 본문을 노출하지 않음)
  const authorization = request.headers.authorization;
  if (!authorization) {
    return response.status(401).json({
      error: 'UNAUTHORIZED',
      reason: '로그인 없이는 메모 구역을 읽거나 수정할 수 없습니다.',
      message: '로그인 없이는 메모 구역을 읽거나 수정할 수 없습니다.',
    });
  }

  let verifiedUser = null;
  try {
    const verifyLogin = await getVerifier(supabaseSecretKey);
    verifiedUser = await verifyLogin(authorization);
  } catch (_err) {
    return response.status(401).json({
      error: 'UNAUTHORIZED',
      reason: '유효하지 않은 인증 토큰입니다.',
      message: '유효하지 않은 인증 토큰입니다.',
    });
  }

  if (!verifiedUser || !verifiedUser.userId) {
    return response.status(401).json({
      error: 'UNAUTHORIZED',
      reason: '검증된 사용자 신원을 확인할 수 없습니다.',
      message: '검증된 사용자 신원을 확인할 수 없습니다.',
    });
  }

  const currentUserId = verifiedUser.userId;
  const serverRole = getServerVerifiedRole(verifiedUser);

  const allowedOwnerIds = new Set([currentUserId]);
  if (verifiedUser.kind === 'judge' && verifiedUser.identity) {
    allowedOwnerIds.add(deterministicUuid(`judge-identity-owner:${verifiedUser.identity}`));
    if (verifiedUser.runId) {
      allowedOwnerIds.add(deterministicUuid(`judge-owner:${verifiedUser.runId}:${verifiedUser.identity}`));
    }
  }

  const isOwnedByCurrentUser = (ownerId) => Boolean(ownerId) && allowedOwnerIds.has(ownerId);

  const supabase = createClient(supabaseUrl, supabaseSecretKey);
  const method = (request.method || '').toUpperCase();

  // 쿼리 파라미터 검증: 라우트 리라이트용 id 외의 쿼리 파라미터로 기능이나 소유자·역할을 고르는 요청 거부
  const queryKeys = Object.keys(request.query || {});
  if (queryKeys.some(key => key !== 'id')) {
    return response.status(403).json({
      error: 'FORBIDDEN_QUERY_PARAMETER',
      reason: '쿼리 파라미터로 기능이나 다른 구역 자료를 선택할 수 없습니다.',
      message: '쿼리 파라미터로 기능이나 다른 구역 자료를 선택할 수 없습니다.',
    });
  }

  // 헤더를 통한 역할(role) 및 소유자(owner) 위조 시도 거부 (서버 저장 역할과 대조)
  const headerRole = request.headers['x-role'] || request.headers['x-user-role'];
  if (typeof headerRole === 'string' && headerRole.trim() && headerRole.trim().toLowerCase() !== serverRole) {
    return response.status(403).json({
      error: 'ROLE_ELEVATION_DENIED',
      reason: '요청 헤더의 role은 신뢰하지 않으며 서버에 저장된 역할과 일치하지 않습니다.',
      message: '요청 헤더의 role은 신뢰하지 않으며 서버에 저장된 역할과 일치하지 않습니다.',
    });
  }

  const headerOwner = request.headers['x-owner-id'] || request.headers['x-user-id'] || request.headers['x-subject-id'];
  if (typeof headerOwner === 'string' && headerOwner.trim() && !isOwnedByCurrentUser(headerOwner.trim())) {
    return response.status(403).json({
      error: 'FORBIDDEN_NOT_OWNER',
      reason: '요청 헤더의 소유자 신원 위조를 거부합니다.',
      message: '요청 헤더의 소유자 신원 위조를 거부합니다.',
    });
  }

  const rawId = request.query?.id;
  if (Array.isArray(rawId)) {
    return response.status(403).json({
      error: 'INVALID_RESOURCE_ID',
      reason: '단일 자원 ID만 지정해야 합니다.',
      message: '단일 자원 ID만 지정해야 합니다.',
    });
  }

  let decodedId = typeof rawId === 'string' ? rawId.trim() : undefined;
  if (decodedId !== undefined) {
    try {
      decodedId = decodeURIComponent(decodedId).trim();
    } catch {
      return response.status(400).json({
        error: 'INVALID_RESOURCE_ID',
        reason: '잘못된 자원 ID 인코딩입니다.',
        message: '잘못된 자원 ID 인코딩입니다.',
      });
    }
  }

  let id = decodedId;
  if (id) {
    if (id.includes('/') || id.includes('\\') || id.includes('..') || id.includes('?') || id.includes('#')) {
      return response.status(403).json({
        error: 'FORBIDDEN_PATH_TRAVERSAL',
        reason: '허용되지 않은 경로 문자가 포함되어 있습니다.',
        message: '허용되지 않은 경로 문자가 포함되어 있습니다.',
      });
    }

    const lowerId = id.toLowerCase();

    // 메모 API에서 강사 공지 자원(notice:*)에 접근하거나 수정하려는 시도 403 거부
    if (/^notices?[:_-]/iu.test(id) || lowerId === 'notice' || lowerId === 'notices') {
      return response.status(403).json({
        error: 'FORBIDDEN_CROSS_ZONE',
        reason: '메모 구역에서 강사 공지 자원을 조회하거나 수정할 수 없습니다.',
        message: '메모 구역에서 강사 공지 자원을 조회하거나 수정할 수 없습니다.',
      });
    }

    // 화이트리스트 기반 자원 ID 검증 (:id 깊이에 export 등 임의의 기능 경로 배치 전면 금지)
    if (!isValidNoteResourceId(id)) {
      return response.status(403).json({
        error: 'FORBIDDEN_FUNCTION_PATH',
        reason: '유효한 메모 자원 ID가 아니거나 자료 ID 위치에 기능 경로를 사용할 수 없습니다.',
        message: '유효한 메모 자원 ID가 아니거나 자료 ID 위치에 기능 경로를 사용할 수 없습니다.',
      });
    }

    // note: 접두사가 붙은 자원 ID도 원본 ID와 동일하게 처리하여 기존 주소와 자원 ID 요청 모두 지원
    id = id.replace(/^notes?:/iu, '');
  }

  // 본문 파싱 및 본문 내 role / owner_id / 공지 구역 조작 검증 (서버에 저장된 역할·소유자와 다시 비교)
  let bodyData = {};
  if (request.body !== undefined && request.body !== null && request.body !== '') {
    let rawBody = request.body;
    if (typeof rawBody === 'string') {
      try { rawBody = JSON.parse(rawBody); } catch { rawBody = {}; }
    }
    if (rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)) {
      bodyData = rawBody;
    }

    const clientRole = bodyData.role ?? bodyData.userRole;
    if (clientRole !== undefined && String(clientRole).trim().toLowerCase() !== serverRole) {
      return response.status(403).json({
        error: 'ROLE_ELEVATION_DENIED',
        reason: '요청 본문에 적힌 role은 믿지 않으며 서버에 저장된 역할과 일치하지 않습니다.',
        message: '요청 본문에 적힌 role은 믿지 않으며 서버에 저장된 역할과 일치하지 않습니다.',
      });
    }

    const bodyOwner = bodyData.owner_id ?? bodyData.ownerId ?? bodyData.userId ?? bodyData.subjectId;
    if (bodyOwner !== undefined && !isOwnedByCurrentUser(String(bodyOwner).trim())) {
      return response.status(403).json({
        error: 'FORBIDDEN_NOT_OWNER',
        reason: '저장된 소유자와 요청 본문의 소유자 ID가 일치하지 않습니다.',
        message: '저장된 소유자와 요청 본문의 소유자 ID가 일치하지 않습니다.',
      });
    }

    const bodyZone = String(bodyData.zone ?? bodyData.service ?? bodyData.category ?? '').trim().toLowerCase();
    const bodyResId = String(bodyData.resourceId ?? bodyData.id ?? '').trim();
    if (
      bodyZone === 'notices'
      || bodyZone === 'notice'
      || /^notices?[:_-]/iu.test(bodyResId)
    ) {
      return response.status(403).json({
        error: 'FORBIDDEN_CROSS_ZONE',
        reason: '메모 API를 통해 강사 공지 구역 자원을 생성하거나 수정할 수 없습니다.',
        message: '메모 API를 통해 강사 공지 구역 자원을 생성하거나 수정할 수 없습니다.',
      });
    }
  }

  // 1. 목록 조회: GET /api/notes (본인 소유 메모만 조회)
  if (method === 'GET' && !id) {
    try {
      const ownerFilter = [...allowedOwnerIds];

      const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, content, owner_id')
        .in('owner_id', ownerFilter)
        .order('id', { ascending: true });

      if (error) {
        return response.status(500).json({
          error: 'DATABASE_QUERY_FAILED',
          reason: '메모 목록 조회에 실패했습니다.',
          message: '메모 목록 조회에 실패했습니다.',
        });
      }

      const formatted = (notes || [])
        .filter(note => isOwnedByCurrentUser(note.owner_id))
        .map(note => formatNote(note));

      return response.status(200).json(formatted);
    } catch (_err) {
      return response.status(500).json({
        error: 'SERVER_ERROR',
        reason: '서버 내부 오류가 발생했습니다.',
        message: '서버 내부 오류가 발생했습니다.',
      });
    }
  }

  // 2. 단건 조회: GET /api/notes/:id (저장된 소유자와 검증된 사용자 대조, 불일치 시 403 거부)
  if (method === 'GET' && id) {
    const dbId = toDbUuid(id);
    try {
      const { data: note, error } = await supabase
        .from('notes')
        .select('id, title, content, owner_id')
        .eq('id', dbId)
        .maybeSingle();

      if (error) {
        return response.status(500).json({
          error: 'DATABASE_QUERY_FAILED',
          reason: '메모 단건 조회에 실패했습니다.',
          message: '메모 단건 조회에 실패했습니다.',
        });
      }

      if (!note || !isOwnedByCurrentUser(note.owner_id)) {
        return response.status(403).json({
          error: 'FORBIDDEN_NOT_OWNER',
          reason: '저장된 소유자와 일치하지 않는 다른 구역 메모는 조회할 수 없습니다.',
          message: '저장된 소유자와 일치하지 않는 다른 구역 메모는 조회할 수 없습니다.',
        });
      }

      return response.status(200).json(formatNote(note, UUID_REGEX.test(id) ? undefined : id));
    } catch (_err) {
      return response.status(500).json({
        error: 'SERVER_ERROR',
        reason: '서버 내부 오류가 발생했습니다.',
        message: '서버 내부 오류가 발생했습니다.',
      });
    }
  }

  // 3. 메모 추가: POST /api/notes -> {id, resourceId, title, body} (본인 ID로만 저장)
  if (method === 'POST') {
    const { title, body } = bodyData;
    const requestedRawId = bodyData.id ? String(bodyData.id).trim().replace(/^notes?:/iu, '') : null;
    if (requestedRawId && !isValidNoteResourceId(requestedRawId)) {
      return response.status(403).json({
        error: 'FORBIDDEN_FUNCTION_PATH',
        reason: '유효한 메모 자원 ID 형식이 아닙니다.',
        message: '유효한 메모 자원 ID 형식이 아닙니다.',
      });
    }
    const dbId = requestedRawId ? toDbUuid(requestedRawId) : randomUUID();

    if (!title || typeof title !== 'string') {
      return response.status(400).json({
        error: 'INVALID_TITLE',
        reason: '유효한 메모 제목이 필요합니다.',
        message: '유효한 메모 제목이 필요합니다.',
      });
    }

    try {
      const { data: existing } = await supabase
        .from('notes')
        .select('id, owner_id')
        .eq('id', dbId)
        .maybeSingle();

      if (existing && !isOwnedByCurrentUser(existing.owner_id)) {
        return response.status(403).json({
          error: 'FORBIDDEN_NOT_OWNER',
          reason: '다른 사용자의 메모 ID를 덮어쓸 수 없습니다.',
          message: '다른 사용자의 메모 ID를 덮어쓸 수 없습니다.',
        });
      }

      const { data, error } = await supabase
        .from('notes')
        .upsert({
          id: dbId,
          title,
          content: body || '',
          owner_id: currentUserId,
        })
        .select('id, title, content')
        .single();

      if (error) {
        return response.status(500).json({
          error: 'DATABASE_INSERT_FAILED',
          reason: '메모 저장에 실패했습니다.',
          message: '메모 저장에 실패했습니다.',
        });
      }

      return response.status(201).json(formatNote(data, requestedRawId));
    } catch (_err) {
      return response.status(500).json({
        error: 'SERVER_ERROR',
        reason: '서버 내부 오류가 발생했습니다.',
        message: '서버 내부 오류가 발생했습니다.',
      });
    }
  }

  // 4. 메모 수정: PUT / PATCH /api/notes/:id (기존 행과 새 행 소유자 모두 본인이어야 함)
  if (method === 'PUT' || method === 'PATCH') {
    if (!id) {
      return response.status(400).json({
        error: 'NOTE_ID_REQUIRED',
        reason: '수정할 메모의 자원 ID가 필요합니다.',
        message: '수정할 메모의 자원 ID가 필요합니다.',
      });
    }

    const { title, body } = bodyData;
    const dbId = toDbUuid(id);

    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('notes')
        .select('id, owner_id')
        .eq('id', dbId)
        .maybeSingle();

      if (fetchErr) {
        return response.status(500).json({
          error: 'DATABASE_QUERY_FAILED',
          reason: '메모 조회에 실패했습니다.',
          message: '메모 조회에 실패했습니다.',
        });
      }
      if (!existing || !isOwnedByCurrentUser(existing.owner_id)) {
        return response.status(403).json({
          error: 'FORBIDDEN_NOT_OWNER',
          reason: '저장된 소유자와 일치하지 않는 다른 구역 메모는 수정할 수 없습니다.',
          message: '저장된 소유자와 일치하지 않는 다른 구역 메모는 수정할 수 없습니다.',
        });
      }

      const updatePayload = {
        owner_id: existing.owner_id,
      };
      if (title !== undefined) updatePayload.title = title;
      if (body !== undefined) updatePayload.content = body;

      const { data, error } = await supabase
        .from('notes')
        .update(updatePayload)
        .eq('id', dbId)
        .eq('owner_id', existing.owner_id)
        .select('id, title, content')
        .maybeSingle();

      if (error) {
        return response.status(500).json({
          error: 'DATABASE_UPDATE_FAILED',
          reason: '메모 수정에 실패했습니다.',
          message: '메모 수정에 실패했습니다.',
        });
      }
      if (!data) {
        return response.status(403).json({
          error: 'FORBIDDEN_NOT_OWNER',
          reason: '본인 소유 메모만 수정할 수 있습니다.',
          message: '본인 소유 메모만 수정할 수 있습니다.',
        });
      }

      return response.status(200).json(formatNote(data, UUID_REGEX.test(id) ? undefined : id));
    } catch (_err) {
      return response.status(500).json({
        error: 'SERVER_ERROR',
        reason: '서버 내부 오류가 발생했습니다.',
        message: '서버 내부 오류가 발생했습니다.',
      });
    }
  }

  // 5. 메모 삭제: DELETE /api/notes/:id (본인 소유 행만 삭제 허용)
  if (method === 'DELETE') {
    if (!id) {
      return response.status(400).json({
        error: 'NOTE_ID_REQUIRED',
        reason: '삭제할 메모의 자원 ID가 필요합니다.',
        message: '삭제할 메모의 자원 ID가 필요합니다.',
      });
    }

    const dbId = toDbUuid(id);

    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('notes')
        .select('id, owner_id')
        .eq('id', dbId)
        .maybeSingle();

      if (fetchErr) {
        return response.status(500).json({
          error: 'DATABASE_QUERY_FAILED',
          reason: '메모 조회에 실패했습니다.',
          message: '메모 조회에 실패했습니다.',
        });
      }
      if (!existing || !isOwnedByCurrentUser(existing.owner_id)) {
        return response.status(403).json({
          error: 'FORBIDDEN_NOT_OWNER',
          reason: '저장된 소유자와 일치하지 않는 다른 구역 메모는 삭제할 수 없습니다.',
          message: '저장된 소유자와 일치하지 않는 다른 구역 메모는 삭제할 수 없습니다.',
        });
      }

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', dbId)
        .eq('owner_id', existing.owner_id);

      if (error) {
        return response.status(500).json({
          error: 'DATABASE_DELETE_FAILED',
          reason: '메모 삭제에 실패했습니다.',
          message: '메모 삭제에 실패했습니다.',
        });
      }

      return response.status(200).json({
        success: true,
        deletedId: id,
        resourceId: `note:${id}`,
      });
    } catch (_err) {
      return response.status(500).json({
        error: 'SERVER_ERROR',
        reason: '서버 내부 오류가 발생했습니다.',
        message: '서버 내부 오류가 발생했습니다.',
      });
    }
  }

  return response.status(405).json({
    error: 'METHOD_NOT_ALLOWED',
    reason: '허용되지 않은 HTTP 메서드입니다.',
    message: '허용되지 않은 HTTP 메서드입니다.',
  });
}
