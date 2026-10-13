import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createLoginVerifier } from '../src/verify-login.mjs';

// 비공개 가상 메모 사본(notes_backup)에서 지정한 메모 한 건만 notes로 복원합니다.
// 사본: notes_backup(id, owner_id, title, content, content_hash) — 서버 전용 키로만 읽고, 공개 저장소에는 두지 않습니다.
// 응답과 로그에 메모 본문·토큰을 넣지 않습니다.

const ID_PATTERN = /^(?:[a-z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/iu;
const HASH_PATTERN = /^[0-9a-f]{64}$/u;
const ALLOWED_KEYS = new Set(['id', 'resourceId', 'noteId', 'contentHash', 'content_hash', 'owner_id', 'ownerId']);

let loginVerifier = null;

function reply(status, error, reason) {
  return { status, json: { error, reason, message: reason } };
}

export function sha256Hex(text) {
  return createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex');
}

// 사본을 읽어 소유자·ID·내용 해시를 검증합니다. 통과하면 { backup, hash }, 실패하면 { stop }(응답)을 돌려줍니다.
async function loadVerifiedBackup(supabase, rawId, userId, clientHash) {
  const { data: backup, error } = await supabase
    .from('notes_backup')
    .select('id, owner_id, title, content, content_hash')
    .eq('id', rawId)
    .maybeSingle();
  if (error) return { stop: reply(500, 'BACKUP_QUERY_FAILED', '사본 조회에 실패했습니다.') };

  // 사본이 없거나 타인 소유인 경우 같은 거부 응답으로 존재 여부를 알려 주지 않고 멈춥니다.
  if (!backup || backup.owner_id !== userId || backup.id !== rawId) {
    return { stop: reply(403, 'RESTORE_REFUSED', '이 메모는 복원할 수 없습니다.') };
  }

  // 사본의 content_hash가 없거나 형식이 틀리거나 내용이 없으면 검증할 수 없으므로 멈춥니다.
  const backupHash = typeof backup.content_hash === 'string' ? backup.content_hash.trim().toLowerCase() : '';
  if (!backupHash || !HASH_PATTERN.test(backupHash) || typeof backup.content !== 'string') {
    return { stop: reply(409, 'HASH_MISMATCH', '사본의 내용 해시가 올바르지 않아 복원하지 않았습니다.') };
  }
  const hash = sha256Hex(backup.content);
  if (hash !== backupHash) {
    return { stop: reply(409, 'HASH_MISMATCH', '사본의 내용 해시가 일치하지 않아 복원하지 않았습니다.') };
  }
  if (clientHash && clientHash.trim().toLowerCase() !== hash) {
    return { stop: reply(409, 'HASH_MISMATCH', '사본의 내용 해시가 요청과 일치하지 않아 복원하지 않았습니다.') };
  }
  return { backup, hash };
}

// 순수 로직: 검증된 사용자 번호와 요청 본문만 받아 한 건만 복원합니다.
export async function restoreOne({ supabase, userId, body }) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return reply(400, 'INVALID_BODY', '요청 본문이 올바르지 않습니다.');
  }
  if (Object.keys(body).some(key => !ALLOWED_KEYS.has(key))) {
    return reply(400, 'INVALID_BODY', '허용되지 않은 항목이 포함되어 있습니다.');
  }

  // 본문의 소유자는 신뢰하지 않습니다. 있더라도 검증된 사용자와 같아야 합니다.
  const reqOwner = body.owner_id ?? body.ownerId;
  if (reqOwner !== undefined && reqOwner !== userId) {
    return reply(403, 'FORBIDDEN_NOT_OWNER', '다른 사용자의 메모는 복원할 수 없습니다.');
  }

  const rawInput = body.id ?? body.resourceId ?? body.noteId;
  const rawId = typeof rawInput === 'string' ? rawInput.trim().replace(/^notes?:/iu, '') : '';
  if (!rawId || /^notices?[:_-]/iu.test(rawId) || !ID_PATTERN.test(rawId)) {
    return reply(400, 'INVALID_RESOURCE_ID', '유효한 메모 ID 한 건이 필요합니다.');
  }

  // 클라이언트가 내용 해시를 제공한 경우 형식 검증 (선택 항목)
  const clientHash = body.contentHash ?? body.content_hash;
  if (clientHash !== undefined && clientHash !== null) {
    if (typeof clientHash !== 'string' || !HASH_PATTERN.test(clientHash)) {
      return reply(400, 'INVALID_CONTENT_HASH', '내용 해시(sha256 16진수 64자리)가 필요합니다.');
    }
  }

  // 1~2. 사본(notes_backup)을 읽고 소유자·ID·내용 해시를 검증합니다. 실패하면 아무것도 쓰지 않고 멈춥니다.
  const first = await loadVerifiedBackup(supabase, rawId, userId, clientHash);
  if (first.stop) return first.stop;

  // 3. 현재 메모 테이블의 상태를 확인합니다. 타인 소유의 메모가 이미 있다면 건드리지 않고 멈춥니다.
  const { data: existing, error: existingError } = await supabase
    .from('notes')
    .select('id, owner_id')
    .eq('id', rawId)
    .maybeSingle();
  if (existingError) return reply(500, 'DATABASE_QUERY_FAILED', '현재 메모 조회에 실패했습니다.');
  if (existing && existing.owner_id !== userId) {
    return reply(403, 'RESTORE_REFUSED', '이 메모는 복원할 수 없습니다.');
  }

  // 3-1. 쓰기 직전에 검증한 사본을 다시 읽어 같은 사본인지 재검증합니다. 달라졌으면 쓰지 않고 멈춥니다.
  const second = await loadVerifiedBackup(supabase, rawId, userId, clientHash);
  if (second.stop) return second.stop;
  if (second.hash !== first.hash || second.backup.title !== first.backup.title) {
    return reply(409, 'HASH_MISMATCH', '검증한 사본이 복원 직전에 달라져 복원하지 않았습니다.');
  }
  const backup = second.backup;
  const actualHash = second.hash;

  // 4. 재검증한 그 한 건만 복원하고 다른 메모와 감사 기록은 건드리지 않습니다.
  const write = existing
    ? await supabase.from('notes')
      .update({ title: backup.title, content: backup.content, owner_id: userId })
      .eq('id', rawId).eq('owner_id', userId).select('id').maybeSingle()
    : await supabase.from('notes')
      .insert({ id: rawId, title: backup.title, content: backup.content, owner_id: userId })
      .select('id').single();
  if (write.error || !write.data) return reply(500, 'DATABASE_RESTORE_FAILED', '메모 복원에 실패했습니다.');

  // 5. 되돌린 한 건을 다시 읽어 ID·소유자·내용 해시가 사본과 같은지 대조 검증합니다.
  const { data: restoredRow, error: checkError } = await supabase
    .from('notes')
    .select('id, owner_id, title, content')
    .eq('id', rawId)
    .maybeSingle();
  if (checkError || !restoredRow) {
    return reply(500, 'RESTORE_CHECK_FAILED', '복원된 메모 확인에 실패했습니다.');
  }

  const restoredHash = sha256Hex(restoredRow.content);
  if (
    restoredRow.id !== backup.id ||
    restoredRow.owner_id !== userId ||
    restoredHash !== actualHash
  ) {
    return reply(409, 'RESTORE_MISMATCH', '되돌린 한 건의 ID·소유자·내용 해시가 사본과 일치하지 않습니다.');
  }

  return {
    status: 200,
    json: {
      restored: true,
      id: rawId,
      resourceId: `note:${rawId}`,
      owner_id: userId,
      ownerMatched: true,
      contentHash: actualHash,
      content_hash: actualHash,
    },
  };
}

