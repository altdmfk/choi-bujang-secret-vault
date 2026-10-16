// ==========================================
// BYTE BACK 자료실 & 12단계 탈환 작전실 (Main Entry)
// ==========================================
import { dom } from './modules/dom.js';
import { apiFetch, setSession, setApprovalToken } from './modules/api-client.js';
import {
  handleLogin,
  handleLogout,
  requestDeviceApproval,
  updateAuthUI,
  showApprovedVault,
  showUnapprovedDevice
} from './modules/auth-device.js';
import {
  handleNoteSubmit,
  resetEditor,
  loadNotices,
  loadNotes
} from './modules/vault-ui.js';
import {
  updateWarRoomAudit,
  renderMatrixTable,
  verifyLiveAuditRecords,
  runLiveVerification,
  resetMatrixTable
} from './modules/ops-room.js';
import { initPwaAndNetwork } from './modules/pwa-network.js';

// ==========================================
// Event Listeners Binding
// ==========================================
dom.loginForm?.addEventListener('submit', handleLogin);
dom.logoutBtn?.addEventListener('click', handleLogout);
dom.requestApprovalBtn?.addEventListener('click', requestDeviceApproval);
dom.noteForm?.addEventListener('submit', handleNoteSubmit);
dom.cancelEditBtn?.addEventListener('click', resetEditor);
dom.runLiveTestBtn?.addEventListener('click', runLiveVerification);
dom.resetMatrixBtn?.addEventListener('click', resetMatrixTable);

// ==========================================
// Session Bootstrap
// ==========================================
async function initSession() {
  updateWarRoomAudit();
  renderMatrixTable();
  verifyLiveAuditRecords();
  initPwaAndNetwork();

  try {
    const res = await apiFetch('/api/device');
    if (res.ok) {
      const data = await res.json();
      setSession({ user: { email: '인증된 사용자' } });
      updateAuthUI({ email: '인증된 사용자' });
      if (data.registered && data.status === 'approved') {
        setApprovalToken(data.approvalToken || null);
        showApprovedVault(data);
        await loadNotices();
        await loadNotes();
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
