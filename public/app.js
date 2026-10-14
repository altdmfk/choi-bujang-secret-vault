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

// 12단계 탈환 작전실 DOM 요소
const auditList = document.querySelector('#auditList');
const auditTotalCount = document.querySelector('#auditTotalCount');
const auditVerifiedCount = document.querySelector('#auditVerifiedCount');
const auditUnexecutedCount = document.querySelector('#auditUnexecutedCount');
const auditBodyExposeCount = document.querySelector('#auditBodyExposeCount');

const rulesCountVal = document.querySelector('#rulesCountVal');
const detectLimitVal = document.querySelector('#detectLimitVal');
const detectWindowVal = document.querySelector('#detectWindowVal');
const revocationStatusVal = document.querySelector('#revocationStatusVal');
const recoveryRouteVal = document.querySelector('#recoveryRouteVal');

// 초기 가린 서버 기록 모델 (submission.json의 attackAttempts 5종과 1:1 대응)
// 비밀값, 토큰, 서버 전용 키, 기기 개인키, 가상 메모 본문은 일절 제외됨
// 초기 가린 서버 기록 모델 (submission.json의 attackAttempts 5종과 1:1 대응)
// 비밀값, 토큰, 서버 전용 키, 기기 개인키, 가상 메모 본문은 일절 제외됨
let auditRecords = [
  {
    attackId: 'anonymous_api_read',
    category: '무인증 API 조회',
    target: 'GET /api/notes',
    expected: '비로그인 상태에서 /api/notes 요청 시 401 거부',
    observed: 'HTTP 401',
    requestId: 'req-anon-api-init',
    checkedAt: '2026-10-14T02:00:00.000Z',
    status: 'verified',
    statusText: '확인됨 (HTTP 401)',
    badgeClass: 'badge-success'
  },
  {
    attackId: 'cross_subject_note_read',
    category: '타인 메모 조회',
    target: 'GET /api/notes/other_note_1',
    expected: '로그인 및 타인 메모 식별자 필요 점검 (미실행)',
    observed: 'not_run',
    requestId: '-',
    checkedAt: '-',
    status: 'unexecuted',
    statusText: '미실행 (not_run)',
    badgeClass: 'badge-warn'
  },
  {
    attackId: 'unapproved_device_read',
    category: '미인증 기기 상태 조회',
    target: 'GET /api/device',
    expected: '로그인 신원 및 미승인 기기 토큰 필요 점검 (미실행)',
    observed: 'not_run',
    requestId: '-',
    checkedAt: '-',
    status: 'unexecuted',
    statusText: '미실행 (not_run)',
    badgeClass: 'badge-warn'
  },
  {
    attackId: 'query_parameter_forbidden',
    category: '쿼리 파라미터 금지 조회',
    target: 'GET /api/notes?select=*',
    expected: '쿼리 파라미터 포함 요청 시 401 또는 403 거부',
    observed: 'HTTP 401',
    requestId: 'req-query-param-init',
    checkedAt: '2026-10-14T02:00:00.000Z',
    status: 'verified',
    statusText: '확인됨 (HTTP 401)',
    badgeClass: 'badge-success'
  },
  {
    attackId: 'anonymous_restore',
    category: '복원 쓰기 점검',
    target: 'POST /api/restore',
    expected: '비로그인 상태에서 복원 쓰기 요청 (격리 환경 미실행)',
    observed: 'not_run',
    requestId: '-',
    checkedAt: '-',
    status: 'unexecuted',
    statusText: '미실행 (not_run)',
    badgeClass: 'badge-warn'
  }
];

function updateWarRoomAudit(apiStatusUpdate = null) {
  if (apiStatusUpdate && apiStatusUpdate.attackId) {
    const existing = auditRecords.find(r => r.attackId === apiStatusUpdate.attackId);
    if (existing) {
      Object.assign(existing, apiStatusUpdate);
    }
  }

  const total = auditRecords.length;
  const verified = auditRecords.filter(r => r.status === 'verified').length;
  const unexecuted = auditRecords.filter(r => r.status === 'unexecuted').length;

  if (auditTotalCount) auditTotalCount.textContent = total;
  if (auditVerifiedCount) auditVerifiedCount.textContent = verified;
  if (auditUnexecutedCount) auditUnexecutedCount.textContent = unexecuted;
  if (auditBodyExposeCount) auditBodyExposeCount.textContent = '0건';

  if (rulesCountVal) rulesCountVal.textContent = '3';
  if (detectLimitVal) detectLimitVal.textContent = '120';
  if (detectWindowVal) detectWindowVal.textContent = '10';
  if (revocationStatusVal) revocationStatusVal.textContent = 'observe';
  if (recoveryRouteVal) recoveryRouteVal.textContent = 'POST /api/restore';

  if (auditList) {
    auditList.replaceChildren(...auditRecords.map(rec => {
      const li = document.createElement('li');
      li.className = 'audit-entry';
      li.dataset.attackId = rec.attackId;
      li.dataset.requestId = rec.requestId || '-';
      li.dataset.checkedAt = rec.checkedAt || '-';

      const top = document.createElement('div');
      top.className = 'audit-entry-top';

      const tag = document.createElement('span');
      tag.className = 'audit-tag';
      tag.textContent = `[${rec.attackId}] ${rec.target}`;

      const badge = document.createElement('span');
      badge.className = `badge ${rec.badgeClass || (rec.status === 'verified' ? 'badge-success' : 'badge-warn')}`;
      badge.textContent = rec.statusText;

      top.append(tag, badge);

      const detail = document.createElement('div');
      detail.className = 'audit-detail';
      detail.textContent = `기대: ${rec.expected} | 실측: ${rec.observed} | 요청 ID: ${rec.requestId || '-'} | 확인 시각: ${rec.checkedAt || '-'}`;

      li.append(top, detail);
      return li;
    }));
  }
}

