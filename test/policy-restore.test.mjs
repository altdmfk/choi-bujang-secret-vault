import test from 'node:test';
import assert from 'node:assert/strict';
import { restorePolicy, parseArgs } from '../scripts/policy-restore.mjs';
import { Stop } from '../scripts/policy-diff.mjs';

const VALID_COMMIT = '91371c4'; // 10단계 초기 커밋 (HEAD의 조상)

test('사본 SHA가 올바르지 않거나 없으면 멈춥니다', () => {
  assert.throws(() => restorePolicy({ sha: '' }), Stop);
  assert.throws(() => restorePolicy({ sha: 'invalid-sha' }), Stop);
});

test('운영 정책 플래그(--production)가 주어지면 즉시 거부하고 멈춥니다', () => {
  const args = parseArgs([VALID_COMMIT, '--production']);
  assert.equal(args.isProduction, true);
  assert.throws(() => restorePolicy(args), {
    name: 'Stop',
    message: '중단: 실제 운영 정책은 건드리지 않습니다.',
  });
});

test('apply: false(미리보기)이면 파일을 쓰지 않고 변경 사항을 보여줍니다', () => {
  const output = [];
  const result = restorePolicy({
    sha: VALID_COMMIT,
    apply: false,
    out: line => output.push(line),
  });
  assert.equal(result.applied, false);
  assert.equal(result.preview, true);
  assert.ok(output.some(line => line.includes('미리보기입니다')));
});

test('--confirm 없이 apply: true만 주면 멈춥니다', () => {
  assert.throws(
    () => restorePolicy({ sha: VALID_COMMIT, apply: true }),
    Stop
  );
});

test('--confirm 값이 커밋 앞 12자리와 다르면 멈춥니다', () => {
  assert.throws(
    () => restorePolicy({ sha: VALID_COMMIT, apply: true, confirm: 'wrong_confirm' }),
    Stop
  );
});

test('사본과 현재 정책에 차이가 없으면 파일을 쓰지 않고 끝납니다', () => {
  const output = [];
  const result = restorePolicy({
    sha: VALID_COMMIT,
    apply: true,
    confirm: '91371c4bc5f1',
    out: line => output.push(line),
  });
  assert.equal(result.applied, false);
  assert.equal(result.changes, 0);
  assert.ok(output.some(line => line.includes('차이가 없어 파일을 쓰지 않았습니다')));
});
