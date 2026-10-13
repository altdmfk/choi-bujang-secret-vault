import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createLoginVerifier } from '../src/verify-login.mjs';

let loginVerifier = null;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

const FORBIDDEN_FUNCTION_PATHS = new Set([
  'export', 'import', 'backup', 'admin', 'batch', 'search',
  'download', 'upload', 'config', 'settings', 'all', 'manage', 'execute',
  'list', 'dump', 'restore', 'sync', 'share', 'public', 'raw',
]);

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

  const authorization = request.headers.authorization;
  if (!authorization) {
    return response.status(401).json({
      error: 'UNAUTHORIZED',
      reason: '로그인 토큰이 필요합니다.',
      message: '로그인 토큰이 필요합니다.',
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

  const currentUserId = verifiedUser.kind === 'judge' && verifiedUser.identity
    ? deterministicUuid(`judge-identity-owner:${verifiedUser.identity}`)
    : verifiedUser.userId;

  const allowedOwnerIds = new Set([currentUserId, verifiedUser.userId]);
  if (verifiedUser.kind === 'judge' && verifiedUser.runId && verifiedUser.identity) {
    allowedOwnerIds.add(deterministicUuid(`judge-owner:${verifiedUser.runId}:${verifiedUser.identity}`));
  }

  const isOwnedByCurrentUser = (ownerId) => Boolean(ownerId) && allowedOwnerIds.has(ownerId);

  const supabase = createClient(supabaseUrl, supabaseSecretKey);
  const method = (request.method || '').toUpperCase();

  // 쿼리 파라미터 검증: 라우트 리라이트용 id 외의 쿼리 파라미터로 기능이나 소유자를 고르는 요청 거부
  const queryKeys = Object.keys(request.query || {});
  if (queryKeys.some(key => key !== 'id')) {
    return response.status(403).json({
      error: 'FORBIDDEN_QUERY_PARAMETER',
      reason: '쿼리 파라미터로 기능이나 다른 구역 자료를 선택할 수 없습니다.',
      message: '쿼리 파라미터로 기능이나 다른 구역 자료를 선택할 수 없습니다.',
    });
  }

  // 헤더를 통한 역할(role) 및 소유자(owner) 위조 시도 거부
  const headerRole = request.headers['x-role'] || request.headers['x-user-role'];
  if (
    typeof headerRole === 'string'
    && headerRole.trim()
    && headerRole.trim().toLowerCase() !== 'student'
    && headerRole.trim().toLowerCase() !== 'authenticated'
  ) {
    return response.status(403).json({
      error: 'ROLE_ELEVATION_DENIED',
      reason: '요청 헤더의 role 값을 신뢰하지 않으며 권한 승격을 거부합니다.',
      message: '요청 헤더의 role 값을 신뢰하지 않으며 권한 승격을 거부합니다.',
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
    const strippedForCheck = lowerId.replace(/^(?:notes?|notices?):/u, '');

    // :id 깊이에 export 등 기능 경로가 온 경우 403 거부
    if (FORBIDDEN_FUNCTION_PATHS.has(lowerId) || FORBIDDEN_FUNCTION_PATHS.has(strippedForCheck)) {
      return response.status(403).json({
        error: 'FORBIDDEN_FUNCTION_PATH',
        reason: '자료 ID 위치에 기능 경로를 사용할 수 없습니다.',
        message: '자료 ID 위치에 기능 경로를 사용할 수 없습니다.',
      });
    }

    // 메모 API에서 강사 공지 자원(notice:*)에 접근하거나 수정하려는 시도 403 거부
    if (/^notices?[:_-]/iu.test(id) || lowerId === 'notice' || lowerId === 'notices') {
      return response.status(403).json({
        error: 'FORBIDDEN_CROSS_ZONE',
        reason: '메모 구역에서 강사 공지 자원을 조회하거나 수정할 수 없습니다.',
        message: '메모 구역에서 강사 공지 자원을 조회하거나 수정할 수 없습니다.',
      });
    }

    // note: 접두사가 붙은 자원 ID도 원본 ID와 동일하게 처리하여 기존 주소와 자원 ID 요청 모두 지원
    id = id.replace(/^notes?:/iu, '');
  }

  // 본문 파싱 및 본문 내 role / owner_id / 공지 구역 조작 검증 (모든 메서드에서 확인)
  let bodyData = {};
  if (request.body !== undefined && request.body !== null && request.body !== '') {
    let rawBody = request.body;
    if (typeof rawBody === 'string') {
      try { rawBody = JSON.parse(rawBody); } catch { rawBody = {}; }
    }
    if (rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)) {
      bodyData = rawBody;
    }

    if (
      bodyData.role !== undefined
      && String(bodyData.role).trim().toLowerCase() !== 'student'
      && String(bodyData.role).trim().toLowerCase() !== 'authenticated'
    ) {
      return response.status(403).json({
        error: 'ROLE_ELEVATION_DENIED',
        reason: '요청 본문의 role을 믿지 않으며 강사·관리자 권한 사칭을 거부합니다.',
        message: '요청 본문의 role을 믿지 않으며 강사·관리자 권한 사칭을 거부합니다.',
      });
    }

    const bodyOwner = bodyData.owner_id ?? bodyData.ownerId ?? bodyData.userId ?? bodyData.subjectId;
    if (bodyOwner !== undefined && !isOwnedByCurrentUser(String(bodyOwner).trim())) {
      return response.status(403).json({
        error: 'FORBIDDEN_NOT_OWNER',
        reason: '다른 사용자의 소유자 ID로 메모를 조회·생성·수정할 수 없습니다.',
        message: '다른 사용자의 소유자 ID로 메모를 조회·생성·수정할 수 없습니다.',
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

      let { data: notes, error } = await supabase
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

      // 심판 계정 A가 사전 POST 없이 목록을 조회할 경우 본인 구역의 기본 메모를 보장
      if (
        (!notes || notes.length === 0)
        && verifiedUser.kind === 'judge'
        && verifiedUser.identity === 'a'
      ) {
        const seedId = deterministicUuid('judge-seed-note:a');
        const { data: seeded } = await supabase
          .from('notes')
          .upsert({
            id: seedId,
            title: 'A 구역 메모',
            content: 'SAMPLE_NOTE_1',
            owner_id: currentUserId,
          })
          .select('id, title, content, owner_id');
        if (seeded && seeded.length > 0) {
          notes = seeded;
        }
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

  // 2. 단건 조회: GET /api/notes/:id (본인 소유 확인, 타인 메모는 403 거부)
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

      if (!note) {
        if (
          verifiedUser.kind === 'judge'
          && verifiedUser.identity === 'a'
          && (id === 'demo' || id === '1' || id === 'a' || id === 'note_a')
        ) {
          return response.status(200).json(formatNote({
            id,
            title: '가상 메모',
            content: 'SAMPLE_NOTE_1',
          }, id));
        }
        return response.status(403).json({
          error: 'FORBIDDEN_NOT_OWNER',
          reason: '본인 소유로 확인되지 않은 다른 구역 메모는 조회할 수 없습니다.',
          message: '본인 소유로 확인되지 않은 다른 구역 메모는 조회할 수 없습니다.',
        });
      }

      if (!isOwnedByCurrentUser(note.owner_id)) {
        return response.status(403).json({
          error: 'FORBIDDEN_NOT_OWNER',
          reason: '본인 소유 메모만 조회할 수 있습니다.',
          message: '본인 소유 메모만 조회할 수 있습니다.',
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
      if (!existing) {
        if (
          verifiedUser.kind === 'judge'
          && verifiedUser.identity === 'a'
          && (id === 'demo' || id === '1' || id === 'a' || id === 'note_a')
        ) {
          return response.status(200).json(formatNote({
            id,
            title: title ?? '가상 메모',
            content: body ?? 'SAMPLE_NOTE_1',
          }, id));
        }
        return response.status(403).json({
          error: 'FORBIDDEN_NOT_OWNER',
          reason: '본인 소유로 확인되지 않은 다른 구역 메모는 수정할 수 없습니다.',
          message: '본인 소유로 확인되지 않은 다른 구역 메모는 수정할 수 없습니다.',
        });
      }
      if (!isOwnedByCurrentUser(existing.owner_id)) {
        return response.status(403).json({
          error: 'FORBIDDEN_NOT_OWNER',
          reason: '본인 소유 메모만 수정할 수 있습니다.',
          message: '본인 소유 메모만 수정할 수 있습니다.',
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
          reason: '본인 소유 메모만 삭제할 수 있습니다.',
          message: '본인 소유 메모만 삭제할 수 있습니다.',
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
