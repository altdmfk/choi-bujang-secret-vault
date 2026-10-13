import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreOne, sha256Hex } from '../api/restore.js';

// 가상 데이터만 사용합니다. 실제 DB·토큰·메모 본문은 쓰지 않습니다.
const B = 'user_b_fixture';
const A = 'user_a_fixture';

function fakeSupabase({ notes, backups }) {
  const tables = { notes, notes_backup: backups };
  return {
    from(name) {
      const rows = tables[name];
      return {
        select() {
          const filters = [];
          const query = {
            eq(key, value) { filters.push([key, value]); return query; },
            maybeSingle: async () => ({ data: rows.find(r => filters.every(([k, v]) => r[k] === v)) ?? null, error: null }),
          };
          return query;
        },
        update(values) {
          const filters = [];
          const query = {
            eq(key, value) { filters.push([key, value]); return query; },
            select() { return query; },
            maybeSingle: async () => {
              const row = rows.find(r => filters.every(([k, v]) => r[k] === v));
              if (row) Object.assign(row, values);
              return { data: row ? { id: row.id } : null, error: null };
            },
          };
          return query;
        },
        insert(values) {
          const query = {
            select() { return query; },
            single: async () => { rows.push({ ...values }); return { data: { id: values.id }, error: null }; },
          };
          return query;
        },
      };
    },
  };
}

function setup() {
  const content = '가상 메모 본문';
  const hash = sha256Hex(content);
  const notes = [
    { id: 'b1', title: '바뀐 제목', content: '훼손됨', owner_id: B },
    { id: 'a1', title: 'A 메모', content: 'A 본문', owner_id: A },
  ];
  const backups = [
    { id: 'b1', owner_id: B, title: 'B 원본', content, content_hash: hash },
    { id: 'a1', owner_id: A, title: 'A 원본', content: 'A 본문', content_hash: sha256Hex('A 본문') },
    { id: 'b2', owner_id: B, title: 'B 삭제됨', content: '삭제 전 본문', content_hash: sha256Hex('삭제 전 본문') },
    { id: 'b3', owner_id: B, title: 'B 변조', content: '변조된 사본', content_hash: sha256Hex('원래 본문') },
    { id: 'b4', owner_id: B, title: 'B 해시누락', content: '내용 있음', content_hash: null },
  ];
  return { supabase: fakeSupabase({ notes, backups }), notes, hash };
}

test('B의 메모 한 건이 사본과 같을 때만 복원되고 다른 메모는 그대로입니다', async () => {
  const { supabase, notes, hash } = setup();
  const result = await restoreOne({ supabase, userId: B, body: { id: 'note:b1', contentHash: hash, confirm: true } });
  assert.equal(result.status, 200);
  assert.equal(result.json.restored, true);
  assert.equal(result.json.contentHash, hash);
  assert.equal(JSON.stringify(result.json).includes('가상 메모 본문'), false);
  assert.equal(notes.find(n => n.id === 'b1').content, '가상 메모 본문');
  assert.deepEqual(notes.find(n => n.id === 'a1'), { id: 'a1', title: 'A 메모', content: 'A 본문', owner_id: A });
  assert.equal(notes.length, 2);
});

test('삭제된 B 메모도 그 한 건만 다시 만들어집니다', async () => {
  const { supabase, notes } = setup();
  const result = await restoreOne({ supabase, userId: B, body: { id: 'b2', contentHash: sha256Hex('삭제 전 본문'), confirm: true } });
  assert.equal(result.status, 200);
  assert.equal(notes.length, 3);
  assert.equal(notes.find(n => n.id === 'b2').owner_id, B);
});

test('B가 A의 메모를 요청하거나 소유자를 속이면 거부됩니다', async () => {
  const { supabase, notes } = setup();
  const other = await restoreOne({ supabase, userId: B, body: { id: 'a1', contentHash: sha256Hex('A 본문') } });
  assert.equal(other.status, 403);
  const forged = await restoreOne({ supabase, userId: B, body: { id: 'b1', owner_id: A, contentHash: sha256Hex('가상 메모 본문') } });
  assert.equal(forged.status, 403);
  const missing = await restoreOne({ supabase, userId: B, body: { id: 'nope', contentHash: sha256Hex('x') } });
  assert.deepEqual(missing.json.error, other.json.error);
  assert.equal(notes.find(n => n.id === 'a1').content, 'A 본문');
});

test('해시가 다르거나 사본이 변조되었으면 거부되고 아무것도 쓰지 않습니다', async () => {
  const { supabase, notes } = setup();
  const wrongHash = await restoreOne({ supabase, userId: B, body: { id: 'b1', contentHash: sha256Hex('다른 내용') } });
  assert.equal(wrongHash.status, 409);
  const tampered = await restoreOne({ supabase, userId: B, body: { id: 'b3', contentHash: sha256Hex('원래 본문') } });
  assert.equal(tampered.status, 409);
  assert.equal(notes.find(n => n.id === 'b1').content, '훼손됨');
  assert.equal(notes.some(n => n.id === 'b3'), false);
});

