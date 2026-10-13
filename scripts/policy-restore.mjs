// 10단계: 검증한 안전 정책 버전으로 aleph.config.json의 시험 정책 항목만 되돌립니다.
// 기본은 미리보기이며 파일을 바꾸지 않습니다. 실제로 쓰려면 미리보기에서 본 버전을 --confirm 으로 다시 적어야 합니다.
// 사용: npm run policy:restore -- <커밋 SHA>                         (미리보기)
//       npm run policy:restore -- <커밋 SHA> --apply --confirm <SHA 앞 12자리>
// 되돌리는 항목: allowedRoutes, protectedService, originalApiUrl, restoreRoute, identityProvider
// 그대로 두는 것: 그 밖의 설정, src/decider.mjs 규칙 코드, git 기록, xdr 경보·차단 기록(감사 이력)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Stop, VALUE_KEYS, diffPolicies, loadBackup, loadCurrent } from './policy-diff.mjs';

export const CONFIG_FILE = 'aleph.config.json';
export const RESTORE_KEYS = ['allowedRoutes', ...VALUE_KEYS];

export function parseArgs(argv) {
  const [sha, ...rest] = argv;
  const isProduction = rest.includes('--production') || rest.includes('--prod');
  const apply = rest.includes('--apply');
  const at = rest.indexOf('--confirm');
  return { sha, isProduction, apply, confirm: at >= 0 ? rest[at + 1] : undefined };
}

export function restorePolicy({
  sha,
  apply = false,
  confirm,
  isProduction = false,
  configFile = CONFIG_FILE,
  out = line => process.stdout.write(`${line}\n`),
}) {
  if (isProduction) {
    throw new Stop('중단: 실제 운영 정책은 건드리지 않습니다.');
  }

  const backup = loadBackup(sha);
  const current = loadCurrent(configFile);
  const changes = diffPolicies(current, backup.policy);
  const short = backup.full.slice(0, 12);

  out(`복원할 버전: ${short} · ${backup.subject} · ${backup.date}`);
  out(`바뀔 항목: ${RESTORE_KEYS.join(', ')}`);
  out(`변경 범위: ${changes.length}건 (현재 -> 복원 후)`);
  for (const line of changes) out(`  ${line}`);
  if (changes.length === 0) out('  차이 없음');
  out('유지: 그 밖의 설정, src/decider.mjs 규칙 코드, git 기록, xdr 경보·차단 기록');
  if (current.ruleIds.join() !== backup.policy.ruleIds.join()) {
    out('주의: RULE_IDS 차이는 규칙 코드 변경이라 이 절차가 되돌리지 않습니다.');
  }

  if (!apply) {
    out('미리보기입니다. 아무것도 바꾸지 않았습니다.');
    return { applied: false, preview: true, version: short, changes };
  }
  if (confirm !== short) {
    throw new Stop(`중단: 위 버전을 확인했다면 --confirm ${short} 를 함께 적어 주세요.`);
  }
  if (changes.length === 0) {
    out('차이가 없어 파일을 쓰지 않았습니다.');
    return { applied: false, changes: 0 };
  }

  // 실제로 쓰기 직전에 검증한 사본을 다시 읽어 검증합니다. 사본이 없거나 검증 실패 시 멈춥니다.
  const reloaded = loadBackup(sha);
  if (!reloaded || !reloaded.policy) {
    throw new Stop('중단: 정책 사본 재검증에 실패하여 복원하지 않았습니다.');
  }
  if (reloaded.full !== backup.full) {
    throw new Stop('중단: 검증한 사본 버전이 달라져 복원하지 않았습니다.');
  }

  const originalText = readFileSync(configFile, 'utf8');
  const eol = originalText.includes('\r\n') ? '\r\n' : '\n';
  const config = JSON.parse(originalText);
  for (const key of RESTORE_KEYS) config[key] = reloaded.policy[key];
  writeFileSync(configFile, `${JSON.stringify(config, null, 2)}${eol}`.replace(/\r?\n/g, eol));

  // 복원 후 되돌린 시험 정책을 다시 읽어 사본과 일치하는지 확인합니다.
  const verifiedCurrent = loadCurrent(configFile);
  const remainingDiff = diffPolicies(verifiedCurrent, reloaded.policy);
  if (remainingDiff.length > 0) {
    // 복원 결과 검증에 실패하면 원래 상태로 되돌리고 멈춥니다.
    writeFileSync(configFile, originalText);
    throw new Stop('중단: 되돌린 시험 정책이 사본과 일치하지 않아 복원 전 상태로 되돌렸습니다.');
  }

  out(`복원했습니다: ${configFile} (정책 항목만). 되돌리려면 git diff 로 확인하고 git checkout -- ${configFile}`);
  out('로컬 파일만 바뀌었고 배포·운영 정책은 바뀌지 않았습니다. 실제 반영과 확인은 별도입니다.');
  return { applied: true, version: short, remainingDiff: 0 };
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    restorePolicy(args);
  } catch (error) {
    process.stderr.write(`${error instanceof Stop ? error.message : '중단: 정책 복원을 진행하지 못했습니다.'}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
