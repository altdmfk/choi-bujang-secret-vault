import { randomBytes } from 'node:crypto';
import { createDeviceApprovalToken, verifyDeviceApproval } from '../src/device-verifier.mjs';
import {
  extractAuthToken,
  getVerifier,
  parseRequestBody,
  sendError,
} from '../src/api-helpers.mjs';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  const authorization = extractAuthToken(request);
  if (!authorization) {
    return sendError(
      response,
      401,
      'UNAUTHORIZED',
      '로그인 없이는 기기 상태를 확인하거나 승인을 요청할 수 없습니다.'
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
        '유효한 로그인 신원을 확인할 수 없습니다.'
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

  const method = (request.method || '').toUpperCase();
  const userId = verifiedUser.userId;

  // 1. GET: 현재 기기 승인 상태 조회 (헤더의 x-device-approval 서명 토큰 검증)
  if (method === 'GET') {
    const approvalToken = request.headers['x-device-approval'];
    const approval = verifyDeviceApproval({
      token: approvalToken,
      userId,
      secretKey: supabaseSecretKey,
    });

    if (!approval) {
      return response.status(200).json({
        registered: false,
        status: 'unapproved',
        message: '이 기기는 아직 서버에 등록·승인되지 않았습니다. 기기 승인을 요청하세요.',
      });
    }

    return response.status(200).json({
      registered: true,
      status: 'approved',
      message: '서버에 의해 확인된 등록 기기입니다.',
    });
  }

  // 2. POST: 기기 승인 요청 접수 및 서명된 승인 토큰 발급
  if (method === 'POST') {
    const body = parseRequestBody(request);
    const action = body?.action;
    if (action !== 'request_approval') {
      return response.status(400).json({
        error: 'INVALID_ACTION',
        registered: false,
        status: 'denied',
        reason: '올바른 기기 승인 요청 액션이 아닙니다.',
        message: '올바른 기기 승인 요청 액션이 아닙니다.',
      });
    }

    // 서버가 기기 식별자를 확인 (16자리 소문자 16진수 규격, 개인키 아님)
    const deviceId = typeof body?.deviceId === 'string' && /^[0-9a-f]{16}$/iu.test(body.deviceId.trim())
      ? body.deviceId.trim().toLowerCase()
      : randomBytes(8).toString('hex');

    // 서버 서명 기반 기기 승인 토큰 생성
    const approvalToken = createDeviceApprovalToken({
      userId,
      deviceId,
      secretKey: supabaseSecretKey,
    });

    return response.status(200).json({
      registered: true,
      status: 'approved',
      approvalToken,
      message: '서버가 이 기기를 등록 기기로 확인하고 정상 승인했습니다.',
    });
  }

  return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
