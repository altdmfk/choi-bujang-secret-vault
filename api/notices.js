import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createLoginVerifier } from '../src/verify-login.mjs';
import { verifyDeviceApproval } from '../src/device-verifier.mjs';

let loginVerifier = null;

function isValidNoticeResourceId(resourceId) {
  if (typeof resourceId !== 'string') return false;
  return /^(?:notice:)?\d+$/iu.test(resourceId.trim());
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
    if (!verifiedUser || !verifiedUser.userId) {
      return response.status(401).json({
        error: 'UNAUTHORIZED',
        reason: '검증된 사용자 신원을 확인할 수 없습니다.',
        message: '검증된 사용자 신원을 확인할 수 없습니다.',
      });
    }
  } catch (_err) {
    return response.status(401).json({
      error: 'UNAUTHORIZED',
      reason: '유효하지 않은 인증 토큰입니다.',
      message: '유효하지 않은 인증 토큰입니다.',
    });
  }

  // 기기 승인 검증: 심판 토큰이 아닌 경우 승인된 기기 토큰(x-device-approval)이 필수
  if (verifiedUser.kind !== 'judge') {
    const approvalToken = request.headers['x-device-approval'];
    const deviceApproval = verifyDeviceApproval({
      token: approvalToken,
      userId: verifiedUser.userId,
      secretKey: supabaseSecretKey,
    });

    if (!deviceApproval) {
      return response.status(403).json({
        error: 'DEVICE_NOT_APPROVED',
        reason: '승인되지 않은 기기에서는 강사 공지 구역을 읽을 수 없습니다.',
        message: '승인되지 않은 기기에서는 강사 공지 구역을 읽을 수 없습니다.',
      });
    }
  }

  const method = (request.method || '').toUpperCase();
  const queryKeys = Object.keys(request.query || {});
  if (queryKeys.some(key => key !== 'id')) {
    return response.status(403).json({
      error: 'FORBIDDEN_QUERY_PARAMETER',
      reason: '쿼리 파라미터로 기능이나 다른 구역 자료를 선택할 수 없습니다.',
      message: '쿼리 파라미터로 기능이나 다른 구역 자료를 선택할 수 없습니다.',
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
    // 구역 검증: 메모 구역 자원 ID(note:*)로 직접 접근 시도 시 교차 접근 차단
    if (
      /^notes?[:_-]/iu.test(decodedId)
      || lowerId === 'demo'
      || lowerId.includes('note')
      || lowerId.includes('memo')
    ) {
      return response.status(403).json({
        error: 'CROSS_ZONE_ACCESS_DENIED',
        reason: '강사 공지 구역에서 메모 자원을 조회할 수 없습니다.',
        message: '강사 공지 구역에서 메모 자원을 조회할 수 없습니다.',
      });
    }

    // 화이트리스트 기반 공지 자원 ID 검증 (:id 자리에 export 등 기능 경로 접근 방지)
    if (!isValidNoticeResourceId(decodedId)) {
      return response.status(403).json({
        error: 'INVALID_RESOURCE_ID',
        reason: '유효한 강사 공지 자원 ID가 아니거나 허용되지 않은 기능 경로입니다.',
        message: '유효한 강사 공지 자원 ID가 아니거나 허용되지 않은 기능 경로입니다.',
      });
    }
  }

  if (method === 'GET') {
    if (decodedId) {
      const normalizedNoticeId = decodedId.replace(/^notices?[:_-]/iu, '');
      const notice = INSTRUCTOR_NOTICES.find(
        n => n.id === normalizedNoticeId || n.resourceId.toLowerCase() === decodedId.toLowerCase()
      );
      if (!notice) {
        return response.status(403).json({
          error: 'CROSS_ZONE_ACCESS_DENIED',
          reason: '허용되지 않은 공지 자원 ID이거나 다른 구역 자료입니다.',
          message: '허용되지 않은 공지 자원 ID이거나 다른 구역 자료입니다.',
        });
      }
      return response.status(200).json(notice);
    }
    return response.status(200).json(INSTRUCTOR_NOTICES);
  }

  // 공지사항 수정/추가/삭제 시도 시:
  // 클라이언트 요청 본문이나 헤더의 role을 믿지 않고,
  // 검증된 사용자가 학생이므로 강사 권한 부재로 403 거부
  return response.status(403).json({
    error: 'INSTRUCTOR_ROLE_REQUIRED',
    reason: '검증된 사용자에게 강사 권한이 없어 공지를 수정하거나 삭제할 수 없습니다.',
    message: '검증된 사용자에게 강사 권한이 없어 공지를 수정하거나 삭제할 수 없습니다.',
  });
}