test('형식이 틀린 요청은 거부됩니다', async () => {
  const { supabase } = setup();
  const hash = sha256Hex('x');
  for (const body of [null, [], {}, { id: '' }, { id: 'b1' }, { contentHash: hash }, { id: 'b1', contentHash: 'abc' },
    { id: 'notice:1', contentHash: hash }, { id: '../x', contentHash: hash }, { id: 'b1', contentHash: hash, role: 'teacher' }]) {
    const result = await restoreOne({ supabase, userId: B, body });
    assert.equal(result.status, 400);
  }
});

test('쓰기 뒤 다시 읽을 때 사본과 다르면 복원 전 상태로 되돌리고 409를 돌려줍니다', async () => {
  const { notes, hash } = setup();
  let writeOccurred = false;
  const backups = [
    { id: 'b1', owner_id: B, title: 'B 원본', content: '가상 메모 본문', content_hash: hash },
  ];
  const fakeSupabase = {
    from(name) {
      if (name === 'notes_backup') {
        return {
          select() {
            return { eq: () => ({ maybeSingle: async () => ({ data: backups[0], error: null }) }) };
          },
        };
      }
      return {
        select() {
          return {
            eq: () => ({
              maybeSingle: async () => {
                if (!writeOccurred) {
                  const found = notes.find(n => n.id === 'b1');
                  return { data: found ? { ...found } : null, error: null };
                }
                return { data: { id: 'b1', owner_id: B, title: 'B 원본', content: '검증실패내용' }, error: null };
              },
            }),
          };
        },
        update(values) {
          writeOccurred = true;
          const target = notes.find(n => n.id === 'b1');
          if (target) Object.assign(target, values);
          const q = { eq: () => q, select: () => q, maybeSingle: async () => ({ data: { id: 'b1' }, error: null }) };
          return q;
        },
      };
    },
  };

  const result = await restoreOne({ supabase: fakeSupabase, userId: B, body: { id: 'b1', contentHash: hash, confirm: true } });
  assert.equal(result.status, 409);
  assert.equal(result.json.error, 'RESTORE_MISMATCH');
  assert.equal(notes.find(n => n.id === 'b1').content, '훼손됨');
});

test('confirm 없이 호출하면 쓰지 않고 preview: true, backupVersion, changed를 돌려줍니다', async () => {
  const { supabase, notes, hash } = setup();
  const result = await restoreOne({ supabase, userId: B, body: { id: 'b1', contentHash: hash } });
  assert.equal(result.status, 200);
  assert.equal(result.json.restored, false);
  assert.equal(result.json.preview, true);
  assert.equal(result.json.requiresConfirmation, true);
  assert.equal(result.json.verified, true);
  assert.equal(result.json.backupVersion, hash);
  assert.equal(result.json.currentVersion, sha256Hex('훼손됨'));
  assert.deepEqual(result.json.changed, ['title', 'content']);
  assert.equal(notes.find(n => n.id === 'b1').content, '훼손됨');
});

test('confirm이 boolean이 아니면 400 INVALID_BODY를 돌려줍니다', async () => {
  const { supabase, hash } = setup();
  for (const badConfirm of ['true', 'false', 1, 0, null, {}]) {
    const result = await restoreOne({ supabase, userId: B, body: { id: 'b1', contentHash: hash, confirm: badConfirm } });
    assert.equal(result.status, 400);
    assert.equal(result.json.error, 'INVALID_BODY');
  }
});

test('쓰기 뒤 다시 읽을 때 제목이 사본과 다르면 복원 전 상태로 되돌리고 409를 돌려줍니다', async () => {
  const { notes, hash } = setup();
  let writeOccurred = false;
  const backups = [
    { id: 'b1', owner_id: B, title: 'B 원본', content: '가상 메모 본문', content_hash: hash },
  ];
  const fakeSupabase = {
    from(name) {
      if (name === 'notes_backup') {
        return {
          select() {
            return { eq: () => ({ maybeSingle: async () => ({ data: backups[0], error: null }) }) };
          },
        };
      }
      return {
        select() {
          return {
            eq: () => ({
              maybeSingle: async () => {
                if (!writeOccurred) {
                  const found = notes.find(n => n.id === 'b1');
                  return { data: found ? { ...found } : null, error: null };
                }
                return { data: { id: 'b1', owner_id: B, title: '변조된 제목', content: '가상 메모 본문' }, error: null };
              },
            }),
          };
        },
        update(values) {
          writeOccurred = true;
          const target = notes.find(n => n.id === 'b1');
          if (target) Object.assign(target, values);
          const q = { eq: () => q, select: () => q, maybeSingle: async () => ({ data: { id: 'b1' }, error: null }) };
          return q;
        },
      };
    },
  };

  const result = await restoreOne({ supabase: fakeSupabase, userId: B, body: { id: 'b1', contentHash: hash, confirm: true } });
  assert.equal(result.status, 409);
  assert.equal(result.json.error, 'RESTORE_MISMATCH');
  assert.equal(notes.find(n => n.id === 'b1').content, '훼손됨');
});



