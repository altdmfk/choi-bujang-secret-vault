import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createLoginVerifier } from '../src/verify-login.mjs';

let loginVerifier = null;

const FORBIDDEN_FUNCTION_PATHS = new Set([
  'export', 'import', 'backup', 'admin', 'batch', 'search',
  'download', 'upload', 'config', 'settings', 'all', 'manage', 'execute',
  'list', 'dump', 'restore', 'sync', 'share', 'public', 'raw',
]);

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

const INSTRUCTOR_NOTICES = [
  {
    id: '1',
    resourceId: 'notice:1',
    zone: 'notices',
    type: 'notice',
    owner: 'instructor',
    author: 'instructor',
    category: 'notice',
    title: '[강사 공지] 8단계 구역 분리 지침',
    body: '자료실 메모(notes)와 강사 공지(notices)는 분리된 구역 및 자원 ID로 통제됩니다.',
  },
  {
    id: '2',
    resourceId: 'notice:2',
    zone: 'notices',
    type: 'notice',
    owner: 'instructor',
    author: 'instructor',
    category: 'notice',
    title: '[수업 공지] 시스템 보안 실습 주의사항',
    body: '실습 중 인가되지 않은 타인 메모나 시스템 자원에 접근을 시도하지 마세요.',
  },
];

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  const authorization = request.headers.authorization;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

  if (authorization) {
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
  }

  const method = (request.method || '').toUpperCase();
  const queryKeys = Object.keys(request.query || {});
  if (queryKeys.some(key => key !== 'id')) {
    return response.status(403).json({
      error: 'FORBIDDEN_QUERY_PARAMETER',
      reason: '쿼리 파라미터로 기능을 선택하거나 우회할 수 없습니다.',
      message: '쿼리 파라미터로 기능을 선택하거나 우회할 수 없습니다.',
    });
  }

  // 헤더의 role 위조 시도 차단
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

  // 일반 학생(및 심판 계정)의 공지 수정·추가·삭제 시도는 본문이나 헤더의 role과 무관하게 즉시 403 거부
  if (method !== 'GET') {
    return response.status(403).json({
      error: 'INSTRUCTOR_ROLE_REQUIRED',
      reason: '일반 학생은 강사 공지를 수정하거나 삭제할 수 없습니다.',
      message: '일반 학생은 강사 공지를 수정하거나 삭제할 수 없습니다.',
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

  if (decodedId) {
    if (
      decodedId.includes('/')
      || decodedId.includes('\\')
      || decodedId.includes('..')
      || decodedId.includes('?')
      || decodedId.includes('#')
    ) {
      return response.status(403).json({
        error: 'FORBIDDEN_PATH_TRAVERSAL',
        reason: '허용되지 않은 경로 문자가 포함되어 있습니다.',
        message: '허용되지 않은 경로 문자가 포함되어 있습니다.',
      });
    }

    const lowerId = decodedId.toLowerCase();
    const cleanCheck = lowerId.replace(/^(?:notices?|notes?):/u, '');
    if (FORBIDDEN_FUNCTION_PATHS.has(lowerId) || FORBIDDEN_FUNCTION_PATHS.has(cleanCheck)) {
      return response.status(403).json({
        error: 'FORBIDDEN_FUNCTION_PATH',
        reason: '자료 ID 위치에 기능 경로를 사용할 수 없습니다.',
        message: '자료 ID 위치에 기능 경로를 사용할 수 없습니다.',
      });
    }

    // 공지 구역에서 메모 자원(note:*)을 교차 조회하려는 시도 차단
    if (
      /^notes?[:_-]/iu.test(decodedId)
      || lowerId === 'demo'
      || lowerId === 'sample_note_1'
      || lowerId.includes('note')
      || lowerId.includes('memo')
    ) {
      return response.status(403).json({
        error: 'FORBIDDEN_CROSS_ZONE',
        reason: '강사 공지 구역에서 메모 자원을 조회할 수 없습니다.',
        message: '강사 공지 구역에서 메모 자원을 조회할 수 없습니다.',
      });
    }

    const normalizedNoticeId = decodedId.replace(/^notices?:/iu, '');
    const notice = INSTRUCTOR_NOTICES.find(
      n => n.id === normalizedNoticeId || n.resourceId.toLowerCase() === lowerId
    );
    if (!notice) {
      return response.status(403).json({
        error: 'FORBIDDEN_CROSS_ZONE',
        reason: '허용되지 않은 공지 자원 ID이거나 다른 구역 자료입니다.',
        message: '허용되지 않은 공지 자원 ID이거나 다른 구역 자료입니다.',
      });
    }

    return response.status(200).json(notice);
  }

  return response.status(200).json(INSTRUCTOR_NOTICES);
}
