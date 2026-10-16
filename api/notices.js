import {
  extractAuthToken,
  getVerifier,
  sanitizeResourceId,
  sendError,
  verifyDeviceHeader,
} from '../src/api-helpers.mjs';

function isValidNoticeResourceId(resourceId) {
  if (typeof resourceId !== 'string') return false;
  return /^(?:notice:)?\d+$/iu.test(resourceId.trim());
}

const INSTRUCTOR_NOTICES = [
  {
    id: '1',
    resourceId: 'notice:1',
    title: '[강사 공지] 8단계 구역 분리 지침',
    body: '자료실 메모(notes)와 강사 공지(notices)는 분리된 구역 및 자원 ID로 통제됩니다.',
    author: 'instructor',
    category: 'notice',
  },
  {
    id: '2',
    resourceId: 'notice:2',
    title: '[수업 공지] 시스템 보안 실습 주의사항',
    body: '실습 중 인가되지 않은 타인 메모나 시스템 자원에 접근을 시도하지 마세요.',
    author: 'instructor',
    category: 'notice',
  },
];

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  const authorization = extractAuthToken(request);
  if (!authorization) {
    return sendError(
      response,
      401,
      'UNAUTHORIZED',
      '로그인 없이는 강사 공지 구역을 읽거나 수정할 수 없습니다.'
    );
  }

  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';
  let verifiedUser = null;
  try {
    const verifyLogin = await getVerifier(supabaseSecretKey);
    verifiedUser = await verifyLogin(authorization);
    if (!verifiedUser || !verifiedUser.userId) {
      return sendError(
        response,
        401,
        'UNAUTHORIZED',
        '검증된 사용자 신원을 확인할 수 없습니다.'
      );
    }
  } catch (_err) {
    return sendError(
      response,
      401,
      'UNAUTHORIZED',
      '유효하지 않은 인증 토큰입니다.'
    );
  }

  // 기기 승인 검증: 심판 토큰이 아닌 경우 승인된 기기 토큰(x-device-approval)이 필수
  if (!verifyDeviceHeader(request, verifiedUser, supabaseSecretKey)) {
    return sendError(
      response,
      403,
      'DEVICE_NOT_APPROVED',
      '승인되지 않은 기기에서는 강사 공지 구역을 읽을 수 없습니다.'
    );
  }

  const method = (request.method || '').toUpperCase();
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
  const decodedId = sanitized.id;

  if (decodedId) {
    const lowerId = decodedId.toLowerCase();
    // 구역 검증: 메모 구역 자원 ID(note:*)로 직접 접근 시도 시 교차 접근 차단
    if (
      /^notes?[:_-]/iu.test(decodedId)
      || lowerId === 'demo'
      || lowerId.includes('note')
      || lowerId.includes('memo')
    ) {
      return sendError(
        response,
        403,
        'CROSS_ZONE_ACCESS_DENIED',
        '강사 공지 구역에서 메모 자원을 조회할 수 없습니다.'
      );
    }

    // 화이트리스트 기반 공지 자원 ID 검증 (:id 자리에 export 등 기능 경로 접근 방지)
    if (!isValidNoticeResourceId(decodedId)) {
      return sendError(
        response,
        403,
        'INVALID_RESOURCE_ID',
        '유효한 강사 공지 자원 ID가 아니거나 허용되지 않은 기능 경로입니다.'
      );
    }
  }

  if (method === 'GET') {
    if (decodedId) {
      const normalizedNoticeId = decodedId.replace(/^notices?[:_-]/iu, '');
      const notice = INSTRUCTOR_NOTICES.find(
        n => n.id === normalizedNoticeId || n.resourceId.toLowerCase() === decodedId.toLowerCase()
      );
      if (!notice) {
        return sendError(
          response,
          403,
          'CROSS_ZONE_ACCESS_DENIED',
          '허용되지 않은 공지 자원 ID이거나 다른 구역 자료입니다.'
        );
      }
      return response.status(200).json(notice);
    }
    return response.status(200).json(INSTRUCTOR_NOTICES);
  }

  // 공지사항 수정/추가/삭제 시도 시:
  // 클라이언트 요청 본문이나 헤더의 role을 믿지 않고, 검증된 사용자가 학생이므로 강사 권한 부재로 403 거부
  return sendError(
    response,
    403,
    'INSTRUCTOR_ROLE_REQUIRED',
    '검증된 사용자에게 강사 권한이 없어 공지를 수정하거나 삭제할 수 없습니다.'
  );
}
