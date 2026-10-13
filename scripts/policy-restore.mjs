// 10단계: 검증한 안전 정책 버전으로 aleph.config.json의 시험 정책 항목만 되돌립니다.
// 기본은 미리보기이며 파일을 바꾸지 않습니다. 실제로 쓰려면 미리보기에서 본 버전을 --confirm 으로 다시 적어야 합니다.
// 사용: npm run policy:restore -- <커밋 SHA>                         (미리보기)
//       npm run policy:restore -- <커밋 SHA> --apply --confirm <SHA 앞 12자리>
// 되돌리는 항목: allowedRoutes, protectedService, originalApiUrl, restoreRoute, identityProvider
// 그대로 두는 것: 그 밖의 설정, src/decider.mjs 규칙 코드, git 기록, xdr 경보·차단 기록(감사 이력)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { Stop, VALUE_KEYS, diffPolicies, loadBackup, loadCurrent } from './policy-diff.mjs';

const CONFIG_FILE = 'aleph.config.json';
const RESTORE_KEYS = ['allowedRoutes', ...VALUE_KEYS];

function parseArgs(argv) {
  const [sha, ...rest] = argv;
  const apply = rest.includes('--apply');
  const at = rest.indexOf('--confirm');
  return { sha, apply, confirm: at >= 0 ? rest[at + 1] : undefined };
}

function configIsCommitted() {
  try {
    execFileSync('git', ['diff', '--quiet', 'HEAD', '--', CONFIG_FILE], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  try {
    const { sha, apply, confirm } = parseArgs(process.argv.slice(2));
    const backup = loadBackup(sha);
    const current = loadCurrent();
    const changes = diffPolicies(current, backup.policy);
    const out = line => process.stdout.write(`${line}\n`);
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
      return;
    }
    if (confirm !== short) throw new Stop(`중단: 위 버전을 확인했다면 --confirm ${short} 를 함께 적어 주세요.`);
    if (!configIsCommitted()) throw new Stop('중단: aleph.config.json에 커밋하지 않은 변경이 있어 되돌릴 수 없습니다. 먼저 커밋하세요.');
    if (changes.length === 0) {
      out('차이가 없어 파일을 쓰지 않았습니다.');
      return;
    }

    const text = readFileSync(CONFIG_FILE, 'utf8');
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const config = JSON.parse(text);
    for (const key of RESTORE_KEYS) config[key] = backup.policy[key];
    writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}${eol}`.replace(/\r?\n/g, eol));
    out(`복원했습니다: ${CONFIG_FILE} (정책 항목만). 되돌리려면 git diff 로 확인하고 git checkout -- ${CONFIG_FILE}`);
    out('로컬 파일만 바뀌었고 배포·운영 정책은 바뀌지 않았습니다. 실제 반영과 확인은 별도입니다.');
  } catch (error) {
    process.stderr.write(`${error instanceof Stop ? error.message : '중단: 정책 복원을 진행하지 못했습니다.'}\n`);
    process.exitCode = 1;
  }
}

main();
