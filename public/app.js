const loggedOutView = document.querySelector('#loggedOutView');
const loggedInView = document.querySelector('#loggedInView');
const userEmailSpan = document.querySelector('#userEmail');
const loginForm = document.querySelector('#loginForm');
const emailInput = document.querySelector('#emailInput');
const passwordInput = document.querySelector('#passwordInput');
const authError = document.querySelector('#authError');
const logoutBtn = document.querySelector('#logoutBtn');
const noticesList = document.querySelector('#notices');
const list = document.querySelector('#notes');

const deviceApprovalSection = document.querySelector('#deviceApprovalSection');
const deviceServerStatusBadge = document.querySelector('#deviceServerStatusBadge');
const deviceStatusDesc = document.querySelector('#deviceStatusDesc');
const requestApprovalBtn = document.querySelector('#requestApprovalBtn');
const approvalResultBox = document.querySelector('#approvalResultBox');
const approvalResultTitle = document.querySelector('#approvalResultTitle');
const approvalResultText = document.querySelector('#approvalResultText');
const vaultContent = document.querySelector('#vaultContent');

const noteForm = document.querySelector('#noteForm');
const editingNoteId = document.querySelector('#editingNoteId');
const noteTitleInput = document.querySelector('#noteTitleInput');
const noteBodyInput = document.querySelector('#noteBodyInput');
const editorTitle = document.querySelector('#editorTitle');
const cancelEditBtn = document.querySelector('#cancelEditBtn');

// 브라우저 저장소(Storage)를 사용하지 않고 순수 JS 메모리 변수로만 관리
let currentSession = null;
let currentApprovalToken = null;

function getAuthHeaders(session = currentSession) {
  const headers = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  if (currentApprovalToken) {
    headers['x-device-approval'] = currentApprovalToken;
  }
  return headers;
}

function updateAuthUI(user) {
  if (user) {
    loggedOutView.style.display = 'none';
    loggedInView.style.display = 'block';
    userEmailSpan.textContent = user.email || '';
    authError.style.display = 'none';
  } else {
    loggedOutView.style.display = 'block';
    loggedInView.style.display = 'none';
    userEmailSpan.textContent = '';
    if (deviceApprovalSection) deviceApprovalSection.style.display = 'none';
    if (vaultContent) vaultContent.style.display = 'none';
    noticesList.replaceChildren();
    list.replaceChildren();
    resetEditor();
  }
}

function showApprovedVault(data) {
  if (deviceApprovalSection) deviceApprovalSection.style.display = 'block';
  if (deviceServerStatusBadge) {
    deviceServerStatusBadge.textContent = '✅ 등록 기기 승인됨';
    deviceServerStatusBadge.style.background = '#1e453e';
    deviceServerStatusBadge.style.color = '#3ecf8e';
  }
  if (deviceStatusDesc) {
    deviceStatusDesc.textContent = `서버 확인 완료: ${data.message || '등록 기기 승인됨'}`;
  }
  if (requestApprovalBtn) requestApprovalBtn.style.display = 'none';
  if (approvalResultBox) approvalResultBox.style.display = 'block';
  if (approvalResultTitle) {
    approvalResultTitle.textContent = '✅ 서버 등록 기기 확인 완료';
    approvalResultTitle.style.color = '#3ecf8e';
  }
  if (approvalResultText) {
    approvalResultText.textContent = '서버 ZTNA 정책에 따라 이 기기의 자료실 접근이 정상 승인되었습니다.';
  }
  if (vaultContent) vaultContent.style.display = 'block';
}

function showUnapprovedDevice(data) {
  if (deviceApprovalSection) deviceApprovalSection.style.display = 'block';
  if (deviceServerStatusBadge) {
    deviceServerStatusBadge.textContent = '⚠️ 미승인 기기';
    deviceServerStatusBadge.style.background = '#4a341b';
    deviceServerStatusBadge.style.color = '#f6c878';
  }
  if (deviceStatusDesc) {
    deviceStatusDesc.textContent = data.message || '현재 기기는 서버에 등록되지 않았습니다. 보호 자료실이 차단되어 있습니다.';
  }
  if (requestApprovalBtn) {
    requestApprovalBtn.style.display = 'inline-block';
    requestApprovalBtn.disabled = false;
    requestApprovalBtn.textContent = '기기 승인 요청';
  }
  if (vaultContent) vaultContent.style.display = 'none';
  noticesList.replaceChildren();
  list.replaceChildren();
}

