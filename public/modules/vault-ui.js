// ==========================================
// Protected Vault CRUD UI
// ==========================================
import { dom } from './dom.js';
import { apiFetch } from './api-client.js';

export function resetEditor() {
  dom.editingNoteId.value = '';
  dom.noteTitleInput.value = '';
  dom.noteBodyInput.value = '';
  dom.editorTitle.textContent = '새 가상 메모 추가';
  dom.cancelEditBtn.style.display = 'none';
}

export async function loadNotices() {
  try {
    const res = await apiFetch('/api/notices');
    if (!res.ok) throw new Error('강사 공지를 불러올 수 없습니다. (인증 실패 또는 거부)');
    const notices = await res.json();
    if (!Array.isArray(notices) || notices.length === 0) {
      const item = document.createElement('li');
      item.textContent = '등록된 강사 공지가 없습니다.';
      dom.noticesList.replaceChildren(item);
      return;
    }

    dom.noticesList.replaceChildren(...notices.map(notice => {
      const item = document.createElement('li');
      const resId = notice.resourceId || `notice:${notice.id}`;
      item.dataset.resourceId = resId;

      const badge = document.createElement('div');
      badge.style.fontSize = '12px';
      badge.style.color = '#8ad8df';
      badge.style.marginBottom = '4px';
      badge.textContent = `[자원 ID: ${resId}]`;

      const title = document.createElement('strong');
      const content = document.createElement('span');
      title.textContent = notice.title;
      content.textContent = notice.body || '';

      item.append(badge, title, content);
      return item;
    }));
  } catch (error) {
    const item = document.createElement('li');
    item.textContent = error.message;
    dom.noticesList.replaceChildren(item);
  }
}

export async function loadNotes() {
  try {
    const res = await apiFetch('/api/notes');
    if (!res.ok) throw new Error('자료 API를 읽을 수 없습니다. (인증 실패 또는 거부)');
    const notes = await res.json();
    if (!Array.isArray(notes)) throw new Error('자료 형식이 맞지 않습니다.');

    if (notes.length === 0) {
      const item = document.createElement('li');
      item.textContent = '등록된 가상 메모가 없습니다.';
      dom.notesList.replaceChildren(item);
      return;
    }

    dom.notesList.replaceChildren(...notes.map(note => {
      const item = document.createElement('li');
      const resId = note.resourceId || `note:${note.id}`;
      item.dataset.resourceId = resId;

      const badge = document.createElement('div');
      badge.style.fontSize = '12px';
      badge.style.color = '#3ecf8e';
      badge.style.marginBottom = '4px';
      badge.textContent = `[자원 ID: ${resId}]`;

      const title = document.createElement('strong');
      const content = document.createElement('span');
      title.textContent = note.title;
      // 가상 메모 본문은 보안 요구사항에 따라 화면에 절대 표시하지 않음
      content.textContent = '[가상 메모 본문 비공개 보호]';
      content.style.fontSize = '12px';
      content.style.color = '#7d95b0';

      const actionRow = document.createElement('div');
      actionRow.className = 'action-row';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.textContent = '수정';
      editBtn.addEventListener('click', () => {
        dom.editingNoteId.value = note.id;
        dom.noteTitleInput.value = note.title;
        dom.noteBodyInput.value = ''; // 메모 본문 화면 노출 방지
        dom.editorTitle.textContent = `메모 수정 (자원 ID: ${resId})`;
        dom.cancelEditBtn.style.display = 'inline-block';
        dom.noteTitleInput.focus();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-danger btn-sm';
      deleteBtn.textContent = '삭제';
      deleteBtn.addEventListener('click', async () => {
        if (!confirm(`'${note.title}' 메모를 삭제하시겠습니까?`)) return;
        try {
          const deleteRes = await apiFetch(`/api/notes/${note.id}`, { method: 'DELETE' });
          if (!deleteRes.ok) throw new Error('삭제에 실패했습니다.');
          await loadNotes();
        } catch (err) {
          alert(err.message);
        }
      });

      actionRow.append(editBtn, deleteBtn);
      item.append(badge, title, content, actionRow);
      return item;
    }));
  } catch (error) {
    const item = document.createElement('li');
    item.textContent = error.message;
    dom.notesList.replaceChildren(item);
  }
}

export async function handleNoteSubmit(e) {
  e.preventDefault();
  const id = dom.editingNoteId.value;
  const title = dom.noteTitleInput.value.trim();
  const body = dom.noteBodyInput.value.trim();

  try {
    const res = id
      ? await apiFetch(`/api/notes/${id}`, { method: 'PUT', body: { title, body } })
      : await apiFetch('/api/notes', { method: 'POST', body: { title, body } });

    if (!res.ok) throw new Error(id ? '수정에 실패했습니다.' : '추가에 실패했습니다.');

    resetEditor();
    await loadNotes();
  } catch (err) {
    alert(err.message);
  }
}
