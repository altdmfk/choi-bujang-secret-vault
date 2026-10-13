import assert from 'node:assert/strict';
import { test } from 'node:test';
import deviceHandler from '../api/device.js';
import { createDeviceApprovalToken, verifyDeviceApproval } from '../src/device-verifier.mjs';

function createMockResponse() {
  const headers = new Map();
  const res = {
    statusCode: 200,
    body: null,
    setHeader(key, value) {
      headers.set(key.toLowerCase(), value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

test('비인증 상태에서는 기기 확인 및 승인 요청이 401로 거부된다', async () => {
  const reqNoAuth = { method: 'GET', headers: {} };
  const resNoAuth = createMockResponse();
  await deviceHandler(reqNoAuth, resNoAuth);
  assert.equal(resNoAuth.statusCode, 401);
  assert.equal(resNoAuth.body.error, 'UNAUTHORIZED');

  const reqPostNoAuth = { method: 'POST', headers: {}, body: { action: 'request_approval' } };
  const resPostNoAuth = createMockResponse();
  await deviceHandler(reqPostNoAuth, resPostNoAuth);
  assert.equal(resPostNoAuth.statusCode, 401);
  assert.equal(resPostNoAuth.body.error, 'UNAUTHORIZED');
});

test('유효하지 않은 토큰은 401을 반환한다', async () => {
  const reqInvalid = {
    method: 'GET',
    headers: { authorization: 'Bearer bad_tok' },
  };
  const resInvalid = createMockResponse();
  await deviceHandler(reqInvalid, resInvalid);
  assert.equal(resInvalid.statusCode, 401);
  assert.equal(resInvalid.body.error, 'UNAUTHORIZED');
});

test('서버 서명 기반 기기 승인 토큰 발급 및 검증이 정상 동작한다', () => {
  const userId = 'user-test-01';
  const deviceId = 'a1b2c3d4e5f60001';
  const testSecretKey = 'mock-test-secret-key-12345';
  const token = createDeviceApprovalToken({ userId, deviceId, secretKey: testSecretKey });
  assert.ok(token);

  // 정상 토큰 검증
  const verified = verifyDeviceApproval({ token, userId, secretKey: testSecretKey });
  assert.ok(verified);
  assert.equal(verified.userId, userId);
  assert.equal(verified.deviceId, deviceId);

  // 타인 userId로 검증 시도 시 거부
  const otherUserVerified = verifyDeviceApproval({ token, userId: 'user-test-02', secretKey: testSecretKey });
  assert.equal(otherUserVerified, null);

  // 변조된 토큰 검증 시 거부
  const tamperedToken = token.slice(0, -4) + 'abcd';
  const tamperedVerified = verifyDeviceApproval({ token: tamperedToken, userId, secretKey: testSecretKey });
  assert.equal(tamperedVerified, null);

  // 다른 서명 키로 검증 시 거부
  const wrongKeyVerified = verifyDeviceApproval({ token, userId, secretKey: 'wrong-key-000' });
  assert.equal(wrongKeyVerified, null);

  // 서명 키 누락 시 거부
  assert.equal(createDeviceApprovalToken({ userId, deviceId }), null);
  assert.equal(verifyDeviceApproval({ token, userId }), null);
});
