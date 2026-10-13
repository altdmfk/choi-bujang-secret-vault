import { createHash } from 'node:crypto';

// 비공개 가상 메모 사본(notes_backup)에 "바뀌기 직전의 한 건"을 저장합니다.
// 수정·삭제 직전마다 호출하므로 사본은 항상 마지막으로 바뀌기 직전 상태입니다.
// 이미 같은 내용의 사본이 있으면 쓰지 않습니다.
// 사본 저장에 실패해도 원래 요청은 막지 않고, 메모 본문·토큰은 로그에 남기지 않습니다.
export async function saveBackup(supabase, note) {
  try {
    if (!note || typeof note.id !== 'string' || !note.id || !note.owner_id) return;
    const content = typeof note.content === 'string' ? note.content : '';
    const row = {
      id: note.id,
      owner_id: note.owner_id,
      title: note.title ?? '',
      content,
      content_hash: createHash('sha256').update(content, 'utf8').digest('hex'),
    };
    const { data: existing, error } = await supabase
      .from('notes_backup')
      .select('id, owner_id, title, content_hash')
      .eq('id', note.id)
      .maybeSingle();
    if (error) return;
    if (!existing) {
      await supabase.from('notes_backup').insert(row);
      return;
    }
    // 다른 사용자의 사본은 건드리지 않습니다. 같은 내용이면 다시 쓰지 않습니다.
    if (existing.owner_id !== note.owner_id) return;
    if (existing.content_hash === row.content_hash && existing.title === row.title) return;
    await supabase.from('notes_backup')
      .update({ title: row.title, content: row.content, content_hash: row.content_hash })
      .eq('id', note.id)
      .eq('owner_id', note.owner_id);
  } catch {
    // 사본 저장 실패는 조용히 넘깁니다.
  }
}

export { saveBackup as snapshotIfAbsent };
