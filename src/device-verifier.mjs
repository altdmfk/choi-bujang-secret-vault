import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 서버 비밀키로 서명된 기기 승인 토큰을 생성합니다.
 * 토큰에는 userId, deviceId, 만료 시각, HMAC 서명이 포함됩니다.
 */
export function createDeviceApprovalToken({ userId, deviceId, secretKey }) {
  if (!userId || !deviceId || !secretKey || typeof secretKey !== 'string') return null;
  const expiresAt = Date.now() + 24 * 3600 * 1000; // 24시간 유효
  const payload = `${userId}:${deviceId}:${expiresAt}`;
  const hmac = createHmac('sha256', secretKey).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

/**
 * 기기 승인 토큰의 유효성, 만료 시각, 서명 및 요청 사용자(userId) 일치 여부를 검증합니다.
 */
export function verifyDeviceApproval({ token, userId, secretKey }) {
  if (!token || typeof token !== 'string' || !userId || !secretKey || typeof secretKey !== 'string') return null;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return null;

    const [tokenUserId, tokenDeviceId, tokenExpiresAt, signature] = parts;
    if (tokenUserId !== userId) return null;

    const expiresAt = Number(tokenExpiresAt);
    if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now()) return null;

    const expectedHmac = createHmac('sha256', secretKey)
      .update(`${tokenUserId}:${tokenDeviceId}:${tokenExpiresAt}`)
      .digest('hex');

    if (signature.length !== expectedHmac.length) return null;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) return null;

    return {
      userId: tokenUserId,
      deviceId: tokenDeviceId,
      expiresAt,
    };
  } catch {
    return null;
  }
}