async function getVerifier(supabaseSecretKey) {
  if (!loginVerifier) {
    const config = JSON.parse(await readFile(resolve(process.cwd(), 'aleph.config.json'), 'utf8'));
    loginVerifier = createLoginVerifier({ config, supabaseSecretKey });
  }
  return loginVerifier;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  // 진단용: 요청 본문의 항목 이름(값 제외)과 응답 상태·오류 코드만 기록합니다. 토큰·본문 값·메모 내용은 기록하지 않습니다.
  let bodyKeys = [];
  const send = ({ status, json }) => {
    console.log(`[restore] method=${request.method} status=${status} code=${json?.error ?? 'OK'} bodyKeys=${JSON.stringify(bodyKeys)}`);
    return response.status(status).json(json);
  };

  if ((request.method || '').toUpperCase() !== 'POST') {
    return send(reply(405, 'METHOD_NOT_ALLOWED', '허용되지 않은 HTTP 메서드입니다.'));
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecretKey) {
    return send(reply(500, 'DATABASE_CONFIG_MISSING', '데이터베이스 설정이 누락되었습니다.'));
  }
  if (!request.headers.authorization) {
    return send(reply(401, 'UNAUTHORIZED', '로그인 없이는 복원할 수 없습니다.'));
  }
  if (Object.keys(request.query || {}).length > 0) {
    return send(reply(403, 'FORBIDDEN_QUERY_PARAMETER', '쿼리 파라미터로 복원 대상을 고를 수 없습니다.'));
  }

  let verifiedUser = null;
  try {
    verifiedUser = await (await getVerifier(supabaseSecretKey))(request.headers.authorization);
  } catch {
    return send(reply(401, 'UNAUTHORIZED', '유효하지 않은 인증 토큰입니다.'));
  }
  if (!verifiedUser || !verifiedUser.userId) {
    return send(reply(401, 'UNAUTHORIZED', '검증된 사용자 신원을 확인할 수 없습니다.'));
  }

  let body = request.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (body && typeof body === 'object' && !Array.isArray(body)) bodyKeys = Object.keys(body).slice(0, 20);
  try {
    return send(await restoreOne({
      supabase: createClient(supabaseUrl, supabaseSecretKey),
      userId: verifiedUser.userId,
      body,
    }));
  } catch {
    return send(reply(500, 'SERVER_ERROR', '서버 내부 오류가 발생했습니다.'));
  }
}
