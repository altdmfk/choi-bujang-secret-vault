import { createHash } from 'node:crypto';

// 비공개 가상 메모 사본(notes_backup)을 "아직 없을 때만" 만듭니다.
// 이미 있는 사본은 덮어쓰지 않으므로, 메모가 변조·삭제돼도 침해 전 내용이 남습니다.
// 사본 저장에 실패해도 원래 요청은 막지 않고, 메모 본문·토큰은 로그에 남기지 않습니다.
export async function snapshotIfAbsent(supabase, note) {
  try {
    if (!note || typeof note.id !== 'string' || !note.id || !note.owner_id) return;
    const { data: existing, error } = await supabase
      .from('notes_backup')
      .select('id')
      .eq('id', note.id)
      .maybeSingle();
    if (error || existing) return;
    const content = typeof note.content === 'string' ? note.content : '';
    await supabase.from('notes_backup').insert({
      id: note.id,
      owner_id: note.owner_id,
      title: note.title ?? '',
      content,
      content_hash: createHash('sha256').update(content, 'utf8').digest('hex'),
    });
  } catch {
    // 사본 저장 실패는 조용히 넘깁니다.
  }
}