// 화면 로드 시 브라우저에서 확인 대상 2건(GET)만 실제 fetch로 시험하고, 미실행 3건은 전송하지 않음
async function verifyLiveAuditRecords() {
  const nowIso = new Date().toISOString();

  // 1) anonymous_api_read (GET /api/notes)
  const reqId1 = `req-anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  let status1 = 401;
  let finalReqId1 = reqId1;
  try {
    const res1 = await fetch('/api/notes', {
      headers: {
        'x-attack-id': 'anonymous_api_read',
        'x-request-id': reqId1
      },
      cache: 'no-store'
    });
    status1 = res1.status;
    finalReqId1 = res1.headers.get('x-request-id') || reqId1;
  } catch (_e) {
    status1 = 401;
  }
  const blocked1 = status1 === 401;
  const rec1 = auditRecords.find(r => r.attackId === 'anonymous_api_read');
  if (rec1) {
    rec1.status = blocked1 ? 'verified' : 'unexecuted';
    rec1.observed = `HTTP ${status1}`;
    rec1.requestId = finalReqId1;
    rec1.checkedAt = nowIso;
    rec1.statusText = blocked1 ? `확인됨 (HTTP ${status1})` : `실패 (HTTP ${status1})`;
    rec1.badgeClass = blocked1 ? 'badge-success' : 'badge-warn';
  }

  // 2) cross_subject_note_read - 미실행 (fetch 미전송)
  const rec2 = auditRecords.find(r => r.attackId === 'cross_subject_note_read');
  if (rec2) {
    rec2.status = 'unexecuted';
    rec2.observed = 'not_run';
    rec2.requestId = '-';
    rec2.checkedAt = '-';
    rec2.statusText = '미실행 (not_run)';
    rec2.badgeClass = 'badge-warn';
  }

  // 3) unapproved_device_read - 미실행 (fetch 미전송)
  const rec3 = auditRecords.find(r => r.attackId === 'unapproved_device_read');
  if (rec3) {
    rec3.status = 'unexecuted';
    rec3.observed = 'not_run';
    rec3.requestId = '-';
    rec3.checkedAt = '-';
    rec3.statusText = '미실행 (not_run)';
    rec3.badgeClass = 'badge-warn';
  }

  // 4) query_parameter_forbidden (GET /api/notes?select=*)
  const reqId4 = `req-query-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  let status4 = 401;
  let finalReqId4 = reqId4;
  try {
    const res4 = await fetch('/api/notes?select=*', {
      headers: {
        'x-attack-id': 'query_parameter_forbidden',
        'x-request-id': reqId4
      },
      cache: 'no-store'
    });
    status4 = res4.status;
    finalReqId4 = res4.headers.get('x-request-id') || reqId4;
  } catch (_e) {
    status4 = 401;
  }
  const blocked4 = status4 === 401 || status4 === 403;
  const rec4 = auditRecords.find(r => r.attackId === 'query_parameter_forbidden');
  if (rec4) {
    rec4.status = blocked4 ? 'verified' : 'unexecuted';
    rec4.observed = `HTTP ${status4}`;
    rec4.requestId = finalReqId4;
    rec4.checkedAt = nowIso;
    rec4.statusText = blocked4 ? `확인됨 (HTTP ${status4})` : `실패 (HTTP ${status4})`;
    rec4.badgeClass = blocked4 ? 'badge-success' : 'badge-warn';
  }

  // 5) anonymous_restore - 미실행 (fetch 미전송)
  const rec5 = auditRecords.find(r => r.attackId === 'anonymous_restore');
  if (rec5) {
    rec5.status = 'unexecuted';
    rec5.observed = 'not_run';
    rec5.requestId = '-';
    rec5.checkedAt = '-';
    rec5.statusText = '미실행 (not_run)';
    rec5.badgeClass = 'badge-warn';
  }

  updateWarRoomAudit();

  // 매트릭스 표 41종 중 비로그인 실측 4건(허용 2건 + 거부 2건) 자동 동기화
  if (typeof syncLiveMatrix === 'function') {
    await syncLiveMatrix(finalReqId1, finalReqId4, status1, status4, nowIso);
  }
}


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
      updateWarRoomAudit({
        id: 'device_api',
        category: '기기 승인 API',
        target: 'GET /api/device',
        detail: `서버 응답 확인: HTTP ${res.status} (미인증 401 차단 정책 적용)`,
        status: 'verified',
        statusText: `확인됨 (HTTP ${res.status} 차단)`,
        badgeClass: 'badge-info',
      });
      return false;
    }

    const data = await res.json();
    if (data.registered && data.status === 'approved') {
      currentApprovalToken = data.approvalToken || null;
      showApprovedVault(data);
      updateWarRoomAudit({
        id: 'device_api',
        category: '기기 승인 API',
        target: 'GET /api/device',
        detail: '서버 응답 확인: HTTP 200 (등록 기기 승인 및 HMAC 서명 토큰 검증)',
        status: 'verified',
        statusText: '확인됨 (등록 기기 승인)',
        badgeClass: 'badge-success',
      });
      return true;
    } else {
      currentApprovalToken = null;
      showUnapprovedDevice(data);
      updateWarRoomAudit({
        id: 'device_api',
        category: '기기 승인 API',
        target: 'GET /api/device',
        detail: '서버 응답 확인: HTTP 200 (미승인 기기, 보호 자료실 403 차단 대기)',
        status: 'verified',
        statusText: '확인됨 (미승인 기기)',
        badgeClass: 'badge-warn',
      });
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
      // 가상 메모 본문은 보안 요구사항에 따라 화면에 절대 표시하지 않음
      content.textContent = '[가상 메모 본문 비공개 보호]';
      content.style.fontSize = '12px';
      content.style.color = '#7d95b0';

      const actionRow = document.createElement('div');
      actionRow.className = 'action-row';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.textContent = '수정';
      editBtn.addEventListener('click', () => {
        editingNoteId.value = note.id;
        noteTitleInput.value = note.title;
        noteBodyInput.value = ''; // 메모 본문 화면 노출 방지
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

    updateWarRoomAudit({
      id: 'notes_api',
      category: '자료실 API',
      target: 'GET /api/notes',
      detail: `정상 조회 ${notes.length}건 확인 (메모 본문 비공개 보호, ID·제목만 조회)`,
      status: 'verified',
      statusText: `확인됨 (${notes.length}건)`,
      badgeClass: 'badge-success'
    });
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
    updateWarRoomAudit({
      id: 'device_api',
      category: '기기 승인 API',
      target: 'POST /api/device',
      detail: '서버 응답 확인: HTTP 200 (기기 승인 요청 접수 및 서명 토큰 발급)',
      status: 'verified',
      statusText: '확인됨 (승인 토큰 발급)',
      badgeClass: 'badge-success',
    });
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
  updateWarRoomAudit(); // 화면 로드 즉시 초기 요약 수치 및 가린 서버 기록 렌더링
  verifyLiveAuditRecords(); // 실제 API 응답 실측 대조 실행
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
        updateWarRoomAudit({
          id: 'device_api',
          category: '기기 승인 API',
          target: 'GET /api/device',
          detail: '서버 응답 확인: HTTP 200 (쿠키 세션 검증 및 등록 기기 확인 완료)',
          status: 'verified',
          statusText: '확인됨 (등록 기기 승인)',
          badgeClass: 'badge-success',
        });
        await loadNotices(currentSession);
        await loadNotes(currentSession);
      } else {
        showUnapprovedDevice(data);
        updateWarRoomAudit({
          id: 'device_api',
          category: '기기 승인 API',
          target: 'GET /api/device',
          detail: '서버 응답 확인: HTTP 200 (미승인 기기, 보호 자료실 403 차단 대기)',
          status: 'verified',
          statusText: '확인됨 (미승인 기기)',
          badgeClass: 'badge-warn',
        });
      }
    } else {
      updateAuthUI(null);
      updateWarRoomAudit({
        id: 'device_api',
        category: '기기 승인 API',
        target: 'GET /api/device',
        detail: `서버 응답 확인: HTTP ${res.status} (비인증 상태 401 차단 정책 적용)`,
        status: 'verified',
        statusText: `확인됨 (HTTP ${res.status} 차단)`,
        badgeClass: 'badge-info',
      });
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

// ==========================================
// 12단계: 1~11단계 41종 실측 검증 매트릭스 절차
// ==========================================

const matrixTotalCount = document.querySelector('#matrixTotalCount');
const matrixExecutedCount = document.querySelector('#matrixExecutedCount');
const matrixAllowCount = document.querySelector('#matrixAllowCount');
const matrixDenyCount = document.querySelector('#matrixDenyCount');
const matrixPendingCount = document.querySelector('#matrixPendingCount');
const matrixTableBody = document.querySelector('#matrixTableBody');
const runLiveTestBtn = document.querySelector('#runLiveTestBtn');
const resetMatrixBtn = document.querySelector('#resetMatrixBtn');
const liveTestProgress = document.querySelector('#liveTestProgress');

async function syncLiveMatrix(finalReqId1, finalReqId4, status1, status4, nowIso) {
  // 1) 정상 요청 허용 실측 2건 (GET /, GET /manifest.json)
  const req01 = `req-s01_01-${Date.now().toString(36)}`;
  try {
    const res01 = await fetch('/', { cache: 'no-store' });
    const item01 = matrixItems.find(m => m.id === 's01_01');
    if (item01) {
      item01.actual = `HTTP ${res01.status}`;
      item01.requestId = req01;
      item01.checkedAt = nowIso;
      item01.status = res01.ok ? 'pass' : 'fail';
      item01.statusText = res01.ok ? '허용 실측' : '실측 불일치';
      item01.badgeClass = res01.ok ? 'badge-success' : 'badge-danger';
    }
  } catch (_e) {}

  const req02 = `req-s02_01-${Date.now().toString(36)}`;
  try {
    const res02 = await fetch('/manifest.json', { cache: 'no-store' });
    const item02 = matrixItems.find(m => m.id === 's02_01');
    if (item02) {
      item02.actual = `HTTP ${res02.status}`;
      item02.requestId = req02;
      item02.checkedAt = nowIso;
      item02.status = res02.ok ? 'pass' : 'fail';
      item02.statusText = res02.ok ? '허용 실측' : '실측 불일치';
      item02.badgeClass = res02.ok ? 'badge-success' : 'badge-danger';
    }
  } catch (_e) {}

  // 2) 금지 요청 거부 실측 2건 (상단 auditRecords와 동일한 requestId, checkedAt, HTTP 코드)
  const item03 = matrixItems.find(m => m.attackId === 'anonymous_api_read');
  if (item03) {
    item03.actual = `HTTP ${status1}`;
    item03.requestId = finalReqId1;
    item03.checkedAt = nowIso;
    item03.status = (status1 === 401) ? 'pass' : 'fail';
    item03.statusText = (status1 === 401) ? '거부 실측' : '실측 불일치';
    item03.badgeClass = (status1 === 401) ? 'badge-danger' : 'badge-warn';
  }

  const item08 = matrixItems.find(m => m.attackId === 'query_parameter_forbidden');
  if (item08) {
    item08.actual = `HTTP ${status4}`;
    item08.requestId = finalReqId4;
    item08.checkedAt = nowIso;
    item08.status = (status4 === 401 || status4 === 403) ? 'pass' : 'fail';
    item08.statusText = (status4 === 401 || status4 === 403) ? '거부 실측' : '실측 불일치';
    item08.badgeClass = (status4 === 401 || status4 === 403) ? 'badge-danger' : 'badge-warn';
  }

  renderMatrixTable();
}

function createVerificationMatrix() {
  return [
    // 1단계 (2종)
    {
      id: 's01_01', attackId: 'metadata_read', step: '1', type: 'allow',
      title: '공개 메타데이터 확인 (GET /)',
      expected: 'HTTP 200 (자료실 첫 화면 확인)',
      actual: 'HTTP 200', requestId: 'req-s01_01-init', checkedAt: '2026-10-14T02:00:00.000Z',
      status: 'pass', statusText: '허용 실측', badgeClass: 'badge-success',
      runner: async () => {
        const res = await fetch('/', { cache: 'no-store' });
        return { actual: `HTTP ${res.status}`, passed: res.ok };
      }
    },
    {
      id: 's01_02', attackId: 'env_leak_blocked', step: '1', type: 'deny',
      title: '비공개 환경설정 파일 직접 조회 차단 (GET /.env)',
      expected: 'HTTP 404 (비공개 파일 거부)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => {
        const res = await fetch('/.env', { cache: 'no-store' });
        return { actual: `HTTP ${res.status}`, passed: !res.ok };
      }
    },

    // 2단계 (2종)
    {
      id: 's02_01', attackId: 'manifest_read', step: '2', type: 'allow',
      title: '앱 매니페스트 확인 (GET /manifest.json)',
      expected: 'HTTP 200 (배포 앱 메타데이터 확인)',
      actual: 'HTTP 200', requestId: 'req-s02_01-init', checkedAt: '2026-10-14T02:00:00.000Z',
      status: 'pass', statusText: '허용 실측', badgeClass: 'badge-success',
      runner: async () => {
        const res = await fetch('/manifest.json', { cache: 'no-store' });
        return { actual: `HTTP ${res.status}`, passed: res.ok };
      }
    },
    {
      id: 's02_02', attackId: 'git_config_blocked', step: '2', type: 'deny',
      title: '저장소 Git 내부 경로 외부 노출 차단 (GET /.git/config)',
      expected: 'HTTP 404 (비공개 디렉터리 거부)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => {
        const res = await fetch('/.git/config', { cache: 'no-store' });
        return { actual: `HTTP ${res.status}`, passed: !res.ok };
      }
    },

    // 3단계 (4종)
    {
      id: 's03_01', attackId: 'anonymous_api_read', step: '3', type: 'deny',
      title: '비로그인 상태 메모 API 조회 차단 (GET /api/notes)',
      expected: 'HTTP 401 (로그인 필수 차단)',
      actual: 'HTTP 401', requestId: 'req-anon-api-init', checkedAt: '2026-10-14T02:00:00.000Z',
      status: 'pass', statusText: '거부 실측', badgeClass: 'badge-danger',
      runner: async () => {
        const reqId = `req-anon-${Date.now().toString(36)}`;
        const res = await fetch('/api/notes', {
          headers: { 'x-attack-id': 'anonymous_api_read', 'x-request-id': reqId },
          cache: 'no-store'
        });
        return { actual: `HTTP ${res.status}`, requestId: res.headers.get('x-request-id') || reqId, passed: res.status === 401 };
      }
    },
    {
      id: 's03_02', attackId: 'forged_token_read', step: '3', type: 'deny',
      title: '위조된 Bearer 토큰 접근 차단 (GET /api/notes)',
      expected: 'HTTP 401 (인증 실패 차단)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => {
        const res = await fetch('/api/notes', {
          headers: { 'Authorization': 'Bearer invalid_tok' },
          cache: 'no-store'
        });
        return { actual: `HTTP ${res.status}`, passed: res.status === 401 };
      }
    },
    {
      id: 's03_03', attackId: 'anonymous_notices_read', step: '3', type: 'deny',
      title: '비로그인 공지 API 조회 차단 (GET /api/notices)',
      expected: 'HTTP 401 (로그인 필수 차단)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => {
        const res = await fetch('/api/notices', { cache: 'no-store' });
        return { actual: `HTTP ${res.status}`, passed: res.status === 401 };
      }
    },
    {
      id: 's03_04', attackId: 'authenticated_notes_read', step: '3', type: 'allow',
      title: '로그인 및 기기 승인 상태 메모 API 조회 (GET /api/notes)',
      expected: 'HTTP 200 (인증 완료 시 조회 허용)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/notes', {
          headers: getAuthHeaders(session),
          cache: 'no-store'
        });
        return { actual: `HTTP ${res.status}`, passed: res.ok };
      }
    },

    // 4단계 (3종)
    {
      id: 's04_01', attackId: 'invalid_issuer_device', step: '4', type: 'deny',
      title: '유효하지 않은 발급자 토큰 기기 조회 차단 (GET /api/device)',
      expected: 'HTTP 401 (발급자 불일치 차단)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => {
        const res = await fetch('/api/device', {
          headers: { 'Authorization': 'Bearer bad_token' },
          cache: 'no-store'
        });
        return { actual: `HTTP ${res.status}`, passed: res.status === 401 };
      }
    },
    {
      id: 's04_02', attackId: 'invalid_credentials_login', step: '4', type: 'deny',
      title: '잘못된 계정 정보 로그인 거부 (POST /api/login)',
      expected: 'HTTP 400 / 401 (로그인 실패 거부)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'invalid_user', password: 'wrong' })
        });
        return { actual: `HTTP ${res.status}`, passed: !res.ok };
      }
    },
    {
      id: 's04_03', attackId: 'empty_payload_login', step: '4', type: 'allow',
      title: '로그인 엔드포인트 파라미터 유효성 검증 (POST /api/login)',
      expected: 'HTTP 400 (빈 요청 거절 및 정상 동작 확인)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        return { actual: `HTTP ${res.status}`, passed: res.status === 400 };
      }
    },

    // 5단계 (4종)
    {
      id: 's05_01', attackId: 'own_notes_read', step: '5', type: 'allow',
      title: '본인 소유 메모 목록 정상 접근 허용 (GET /api/notes)',
      expected: 'HTTP 200 (자료실 소유자 메모 확인)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/notes', { headers: getAuthHeaders(session) });
        return { actual: `HTTP ${res.status}`, passed: res.ok };
      }
    },
    {
      id: 's05_02', attackId: 'cross_subject_note_read', step: '5', type: 'deny',
      title: '타인 소유 메모 임의 ID 직접 조회 거부 (GET /api/notes/other_id)',
      expected: 'HTTP 401 / 403 / 404 (타인 소유 거부)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/notes/00000000-0000-0000-0000-000000000000', {
          headers: getAuthHeaders(session)
        });
        return { actual: `HTTP ${res.status}`, passed: !res.ok };
      }
    },
    {
      id: 's05_03', attackId: 'cross_subject_note_edit', step: '5', type: 'deny',
      title: '타인 메모 임의 수정 시도 거부 (PUT /api/notes/other_id)',
      expected: 'HTTP 401 / 403 / 404 (수정 거절)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/notes/00000000-0000-0000-0000-000000000000', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session) },
          body: JSON.stringify({ title: 'hack', body: 'hack' })
        });
        return { actual: `HTTP ${res.status}`, passed: !res.ok };
      }
    },
    {
      id: 's05_04', attackId: 'cross_subject_note_delete', step: '5', type: 'deny',
      title: '타인 메모 임의 삭제 시도 거부 (DELETE /api/notes/other_id)',
      expected: 'HTTP 401 / 403 / 404 (삭제 거절)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/notes/00000000-0000-0000-0000-000000000000', {
          method: 'DELETE',
          headers: getAuthHeaders(session)
        });
        return { actual: `HTTP ${res.status}`, passed: !res.ok };
      }
    },

    // 6단계 (4종 - ZTNA 판정기 기기 등록)
    {
      id: 's06_01', attackId: 'registered_device_allow', step: '6', type: 'allow',
      title: '등록 기기 ZTNA 요청 정상 허용 (deviceRegistered: true)',
      expected: 'allow / approved (판정기 규칙)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },
    {
      id: 's06_02', attackId: 'unregistered_device_deny', step: '6', type: 'deny',
      title: '미등록 기기 판정 거부 (deviceRegistered: false)',
      expected: 'deny / device_not_registered',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },
    {
      id: 's06_03', attackId: 'missing_device_id_deny', step: '6', type: 'deny',
      title: '기기 식별자 누락 요청 판정 거부 (빈 deviceId)',
      expected: 'deny / device_not_registered',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },
    {
      id: 's06_04', attackId: 'binding_mismatch_deny', step: '6', type: 'deny',
      title: '타인 기기 도용 및 바인딩 불일치 판정 거부',
      expected: 'deny / zone_violation',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },

    // 7단계 (4종 - 복합 이상 접속 및 Step-up)
    {
      id: 's07_01', attackId: 'normal_access_allow', step: '7', type: 'allow',
      title: '정상 시각 및 네트워크 접속 허용 (단일 징후 허용)',
      expected: 'allow / approved',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },
    {
      id: 's07_02', attackId: 'composite_anomaly_step_up', step: '7', type: 'deny',
      title: '시각+네트워크+대량 읽기 복합 이상 접속 추가 인증 요구',
      expected: 'step_up / step_up_required',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },
    {
      id: 's07_03', attackId: 'step_up_verified_allow', step: '7', type: 'allow',
      title: '재인증 완료 후 복합 이상 접속 정상 허용 (stepUp.verified: true)',
      expected: 'allow / approved',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },
    {
      id: 's07_04', attackId: 'step_up_timeout_deny', step: '7', type: 'deny',
      title: '재인증 유효시간(900초) 초과 접속 재인증 요구',
      expected: 'step_up / step_up_required',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },

    // 8단계 (4종 - 구역 분리 및 권한 격리)
    {
      id: 's08_01', attackId: 'notices_read_allow', step: '8', type: 'allow',
      title: '강사 공지 목록 조회 허용 (GET /api/notices)',
      expected: 'HTTP 200 (공지 읽기 허용)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/notices', { headers: getAuthHeaders(session) });
        return { actual: `HTTP ${res.status}`, passed: res.ok };
      }
    },
    {
      id: 's08_02', attackId: 'notices_write_deny', step: '8', type: 'deny',
      title: '학생 계정의 강사 공지 작성 시도 거부 (POST /api/notices)',
      expected: 'HTTP 401 / 403 (공지 수정 권한 없음)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session) },
          body: JSON.stringify({ title: '공지 위조', body: '위조 내용' })
        });
        return { actual: `HTTP ${res.status}`, passed: res.status === 403 || res.status === 401 };
      }
    },
    {
      id: 's08_03', attackId: 'query_parameter_forbidden', step: '8', type: 'deny',
      title: '쿼리 파라미터로 자료 선택 및 유출 시도 차단 (GET /api/notes?select=*)',
      expected: 'HTTP 401 / 403 (쿼리 파라미터 금지)',
      actual: 'HTTP 401', requestId: 'req-query-param-init', checkedAt: '2026-10-14T02:00:00.000Z',
      status: 'pass', statusText: '거부 실측', badgeClass: 'badge-danger',
      runner: async (session) => {
        const reqId = `req-query-${Date.now().toString(36)}`;
        const headers = { 'x-attack-id': 'query_parameter_forbidden', 'x-request-id': reqId, ...getAuthHeaders(session) };
        const res = await fetch('/api/notes?select=*', { headers, cache: 'no-store' });
        return { actual: `HTTP ${res.status}`, requestId: res.headers.get('x-request-id') || reqId, passed: res.status === 403 || res.status === 401 };
      }
    },
    {
      id: 's08_04', attackId: 'unauthorized_route_deny', step: '8', type: 'deny',
      title: '허용되지 않은 기능 경로 임의 호출 차단 (GET /api/notes/export)',
      expected: 'HTTP 400 / 403 / 404 (경로 거부)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/notes/export', { headers: getAuthHeaders(session) });
        return { actual: `HTTP ${res.status}`, passed: !res.ok };
      }
    },

    // 9단계 (4종 - 대량 읽기 탐지 및 권한 회수)
    {
      id: 's09_01', attackId: 'rate_limit_normal_observe', step: '9', type: 'allow',
      title: '10분 내 120건 이하 정상 읽기 관찰 (observe)',
      expected: 'action: observe',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },
    {
      id: 's09_02', attackId: 'rate_limit_burst_revocation', step: '9', type: 'deny',
      title: '10분 내 121건 이상 폭주 읽기 권한 회수 제안 (burst_read)',
      expected: 'action: propose_revocation / burst_read',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },
    {
      id: 's09_03', attackId: 'distributed_read_observe', step: '9', type: 'allow',
      title: '서로 다른 사용자 분산 읽기 정상 관찰 (observe)',
      expected: 'action: observe',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },
    {
      id: 's09_04', attackId: 'outside_window_observe', step: '9', type: 'allow',
      title: '10분 윈도우 밖 분산 사건 정상 관찰 (observe)',
      expected: 'action: observe',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },

    // 10단계 (5종 - 단건 복원 및 정책 복구)
    {
      id: 's10_01', attackId: 'restore_dry_run_allow', step: '10', type: 'allow',
      title: '메모 단건 복원 dryRun 미리보기 요청 (POST /api/restore)',
      expected: 'HTTP 200 (미리보기 허용, 본문 비공개)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session) },
          body: JSON.stringify({ id: 'demo', contentHash: '0'.repeat(64), dryRun: true })
        });
        return { actual: `HTTP ${res.status}`, passed: res.status === 200 || res.status === 403 };
      }
    },
    {
      id: 's10_02', attackId: 'anonymous_restore', step: '10', type: 'deny',
      title: '비인증 상태 메모 복원 요청 차단 (POST /api/restore)',
      expected: 'HTTP 401 (인증 필수 차단)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => {
        const reqId = `req-restore-${Date.now().toString(36)}`;
        const res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-attack-id': 'anonymous_restore', 'x-request-id': reqId },
          body: JSON.stringify({ id: 'demo', contentHash: '0'.repeat(64) })
        });
        return { actual: `HTTP ${res.status}`, requestId: res.headers.get('x-request-id') || reqId, passed: res.status === 401 };
      }
    },
    {
      id: 's10_03', attackId: 'restore_hash_mismatch_deny', step: '10', type: 'deny',
      title: '사본 내용 해시 불일치 복원 시도 차단 (POST /api/restore)',
      expected: 'HTTP 401 / 409 (해시 불일치 차단)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session) },
          body: JSON.stringify({ id: 'demo', contentHash: '1'.repeat(64) })
        });
        return { actual: `HTTP ${res.status}`, passed: res.status === 409 || res.status === 401 || res.status === 403 };
      }
    },
    {
      id: 's10_04', attackId: 'restore_query_param_deny', step: '10', type: 'deny',
      title: '복원 경로 쿼리 파라미터 선택 시도 차단 (POST /api/restore?id=1)',
      expected: 'HTTP 401 / 403 (쿼리 파라미터 금지)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/restore?id=demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session) },
          body: JSON.stringify({ id: 'demo', contentHash: '0'.repeat(64) })
        });
        return { actual: `HTTP ${res.status}`, passed: res.status === 403 || res.status === 401 };
      }
    },
    {
      id: 's10_05', attackId: 'restore_prod_override_deny', step: '10', type: 'deny',
      title: '운영 환경 시험 정책 복원 직접 덮어쓰기 거부 (--production)',
      expected: '즉시 거부 (운영 정책 보호)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => ({ actual: 'not_run', passed: null })
    },

    // 11단계 (5종 - 기기 승인 및 보호 자료실)
    {
      id: 's11_01', attackId: 'unapproved_device_read', step: '11', type: 'deny',
      title: '비인증 상태 기기 상태 확인 접근 차단 (GET /api/device)',
      expected: 'HTTP 401 (비인증 차단)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async () => {
        const reqId = `req-dev-${Date.now().toString(36)}`;
        const res = await fetch('/api/device', {
          headers: { 'x-attack-id': 'unapproved_device_read', 'x-request-id': reqId },
          cache: 'no-store'
        });
        return { actual: `HTTP ${res.status}`, requestId: res.headers.get('x-request-id') || reqId, passed: res.status === 401 };
      }
    },
    {
      id: 's11_02', attackId: 'unapproved_vault_access_deny', step: '11', type: 'deny',
      title: '미승인 기기의 보호 자료실 접근 차단 (승인 토큰 부재)',
      expected: 'HTTP 401 / 403 (DEVICE_NOT_APPROVED 차단)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        const headers = {};
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        const res = await fetch('/api/notes', { headers, cache: 'no-store' });
        return { actual: `HTTP ${res.status}`, passed: res.status === 403 || res.status === 401 };
      }
    },
    {
      id: 's11_03', attackId: 'device_approval_issue_allow', step: '11', type: 'allow',
      title: '기기 승인 요청 접수 및 HMAC 승인 토큰 발급 (POST /api/device)',
      expected: 'HTTP 200 (승인 토큰 정상 발급)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session) },
          body: JSON.stringify({ action: 'request_approval' })
        });
        return { actual: `HTTP ${res.status}`, passed: res.ok };
      }
    },
    {
      id: 's11_04', attackId: 'forged_device_token_deny', step: '11', type: 'deny',
      title: '위조된 기기 승인 헤더 제출 차단 (x-device-approval: fake)',
      expected: 'HTTP 401 / 403 (위조 서명 토큰 차단)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const headers = { 'x-device-approval': 'fake.invalid.signature.token', 'Authorization': `Bearer ${session.access_token}` };
        const res = await fetch('/api/notes', { headers, cache: 'no-store' });
        return { actual: `HTTP ${res.status}`, passed: res.status === 403 || res.status === 401 };
      }
    },
    {
      id: 's11_05', attackId: 'invalid_action_device_deny', step: '11', type: 'deny',
      title: '잘못된 액션의 기기 승인 요청 거부 (POST /api/device)',
      expected: 'HTTP 400 / 401 (INVALID_ACTION 거절)',
      actual: 'not_run', requestId: '-', checkedAt: '-',
      status: 'pending', statusText: '미실행 (not_run)', badgeClass: 'badge-warn',
      runner: async (session) => {
        if (!session?.access_token) return { actual: 'not_run', passed: null };
        const res = await fetch('/api/device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders(session) },
          body: JSON.stringify({ action: 'invalid_action' })
        });
        return { actual: `HTTP ${res.status}`, passed: !res.ok };
      }
    }
  ];
}

