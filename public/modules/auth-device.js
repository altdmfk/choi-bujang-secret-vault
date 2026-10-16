// ==========================================
// Auth State & Device Approval UI
// ==========================================
import { dom } from './dom.js';
import { apiFetch, setSession, setApprovalToken, clearAuth } from './api-client.js';
import { loadNotices, loadNotes, resetEditor } from './vault-ui.js';

export function updateAuthUI(user) {
  if (user) {
    dom.loggedOutView.style.display = 'none';
    dom.loggedInView.style.display = 'block';
    dom.userEmailSpan.textContent = user.email || '';
    dom.authError.style.display = 'none';
    dom.authError.textContent = '';
  } else {
    dom.loggedOutView.style.display = 'block';
    dom.loggedInView.style.display = 'none';
    dom.userEmailSpan.textContent = '';
    if (dom.deviceApprovalSection) dom.deviceApprovalSection.style.display = 'none';
    if (dom.vaultContent) dom.vaultContent.style.display = 'none';
    dom.noticesList.replaceChildren();
    dom.notesList.replaceChildren();
    resetEditor();
  }
}

export function showApprovedVault(data) {
  if (dom.deviceApprovalSection) dom.deviceApprovalSection.style.display = 'block';
  if (dom.deviceServerStatusBadge) {
    dom.deviceServerStatusBadge.textContent = '✅ 등록 기기 승인됨';
    dom.deviceServerStatusBadge.style.background = '#1e453e';
    dom.deviceServerStatusBadge.style.color = '#3ecf8e';
  }
  if (dom.deviceStatusDesc) {
    dom.deviceStatusDesc.textContent = `서버 확인 완료: ${data.message || '등록 기기 승인됨'}`;
  }
  if (dom.requestApprovalBtn) dom.requestApprovalBtn.style.display = 'none';
  if (dom.approvalResultBox) dom.approvalResultBox.style.display = 'block';
  if (dom.approvalResultTitle) {
    dom.approvalResultTitle.textContent = '✅ 서버 등록 기기 확인 완료';
    dom.approvalResultTitle.style.color = '#3ecf8e';
  }
  if (dom.approvalResultText) {
    dom.approvalResultText.textContent = '서버 ZTNA 정책에 따라 이 기기의 자료실 접근이 정상 승인되었습니다.';
  }
  if (dom.vaultContent) dom.vaultContent.style.display = 'block';
}

export function showUnapprovedDevice(data) {
  if (dom.deviceApprovalSection) dom.deviceApprovalSection.style.display = 'block';
  if (dom.deviceServerStatusBadge) {
    dom.deviceServerStatusBadge.textContent = '⚠️ 미승인 기기';
    dom.deviceServerStatusBadge.style.background = '#4a341b';
    dom.deviceServerStatusBadge.style.color = '#f6c878';
  }
  if (dom.deviceStatusDesc) {
    dom.deviceStatusDesc.textContent = data.message || '현재 기기는 서버에 등록되지 않았습니다. 보호 자료실이 차단되어 있습니다.';
  }
  if (dom.requestApprovalBtn) {
    dom.requestApprovalBtn.style.display = 'inline-block';
    dom.requestApprovalBtn.disabled = false;
    dom.requestApprovalBtn.textContent = '기기 승인 요청';
  }
  if (dom.vaultContent) dom.vaultContent.style.display = 'none';
  dom.noticesList.replaceChildren();
  dom.notesList.replaceChildren();
}

export async function checkDeviceApproval() {
  try {
    const res = await apiFetch('/api/device');
    if (!res.ok) {
      showUnapprovedDevice({ message: '기기 상태 확인 필요 (로그인 필요)' });
      return false;
    }

    const data = await res.json();
    if (data.registered && data.status === 'approved') {
      setApprovalToken(data.approvalToken || null);
      showApprovedVault(data);
      return true;
    } else {
      setApprovalToken(null);
      showUnapprovedDevice(data);
      return false;
    }
  } catch (err) {
    showUnapprovedDevice({ message: `기기 확인 중 오류: ${err.message}` });
    return false;
  }
}

export async function handleLogin(e) {
  e.preventDefault();
  dom.authError.style.display = 'none';
  dom.authError.textContent = '';

  try {
    const res = await apiFetch('/api/login', {
      method: 'POST',
      body: {
        email: dom.emailInput.value,
        password: dom.passwordInput.value,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '로그인에 실패했습니다.');
    }

    setSession({
      access_token: data.access_token,
      user: data.user,
    });
    updateAuthUI(data.user);

    // 로그인 직후 서버 등록 기기 승인 상태 확인 (클라이언트 단독 판단 배제)
    const isApproved = await checkDeviceApproval();
    if (isApproved) {
      await loadNotices();
      await loadNotes();
    }
  } catch (error) {
    dom.authError.textContent = `로그인 실패: ${error.message}`;
    dom.authError.style.display = 'block';
  }
}

export function handleLogout() {
  document.cookie = 'sb_token=; Path=/; Max-Age=0; SameSite=Lax';
  clearAuth();
  updateAuthUI(null);
}

export async function requestDeviceApproval() {
  if (!dom.requestApprovalBtn) return;
  dom.requestApprovalBtn.disabled = true;
  dom.requestApprovalBtn.textContent = '서버 승인 확인 중...';
  if (dom.approvalResultBox) dom.approvalResultBox.style.display = 'block';
  if (dom.approvalResultTitle) {
    dom.approvalResultTitle.textContent = '기기 승인 처리 중';
    dom.approvalResultTitle.style.color = '#f6c878';
  }
  if (dom.approvalResultText) {
    dom.approvalResultText.textContent = '서버에 기기 승인을 요청하고 등록 기기 여부를 확인하는 중입니다...';
  }

  try {
    const res = await apiFetch('/api/device', {
      method: 'POST',
      body: { action: 'request_approval' },
    });

    const data = await res.json();
    if (!res.ok || !data.registered || data.status !== 'approved') {
      throw new Error(data.message || data.reason || '서버가 이 기기의 승인을 거부했습니다.');
    }

    setApprovalToken(data.approvalToken || null);
    showApprovedVault(data);
    await loadNotices();
    await loadNotes();
  } catch (err) {
    setApprovalToken(null);
    if (dom.approvalResultTitle) {
      dom.approvalResultTitle.textContent = '❌ 기기 승인 거부';
      dom.approvalResultTitle.style.color = '#ff8b9e';
    }
    if (dom.approvalResultText) {
      dom.approvalResultText.textContent = err.message;
    }
    if (dom.vaultContent) dom.vaultContent.style.display = 'none';
    dom.noticesList.replaceChildren();
    dom.notesList.replaceChildren();
  } finally {
    dom.requestApprovalBtn.disabled = false;
    dom.requestApprovalBtn.textContent = '기기 승인 요청';
  }
}
