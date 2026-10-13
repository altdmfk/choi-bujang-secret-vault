import assert from 'node:assert/strict';
import { test } from 'node:test';
import deviceHandler from '../api/device.js';

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