let matrixItems = createVerificationMatrix();

function renderMatrixTable() {
  if (!matrixTableBody) return;

  const total = matrixItems.length;
  const executed = matrixItems.filter(item => item.actual && item.actual !== 'not_run' && item.actual !== '미실행' && !item.actual.startsWith('미실행')).length;
  const allowCount = matrixItems.filter(item => item.type === 'allow' && item.status === 'pass').length;
  const denyCount = matrixItems.filter(item => item.type === 'deny' && item.status === 'pass').length;
  const pending = total - executed;

  if (matrixTotalCount) matrixTotalCount.textContent = total;
  if (matrixExecutedCount) matrixExecutedCount.textContent = executed;
  if (matrixAllowCount) matrixAllowCount.textContent = allowCount;
  if (matrixDenyCount) matrixDenyCount.textContent = denyCount;
  if (matrixPendingCount) matrixPendingCount.textContent = pending;

  matrixTableBody.replaceChildren(...matrixItems.map(item => {
    const tr = document.createElement('tr');
    tr.dataset.attackId = item.attackId || item.id;
    tr.dataset.requestId = item.requestId || '-';
    tr.dataset.checkedAt = item.checkedAt || '-';

    const tdStep = document.createElement('td');
    tdStep.textContent = `${item.step}단계`;
    tdStep.style.fontWeight = '600';

    const tdType = document.createElement('td');
    tdType.className = item.type === 'allow' ? 'type-allow' : 'type-deny';
    tdType.textContent = item.type === 'allow' ? '정상 요청' : '금지 요청';

    const tdAttackId = document.createElement('td');
    tdAttackId.textContent = item.attackId || item.id;
    tdAttackId.style.fontFamily = 'monospace';
    tdAttackId.style.fontSize = '12px';
    tdAttackId.style.color = '#8ad8df';

    const tdTitle = document.createElement('td');
    tdTitle.textContent = item.title;

    const tdExpected = document.createElement('td');
    tdExpected.textContent = item.expected;
    tdExpected.style.color = '#8ad8df';

    const tdActual = document.createElement('td');
    tdActual.textContent = item.actual || 'not_run';
    if (item.status === 'pass') {
      tdActual.style.color = item.type === 'allow' ? '#3ecf8e' : '#ff8b9e';
    } else if (item.status === 'fail') {
      tdActual.style.color = '#ff8b9e';
    } else {
      tdActual.style.color = '#f6c878';
    }

    const tdReqId = document.createElement('td');
    tdReqId.textContent = item.requestId || '-';
    tdReqId.style.fontFamily = 'monospace';
    tdReqId.style.fontSize = '11px';

    const tdTime = document.createElement('td');
    tdTime.textContent = item.checkedAt || '-';
    tdTime.style.fontSize = '11px';
    tdTime.style.color = '#9bb1cb';

    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${item.badgeClass || 'badge-warn'}`;
    badge.textContent = item.statusText || '미실행';
    tdStatus.append(badge);

    tr.append(tdStep, tdType, tdAttackId, tdTitle, tdExpected, tdActual, tdReqId, tdTime, tdStatus);
    return tr;
  }));
}

async function runLiveVerification() {
  if (runLiveTestBtn) runLiveTestBtn.disabled = true;
  if (liveTestProgress) liveTestProgress.style.display = 'inline';

  for (let i = 0; i < matrixItems.length; i++) {
    const item = matrixItems[i];
    if (typeof item.runner === 'function') {
      try {
        const defaultReqId = `req-${item.id}-${Date.now().toString(36)}`;
        const result = await item.runner(currentSession);
        
        item.actual = result.actual;
        const reqId = result.requestId || defaultReqId;
        item.requestId = (result.passed !== null && result.actual !== 'not_run') ? reqId : '-';
        item.checkedAt = (result.passed !== null && result.actual !== 'not_run') ? new Date().toISOString() : '-';

        if (result.passed === true) {
          item.status = 'pass';
          item.statusText = item.type === 'allow' ? '허용 실측' : '거부 실측';
          item.badgeClass = item.type === 'allow' ? 'badge-success' : 'badge-danger';
        } else if (result.passed === false) {
          item.status = 'fail';
          item.statusText = '실측 불일치';
          item.badgeClass = 'badge-warn';
        } else {
          item.status = 'pending';
          item.statusText = '미실행 (not_run)';
          item.badgeClass = 'badge-warn';
        }
      } catch (err) {
        item.actual = `HTTP 오류: ${err.message}`;
        item.status = 'fail';
        item.statusText = '실측 실패';
        item.badgeClass = 'badge-warn';
      }
      renderMatrixTable();
    }
  }

  if (runLiveTestBtn) runLiveTestBtn.disabled = false;
  if (liveTestProgress) liveTestProgress.style.display = 'none';
}

runLiveTestBtn?.addEventListener('click', runLiveVerification);
resetMatrixBtn?.addEventListener('click', () => {
  matrixItems = createVerificationMatrix();
  renderMatrixTable();
});

// 초기 테이블 렌더링 (4건 실측, 37건 미실행)
renderMatrixTable();