async function checkDeviceApproval(session = currentSession) {
  try {
    const res = await fetch('/api/device', {
      headers: getAuthHeaders(session),
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (!res.ok) {
      showUnapprovedDevice({ message: '기기 상태 확인 필요 (로그인 필요)' });
      return false;
    }

    const data = await res.json();
    if (data.registered && data.status === 'approved') {
      currentApprovalToken = data.approvalToken || null;
      showApprovedVault(data);
      return true;
    } else {
      currentApprovalToken = null;
      showUnapprovedDevice(data);
      return false;
    }
  } catch (err) {
    showUnapprovedDevice({ message: `기기 확인 중 오류: ${err.message}` });
    return false;
  }
}

function resetEditor() {
  editingNoteId.value = '';
  noteTitleInput.value = '';
  noteBodyInput.value = '';
  editorTitle.textContent = '새 가상 메모 추가';
  cancelEditBtn.style.display = 'none';
}

cancelEditBtn.addEventListener('click', resetEditor);

async function loadNotices(session = currentSession) {
  try {
    const response = await fetch('/api/notices', {
      headers: getAuthHeaders(session),
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error('강사 공지를 불러올 수 없습니다. (인증 실패 또는 거부)');
    const notices = await response.json();
    if (!Array.isArray(notices) || notices.length === 0) {
      const item = document.createElement('li');
      item.textContent = '등록된 강사 공지가 없습니다.';
      noticesList.replaceChildren(item);
      return;
    }

    noticesList.replaceChildren(...notices.map(notice => {
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
    noticesList.replaceChildren(item);
  }
}

async function loadNotes(session = currentSession) {
  try {
    const response = await fetch('/api/notes', {
      headers: getAuthHeaders(session),
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) throw new Error('자료 API를 읽을 수 없습니다. (인증 실패 또는 거부)');
    const notes = await response.json();
    if (!Array.isArray(notes)) throw new Error('자료 형식이 맞지 않습니다.');

    if (notes.length === 0) {
      const item = document.createElement('li');
      item.textContent = '등록된 가상 메모가 없습니다.';
      list.replaceChildren(item);
      return;
    }

    list.replaceChildren(...notes.map(note => {
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
      content.textContent = note.body || '';

      const actionRow = document.createElement('div');
      actionRow.className = 'action-row';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.textContent = '수정';
      editBtn.addEventListener('click', () => {
        editingNoteId.value = note.id;
        noteTitleInput.value = note.title;
        noteBodyInput.value = note.body || '';
        editorTitle.textContent = `메모 수정 (자원 ID: ${resId})`;
        cancelEditBtn.style.display = 'inline-block';
        noteTitleInput.focus();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger btn-sm';
      deleteBtn.textContent = '삭제';
      deleteBtn.addEventListener('click', async () => {
        if (!confirm(`'${note.title}' 메모를 삭제하시겠습니까?`)) return;
        try {
          const res = await fetch(`/api/notes/${note.id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(currentSession),
            credentials: 'same-origin',
          });
          if (!res.ok) throw new Error('삭제에 실패했습니다.');
          await loadNotes(currentSession);
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
    list.replaceChildren(item);
  }
}

noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = editingNoteId.value;
  const title = noteTitleInput.value.trim();
  const body = noteBodyInput.value.trim();

  try {
    if (id) {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(currentSession),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) throw new Error('수정에 실패했습니다.');
    } else {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(currentSession),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) throw new Error('추가에 실패했습니다.');
    }

    resetEditor();
    await loadNotes(currentSession);
  } catch (err) {
    alert(err.message);
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.style.display = 'none';
  authError.textContent = '';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email: emailInput.value,
        password: passwordInput.value,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '로그인에 실패했습니다.');
    }

    // 브라우저 저장소(Storage) 미사용: 메모리 변수에만 보관
    currentSession = {
      access_token: data.access_token,
      user: data.user,
    };
    updateAuthUI(data.user);

    // 로그인 직후 서버 등록 기기 승인 상태 확인
    const isApproved = await checkDeviceApproval(currentSession);
    if (isApproved) {
      await loadNotices(currentSession);
      await loadNotes(currentSession);
    }
  } catch (error) {
    authError.textContent = `로그인 실패: ${error.message}`;
    authError.style.display = 'block';
  }
});

requestApprovalBtn?.addEventListener('click', async () => {
  requestApprovalBtn.disabled = true;
  requestApprovalBtn.textContent = '서버 승인 확인 중...';
  approvalResultBox.style.display = 'block';
  approvalResultTitle.textContent = '기기 승인 처리 중';
  approvalResultTitle.style.color = '#f6c878';
  approvalResultText.textContent = '서버에 기기 승인을 요청하고 등록 기기 여부를 확인하는 중입니다...';

  try {
    const res = await fetch('/api/device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(currentSession),
      },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'request_approval' }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok || !data.registered || data.status !== 'approved') {
      throw new Error(data.message || data.reason || '서버가 이 기기의 승인을 거부했습니다.');
    }

    currentApprovalToken = data.approvalToken || null;
    showApprovedVault(data);
    await loadNotices(currentSession);
    await loadNotes(currentSession);
  } catch (err) {
    currentApprovalToken = null;
    if (approvalResultTitle) {
      approvalResultTitle.textContent = '❌ 기기 승인 거부';
      approvalResultTitle.style.color = '#ff8b9e';
    }
    if (approvalResultText) {
      approvalResultText.textContent = err.message;
    }
    if (vaultContent) vaultContent.style.display = 'none';
    noticesList.replaceChildren();
    list.replaceChildren();
  } finally {
    requestApprovalBtn.disabled = false;
    requestApprovalBtn.textContent = '기기 승인 요청';
  }
});

logoutBtn.addEventListener('click', async () => {
  // 쿠키 만료 처리 및 메모리 세션 초기화 (브라우저 저장소는 원래 비어 있음)
  document.cookie = 'sb_token=; Path=/; Max-Age=0; SameSite=Lax';
  currentSession = null;
  currentApprovalToken = null;
  updateAuthUI(null);
});

// 초기화: 쿠키 기반 세션 확인 (저장소 미사용)
async function initSession() {
  try {
    const res = await fetch('/api/device', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (res.ok) {
      const data = await res.json();
      currentSession = { user: { email: '인증된 사용자' } };
      updateAuthUI(currentSession.user);
      if (data.registered && data.status === 'approved') {
        currentApprovalToken = data.approvalToken || null;
        showApprovedVault(data);
        await loadNotices(currentSession);
        await loadNotes(currentSession);
      } else {
        showUnapprovedDevice(data);
      }
    } else {
      updateAuthUI(null);
    }
  } catch {
    updateAuthUI(null);
  }
}
initSession();

// 네트워크 상태(온라인/오프라인) 및 오프라인 배너 연동
const offlineBanner = document.querySelector('#offlineBanner');
const networkStatusText = document.querySelector('#networkStatusText');
const appDisplayMode = document.querySelector('#appDisplayMode');
const pwaStatusBadge = document.querySelector('#pwaStatusBadge');
const installAppRow = document.querySelector('#installAppRow');
const installPwaBtn = document.querySelector('#installPwaBtn');

function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  if (isOnline) {
    offlineBanner.style.display = 'none';
    if (networkStatusText) {
      networkStatusText.textContent = '온라인';
      networkStatusText.style.color = '#3ecf8e';
    }
  } else {
    offlineBanner.style.display = 'block';
    if (networkStatusText) {
      networkStatusText.textContent = '오프라인';
      networkStatusText.style.color = '#ff8b9e';
    }
  }
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();

const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (isStandalone) {
  if (appDisplayMode) appDisplayMode.textContent = '설치형 웹앱 (Standalone)';
  if (pwaStatusBadge) {
    pwaStatusBadge.textContent = '접속 방식: PWA 웹앱';
    pwaStatusBadge.className = 'device-badge pwa';
  }
} else {
  if (appDisplayMode) appDisplayMode.textContent = '웹 브라우저';
  if (pwaStatusBadge) {
    pwaStatusBadge.textContent = '접속 방식: 브라우저';
    pwaStatusBadge.className = 'device-badge';
  }
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installAppRow) installAppRow.style.display = 'block';
});

installPwaBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (installAppRow) installAppRow.style.display = 'none';
});
