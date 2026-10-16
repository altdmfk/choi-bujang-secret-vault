// ==========================================
// Centralized DOM Elements Registry
// ==========================================
export const dom = {
  // 인증 관련
  loggedOutView: document.querySelector('#loggedOutView'),
  loggedInView: document.querySelector('#loggedInView'),
  userEmailSpan: document.querySelector('#userEmail'),
  loginForm: document.querySelector('#loginForm'),
  emailInput: document.querySelector('#emailInput'),
  passwordInput: document.querySelector('#passwordInput'),
  authError: document.querySelector('#authError'),
  logoutBtn: document.querySelector('#logoutBtn'),

  // 기기 승인 관련
  deviceApprovalSection: document.querySelector('#deviceApprovalSection'),
  deviceServerStatusBadge: document.querySelector('#deviceServerStatusBadge'),
  deviceStatusDesc: document.querySelector('#deviceStatusDesc'),
  requestApprovalBtn: document.querySelector('#requestApprovalBtn'),
  approvalResultBox: document.querySelector('#approvalResultBox'),
  approvalResultTitle: document.querySelector('#approvalResultTitle'),
  approvalResultText: document.querySelector('#approvalResultText'),

  // 보호 자료실 & 공지 관련
  vaultContent: document.querySelector('#vaultContent'),
  noticesList: document.querySelector('#notices'),
  notesList: document.querySelector('#notes'),
  noteForm: document.querySelector('#noteForm'),
  editingNoteId: document.querySelector('#editingNoteId'),
  noteTitleInput: document.querySelector('#noteTitleInput'),
  noteBodyInput: document.querySelector('#noteBodyInput'),
  editorTitle: document.querySelector('#editorTitle'),
  cancelEditBtn: document.querySelector('#cancelEditBtn'),

  // 탈환 작전실 대시보드 수치 관련
  rulesCountVal: document.querySelector('#rulesCountVal'),
  detectLimitVal: document.querySelector('#detectLimitVal'),
  detectWindowVal: document.querySelector('#detectWindowVal'),
  revocationStatusVal: document.querySelector('#revocationStatusVal'),
  recoveryRouteVal: document.querySelector('#recoveryRouteVal'),

  // 가린 서버 기록 관련
  auditList: document.querySelector('#auditList'),
  auditTotalCount: document.querySelector('#auditTotalCount'),
  auditVerifiedCount: document.querySelector('#auditVerifiedCount'),
  auditUnexecutedCount: document.querySelector('#auditUnexecutedCount'),
  auditBodyExposeCount: document.querySelector('#auditBodyExposeCount'),

  // 1~11단계 실측 매트릭스 관련
  matrixTotalCount: document.querySelector('#matrixTotalCount'),
  matrixExecutedCount: document.querySelector('#matrixExecutedCount'),
  matrixAllowCount: document.querySelector('#matrixAllowCount'),
  matrixDenyCount: document.querySelector('#matrixDenyCount'),
  matrixPendingCount: document.querySelector('#matrixPendingCount'),
  matrixTableBody: document.querySelector('#matrixTableBody'),
  runLiveTestBtn: document.querySelector('#runLiveTestBtn'),
  resetMatrixBtn: document.querySelector('#resetMatrixBtn'),
  liveTestProgress: document.querySelector('#liveTestProgress'),

  // PWA 및 네트워크 상태 관련
  offlineBanner: document.querySelector('#offlineBanner'),
  networkStatusText: document.querySelector('#networkStatusText'),
  appDisplayMode: document.querySelector('#appDisplayMode'),
  pwaStatusBadge: document.querySelector('#pwaStatusBadge'),
  installAppRow: document.querySelector('#installAppRow'),
  installPwaBtn: document.querySelector('#installPwaBtn'),
};
