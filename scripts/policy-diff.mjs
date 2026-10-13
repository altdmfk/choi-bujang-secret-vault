// 10단계: 침해 전에 검증한 커밋의 정책과 현재 시험 정책의 차이만 보여 줍니다.
// 읽기 전용입니다. 파일을 쓰거나 git 상태를 바꾸거나 운영 정책을 바꾸지 않습니다.
// 사용: npm run policy:diff -- <침해 전 검증한 커밋 SHA>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_FILE = 'aleph.config.json';
const DECIDER_FILE = 'src/decider.mjs';
const LIST_KEYS = ['allowedRoutes'];
export const VALUE_KEYS = ['protectedService', 'originalApiUrl', 'restoreRoute', 'identityProvider'];

export class Stop extends Error {
  constructor(message) {
    super(message);
    this.name = 'Stop';
  }
}

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function parsePolicy(configText, deciderText) {
  let config;
  try { config = JSON.parse(configText); } catch { return null; }
  if (config === null || typeof config !== 'object') return null;
  const match = /export const RULE_IDS\s*=\s*Object\.freeze\(\s*\[([^\]]*)\]\s*\)/.exec(deciderText);
  if (!match || !Array.isArray(config.allowedRoutes)) return null;
  const ruleIds = [...match[1].matchAll(/'([^']+)'/g)].map(item => item[1]);
  const policy = { allowedRoutes: config.allowedRoutes, ruleIds };
  for (const key of VALUE_KEYS) policy[key] = config[key] ?? null;
  return policy;
}

export function loadBackup(sha) {
  if (!/^[0-9a-f]{7,40}$/i.test(sha ?? '')) {
    throw new Stop('중단: 침해 전에 검증한 커밋 SHA(7~40자리 16진수)를 직접 지정해 주세요.');
  }
  const full = git(['rev-parse', '--verify', '--quiet', `${sha}^{commit}`]);
  if (!full) throw new Stop('중단: 정책 사본(커밋)을 찾을 수 없습니다.');
  if (git(['merge-base', '--is-ancestor', full, 'HEAD']) === null) {
    throw new Stop('중단: 지정한 커밋이 현재 기록의 과거가 아니라 검증할 수 없습니다.');
  }
  const configText = git(['show', `${full}:${CONFIG_FILE}`]);
  const deciderText = git(['show', `${full}:${DECIDER_FILE}`]);
  const policy = configText && deciderText ? parsePolicy(configText, deciderText) : null;
  if (!policy) throw new Stop('중단: 정책 사본을 읽거나 검증하지 못했습니다.');
  const [subject, date] = git(['show', '-s', '--format=%s%n%cI', full]).split('\n');
  return { full, subject, date, policy };
}

export function loadCurrent(configPath = CONFIG_FILE) {
  const policy = parsePolicy(readFileSync(configPath, 'utf8'), readFileSync(DECIDER_FILE, 'utf8'));
  if (!policy) throw new Stop('중단: 현재 시험 정책을 읽지 못했습니다.');
  return policy;
}

export function diffPolicies(current, backup) {
  const changes = [];
  for (const [label, key] of [['허용 경로', 'allowedRoutes'], ['판정 규칙', 'ruleIds']]) {
    for (const item of backup[key]) if (!current[key].includes(item)) changes.push(`+ ${label} 복원: ${item}`);
    for (const item of current[key]) if (!backup[key].includes(item)) changes.push(`- ${label} 제거: ${item}`);
  }
  for (const key of VALUE_KEYS) {
    const before = JSON.stringify(current[key]);
    const after = JSON.stringify(backup[key]);
    if (before !== after) changes.push(`~ ${key}: ${before} -> ${after}`);
  }
  return changes;
}

function main() {
  try {
    const backup = loadBackup(process.argv[2]);
    const current = loadCurrent();
    const changes = diffPolicies(current, backup.policy);
    const out = line => process.stdout.write(`${line}\n`);
    out(`복원할 버전: ${backup.full.slice(0, 12)} · ${backup.subject} · ${backup.date}`);
    out(`비교 대상: ${[...LIST_KEYS, 'ruleIds', ...VALUE_KEYS].join(', ')}`);
    out(`변경 범위: ${changes.length}건 (현재 -> 복원 후)`);
    for (const line of changes) out(`  ${line}`);
    if (changes.length === 0) out('  차이 없음');
    out('차이만 보여 주는 읽기 전용 명령입니다. 파일·정책은 바꾸지 않았고 실제 복원은 하지 않았습니다.');
  } catch (error) {
    process.stderr.write(`${error instanceof Stop ? error.message : '중단: 정책 차이를 확인하지 못했습니다.'}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
