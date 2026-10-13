import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createLoginVerifier } from '../src/verify-login.mjs';

let loginVerifier = null;

const FORBIDDEN_FUNCTION_KEYWORD = /(?:^|[:_-])(?:export|import|backup|admin|batch|search|download|upload|config|settings?|all|manage|exec(?:ute)?|list|dump|restore|sync|share|public|raw|status|health|metrics?|debug|test|eval|run|query|filter|stats?|summary|count|bulk|migrat(?:e|ion)|archiv(?:e|es)|clone|copy|audit|report|flush|clear|reset|purge|system|whoami|me)(?:$|[:_-]|\d)/iu;

function isValidNoticeResourceId(resourceId) {
  if (typeof resourceId !== 'string' || !resourceId.trim()) return false;
  const lower = resourceId.trim().toLowerCase();
  if (FORBIDDEN_FUNCTION_KEYWORD.test(lower)) return false;
  return /^(?:notices?[:_-])?\d{1,6}$/u.test(lower);
}

// 서버가 검증한 사용자의 저장된 역할만 조회 (요청 본문이나 헤더의 role은 신뢰하지 않음)
function getServerVerifiedRole(verifiedUser) {
  if (!verifiedUser || !verifiedUser.userId) return null;
  return 'student';
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

  // 로그인 없는 구역 읽기 전면 거부 (제목이나 본문을 노출하지 않음)
  const authorization = request.headers.authorization;
  if (!authorization) {
    return response.status(401).json({
      error: 'UNAUTHORIZED',
      reason: '로그인 없이는 강사 공지 구역을 읽거나 수정할 수 없습니다.',
      message: '로그인 없이는 강사 공지 구역을 읽거나 수정할 수 없습니다.',
    });
  }

  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';
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

  const serverRole = getServerVerifiedRole(verifiedUser);

  const method = (request.method || '').toUpperCase();
  const queryKeys = Object.keys(request.query || {});
  if (queryKeys.some(key => key !== 'id')) {
    return response.status(403).json({
      error: 'FORBIDDEN_QUERY_PARAMETER',
      reason: '쿼리 파라미터로 역할이나 기능을 선택할 수 없습니다.',
      message: '쿼리 파라미터로 역할이나 기능을 선택할 수 없습니다.',
    });
  }

  // 헤더나 요청 본문에 적힌 role / menu 값을 서버 저장 역할(serverRole)과 대조하여 불일치 시 즉시 거부
  const headerRole = request.headers['x-role'] || request.headers['x-user-role'];
  if (typeof headerRole === 'string' && headerRole.trim() && headerRole.trim().toLowerCase() !== serverRole) {
    return response.status(403).json({
      error: 'ROLE_ELEVATION_DENIED',
      reason: '요청 헤더의 role은 신뢰하지 않으며 서버에 저장된 역할과 일치하지 않습니다.',
      message: '요청 헤더의 role은 신뢰하지 않으며 서버에 저장된 역할과 일치하지 않습니다.',
    });
  }

  if (request.body !== undefined && request.body !== null && request.body !== '') {
    let rawBody = request.body;
    if (typeof rawBody === 'string') {
      try { rawBody = JSON.parse(rawBody); } catch { rawBody = {}; }
    }
    if (rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)) {
      const clientRole = rawBody.role ?? rawBody.userRole;
      if (clientRole !== undefined && String(clientRole).trim().toLowerCase() !== serverRole) {
        return response.status(403).json({
          error: 'ROLE_ELEVATION_DENIED',
          reason: '요청 본문에 적힌 role은 믿지 않으며 서버에 저장된 역할과 일치하지 않습니다.',
          message: '요청 본문에 적힌 role은 믿지 않으며 서버에 저장된 역할과 일치하지 않습니다.',
        });
      }
    }
  }

  // 강사 공지 수정·추가·삭제는 서버에 저장된 역할이 instructor인 경우에만 허용 (일반 학생은 403 거부)
  if (method !== 'GET' && serverRole !== 'instructor') {
    return response.status(403).json({
      error: 'INSTRUCTOR_ROLE_REQUIRED',
      reason: '서버에서 확인된 강사 권한이 없어 공지를 수정하거나 삭제할 수 없습니다.',
      message: '서버에서 확인된 강사 권한이 없어 공지를 수정하거나 삭제할 수 없습니다.',
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

    // 화이트리스트 기반 공지 자원 ID 검증 (임의의 기능 경로 및 비인가 자원 ID 전면 차단)
    if (!isValidNoticeResourceId(decodedId)) {
      return response.status(403).json({
        error: 'FORBIDDEN_FUNCTION_PATH',
        reason: '유효한 강사 공지 자원 ID가 아니거나 허용되지 않은 기능 경로입니다.',
        message: '유효한 강사 공지 자원 ID가 아니거나 허용되지 않은 기능 경로입니다.',
      });
    }

    const normalizedNoticeId = decodedId.replace(/^notices?[:_-]/iu, '');
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
