import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createLoginVerifier } from './verify-login.mjs';
import { verifyDeviceApproval } from './device-verifier.mjs';

let cachedVerifier = null;

/**
 * 표준 JSON 에러 응답 헬퍼
 */
export function sendError(response, status, error, reason) {
  return response.status(status).json({
    error,
    reason,
    message: reason,
  });
}

/**
 * 요청에서 Bearer 토큰 또는 HttpOnly sb_token 쿠키 추출
 */
export function extractAuthToken(request) {
  const auth = request.headers?.authorization;
  if (auth) return auth;
  const cookieHeader = request.headers?.cookie;
  if (cookieHeader) {
    const match = /(?:^|;\s*)sb_token=([^;]+)/.exec(cookieHeader);
    if (match) return `Bearer ${match[1]}`;
  }
  return null;
}

/**
 * aleph.config.json 기반 로그인 검증기 싱글톤 획득
 */
export async function getVerifier(supabaseSecretKey) {
  if (!cachedVerifier) {
    const configPath = resolve(process.cwd(), 'aleph.config.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    cachedVerifier = createLoginVerifier({
      config,
      supabaseSecretKey,
    });
  }
  return cachedVerifier;
}

/**
 * Supabase 서버 전용 클라이언트 인스턴스 초기화
 */
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseSecretKey);
}

/**
 * 안전한 JSON 요청 본문 파싱 (문자열 또는 객체 처리)
 */
export function parseRequestBody(request) {
  let body = request.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  return body || {};
}

/**
 * 쿼리 파라미터 및 경로 탐색/특수문자 방어와 자원 ID 정제
 */
export function sanitizeResourceId(rawId) {
  if (Array.isArray(rawId)) {
    return { error: { status: 403, code: 'INVALID_RESOURCE_ID', reason: '단일 자원 ID만 지정해야 합니다.' } };
  }
  let decodedId = typeof rawId === 'string' ? rawId.trim() : undefined;
  if (decodedId !== undefined) {
    try {
      decodedId = decodeURIComponent(decodedId).trim();
    } catch {
      return { error: { status: 400, code: 'INVALID_RESOURCE_ID', reason: '잘못된 자원 ID 인코딩입니다.' } };
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
      return { error: { status: 403, code: 'FORBIDDEN_PATH_TRAVERSAL', reason: '허용되지 않은 경로 문자가 포함되어 있습니다.' } };
    }
  }
  return { id: decodedId };
}

/**
 * 심판 이외의 사용자에 대한 기기 승인 서명 검증 (Stage 11)
 */
export function verifyDeviceHeader(request, verifiedUser, supabaseSecretKey) {
  if (verifiedUser?.kind === 'judge') {
    return true;
  }
  const approvalToken = request.headers?.['x-device-approval'];
  const approval = verifyDeviceApproval({
    token: approvalToken,
    userId: verifiedUser?.userId,
    secretKey: supabaseSecretKey,
  });
  return Boolean(approval);
}

/**
 * 민감정보(토큰, 비밀값, 본문 내용)를 배제한 안전한 진단 로그
 */
export function safeAuditLog(prefix, { method, status, code, extra = {} }) {
  const parts = [`[${prefix}]`, `method=${method}`, `status=${status}`, `code=${code ?? 'OK'}`];
  for (const [k, v] of Object.entries(extra)) {
    parts.push(`${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`);
  }
  console.log(parts.join(' '));
}
