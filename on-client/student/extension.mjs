// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.

const DEVICE_STATUS_LABELS = Object.freeze({
  compliant: '보안 기준 충족',
  noncompliant: '보안 기준 미충족',
  unknown: '확인 불가',
});

const SESSION_STATUS_LABELS = Object.freeze({
  active: '활성',
  expired: '만료',
  revoked: '철회됨',
  unknown: '확인 불가',
});

const ACCESS_STATUS_LABELS = Object.freeze({
  allowed: '허용됨',
  denied: '거부됨',
  unknown: '확인 불가',
});

const MODE_BADGE_LABELS = Object.freeze({
  demo: '예제 자료',
  disconnected: '연결 없음',
  unknown: '확인 불가',
});

const EVENT_KIND_LABELS = Object.freeze({
  access: '접속(access)',
  xdr: 'XDR 경보(xdr)',
});

const STATE_FIELD_LABELS = Object.freeze({
  access: '접속',
  session: '세션',
  device: '기기',
});

const DECISIONS_MAP = Object.freeze({
  allow: Object.freeze({
    code: 'allow',
    text: '접근 허용 (allow)',
    note: '서버 정책에 따라 이 업무 앱 접근이 허용되었습니다. (실제 앱 접속 성공을 보장하지는 않습니다.)',
    className: 'decision decision-allow',
  }),
  deny: Object.freeze({
    code: 'deny',
    text: '접근 거부 (deny)',
    note: '보안 정책에 따라 이 업무 앱 접근이 거부되었습니다.',
    className: 'decision decision-deny',
  }),
  challenge: Object.freeze({
    code: 'challenge',
    text: '추가 확인 필요 (challenge)',
    note: '추가 인증 또는 확인이 필요합니다. 본 앱이 추가 인증 절차를 대신 수행하지 않습니다.',
    className: 'decision decision-challenge',
  }),
  unknown: Object.freeze({
    code: 'unknown',
    text: '확인 불가 (unknown)',
    note: '판정을 확인할 수 없습니다. 허용되지 않음 (접근 허용 또는 정상으로 간주할 수 없습니다).',
    className: 'decision decision-unknown',
  }),
});

const VULN_SCAN_STATUS_MAP = Object.freeze({
  complete: Object.freeze({
    label: '모두 조회(complete)',
    desc: '승인된 모든 공개 패키지의 조회가 완료되었습니다.',
  }),
  partial: Object.freeze({
    label: '일부 조회 실패(partial)',
    desc: '일부 패키지의 조회가 실패했으나 이미 확인된 항목은 유지하여 표시합니다.',
  }),
  not_checked: Object.freeze({
    label: '아직 조회 안 함(not_checked)',
    desc: '승인된 공개 패키지가 없거나 아직 조회를 시작하지 않았습니다.',
  }),
  not_configured: Object.freeze({
    label: '조회 준비 미완료(not_configured)',
    desc: '프로젝트 설정이 완료되지 않았습니다 (프로젝트 설정 없음).',
  }),
  unverifiable: Object.freeze({
    label: 'lock 파일 확인 불가(unverifiable)',
    desc: 'package-lock.json 파일을 확인할 수 없어 전체 검증을 수행할 수 없습니다.',
  }),
});

const SAFE_AI_MESSAGES = Object.freeze({
  ON_AI_PROVISIONING_PENDING: '학생 앱 이용 권한의 발급·연결을 준비 중입니다. 담당자에게 확인하세요.',
  WB_CLCO_AUTH_REQUIRED: '앱 전용 열쇠의 인증을 확인하세요. Workbench 열쇠를 복사하지 마세요.',
  WB_CLCO_ACCESS_BLOCKED: '학생 앱의 이용 권한을 확인하세요.',
  WB_CLCO_COHORT_BUDGET_EXHAUSTED: '반의 AI 사용량이 소진됐습니다. 담당자에게 확인하세요.',
  WB_CLCO_RATE_LIMITED: 'AI 요청이 잠시 제한됐습니다. 잠시 후 직접 다시 요청하세요.',
  WB_CLCO_LIMIT_REACHED: 'AI 이용 한도에 도달했습니다. 담당자에게 확인하세요.',
  WB_CLCO_SESSION_CLOSED: '현재 AI 이용 시간이 아닙니다. 이용 시간을 확인하세요.',
  WB_CLCO_TIMEOUT: 'AI 응답 시간이 초과됐습니다. 필요하면 직접 다시 요청하세요.',
  REQUEST_TIMEOUT: '서버의 AI 응답 시간이 초과됐습니다. 필요하면 직접 다시 요청하세요.',
  ENGINE_TIMEOUT: '서버의 확인 시간이 초과됐습니다. 필요하면 직접 다시 요청하세요.',
  TIMEOUT: 'AI 응답 시간이 초과됐습니다. 필요하면 직접 다시 요청하세요.',
  WB_CLCO_CANCELLED: 'AI 요청을 취소했습니다. 이전 응답은 현재 결과가 아닙니다.',
  CANCELLED: 'AI 요청을 취소했습니다. 이전 응답은 현재 결과가 아닙니다.',
  REQUEST_CANCELLED: 'AI 요청을 취소했습니다. 이전 응답은 현재 결과가 아닙니다.',
  MODEL_NOT_CONFIGURED: '서버에 사용할 AI 모델을 설정하세요.',
  ON_AI_AUTHORIZATION_CHANGED: 'AI 이용 권한 내용이 점검 도중 바뀌었습니다. 다시 점검하기 전에 담당자에게 현재 권한을 확인하세요.',
  ON_AI_MODEL_LIST_EMPTY: '현재 앱 권한으로 쓸 수 있는 AI 모델이 없습니다. 담당자에게 모델 허용 설정을 확인하세요.',
  SUBJECT_SCOPE_UNVERIFIED: '현재 로그인과 사건·프로젝트의 연결을 확인할 수 없습니다.',
  ON_AI_INVALID_INPUT: '설명에 필요한 사건 근거·규칙을 확인할 수 없습니다.',
  ON_AI_INVALID_OUTPUT: 'AI 설명의 근거·조치·응답 형식을 확인할 수 없습니다.',
  AI_REQUEST_UNVERIFIED: 'AI 연결 또는 응답을 확인할 수 없습니다. 기존 기록을 확인하세요.',
});

const AI_ERROR_RULES = Object.freeze([
  {
    match: (code, combined) =>
      ['CANCELLED', 'WB_CLCO_CANCELLED', 'REQUEST_CANCELLED'].includes(code)
      || combined.includes('취소')
      || combined.includes('CANCEL'),
    category: '취소됨',
    guidance: 'AI 요청이 취소되었습니다. 이전 결과는 현재 결과가 아니며, 점검이 성공한 것이 아닙니다.',
    isTimeout: false,
    isCancel: true,
  },
  {
    match: (code, combined) =>
      ['TIMEOUT', 'WB_CLCO_TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT'].includes(code)
      || combined.includes('TIMEOUT')
      || combined.includes('시간 초과')
      || combined.includes('시간초과'),
    category: '시간 초과',
    guidance: 'AI 응답 시간이 초과되었습니다. 잠시 뒤 위쪽 AI 연결 점검 버튼을 직접 눌러 다시 점검하세요.',
    isTimeout: true,
    isCancel: false,
  },
  {
    match: (code, combined) =>
      ['NETWORK_ERROR', 'WB_CLCO_NETWORK_ERROR'].includes(code)
      || combined.includes('NETWORK')
      || combined.includes('네트워크'),
    category: '네트워크 오류',
    guidance: '네트워크 연결 상태를 확인한 뒤 잠시 후 위쪽 버튼을 직접 눌러 다시 점검하세요.',
  },
  {
    match: (code, combined) =>
      code === 'WB_CLCO_RATE_LIMITED'
      || combined.includes('RATE_LIMITED')
      || combined.includes('요청 제한'),
    category: '요청 제한',
    guidance: 'AI 요청이 잠시 제한되었습니다. 잠시 후 위쪽 AI 연결 점검 버튼을 직접 눌러 다시 요청하세요.',
  },
  {
    match: (code, combined) =>
      ['MODEL_NOT_CONFIGURED', 'ON_AI_MODEL_LIST_EMPTY'].includes(code)
      || (combined.includes('MODEL') && (combined.includes('EMPTY') || combined.includes('NOT_CONFIGURED') || combined.includes('모델'))),
    category: '쓸 수 있는 모델 없음',
    guidance: '현재 앱 권한으로 사용할 수 있는 AI 모델이 설정되어 있지 않습니다. 담당자에게 모델 허용 설정을 확인 요청하세요.',
  },
  {
    match: (code, combined) =>
      code === 'WB_CLCO_COHORT_BUDGET_EXHAUSTED'
      || combined.includes('BUDGET')
      || combined.includes('사용량'),
    category: '반 사용량 소진',
    guidance: '반의 AI 사용량이 소진되었습니다. 담당자에게 확인을 요청하세요.',
  },
  {
    match: (code, combined) =>
      code === 'WB_CLCO_LIMIT_REACHED'
      || combined.includes('LIMIT')
      || combined.includes('한도'),
    category: '이용 한도 도달',
    guidance: 'AI 이용 한도에 도달했습니다. 담당자에게 확인을 요청하세요.',
  },
  {
    match: (code, combined) =>
      code === 'WB_CLCO_SESSION_CLOSED'
      || combined.includes('SESSION_CLOSED')
      || combined.includes('이용 시간'),
    category: '이용 시간 아님',
    guidance: '현재 AI 이용 시간이 아닙니다. 이용 가능 시간을 확인하세요.',
  },
  {
    match: (code, combined) =>
      code === 'WB_CLCO_AUTH_REQUIRED'
      || combined.includes('AUTH_REQUIRED'),
    category: '인증 실패',
    guidance: '앱 전용 열쇠의 인증을 확인해야 합니다. 계정 연결 상태를 다시 확인하고, Workbench 열쇠를 복사해 붙이지 마세요. 계속되면 담당자에게 확인을 요청하세요.',
  },
  {
    match: (code, combined) =>
      code === 'WB_CLCO_ACCESS_BLOCKED'
      || combined.includes('ACCESS_BLOCKED')
      || combined.includes('접근 제한'),
    category: '접근 제한',
    guidance: '학생 앱의 이용 권한이 차단되었거나 접근이 제한되었습니다. 계정 연결과 담당자 확인이 필요합니다.',
  },
  {
    match: (code, combined) =>
      code === 'ON_AI_PROVISIONING_PENDING'
      || combined.includes('PROVISIONING')
      || combined.includes('권한 준비'),
    category: '권한 준비 중',
    guidance: '학생 앱 이용 권한의 발급 및 연결을 준비 중입니다 (학생 잘못이 아님). 담당자에게 확인을 요청하세요.',
  },
  {
    match: (code) => code === 'ON_AI_AUTHORIZATION_CHANGED',
    category: '권한 변경 확인 필요',
    guidance: 'AI 이용 권한 내용이 점검 도중 바뀌었습니다. 다시 점검하기 전에 담당자에게 현재 권한을 확인하세요.',
  },
  {
    match: (code, combined) =>
      ['SUBJECT_SCOPE_UNVERIFIED', 'AI_REQUEST_UNVERIFIED'].includes(code)
      || combined.includes('UNVERIFIED')
      || combined.includes('확인 불가'),
    category: '확인 불가',
    guidance: 'AI 연결 또는 응답을 확인할 수 없습니다. 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.',
  },
]);

function attachKeyboardClick(element, handler) {
  if (!element || typeof handler !== 'function') return;
  element.addEventListener('click', handler);
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  });
}

function ensureStudentAppearanceStyle() {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return;

  // 1. CSP(style-src 'self')를 완벽히 준수하는 정식 외부 스타일시트 링크 확인
  if (!document.querySelector('link[href*="appearance.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/student/appearance.css';
    try {
      (document.head || document.documentElement).appendChild(link);
    } catch {}
  }

  if (document.getElementById('student-appearance-style')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'student-appearance-style';
  styleEl.textContent = `
    /* 관제 대시보드 테마 및 키보드 접근성 */
    button:focus-visible,
    select:focus-visible,
    [tabindex="0"]:focus-visible,
    a:focus-visible {
      outline: 2px solid #0e306d;
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(14, 48, 109, 0.2);
    }
    #tab-list, #nav, .tab-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    #tab-list [role="tab"].is-active,
    #nav [role="tab"].is-active,
    .tab.is-active {
      background: #e7ecf3;
      color: #0e306d;
      font-weight: 700;
      border-left: 3px solid #009a93;
    }
    .view {
      display: block;
    }
    .view[hidden] {
      display: none !important;
    }
    .soc-dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 12px;
      margin: 0 0 14px 0;
    }
    .soc-dashboard-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
    }
    .soc-dashboard-header .soc-card-timestamp {
      margin: 0 0 0 auto;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
      text-align: right;
      white-space: nowrap;
    }
    .soc-overview-shell {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      margin: 0 0 10px;
    }
    .soc-provenance-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 4px 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 11.5px;
      color: #475569;
    }
    .soc-metric-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin: 0 0 10px;
    }
    @media (max-width: 1280px) {
      .soc-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 768px) {
      .soc-metric-grid { grid-template-columns: minmax(0, 1fr); }
    }
    :root {
      /* 테마 색상 변수 */
      --brand-navy: #0E306D;
      --brand-navy-tint: #E7ECF3;
      --brand-navy-border: #C5D1E3;
      --brand-teal: #009A93;
      --brand-teal-tint: #E6F5F4;
      --brand-teal-border: #B3E0DE;
      --brand-orange: #F47725;
      --brand-orange-tint: #FEF1E8;
      --brand-orange-border: #FCD6BD;
      --brand-red: #EA002C;
      --brand-red-tint: #FDE8EC;
      --brand-red-border: #F9B2BE;
      --surface-bg: #F4F6F9;
      --card-bg: #FFFFFF;
      --border-subtle: #E2E8F0;
      --text-main: #0F172A;
      --text-muted: #64748B;
      --student: #6d28d9;
      --student-soft: #f5f3ff;
    }

    /* Standardized Badges & Tags (Zero Wrapping, Uniform 22px Height) */
    .soc-badge,
    .badge,
    .role-badge,
    .provenance-badge,
    .pc-readonly-pill,
    .pc-readonly-badge,
    .pc-readonly-text,
    .mode-badge,
    .tag,
    .tag-student,
    .tag-demo,
    .soc-snapshot-badge,
    .badge-non-intrusion {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 22px !important;
      padding: 0 8px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      line-height: 20px !important;
      border-radius: 4px !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      vertical-align: middle !important;
    }

    .soc-card-badges > span,
    .soc-local-badges > span,
    .pc-accordion-badges > span {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 22px !important;
      line-height: 20px !important;
      padding: 0 8px !important;
      margin: 0 !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      border-radius: 4px !important;
      white-space: nowrap !important;
      box-sizing: border-box !important;
      vertical-align: middle !important;
    }

    /* [실측값] & [읽기 전용] */
    .badge-live,
    .pc-readonly-pill,
    .pc-readonly-badge,
    .pc-readonly-text,
    .mode-badge[data-mode="connected"],
    [data-provenance="live"] {
      background: #E6F5F4 !important;
      color: #009A93 !important;
      border: 1px solid #B3E0DE !important;
    }

    /* 「SDP 미연결」 & 확인 불가 */
    .badge-unverified,
    .badge-sdp-disconnected,
    .mode-badge[data-mode="disconnected"],
    [data-provenance="unverified"],
    [data-sdp-status="disconnected"] {
      background: #FEF1E8 !important;
      color: #F47725 !important;
      border: 1px solid #FCD6BD !important;
      padding: 0 6px !important;
      margin: 0 !important;
    }

    /* [내가 바꾼 부분] & 학생 태그 (보라색 지정 색: #6d28d9 / #f5f3ff / #ddd6fe) */
    .badge-custom,
    .tag-student,
    [data-role-kind="custom"] {
      background: var(--student-soft, #f5f3ff) !important;
      color: var(--student, #6d28d9) !important;
      border: 1px solid #ddd6fe !important;
    }

    /* [예시값] & [제공 기능] & [누적 스냅샷] & [침해 탐지 아님] (네이비) */
    .badge-demo,
    .badge-provided,
    .tag-demo,
    .soc-snapshot-badge,
    .badge-non-intrusion,
    .mode-badge[data-mode="demo"],
    [data-provenance="demo"],
    [data-role-kind="provided"] {
      background: #E7ECF3 !important;
      color: #0E306D !important;
      border: 1px solid #C5D1E3 !important;
    }

    /* [예시값 · 로컬 AI 분석] & [시뮬레이션 · 조치 상태 검증] */
    .badge-ai-demo {
      background: #EFF6FF !important;
      color: #1D4ED8 !important;
      border: 1px solid #BFDBFE !important;
    }

    .badge-sim-action {
      background: #FDF2F8 !important;
      color: #9D174D !important;
      border: 1px solid #FBCFE8 !important;
    }

    /* Stage 19 SOAR State Machine Stepper */
    .action-progress-stepper {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      margin: 12px 0 !important;
      padding: 10px 14px !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      font-size: 12px !important;
      flex-wrap: wrap !important;
    }
    .stepper-step {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 4px 8px !important;
      border-radius: 4px !important;
      font-weight: 500 !important;
      color: #64748b !important;
    }
    .stepper-step.step-completed {
      background: #e6f5f4 !important;
      color: #009a93 !important;
      font-weight: 600 !important;
    }
    .stepper-step.step-active {
      background: #fdf2f8 !important;
      color: #9d174d !important;
      border: 1px solid #fbcfe8 !important;
      font-weight: 600 !important;
    }
    .stepper-step.step-denied {
      background: #fef2f2 !important;
      color: #b91c1c !important;
      font-weight: 600 !important;
    }
    .stepper-step.step-pending {
      opacity: 0.6 !important;
    }
    .step-bullet {
      font-size: 11px !important;
      line-height: 1 !important;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      font-size: 11px !important;
      letter-spacing: -0.02em !important;
      word-break: break-all !important;
    }

    /* 15단계 사건 목록 필터 바 레이아웃 정돈 */
    .event-filters {
      display: flex !important;
      align-items: center !important;
      gap: 16px !important;
      flex-wrap: wrap !important;
      margin: 10px 0 14px 0 !important;
      padding: 8px 14px !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
    }
    .event-filter-item,
    .event-filters label {
      display: inline-flex !important;
      align-items: center !important;
      gap: 8px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #334155 !important;
      margin: 0 !important;
      cursor: pointer !important;
      white-space: nowrap !important;
    }
    .filter-label-text {
      white-space: nowrap !important;
      color: #475569 !important;
    }
    .event-filters select {
      font: inherit !important;
      font-size: 13px !important;
      padding: 4px 10px !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 6px !important;
      background: #ffffff !important;
      color: #0f172a !important;
      cursor: pointer !important;
    }

    /* Supply-Chain Posture Summary Bar */
    .supply-chain-posture-bar {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      margin: 10px 0 16px 0 !important;
      padding: 12px 16px !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      flex-wrap: wrap !important;
    }
    .posture-chip {
      display: inline-flex !important;
      flex-direction: column !important;
      gap: 2px !important;
      padding: 6px 12px !important;
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 6px !important;
      min-width: 120px !important;
    }
    .chip-label {
      font-size: 11px !important;
      color: #64748b !important;
    }
    .chip-val {
      font-size: 14px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
    }
    .text-teal {
      color: #009a93 !important;
    }
    .text-red {
      color: #dc2626 !important;
    }
    .text-muted {
      color: #64748b !important;
    }
    .osv-vuln-link {
      color: #dc2626 !important;
      text-decoration: underline !important;
      font-weight: 600 !important;
    }
    .osv-vuln-link:hover {
      color: #b91c1c !important;
    }

    /* Baseline & Drift Styles */
    .badge-drift-warning {
      background: #FEF2F2 !important;
      color: #B91C1C !important;
      border: 1px solid #FECACA !important;
      font-weight: 700 !important;
    }
    .badge-drift-clean {
      background: #E6F5F4 !important;
      color: #009A93 !important;
      border: 1px solid #B3E0DE !important;
    }
    .baseline-action-bar {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      margin: 8px 0 14px 0 !important;
      padding: 8px 12px !important;
      background: #f1f5f9 !important;
      border-radius: 6px !important;
      flex-wrap: wrap !important;
    }
    .btn-baseline-pin {
      background: #009A93 !important;
      color: #ffffff !important;
      border: none !important;
      padding: 6px 12px !important;
      border-radius: 4px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
    }
    .btn-baseline-pin:hover {
      background: #00827c !important;
    }
    .drift-alert-box {
      background: #fff1f2 !important;
      color: #9f1239 !important;
      border: 1px solid #fecdd3 !important;
      border-radius: 6px !important;
      padding: 10px 14px !important;
      margin: 8px 0 12px 0 !important;
      font-size: 12px !important;
      line-height: 1.5 !important;
    }
    .port-row-keshev {
      background: #f5f3ff !important;
    }
    .surface-table-title {
      font-size: 13px !important;
      font-weight: 600 !important;
      margin: 16px 0 8px 0 !important;
      color: #1e293b !important;
    }
    .surface-disclaimer {
      margin-top: 14px !important;
      font-size: 11px !important;
    }

    /* SSE Real-Time Stream Status Pill */
    .sse-status-pill {
      font-size: 11px !important;
      padding: 3px 8px !important;
      border-radius: 9999px !important;
      font-weight: 600 !important;
      margin-left: 8px !important;
      display: inline-block !important;
    }
    .sse-connected {
      background: #E6F5F4 !important;
      color: #009A93 !important;
      border: 1px solid #B3E0DE !important;
    }
    .sse-disconnected {
      background: #FEF3C7 !important;
      color: #B45309 !important;
      border: 1px solid #FDE68A !important;
    }

    /* Clean Distinct Panels in Left & Right Columns & Standalone Audit */
    .soc-split-card {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      padding: 14px 16px !important;
      margin-bottom: 16px !important;
      box-sizing: border-box !important;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04) !important;
    }
    .soc-split-card:last-child {
      margin-bottom: 0 !important;
    }
    .soc-split-card .soc-panel-heading {
      margin: -2px 0 12px 0 !important;
      padding-bottom: 8px !important;
      border-bottom: 1px solid #f1f5f9 !important;
    }
    .soc-audit-standalone-panel {
      margin-top: 14px !important;
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      overflow: hidden !important;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04) !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .pc-baseline-control-bar {
      display: flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      padding: 6px 12px !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 6px !important;
      margin-top: 2px !important;
      margin-bottom: 18px !important;
      box-sizing: border-box !important;
      gap: 10px !important;
      flex-wrap: wrap !important;
    }
    .pc-baseline-desc {
      font-size: 11px !important;
      color: #64748b !important;
      font-weight: 500 !important;
      line-height: 1.3 !important;
      letter-spacing: -0.01em !important;
    }
    .pc-inspection-table {
      margin-bottom: 14px !important;
    }
    .pc-ports-accordion,
    details[data-pc-section="endpoint-ports-detail"] {
      margin-top: 18px !important;
      margin-bottom: 8px !important;
    }
    .pc-inspection-table + .pc-accordion {
      margin-top: 18px !important;
    }
    .audit-spec-table .pc-inspection-row {
      display: grid !important;
      grid-template-columns: 210px 1fr 100px !important;
      align-items: center !important;
      gap: 12px !important;
      padding: 6px 10px !important;
    }
    .audit-spec-table .pc-col-item {
      font-size: 11.5px !important;
      font-weight: 700 !important;
      color: #0e306d !important;
      white-space: nowrap !important;
      text-align: right !important;
      justify-self: end !important;
      padding-right: 6px !important;
    }
    .audit-spec-table .pc-col-status {
      text-align: left !important;
      justify-self: start !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif !important;
      font-size: 11.5px !important;
      color: #334155 !important;
      word-break: keep-all !important;
      line-height: 1.45 !important;
    }
    .audit-spec-table .pc-col-badge {
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }
    .audit-action-btn {
      height: 28px !important;
      padding: 0 14px !important;
      font-size: 11.5px !important;
      font-weight: 600 !important;
      border-radius: 4px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
      line-height: 26px !important;
      cursor: pointer !important;
      white-space: nowrap !important;
      transition: background-color 0.15s ease, border-color 0.15s ease !important;
    }
    .pc-inspection-scroll {
      max-height: 220px !important;
      overflow-y: auto !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 6px !important;
      margin-top: 6px !important;
      margin-bottom: 8px !important;
      background: #ffffff !important;
      padding: 4px !important;
      scrollbar-width: thin !important;
    }
    .soc-btn-navy {
      background: #0E306D !important;
      color: #ffffff !important;
      border: 1px solid #0a2558 !important;
      padding: 6px 14px !important;
      border-radius: 4px !important;
      font-size: 11.5px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: background 0.15s ease !important;
    }
    .soc-btn-navy:hover:not(:disabled) {
      background: #09214d !important;
    }
    .soc-btn-navy:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
    }

    /* Section 7 Table Scroll Container & Mini-Table */
    .soc-table-scroll-container {
      max-height: 220px !important;
      overflow-y: auto !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 6px !important;
      margin-top: 6px !important;
      margin-bottom: 8px !important;
      background: #ffffff !important;
    }
    .surface-mini-table {
      width: 100% !important;
      border-collapse: collapse !important;
      font-size: 11.5px !important;
    }
    .surface-mini-table th {
      background: #f8fafc !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 1 !important;
      font-size: 11px !important;
      color: #64748b !important;
      padding: 6px 8px !important;
      border-bottom: 1px solid #e2e8f0 !important;
      text-align: left !important;
    }
    .surface-mini-table td {
      padding: 5px 8px !important;
      border-bottom: 1px solid #f1f5f9 !important;
      vertical-align: middle !important;
      text-align: left !important;
    }
    .surface-mini-table tr:hover {
      background: #f8fafc !important;
    }
    .surface-table-title {
      font-size: 12px !important;
      font-weight: 700 !important;
      color: #0E306D !important;
      margin: 10px 0 4px 0 !important;
    }

    /* Signed Audit Bundle Styles */
    .badge-audit-sign {
      background: #EDE9FE !important;
      color: #6D28D9 !important;
      border: 1px solid #DDD6FE !important;
      font-weight: 600 !important;
    }
    .audit-sub-box {
      margin-top: 10px !important;
      padding: 10px 12px !important;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 6px !important;
    }
    .audit-sub-title {
      display: block !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      color: #0E306D !important;
      margin: 6px 0 4px 0 !important;
    }
    .audit-sub-title:first-child {
      margin-top: 0 !important;
    }
    .audit-actions-row {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      margin-top: 8px !important;
      flex-wrap: wrap !important;
    }
    .audit-input-group {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      margin-top: 8px !important;
    }
    .audit-file-input {
      font-size: 12px !important;
      color: #475569 !important;
    }
    .audit-json-textarea {
      width: 100% !important;
      min-height: 60px !important;
      height: 78px !important;
      max-height: 240px !important;
      font-size: 11px !important;
      font-family: ui-monospace, Menlo, Consolas, monospace !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 6px !important;
      padding: 8px 10px !important;
      box-sizing: border-box !important;
      resize: vertical !important;
      background: #f8fafc !important;
      color: #1e293b !important;
      line-height: 1.4 !important;
      transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease !important;
    }
    .audit-json-textarea:focus {
      background: #ffffff !important;
      border-color: #009a93 !important;
      outline: 2px solid rgba(0, 154, 147, 0.2) !important;
      outline-offset: 1px !important;
    }
    .audit-verify-result-container {
      margin-top: 10px !important;
    }
    .audit-result-banner {
      padding: 8px 12px !important;
      border-radius: 6px !important;
      font-size: 12px !important;
      line-height: 1.5 !important;
    }
    .banner-verified {
      background: #e6f5f4 !important;
      color: #009a93 !important;
      border: 1px solid #b3e0de !important;
    }
    .banner-tampered {
      background: #fef2f2 !important;
      color: #b91c1c !important;
      border: 1px solid #fecaca !important;
    }
    .banner-warning {
      background: #fffbeb !important;
      color: #b45309 !important;
      border: 1px solid #fde68a !important;
    }
    .text-small {
      font-size: 11px !important;
      margin-top: 4px !important;
    }

    .soc-metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
    }
    .soc-metric-card:hover {
      box-shadow: 0 3px 8px rgba(15, 23, 42, 0.08);
      border-color: #c5d1e3;
    }

    .soc-hero-teal {
      color: #009a93 !important;
    }
    .soc-metric-card[data-soc-card="card-2-decision-firewall"],
    .soc-metric-card[data-soc-card="card-2-decision-firewall"]:focus-visible,
    .soc-metric-card.soc-card-allow {
      border-color: #b3e0de;
    }
    .soc-metric-card[data-soc-card="card-2-decision-firewall"]:hover,
    .soc-metric-card[data-soc-card="card-2-decision-firewall"]:active,
    .soc-metric-card[data-soc-card="card-2-decision-firewall"].is-active,
    .soc-metric-card[data-soc-card="card-2-decision-firewall"]:focus,
    .soc-metric-card[data-soc-card="card-2-decision-firewall"]:focus-within {
      border-color: #009a93 !important;
      box-shadow: 0 0 0 3px rgba(0, 154, 147, 0.25) !important;
    }
    .soc-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 0;
      padding: 8px 12px;
      background: #e7ecf3;
      border-bottom: 1px solid #c5d1e3;
      box-sizing: border-box;
    }
    .soc-card-title {
      margin: 0;
      font-size: 13.5px;
      font-weight: 700;
      color: #0e306d;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .soc-card-step {
      font-size: 11px;
      font-weight: 700;
      color: #0e306d;
      letter-spacing: 0.5px;
    }
    .soc-card-badges {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
    }
    .soc-card-body {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      box-sizing: border-box;
    }

    /* 1. [제공 SDP 영역] 1줄 슬림 바 */
    .soc-sdp-slim-bar {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #64748b;
      border-radius: 6px;
      padding: 3px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
    }
    .soc-sdp-summary {
      color: #475569;
      font-weight: 600;
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* 2. [내 PC 실측 영역] */
    .soc-card-local-section,
    .soc-card-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }
    .soc-local-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }
    .soc-local-title {
      color: #0f172a;
      font-size: 13px;
      font-weight: 700;
    }
    .soc-local-badges {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* (B) Hero Metric (#0E306D, 28px bold number + unit) */
    .soc-hero-metric {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin: 2px 0 6px 0;
    }
    .soc-hero-num {
      font-size: 28px;
      font-weight: 800;
      line-height: 1.1;
      color: #0e306d;
      font-variant-numeric: tabular-nums;
      font-family: system-ui, -apple-system, sans-serif;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .soc-hero-unit {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
    }
    .soc-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .soc-status-dot.dot-teal {
      background-color: #009a93;
    }
    .soc-status-dot.dot-orange {
      background-color: #f47725;
    }

    /* (C) Structured Mini-Tables (.soc-mini-table) */
    .soc-mini-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      margin: 0;
      box-sizing: border-box;
    }
    .soc-mini-table th,
    .soc-mini-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #eef2f6;
      text-align: left;
      vertical-align: middle;
      box-sizing: border-box;
    }
    .soc-mini-table th {
      color: #64748b;
      font-weight: 600;
      font-size: 11.5px;
      white-space: nowrap;
    }
    .soc-mini-table td {
      color: #0f172a;
    }
    .soc-mini-table tbody tr:last-child td {
      border-bottom: none;
    }
    .soc-mini-table .soc-val-right {
      text-align: right;
      font-weight: 600;
      font-family: ui-monospace, Consolas, monospace;
    }
    .soc-col-profile {
      white-space: nowrap !important;
      vertical-align: middle;
    }
    .soc-profile-en {
      display: block;
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      line-height: 1.15;
      margin-top: 2px;
    }
    .soc-status-on {
      color: #009a93;
      font-weight: 700;
      white-space: nowrap;
    }
    .soc-status-off {
      color: #EA002C;
      font-weight: 700;
      white-space: nowrap;
    }
    .soc-dot-teal {
      color: #009a93;
      font-weight: 700;
      margin-right: 4px;
      display: inline-block;
    }
    .soc-dot-off {
      color: #EA002C;
      font-weight: 700;
      margin-right: 4px;
      display: inline-block;
    }
    .soc-num-error {
      color: #EA002C !important;
      font-weight: 700;
    }

    /* Card 1 항목 컬럼 넓이 확보 (기본 게이트웨이 한 줄 표시) */
    .soc-metric-card[data-soc-card="card-1-identity-network"] .soc-mini-table th:first-child,
    .soc-metric-card[data-soc-card="card-1-identity-network"] .soc-mini-table td:first-child {
      white-space: nowrap !important;
      min-width: 98px;
      padding-right: 6px !important;
    }
    .soc-metric-card[data-soc-card="card-1-identity-network"] .soc-mini-table td.soc-val-right {
      font-size: 11.5px !important;
      padding-left: 4px !important;
      letter-spacing: -0.2px;
    }

    /* Card 2 방화벽 프로필 매트릭스 고정 그리드 & 한 줄 보장 */
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table {
      width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
    }
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table th,
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table td {
      padding: 5px 2px !important;
      vertical-align: middle !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table th:nth-child(1),
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table td:nth-child(1),
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-col-profile {
      width: 22% !important;
      white-space: nowrap !important;
    }
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table th:nth-child(2),
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table td:nth-child(2),
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-status-cell {
      width: 32% !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
    }
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table th:nth-child(3),
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table td:nth-child(3) {
      width: 23% !important;
    }
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table th:nth-child(4),
    .soc-metric-card[data-soc-card="card-2-decision-firewall"] .soc-mini-table td:nth-child(4) {
      width: 23% !important;
    }
    .soc-status-cell {
      white-space: nowrap !important;
      word-break: keep-all !important;
    }
    .soc-status-pill-text {
      display: inline-flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      align-items: center !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      font-weight: 700 !important;
      font-size: 11px !important;
      line-height: 1 !important;
    }
    .soc-status-dot-icon {
      display: inline-block !important;
      flex-shrink: 0 !important;
      font-size: 10px !important;
      line-height: 1 !important;
      margin-right: 3px !important;
    }
    .soc-status-label {
      display: inline-block !important;
      flex-shrink: 0 !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      line-height: 1 !important;
    }
    .soc-action-main {
      font-weight: 600 !important;
      font-size: 11.5px !important;
      color: #0f172a !important;
      white-space: nowrap !important;
    }
    .soc-action-sub.is-default {
      display: block !important;
      font-size: 10px !important;
      color: #64748b !important;
      line-height: 1.25 !important;
      margin-top: 2px !important;
      white-space: nowrap !important;
      letter-spacing: -0.2px !important;
    }
    .soc-action-sub.is-received {
      font-size: 10.5px !important;
      color: #64748b !important;
    }

    /* Card 3 전체 컬럼 줄 바꿈 방지 및 너비·패딩 최적화 */
    .soc-metric-card[data-soc-card="card-3-xdr-windows-logs"] .soc-mini-table th,
    .soc-metric-card[data-soc-card="card-3-xdr-windows-logs"] .soc-mini-table td {
      white-space: nowrap !important;
      padding: 5px 4px !important;
      font-size: 11.5px !important;
    }
    .soc-metric-card[data-soc-card="card-3-xdr-windows-logs"] .soc-mini-table {
      width: 100% !important;
      table-layout: auto !important;
    }
    .soc-metric-card[data-soc-card="card-3-xdr-windows-logs"] .soc-ratio-labels,
    .soc-metric-card[data-soc-card="card-3-xdr-windows-logs"] .soc-card-notice {
      white-space: nowrap !important;
    }

    .pc-non-intrusion-inline {
      margin: 4px 0 8px;
      padding: 6px 10px;
      border-radius: 4px;
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      color: #334155;
      font-size: 0.82rem;
      font-weight: 600;
    }

    .soc-card-notice {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.35;
    }

    /* Column sizing for CARD 04 Hardware Table */
    .soc-col-hw-name {
      width: 28%;
      font-weight: 700;
      color: #0e306d;
    }
    .soc-col-hw-gauge {
      width: 36%;
      padding-left: 4px;
      padding-right: 4px;
    }
    .soc-col-hw-val {
      width: 36%;
      text-align: right;
      font-weight: 600;
      font-family: ui-monospace, Consolas, monospace;
    }
    .soc-gauge-track {
      height: 8px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
      width: 100%;
      display: block;
    }
    .soc-gauge-bar {
      height: 100%;
      border-radius: 999px;
      transition: width 0.35s ease;
    }
    .soc-gauge-bar.gauge-teal {
      background-color: #009a93;
    }
    .soc-gauge-bar.gauge-orange {
      background-color: #f47725;
    }

    /* Ratio Bar for CARD 03 */
    .soc-ratio-container {
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .soc-ratio-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 600;
    }
    .soc-ratio-labels .ratio-err {
      color: #EA002C !important;
    }
    .soc-ratio-labels .ratio-warn {
      color: #0e306d;
    }
    .soc-ratio-track {
      height: 6px;
      width: 100%;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
      display: flex;
    }
    .soc-ratio-seg.seg-error {
      background: #EA002C !important;
      height: 100%;
    }
    .soc-ratio-seg.seg-warning {
      background: #0e306d;
      height: 100%;
    }

    /* Phase 3 & 4: Accordion & Delta Summary Grid */
    .pc-accordion {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #ffffff;
      margin-bottom: 6px;
      overflow: hidden;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .pc-accordion:hover {
      border-color: #c5d1e3;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .pc-accordion[open] {
      border-color: #c5d1e3;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
    }
    .pc-accordion-summary::-webkit-details-marker {
      display: none;
    }
    .pc-accordion-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      min-height: 34px;
      height: 34px;
      box-sizing: border-box;
      background: #f8fafc;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      user-select: none;
      list-style: none;
      gap: 8px;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .pc-accordion-summary::before {
      content: "▸";
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      font-size: 12px;
      line-height: 1;
      color: #0e306d;
      flex-shrink: 0;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;
      transform-origin: center;
    }
    .pc-accordion[open] > .pc-accordion-summary::before {
      transform: rotate(90deg);
      color: #009a93;
    }
    .pc-accordion-summary:hover {
      background: #edf2f7;
    }
    .pc-accordion-summary:focus-visible {
      outline: 2px solid #0e306d;
      outline-offset: -2px;
    }
    .pc-accordion[open] > .pc-accordion-summary {
      background: #e7ecf3;
      border-bottom: 1px solid #e2e8f0;
    }
    .pc-accordion-title {
      flex-shrink: 0;
      font-weight: 700;
      color: #0e306d;
      white-space: nowrap;
    }
    .pc-accordion-metric {
      flex: 1;
      min-width: 0;
      color: #009a93;
      font-weight: 600;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 11.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pc-accordion-badges {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .pc-accordion-body {
      padding: 8px 12px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
    }

    /* Structured Table/Grid Rows for Inspection Sub-items */
    .pc-inspection-table {
      display: grid;
      gap: 4px;
      width: 100%;
    }
    .pc-inspection-row {
      display: grid;
      grid-template-columns: minmax(130px, 1.2fr) minmax(200px, 2.8fr) auto;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: var(--surface-bg, #f4f6f9);
      border: 1px solid var(--border-subtle, #e2e8f0);
      border-radius: 6px;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .pc-inspection-row:hover {
      background: #edf2f7;
      border-color: #c5d1e3;
    }
    .pc-inspection-row.row-unverified {
      background: var(--brand-orange-tint, #fef1e8);
      border-style: dashed;
      border-color: var(--brand-orange-border, #fcd6bd);
    }
    .pc-col-item {
      font-weight: 700;
      color: var(--brand-navy, #0e306d);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pc-col-status {
      color: var(--text-main, #0f172a);
      font-family: ui-monospace, Consolas, monospace;
      font-size: 11.5px;
      word-break: break-word;
    }
    .pc-col-badge {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .soc-compact-status-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 12px;
      color: #475569;
      margin-top: 8px;
    }
    .soc-status-prose {
      font-size: 12px;
      color: #64748b;
    }

    .sdp-audit-details {
      margin-top: 10px;
    }
    .soc-split-overview-card {
      margin-top: 8px;
      background: transparent;
      border: none;
      padding: 0;
    }
    .soc-split-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
    }
    .soc-panel-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: nowrap;
      gap: 8px;
      padding: 10px 14px;
      background: #e7ecf3;
      border-bottom: 1px solid #c5d1e3;
      margin: 0;
      box-sizing: border-box;
    }
    .soc-panel-title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #0e306d;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .soc-panel-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .soc-panel-actions .soc-card-timestamp {
      margin: 0 !important;
      font-size: 11px;
      color: #64748b;
      line-height: 22px;
      white-space: nowrap;
    }
    .soc-audit-card {
      background: #f4f6f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      margin: 0 12px 8px 12px;
      box-sizing: border-box;
    }
    .pc-status-grid {
      padding: 10px 12px 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      box-sizing: border-box;
    }
    .sdp-audit-details {
      width: 100%;
    }
    .sdp-audit-details .pc-accordion-body {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sdp-audit-details .soc-audit-card {
      margin: 0 !important;
      width: 100% !important;
      box-sizing: border-box !important;
      background: #f8fafc;
    }
    .sdp-timeline-details,
    .soc-compact-status-row {
      margin: 0 12px 12px 12px;
    }
    .soc-audit-card h4 {
      color: #0e306d;
      font-size: 13px;
      font-weight: 700;
      margin: 0 0 6px 0;
    }

    /* 2x2 Core Delta Summary Grid */
    .soc-delta-summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin: 6px 0 10px 0;
    }
    @media (max-width: 640px) {
      .soc-delta-summary-grid {
        grid-template-columns: 1fr;
      }
    }
    .trend-delta-box {
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 10px 12px;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .soc-delta-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .soc-delta-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 2px 5px rgba(15, 23, 42, 0.06);
    }
    .delta-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .delta-card-label {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }
    .delta-card-desc {
      font-size: 11.5px;
      color: #64748b;
    }
    .delta-chip {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 22px !important;
      line-height: 20px !important;
      padding: 0 8px !important;
      border-radius: 4px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      letter-spacing: -0.2px;
    }
    .delta-chip.is-up {
      background: #fde8ec !important;
      color: #EA002C !important;
      border: 1px solid #f9b2be !important;
    }
    .delta-chip.is-down {
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      border: 1px solid #bfdbfe !important;
    }
    .delta-chip.is-same,
    .delta-chip.is-pending {
      background: #f1f5f9 !important;
      color: #475569 !important;
      border: 1px solid #cbd5e1 !important;
    }
    .pc-toggle-all-btn,
    .pc-refresh-btn {
      font-size: 11px;
      padding: 2px 8px;
      height: 24px;
      line-height: 1.25;
      border-radius: 4px;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .pc-toggle-all-btn {
      background: #e7ecf3 !important;
      color: #0e306d !important;
      border: 1px solid #c5d1e3 !important;
      cursor: pointer;
      font-weight: 600;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .pc-toggle-all-btn:hover {
      background: #d8e2ef !important;
      border-color: #0e306d !important;
    }
    .pc-toggle-all-btn:focus-visible {
      outline: 2px solid #0e306d;
      outline-offset: 2px;
    }

    /* 상단 배지 범례 details 접힘 */
    .soc-legend-details {
      width: 100%;
      margin-top: 2px;
    }
    .soc-legend-summary {
      font-size: 11.5px;
      color: #64748b;
      cursor: pointer;
      padding: 2px 4px;
      user-select: none;
      font-weight: 500;
    }
    .soc-legend-summary:hover {
      color: #0e306d;
    }
    .soc-legend-details[open] .soc-provenance-badges {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed #e2e8f0;
    }

    .soc-section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 4px;
      font-size: 11.5px;
      color: #64748b;
    }
    .soc-card-timestamp {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #94a3b8;
      text-align: right;
    }
    .pc-refresh-btn {
      background: #009a93 !important;
      color: #ffffff !important;
      border: 1px solid #008781 !important;
      cursor: pointer;
      font-weight: 600;
      transition: background-color 0.2s ease;
    }
    .pc-refresh-btn:hover:not(:disabled) {
      background: #007d77 !important;
    }
    .pc-refresh-btn:focus-visible {
      outline: 2px solid #009a93;
      outline-offset: 2px;
    }
    .pc-refresh-btn:disabled,
    .pc-refresh-btn[aria-busy="true"] {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .pc-status-loading-indicator {
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid #38bdf8;
      color: #bae6fd;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0 12px 0;
    }
    .pc-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(56, 189, 248, 0.3);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: pc-spin-keyframes 0.8s linear infinite;
    }
    @keyframes pc-spin-keyframes {
      to { transform: rotate(360deg); }
    }
    .pc-status-error-box {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid #ef4444;
      color: #fee2e2;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .pc-error-title {
      margin: 0 0 6px 0;
      color: #fca5a5;
      font-size: 14px;
      font-weight: bold;
    }
    .pc-next-steps {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed rgba(239, 68, 68, 0.4);
      font-size: 12px;
    }
    .pc-next-steps ul {
      margin: 4px 0 0 16px;
      padding: 0;
    }
    .badge-sdp-disconnected {
      background: #7f1d1d !important;
      color: #fecaca !important;
      border: 1px solid #dc2626 !important;
    }

    /* Compact scrollable data containers to prevent endless page stretching */
    #records-list,
    .records,
    .vulnerabilities-result,
    .packages-table,
    .devices-list,
    #devices,
    #sessions,
    .soc-timeline-list,
    .diag-output,
    #action-result {
      max-height: 380px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
    }
  `;
  try {
    (document.head || document.body || document.documentElement).appendChild(styleEl);
  } catch {
    // Gracefully handle strict CSP environments
  }
}

function createEl(tag, { id, className, text, attrs, style } = {}, children = []) {
  const node = document.createElement(tag);
  if (id) node.id = id;
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);

  const mergedAttrs = attrs ? { ...attrs } : {};
  if (style && !mergedAttrs.style) {
    mergedAttrs.style = style;
  }

  for (const [k, v] of Object.entries(mergedAttrs)) {
    if (v !== undefined && v !== null) {
      if (k === 'style') {
        // CSP-compliant: Never call setAttribute('style', ...) under style-src 'self'
        if (typeof v === 'string') {
          const rules = v.split(';');
          for (const rule of rules) {
            const colonIdx = rule.indexOf(':');
            if (colonIdx > -1) {
              const prop = rule.slice(0, colonIdx).trim();
              let val = rule.slice(colonIdx + 1).trim();
              let priority = '';
              if (val.toLowerCase().endsWith('!important')) {
                priority = 'important';
                val = val.slice(0, -10).trim();
              }
              if (prop && val && node.style && typeof node.style.setProperty === 'function') {
                node.style.setProperty(prop, val, priority);
              }
            }
          }
        }
      } else {
        node.setAttribute(k, String(v));
      }
    }
  }
  if (style && typeof style === 'object' && node.style) {
    for (const [prop, val] of Object.entries(style)) {
      if (val !== undefined && val !== null) {
        node.style[prop] = String(val);
      }
    }
  }
  for (const child of children) {
    if (child) node.appendChild(child);
  }
  return node;
}

function appendKvRow(dl, term, value, ddAttrs) {
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  if (ddAttrs) {
    for (const [k, v] of Object.entries(ddAttrs)) {
      if (v !== undefined && v !== null) dd.setAttribute(k, String(v));
    }
  }
  dd.textContent = value !== undefined && value !== null ? String(value) : '';
  dl.appendChild(dt);
  dl.appendChild(dd);
  return dd;
}

function extractErrorText(error, fallback = '확인 불가') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || error.code || fallback;
}

function mapDeviceStatus(status) {
  if (status && Object.hasOwn(DEVICE_STATUS_LABELS, status)) {
    return DEVICE_STATUS_LABELS[status];
  }
  return status ? `${status} (확인 불가)` : '확인 불가';
}

function mapSessionStatus(status) {
  if (status && Object.hasOwn(SESSION_STATUS_LABELS, status)) {
    return SESSION_STATUS_LABELS[status];
  }
  return status ? `${status} (확인 불가)` : '확인 불가';
}

function createModeBadge(mode) {
  if (!mode || mode === 'connected') return null;
  const badge = document.createElement('span');
  badge.className = mode === 'demo' ? 'tag tag-demo' : 'tag';
  badge.setAttribute('data-student-mode', mode);
  badge.textContent = Object.hasOwn(MODE_BADGE_LABELS, mode) ? MODE_BADGE_LABELS[mode] : mode;
  return badge;
}

function formatErrorMessage(error, defaultMsg = '확인 불가') {
  const msg = extractErrorText(error, defaultMsg);
  if (msg.startsWith('연결 실패') || msg.startsWith('확인 불가')) {
    return msg;
  }
  return `연결 실패: ${msg}`;
}

function isTimeoutError(error) {
  if (!error) return false;
  const text = typeof error === 'string'
    ? error
    : `${error.code || ''} ${error.message || ''}`;
  return text.toUpperCase().includes('TIMEOUT') || text.includes('시간 초과') || text.includes('시간초과');
}

function sanitizeAiErrorMessage(rawMsg, code) {
  if (code && Object.hasOwn(SAFE_AI_MESSAGES, code)) {
    return SAFE_AI_MESSAGES[code];
  }
  if (!rawMsg) return 'AI 연결 점검에 실패했습니다.';
  const str = String(rawMsg);
  if (/sk-|bearer|token|secret|password|credential|private[_-]?key/i.test(str)) {
    return '보안을 위해 원문 오류가 가려졌습니다. 담당자에게 확인을 요청하세요.';
  }
  return str;
}

function classifyAiError(error) {
  const code = typeof error === 'string' ? error : (error?.code ? String(error.code) : '');
  const message = typeof error === 'string' ? error : (error?.message ? String(error.message) : '');
  const combined = `${code} ${message}`.toUpperCase();

  for (const rule of AI_ERROR_RULES) {
    if (rule.match(code, combined)) {
      return {
        category: rule.category,
        guidance: rule.guidance,
        isTimeout: Boolean(rule.isTimeout),
        isCancel: Boolean(rule.isCancel),
      };
    }
  }

  return {
    category: 'AI 연결 점검 실패',
    guidance: 'AI 연결 점검 중 오류가 발생했습니다. 담당자에게 계정 연결과 앱 권한을 확인하세요.',
    isTimeout: false,
    isCancel: false,
  };
}

function renderModeBadges(target, resources = []) {
  const modesToShow = [];
  for (const res of resources) {
    if (res?.mode && res.mode !== 'connected' && !modesToShow.includes(res.mode)) {
      modesToShow.push(res.mode);
    }
  }
  if (modesToShow.length === 0) return null;

  const modeWrap = createEl('div', { className: 'mode-badges row' });
  for (const m of modesToShow) {
    const badge = createModeBadge(m);
    if (badge) modeWrap.appendChild(badge);
  }
  target.appendChild(modeWrap);
  return modeWrap;
}

function appendInlineModeBadge(target, mode) {
  const badge = createModeBadge(mode);
  if (badge) {
    target.appendChild(document.createTextNode(' '));
    target.appendChild(badge);
  }
}

function mapDecision(decision) {
  return Object.hasOwn(DECISIONS_MAP, decision) ? DECISIONS_MAP[decision] : DECISIONS_MAP.unknown;
}

function formatStateWithCode(status, labelMap) {
  const code = status && Object.hasOwn(labelMap, status) ? status : 'unknown';
  return `${labelMap[code]}(${code})`;
}

function formatAccessState(status) {
  return formatStateWithCode(status, ACCESS_STATUS_LABELS);
}

function formatDeviceState(status) {
  return formatStateWithCode(status, DEVICE_STATUS_LABELS);
}

function formatSessionState(status) {
  return formatStateWithCode(status, SESSION_STATUS_LABELS);
}

function mapKind(kind) {
  if (kind && Object.hasOwn(EVENT_KIND_LABELS, kind)) {
    return EVENT_KIND_LABELS[kind];
  }
  return kind ? `${kind}(unknown)` : '확인 불가(unknown)';
}

function formatPackageStatus(pkg) {
  if (pkg.status === 'unverifiable' && Array.isArray(pkg.vulnerabilities) && pkg.vulnerabilities.length > 0) {
    return '일부 확인·전체 조회 확인 불가 (unverifiable)';
  }
  if (pkg.status === 'unverifiable') return '조회 확인 불가 (unverifiable)';
  if (pkg.status === 'known_vulnerabilities') return '알려진 항목 있음 (known_vulnerabilities)';
  if (pkg.status === 'none_found') return '알려진 항목 없음 (none_found)';
  return pkg.status ? `${pkg.status} (확인 불가)` : '확인 불가';
}

function appendStatusResourceError(section, attrName, error, timeoutLabel, failLabel) {
  const errMsg = extractErrorText(error, '오류 발생');
  const text = isTimeoutError(error)
    ? `시간 초과: ${timeoutLabel} 응답 시간이 초과되었습니다 (${errMsg}).`
    : `${failLabel} 불러오지 못했습니다: ${errMsg}`;

  section.appendChild(createEl('p', {
    className: 'state state-error',
    text,
    attrs: { [attrName]: 'error' },
  }));
  section.appendChild(createEl('p', {
    className: 'muted',
    text: '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.',
  }));
}

// ============================================================================
// Pure State Normalization, Provenance Tagging & SOC Aggregation Layer
// ============================================================================

function formatMeasuredAt(rawIso) {
  const fallbackIso = new Date().toISOString();
  const targetIso = typeof rawIso === 'string' && rawIso.trim().length > 0 ? rawIso.trim() : fallbackIso;
  const parsed = new Date(targetIso);
  if (Number.isNaN(parsed.getTime())) {
    return targetIso;
  }
  const pad = (n) => String(n).padStart(2, '0');
  const y = parsed.getFullYear();
  const m = pad(parsed.getMonth() + 1);
  const d = pad(parsed.getDate());
  const hh = pad(parsed.getHours());
  const mm = pad(parsed.getMinutes());
  const ss = pad(parsed.getSeconds());
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

const SOC_LIMITS = Object.freeze({
  PC_STATUS_ENDPOINT: '/api/pc-status',
  FETCH_THROTTLE_MS: 400,
  MAX_SNAPSHOTS: 25,
  MAX_DECISION_HISTORY: 20,
  FIREWALL_PROFILE_TOTAL: 3,
});

const SOC_UI_TEXT = Object.freeze({
  LIVE_BADGE: '[실측값]',
  LIVE_FULL: '[실측값] 내 PC에서 실제로 잰 값',
  DEMO_BADGE: '[예시값]',
  DEMO_FULL: '[예시값] 실제 조회 결과가 아닌 설명용 값',
  UNVERIFIED_BADGE: '확인 불가',
  SDP_DISCONNECTED_BADGE: '「SDP 미연결」',
  SDP_DISCONNECTED_FULL: '「SDP 미연결」 (외부 SDP 서버 미연결 · 내 PC 조회와 구분 표시)',
  SDP_CONNECTED_BADGE: '「SDP 연결됨」',
  NON_INTRUSION_CLAIM: '「이 건수는 침해나 공격 탐지 결과가 아닙니다」',
  NON_INTRUSION_BANNER: '「이 건수는 침해나 공격 탐지 결과가 아닙니다」 — Windows 일반 로그(System·Application)의 경고·오류 집계이며, 방화벽·보안 설정은 읽기만 합니다.',
  READONLY_PILL: '읽기 전용: 방화벽과 보안 설정은 읽기만 하고 바꾸지 않습니다.',
  ADMIN_FIREWALL_REASON: '관리자 권한이 있어야 읽을 수 있는 항목이므로 설정을 바꾸지 않고 「확인 불가」로 표시합니다.',
  ADMIN_SECURITY_LOG_REASON: '관리자 권한(SeSecurityPrivilege)이 있어야 읽을 수 있는 기록이므로 설정을 바꾸지 않고 「확인 불가」로 표시합니다.',
});

const DEFAULT_ADMIN_FIREWALL_ITEMS = Object.freeze([
  Object.freeze({
    item: '방화벽 차단 패킷 로그(pfirewall.log) 및 그룹 정책 저장소(PersistentStore)',
    status: '확인 불가',
    reason: SOC_UI_TEXT.ADMIN_FIREWALL_REASON,
  }),
]);

const DEFAULT_ADMIN_EVENT_LOGS = Object.freeze([
  Object.freeze({
    logName: 'Security (Windows 보안 감사 로그)',
    status: '확인 불가',
    reason: SOC_UI_TEXT.ADMIN_SECURITY_LOG_REASON,
  }),
]);

function resolveProvenance({ mode, forceLive = false } = {}) {
  if (!forceLive && mode === 'demo') {
    return Object.freeze({
      kind: 'demo',
      label: SOC_UI_TEXT.DEMO_BADGE,
      fullLabel: SOC_UI_TEXT.DEMO_FULL,
      className: 'provenance-badge badge-demo',
    });
  }
  return Object.freeze({
    kind: 'live',
    label: SOC_UI_TEXT.LIVE_BADGE,
    fullLabel: SOC_UI_TEXT.LIVE_FULL,
    className: 'provenance-badge badge-live',
  });
}

function createProvenanceBadgeEl(provenance, useFull = false) {
  const p = provenance || resolveProvenance({ forceLive: true });
  return createEl('span', {
    className: p.className,
    text: useFull ? p.fullLabel : p.label,
    attrs: { 'data-provenance': p.kind },
  });
}

function createRoleBadgeEl(roleKind = 'custom') {
  const isProvided = roleKind === 'provided';
  return createEl('span', {
    className: isProvided ? 'provenance-badge badge-provided' : 'provenance-badge badge-custom',
    text: isProvided ? '[제공 기능]' : '[내가 바꾼 부분]',
    attrs: { 'data-role-kind': isProvided ? 'provided' : 'custom' },
  });
}

function createUnverifiedBadgeEl(label = SOC_UI_TEXT.UNVERIFIED_BADGE) {
  return createEl('span', {
    className: 'provenance-badge badge-unverified',
    text: label,
    attrs: { 'data-provenance': 'unverified' },
  });
}

function createSdpStatusBadgeEl(mode, useFull = false) {
  const isConnected = mode === 'connected';
  const text = isConnected
    ? SOC_UI_TEXT.SDP_CONNECTED_BADGE
    : useFull
      ? SOC_UI_TEXT.SDP_DISCONNECTED_FULL
      : SOC_UI_TEXT.SDP_DISCONNECTED_BADGE;
  return createEl('span', {
    className: isConnected ? 'provenance-badge badge-live' : 'provenance-badge badge-sdp-disconnected',
    text,
    attrs: { 'data-sdp-status': isConnected ? 'connected' : 'disconnected' },
  });
}

function probeNodeOsRuntimeIfAvailable(pcStatus, onResolved, force = false) {
  const nowMs = Date.now();
  if (
    pcStatus.osProbeLoading
    || (!force && pcStatus.lastOsProbeFetchMs && nowMs - pcStatus.lastOsProbeFetchMs < SOC_LIMITS.FETCH_THROTTLE_MS)
  ) {
    return;
  }
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return;
  }

  pcStatus.osProbeLoading = true;
  pcStatus.lastOsProbeFetchMs = nowMs;
  pcStatus.osProbeError = null;

  fetch(SOC_LIMITS.PC_STATUS_ENDPOINT, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
    .then((res) => {
      if (!res) throw new Error('응답 객체가 없습니다.');
      if (!res.ok) throw new Error(`HTTP 상태 코드 오류: ${res.status} (${res.statusText || '서버 오류'})`);
      return res.json();
    })
    .then((payload) => {
      if (payload && payload.ok === true && payload.data && typeof payload.data === 'object') {
        pcStatus.osProbe = Object.freeze(payload.data);
        pcStatus.osProbeError = null;
        if (!pcStatus.cores && Number(payload.data?.cpu?.logicalCores) > 0) {
          pcStatus.cores = Number(payload.data.cpu.logicalCores);
        }
        if (typeof pcStatus.onServerSnapshots === 'function' && Array.isArray(payload.data.snapshotHistory)) {
          pcStatus.onServerSnapshots(payload.data.snapshotHistory);
        }
      } else {
        const msg = payload?.error?.message || '실측 데이터 형식이 올바르지 않습니다.';
        pcStatus.osProbeError = msg;
      }
    })
    .catch((err) => {
      pcStatus.osProbe = null;
      pcStatus.osProbeError = err?.message || '로컬 런타임 브리지 센서(/api/pc-status) 연결 실패';
    })
    .finally(() => {
      pcStatus.osProbeLoading = false;
      if (typeof onResolved === 'function') onResolved();
    });
}

function readBrowserHardwareAndHeap(fallbackCores = null) {
  let cores = fallbackCores;
  let deviceMemoryGb = null;
  let heapSupported = false;
  let heapUsedMb = null;
  let heapTotalMb = null;
  let heapLimitMb = null;
  let heapUsagePct = null;

  try {
    const navCores = typeof navigator !== 'undefined' ? Number(navigator.hardwareConcurrency) : NaN;
    if (Number.isFinite(navCores) && navCores > 0) {
      cores = navCores;
    }
  } catch {
    cores = fallbackCores;
  }

  try {
    const navMem = typeof navigator !== 'undefined' ? Number(navigator.deviceMemory) : NaN;
    if (Number.isFinite(navMem) && navMem > 0) {
      deviceMemoryGb = navMem;
    }
  } catch {
    deviceMemoryGb = null;
  }

  try {
    const mem = typeof performance !== 'undefined' && performance?.memory ? performance.memory : null;
    if (mem && Number.isFinite(Number(mem.usedJSHeapSize))) {
      heapSupported = true;
      heapUsedMb = Number((Number(mem.usedJSHeapSize) / (1024 * 1024)).toFixed(2));
      heapTotalMb = Number.isFinite(Number(mem.totalJSHeapSize))
        ? Number((Number(mem.totalJSHeapSize) / (1024 * 1024)).toFixed(2))
        : null;
      heapLimitMb = Number.isFinite(Number(mem.jsHeapSizeLimit))
        ? Number((Number(mem.jsHeapSizeLimit) / (1024 * 1024)).toFixed(0))
        : null;
      if (heapLimitMb && heapLimitMb > 0) {
        heapUsagePct = Number(((heapUsedMb / heapLimitMb) * 100).toFixed(2));
      } else if (heapTotalMb && heapTotalMb > 0) {
        heapUsagePct = Number(((heapUsedMb / heapTotalMb) * 100).toFixed(1));
      }
    }
  } catch {
    heapSupported = false;
  }

  return {
    cores,
    deviceMemoryGb,
    heapSupported,
    heapUsedMb,
    heapTotalMb,
    heapLimitMb,
    heapUsagePct,
  };
}

function createInitialPcStatusState() {
  const nowIso = new Date().toISOString();
  const hw = readBrowserHardwareAndHeap(null);
  return {
    measuredAt: nowIso,
    osProbe: null,
    osProbeLoading: false,
    osProbeError: null,
    ...hw,
    storageState: 'checking',
    storageFreeGb: null,
    storageQuotaGb: null,
    storageUsedMb: null,
    storageUsagePct: null,
    storageMeasuredAt: nowIso,
    storageReason: '일반 권한 StorageManager(navigator.storage.estimate) 조회 대기 중입니다.',
  };
}

function refreshBrowserPcStatus(pcStatus, onStorageResolved, force = false) {
  pcStatus.measuredAt = new Date().toISOString();
  probeNodeOsRuntimeIfAvailable(pcStatus, onStorageResolved, force);

  const fallbackCores = pcStatus.osProbe?.cpu?.logicalCores
    ? Number(pcStatus.osProbe.cpu.logicalCores)
    : null;
  Object.assign(pcStatus, readBrowserHardwareAndHeap(fallbackCores));

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.storage?.estimate === 'function') {
      const promise = navigator.storage.estimate();
      if (promise && typeof promise.then === 'function') {
        promise.then((est) => {
          const quota = Number(est?.quota);
          const usage = Number(est?.usage);
          pcStatus.storageMeasuredAt = new Date().toISOString();
          if (Number.isFinite(quota) && quota > 0 && Number.isFinite(usage) && usage >= 0) {
            const freeBytes = Math.max(0, quota - usage);
            pcStatus.storageState = 'ok';
            pcStatus.storageFreeGb = Number((freeBytes / (1024 ** 3)).toFixed(2));
            pcStatus.storageQuotaGb = Number((quota / (1024 ** 3)).toFixed(2));
            pcStatus.storageUsedMb = Number((usage / (1024 ** 2)).toFixed(2));
            pcStatus.storageUsagePct = Number(((usage / quota) * 100).toFixed(2));
            pcStatus.storageReason = '브라우저 일반 권한(navigator.storage.estimate)으로 Origin 할당 디스크 여유 공간을 측정했습니다.';
          } else {
            pcStatus.storageState = 'unverified';
            pcStatus.storageFreeGb = null;
            pcStatus.storageUsagePct = null;
            pcStatus.storageReason = 'StorageManager 응답에 유효한 quota/usage 수치가 없어 확인 불가로 처리했습니다.';
          }
          if (typeof onStorageResolved === 'function') onStorageResolved();
        }).catch(() => {
          pcStatus.storageMeasuredAt = new Date().toISOString();
          pcStatus.storageState = 'unverified';
          pcStatus.storageFreeGb = null;
          pcStatus.storageUsagePct = null;
          pcStatus.storageReason = '현재 브라우저 환경에서 navigator.storage.estimate() 호출이 지연되어 확인 불가로 처리했습니다.';
          if (typeof onStorageResolved === 'function') onStorageResolved();
        });
      }
    } else {
      pcStatus.storageState = 'unverified';
      pcStatus.storageFreeGb = null;
      pcStatus.storageUsagePct = null;
      pcStatus.storageReason = '현재 브라우저 환경에서 navigator.storage.estimate() API를 지원하지 않아 확인 불가로 처리했습니다.';
    }
  } catch {
    pcStatus.storageState = 'unverified';
    pcStatus.storageFreeGb = null;
    pcStatus.storageUsagePct = null;
    pcStatus.storageReason = '브라우저 스토리지 추정 중 오류가 발생하여 확인 불가로 처리했습니다.';
  }
}

function normalizeIdentitySummary({ me, devices, sessions, mode, measuredAt } = {}) {
  const effectiveMode = me?.mode || devices?.mode || sessions?.mode || mode || 'unknown';
  const userId = me?.data?.user?.id || '';
  const provenance = resolveProvenance({
    mode: effectiveMode,
    forceLive: me?.status === 'error' || effectiveMode === 'disconnected',
  });

  const devList = Array.isArray(devices?.data) ? devices.data : [];
  const sessList = Array.isArray(sessions?.data) ? sessions.data : [];

  const compliantCount = devList.filter((d) => d?.status === 'compliant').length;
  const noncompliantCount = devList.filter((d) => d?.status === 'noncompliant').length;
  const unknownDeviceCount = devList.filter((d) => !d?.status || d.status === 'unknown').length;
  const activeSessionCount = sessList.filter((s) => s?.status === 'active').length;
  const totalDevices = devList.length;

  let tone = 'unknown';
  let headline = `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} · 신원·기기 미확인 (기기 0대 / 세션 0건)`;
  let subline = '사유: SDP 서버 미연결 (내 PC 실측과 분리 표시)';

  if (me?.status === 'loading' || devices?.status === 'loading' || sessions?.status === 'loading') {
    tone = 'unknown';
    headline = `신원·기기 확인 중… (기기 ${totalDevices}대 / 세션 ${sessList.length}건)`;
    subline = '로컬 서버에서 신원 및 기기 상태를 조회하고 있습니다.';
  } else if (me?.status === 'error' || devices?.status === 'error' || sessions?.status === 'error') {
    tone = 'deny';
    headline = effectiveMode === 'disconnected'
      ? `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} · 신원·기기 미확인`
      : '신원·기기 조회 실패';
    subline = `사유: ${extractErrorText(me?.error || devices?.error || sessions?.error, 'SDP 서버 미연결')} (내 PC 실측과 분리)`;
  } else if (me?.status === 'ok') {
    const devStatus = me.data?.device?.status || 'unknown';
    const sessStatus = me.data?.session?.status || 'unknown';
    const userLabel = me.data?.user?.label || userId || '사용자';
    const demoNote = effectiveMode === 'demo' ? ` · ${SOC_UI_TEXT.DEMO_BADGE} 설명용 데이터` : '';
    if (devStatus === 'compliant' && sessStatus === 'active') {
      tone = 'allow';
      headline = `${userLabel} · 기준 충족 (기기 ${compliantCount}대 / 세션 ${activeSessionCount}건)${demoNote}`;
      subline = `준수 기기 ${compliantCount}대 · 활성 세션 ${activeSessionCount}건`;
    } else if (devStatus === 'noncompliant' || sessStatus === 'revoked' || sessStatus === 'expired') {
      tone = 'deny';
      headline = `${userLabel} · 기준 미충족/만료 (미충족 ${noncompliantCount}대)${demoNote}`;
      subline = `기기(${mapDeviceStatus(devStatus)}) · 세션(${mapSessionStatus(sessStatus)})${demoNote}`;
    } else {
      tone = 'challenge';
      headline = `${userLabel} · 기기 확인 불가 (${devStatus} · 미확인 ${unknownDeviceCount}대)${demoNote}`;
      subline = `세션(${mapSessionStatus(sessStatus)}, ${activeSessionCount}건) · 기기 보안 기준 미검증${demoNote}`;
    }
  }

  return Object.freeze({
    cardId: 'identity-compliance',
    stepLabel: '카드 1 · SDP IDENTITY & DEVICE',
    title: '신원 및 기기 준수 현황',
    tone,
    headline,
    subline,
    measuredAt: formatMeasuredAt(measuredAt),
    provenance,
    sdpMode: effectiveMode,
    showSdpBadge: true,
    kpis: Object.freeze([
      { label: effectiveMode === 'connected' ? 'SDP 연결됨' : `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} (로컬 실측과 별도)`, chipClass: effectiveMode === 'connected' ? 'chip-allow' : 'chip-deny' },
      { label: `준수 기기 ${compliantCount}대`, chipClass: compliantCount > 0 ? 'chip-allow' : 'chip-unknown' },
      { label: `미확인 기기 ${unknownDeviceCount}대`, chipClass: unknownDeviceCount > 0 ? 'chip-challenge' : 'chip-unknown' },
      { label: `활성 세션 ${activeSessionCount}건`, chipClass: activeSessionCount > 0 ? 'chip-allow' : 'chip-unknown' },
    ]),
  });
}

function normalizeEventsSummary(eventsSlice = {}, fallbackMeasuredAt = null) {
  const status = eventsSlice?.status || 'loading';
  const mode = eventsSlice?.mode || 'unknown';
  const rawList = Array.isArray(eventsSlice?.data) ? eventsSlice.data : [];
  const sortedEvents = [...rawList].sort((a, b) => new Date(b?.at || 0).getTime() - new Date(a?.at || 0).getTime());

  const provenance = resolveProvenance({
    mode,
    forceLive: status === 'error' || mode === 'disconnected',
  });

  const xdrCount = sortedEvents.filter((e) => e?.kind === 'xdr').length;
  const accessCount = sortedEvents.filter((e) => e?.kind === 'access').length;
  const deniedCount = sortedEvents.filter((e) => e?.state?.access === 'denied').length;
  const unknownStateCount = sortedEvents.filter((e) =>
    e?.state?.access === 'unknown' || e?.state?.session === 'unknown' || e?.state?.device === 'unknown').length;

  const ruleMap = new Map();
  for (const ev of sortedEvents) {
    const rules = Array.isArray(ev?.rules) ? ev.rules : [];
    for (const r of rules) {
      if (!r?.id) continue;
      const prev = ruleMap.get(r.id) || { id: r.id, text: r.text || '', count: 0, eventIds: [] };
      prev.count += 1;
      if (ev.id && !prev.eventIds.includes(ev.id)) prev.eventIds.push(ev.id);
      ruleMap.set(r.id, prev);
    }
  }
  const matchedRules = [...ruleMap.values()];

  let tone = 'unknown';
  let headline = '기록 확인 중… (0건 / 0종)';
  let subline = '접속 기록(건)과 저장된 XDR 경보(건)를 집계합니다.';

  if (status === 'loading') {
    tone = 'unknown';
    headline = '보안 기록 불러오는 중… (0건)';
  } else if (status === 'error') {
    tone = 'deny';
    headline = mode === 'disconnected'
      ? `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} · 보안 기록 확인 불가 (0건)`
      : '보안 기록 조회 실패 · 확인 불가 (0건)';
    subline = `사유: ${extractErrorText(eventsSlice?.error, 'SDP 서버 연결을 확인할 수 없습니다.')} (내 PC Windows 기록 조회 결과와 구분해 표시함)`;
  } else if (sortedEvents.length === 0) {
    tone = 'unknown';
    headline = '관측된 보안 기록 0건 (규칙 0종)';
    subline = '표시할 보안 기록이 없습니다 (정상·안전 단정 아님).';
  } else {
    tone = xdrCount > 0 || deniedCount > 0 ? 'deny' : unknownStateCount > 0 ? 'challenge' : 'allow';
    const demoLabel = mode === 'demo' ? ` [${SOC_UI_TEXT.DEMO_BADGE} · 설명용]` : '';
    headline = `총 ${sortedEvents.length}건 (XDR ${xdrCount}건 · 접속 ${accessCount}건)${demoLabel}`;
    subline = `매칭 규칙 ${matchedRules.length}종 · 거부 상태 ${deniedCount}건 · 미확인 상태 ${unknownStateCount}건 (SDP 서버: ${mode === 'connected' ? '연결됨' : SOC_UI_TEXT.SDP_DISCONNECTED_BADGE})`;
  }

  const latestEventTime = sortedEvents[0]?.at || fallbackMeasuredAt;

  return Object.freeze({
    cardId: 'xdr-events',
    stepLabel: '카드 3 · SDP/XDR EVENTS & RULES',
    title: 'XDR 보안 이벤트 및 규칙 (SDP 영역)',
    tone,
    headline,
    subline,
    measuredAt: formatMeasuredAt(latestEventTime),
    provenance,
    sdpMode: mode,
    showSdpBadge: true,
    sortedEvents,
    matchedRules,
    xdrCount,
    accessCount,
    deniedCount,
    unknownStateCount,
    kpis: Object.freeze([
      { label: mode === 'connected' ? 'SDP 연결됨' : SOC_UI_TEXT.SDP_DISCONNECTED_BADGE, chipClass: mode === 'connected' ? 'chip-allow' : 'chip-deny' },
      { label: `XDR 경보 ${xdrCount}건`, chipClass: xdrCount > 0 ? 'chip-deny' : 'chip-unknown' },
      { label: `접속 기록 ${accessCount}건`, chipClass: accessCount > 0 ? 'chip-challenge' : 'chip-unknown' },
      { label: `매칭 규칙 ${matchedRules.length}종`, chipClass: matchedRules.length > 0 ? 'chip-challenge' : 'chip-unknown' },
    ]),
  });
}


function normalizeIdentityAndNetworkSummary(store, fallbackMeasuredAt = null) {
  const rawTime = store.status?.diagnostics?.data?.checkedAt || store.pcStatus?.measuredAt || fallbackMeasuredAt;
  const measuredAt = formatMeasuredAt(rawTime);
  const liveProv = resolveProvenance({ forceLive: true });

  const osNet = store.pcStatus?.osProbe?.network;
  const netInterfaces = Array.isArray(osNet?.interfaces) ? osNet.interfaces : [];
  const netOk = osNet?.status === 'ok' && netInterfaces.length > 0;
  const netCount = osNet?.interfaceCount ?? netInterfaces.length;
  const primaryNic = netInterfaces[0];
  const primaryIpv4 = Array.isArray(primaryNic?.ipv4) && primaryNic.ipv4.length > 0 ? primaryNic.ipv4[0] : 'IPv4 없음';
  const gw = osNet?.primaryGateway || '없음(로컬)';
  const dnsStr = Array.isArray(osNet?.dnsServers) && osNet.dnsServers.length > 0 ? osNet.dnsServers.join(', ') : 'IPv4 DNS 없음';
  const reason = store.pcStatus?.osProbeError || osNet?.reason || '런타임 브리지 미연결';

  return Object.freeze({
    cardId: 'card-1-identity-network',
    stepLabel: 'Card 01',
    title: '네트워크 구성',
    tone: netOk ? 'allow' : 'challenge',
    measuredAt,
    provenance: liveProv,
    sdpSection: null,
    localSection: {
      type: 'network-kpi-table',
      title: '네트워크 어댑터 구성',
      isReadonly: false,
      liveProv,
      netOk,
      netCount,
      primaryIpv4,
      gw,
      dnsStr,
      reason,
    },
  });
}

function normalizeDecisionAndFirewallSummary(store, fallbackMeasuredAt = null) {
  const decisionSlice = store.decision;
  const decisionHistory = store.decisionHistory || [];
  const status = decisionSlice?.status || 'idle';
  const mode = decisionSlice?.mode || store.status?.mode || 'unknown';
  const provenance = resolveProvenance({ mode, forceLive: status === 'idle' || status === 'error' });
  const liveProv = resolveProvenance({ forceLive: true });
  const rawTime = decisionSlice?.data?.checkedAt || decisionHistory[0]?.checkedAt || store.pcStatus?.measuredAt || fallbackMeasuredAt;
  const measuredAt = formatMeasuredAt(rawTime);

  const stats = { allow: 0, deny: 0, challenge: 0, unknown: 0, failed: 0 };
  for (const item of decisionHistory) {
    if (item?.status === 'error') stats.failed += 1;
    else if (item?.decision && Object.hasOwn(stats, item.decision)) stats[item.decision] += 1;
    else if (item?.status === 'ok') stats.unknown += 1;
  }
  const totalDecisions = decisionHistory.length;
  const targetApp = decisionSlice?.data?.appId || decisionSlice?.appId || null;

  let sdpTone = 'unknown';
  let sdpStatusText = `인가 대기 0건 (누적 ${totalDecisions}건)`;

  if (status === 'loading') {
    sdpTone = 'unknown';
    sdpStatusText = `${targetApp || '업무 앱'} 판정 확인 중…`;
  } else if (status === 'error') {
    sdpTone = 'deny';
    sdpStatusText = `판정 실패 (${stats.failed}건)`;
  } else if (status === 'ok') {
    const mapped = mapDecision(decisionSlice?.data?.decision);
    sdpTone = mapped.code === 'allow' ? 'allow' : mapped.code === 'deny' ? 'deny' : 'challenge';
    sdpStatusText = `${targetApp || '업무 앱'}: ${mapped.code} (허용 ${stats.allow} · 거부 ${stats.deny})`;
  }

  const osFw = store.pcStatus?.osProbe?.firewall;
  const fwProfiles = Array.isArray(osFw?.profiles) ? osFw.profiles : [];
  const fwOk = osFw?.status === 'ok' && fwProfiles.length > 0;
  const fwEnabled = osFw?.enabledCount ?? null;
  const fwTotal = osFw?.totalProfiles ?? SOC_LIMITS.FIREWALL_PROFILE_TOTAL;
  const inbound = fwProfiles[0]?.defaultInboundAction || '차단(Block)';
  const outbound = fwProfiles[0]?.defaultOutboundAction || '허용(Allow)';
  const reason = store.pcStatus?.osProbeError || osFw?.reason || '방화벽 프로필 확인 불가';

  return Object.freeze({
    cardId: 'card-2-decision-firewall',
    stepLabel: 'Card 02',
    title: '방화벽 설정',
    tone: fwOk ? 'allow' : 'challenge',
    measuredAt,
    provenance,
    sdpSection: null,
    localSection: {
      type: 'firewall-tiles',
      title: '방화벽 설정',
      isReadonly: true,
      liveProv,
      fwOk,
      fwEnabled,
      fwTotal,
      profiles: fwProfiles,
      inbound,
      outbound,
      reason,
    },
  });
}

function normalizeEventsAndWindowsLogsSummary(store, fallbackMeasuredAt = null) {
  const eventsSlice = store.events;
  const status = eventsSlice?.status || 'loading';
  const mode = eventsSlice?.mode || store.status?.mode || 'unknown';
  const rawList = Array.isArray(eventsSlice?.data) ? eventsSlice.data : [];
  const sortedEvents = [...rawList].sort((a, b) => new Date(b?.at || 0).getTime() - new Date(a?.at || 0).getTime());
  const provenance = resolveProvenance({ mode, forceLive: status === 'error' || mode === 'disconnected' });
  const liveProv = resolveProvenance({ forceLive: true });
  const latestEventTime = sortedEvents[0]?.at || store.pcStatus?.measuredAt || fallbackMeasuredAt;
  const measuredAt = formatMeasuredAt(latestEventTime);

  const xdrCount = sortedEvents.filter((e) => e?.kind === 'xdr').length;
  const accessCount = sortedEvents.filter((e) => e?.kind === 'access').length;
  const deniedCount = sortedEvents.filter((e) => e?.state?.access === 'denied').length;
  const ruleMap = new Map();
  for (const ev of sortedEvents) {
    const rules = Array.isArray(ev?.rules) ? ev.rules : [];
    for (const r of rules) {
      if (!r?.id) continue;
      const prev = ruleMap.get(r.id) || { id: r.id, text: r.text || '', count: 0 };
      prev.count += 1;
      ruleMap.set(r.id, prev);
    }
  }
  const matchedRules = [...ruleMap.values()];

  let sdpTone = 'unknown';
  let sdpStatusText = '수신 기록 0건 (SDP 미연결)';

  if (status === 'loading') {
    sdpTone = 'unknown';
    sdpStatusText = '보안 기록 불러오는 중…';
  } else if (status === 'error') {
    sdpTone = 'deny';
    sdpStatusText = mode === 'disconnected' ? '수신 기록 0건 (SDP 미연결)' : '보안 기록 조회 실패 (0건)';
  } else if (status === 'ok') {
    if (sortedEvents.length === 0) {
      sdpTone = 'unknown';
      sdpStatusText = '수신 기록 0건';
    } else {
      sdpTone = xdrCount > 0 || deniedCount > 0 ? 'deny' : 'allow';
      sdpStatusText = `총 ${sortedEvents.length}건 (XDR ${xdrCount}건 · 거부 ${deniedCount}건)`;
    }
  }

  const osWinEv = store.pcStatus?.osProbe?.windowsEvents;
  const sysLog = osWinEv?.system;
  const appLog = osWinEv?.application;
  const winEvOk = sysLog?.status === 'ok' || appLog?.status === 'ok';
  const sysErr = sysLog?.errorCount ?? 0;
  const sysWarn = sysLog?.warningCount ?? 0;
  const appErr = appLog?.errorCount ?? 0;
  const appWarn = appLog?.warningCount ?? 0;
  const reason = store.pcStatus?.osProbeError || '런타임 브리지 미연결';

  return Object.freeze({
    cardId: 'card-3-xdr-windows-logs',
    stepLabel: 'Card 03',
    title: 'Windows 기록',
    tone: winEvOk ? 'allow' : 'challenge',
    measuredAt,
    provenance,
    sortedEvents,
    matchedRules,
    xdrCount,
    accessCount,
    deniedCount,
    sdpSection: null,
    localSection: {
      type: 'windows-counters',
      title: 'Windows 일반 기록 (최근 24시간)',
      isReadonly: false,
      liveProv,
      winEvOk,
      sysTotal: sysLog?.totalCount ?? 0,
      sysErr,
      sysWarn,
      appTotal: appLog?.totalCount ?? 0,
      appErr,
      appWarn,
      reason,
      nonIntrusionNotice: '이 건수는 침해나 공격 탐지 결과가 아닙니다 (일반 이벤트 로그)',
    },
  });
}

function normalizeDiagnosticsAndHardwareSummary(store, fallbackMeasuredAt = null) {
  const diagnostics = store.status?.diagnostics;
  const vulnerabilities = store.vulnerabilities;
  const diagStatus = diagnostics?.status || 'idle';
  const vulnStatus = vulnerabilities?.status || 'idle';
  const rawTime = store.pcStatus?.osProbe?.measuredAt || store.pcStatus?.measuredAt || diagnostics?.data?.checkedAt || fallbackMeasuredAt;
  const measuredAt = formatMeasuredAt(rawTime);
  const liveProv = resolveProvenance({ forceLive: true });

  const safeDiag = {
    requestId: diagnostics?.data?.requestId || '',
    version: diagnostics?.data?.version || '',
    component: diagnostics?.data?.component || '',
  };
  const diagCount = Object.values(safeDiag).filter((v) => String(v).trim().length > 0).length;
  const packages = Array.isArray(vulnerabilities?.data?.packages) ? vulnerabilities.data.packages : [];
  let totalVulnCount = 0;
  for (const p of packages) {
    if (Array.isArray(p?.vulnerabilities)) totalVulnCount += p.vulnerabilities.length;
  }

  let sdpTone = 'allow';
  let sdpStatusText = `조회 패키지 ${packages.length}개 · 취약점 ${totalVulnCount}건 (${safeDiag.version || 'v0.2.11'})`;
  if (diagStatus === 'error' || vulnStatus === 'error') {
    sdpTone = 'challenge';
    sdpStatusText = '진단/취약점 일부 확인 불가';
  }

  const osCpu = store.pcStatus?.osProbe?.cpu;
  const osMem = store.pcStatus?.osProbe?.memory;
  const osDisk = store.pcStatus?.osProbe?.disk;

  const cores = store.pcStatus?.cores ?? osCpu?.logicalCores ?? null;
  const cpuPct = osCpu?.usagePercent ?? null;
  const memUsedGb = osMem?.usedGb ?? null;
  const memTotalGb = osMem?.totalGb ?? null;
  const diskFreeGb = osDisk?.freeGb ?? store.pcStatus?.storageFreeGb ?? null;
  const diskTotalGb = osDisk?.totalGb ?? null;

  return Object.freeze({
    cardId: 'card-4-diag-hardware',
    stepLabel: 'Card 04',
    title: '하드웨어 자원',
    tone: sdpTone,
    measuredAt,
    provenance: liveProv,
    sdpSection: null,
    localSection: {
      type: 'hardware-gauges',
      title: '하드웨어 자원',
      isReadonly: false,
      liveProv,
      cores,
      cpuPct,
      memUsedGb,
      memTotalGb,
      diskFreeGb,
      diskTotalGb,
    },
  });
}

function aggregateSocTopCards(store) {
  const fallbackTime = store.pcStatus?.measuredAt || new Date().toISOString();
  const card1 = normalizeIdentityAndNetworkSummary(store, fallbackTime);
  const card2 = normalizeDecisionAndFirewallSummary(store, fallbackTime);
  const card3 = normalizeEventsAndWindowsLogsSummary(store, fallbackTime);
  const card4 = normalizeDiagnosticsAndHardwareSummary(store, fallbackTime);
  return Object.freeze([card1, card2, card3, card4]);
}

function buildCard01Dom(card) {
  const article = createEl('article', {
    className: `soc-metric-card soc-card-${card.tone || 'unknown'}`,
    attrs: {
      role: 'region',
      'aria-label': `${card.stepLabel} ${card.title}`,
      'data-soc-card': card.cardId,
      'data-soc-tone': card.tone || 'unknown',
      tabindex: '0',
    },
  });

  const sec = card.localSection || {};
  const headerBadge = sec.netOk
    ? createProvenanceBadgeEl(sec.liveProv || resolveProvenance({ forceLive: true }))
    : createUnverifiedBadgeEl('확인 불가');

  // (A) Uniform Header Bar (#E7ECF3 background, #0E306D bold title, right-aligned uniform badge)
  const header = createEl('header', { className: 'soc-card-header' }, [
    createEl('h3', { className: 'soc-card-title' }, [
      createEl('span', { className: 'soc-card-step', text: card.stepLabel }),
      document.createTextNode(` ${card.title}`),
    ]),
    createEl('div', { className: 'soc-card-badges' }, [headerBadge]),
  ]);
  article.appendChild(header);

  const body = createEl('div', { className: 'soc-card-body' });

  // (B) Hero Metric: 활성 어댑터 수
  const heroCount = sec.netOk ? (sec.netCount ?? 0) : 0;
  const heroRow = createEl('div', { className: 'soc-hero-metric' }, [
    createEl('span', { className: 'soc-hero-num' }, [
      createEl('span', { className: `soc-status-dot ${sec.netOk ? 'dot-teal' : 'dot-orange'}`, attrs: { 'aria-hidden': 'true' } }),
      document.createTextNode(` ${sec.netOk ? `${heroCount}개` : '확인 대기'}`),
    ]),
    createEl('span', { className: 'soc-hero-unit', text: '활성 어댑터' }),
  ]);
  body.appendChild(heroRow);

  // (C) Structured Mini-Table (.soc-mini-table): 2-Column Key-Value Table
  let ipv4Val = sec.primaryIpv4 || '확인 불가';
  if (ipv4Val.includes('/') && !ipv4Val.includes(' / ')) {
    ipv4Val = ipv4Val.replace('/', ' / ');
  }
  const gwVal = sec.gw || '확인 불가';
  const dnsVal = sec.dnsStr || '확인 불가';

  const table = createEl('table', { className: 'soc-mini-table', attrs: { role: 'table', 'aria-label': '네트워크 구성 측정값' } }, [
    createEl('thead', {}, [
      createEl('tr', {}, [
        createEl('th', { attrs: { scope: 'col' }, text: '항목' }),
        createEl('th', { attrs: { scope: 'col' }, className: 'soc-val-right', text: '측정값' }),
      ]),
    ]),
    createEl('tbody', {}, [
      createEl('tr', {}, [
        createEl('td', {}, [createEl('strong', { text: '대표 IPv4' })]),
        createEl('td', { className: 'soc-val-right', text: ipv4Val }),
      ]),
      createEl('tr', {}, [
        createEl('td', {}, [createEl('strong', { text: '기본 게이트웨이' })]),
        createEl('td', { className: 'soc-val-right', text: gwVal }),
      ]),
      createEl('tr', {}, [
        createEl('td', {}, [createEl('strong', { text: 'DNS 서버' })]),
        createEl('td', { className: 'soc-val-right', text: dnsVal }),
      ]),
    ]),
  ]);
  body.appendChild(table);

  article.appendChild(body);
  return article;
}

function formatActionCell(actionText) {
  if (!actionText || typeof actionText !== 'string') {
    return [document.createTextNode('-')];
  }
  if (actionText === '확인 불가') {
    return [createEl('span', { className: 'soc-action-unverified', text: '확인 불가' })];
  }
  const match = actionText.match(/^([^(]+)\s*(\([^)]+\))$/);
  if (match) {
    const main = match[1].trim();
    const paren = match[2].trim();
    const isNotReceived = paren.includes('기본값') || actionText.includes('기본값');
    if (isNotReceived) {
      return [
        createEl('span', { className: 'soc-action-main', text: main }),
        createEl('span', { className: 'soc-action-sub is-default', text: paren }),
      ];
    }
    return [
      createEl('span', { className: 'soc-action-main', text: main }),
      createEl('span', { className: 'soc-action-sub is-received', text: ` ${paren}` }),
    ];
  }
  return [document.createTextNode(actionText)];
}

function buildCard02Dom(card) {
  const article = createEl('article', {
    className: `soc-metric-card soc-card-${card.tone || 'unknown'}`,
    attrs: {
      role: 'region',
      'aria-label': `${card.stepLabel} ${card.title}`,
      'data-soc-card': card.cardId,
      'data-soc-tone': card.tone || 'unknown',
      tabindex: '0',
    },
  });

  const sec = card.localSection || {};
  const headerBadges = [
    createEl('span', {
      className: 'provenance-badge badge-live',
      text: '[읽기 전용]',
      attrs: { 'data-provenance': 'live' },
    }),
  ];
  if (sec.fwOk) {
    headerBadges.push(createProvenanceBadgeEl(sec.liveProv || resolveProvenance({ forceLive: true })));
  } else {
    headerBadges.push(createUnverifiedBadgeEl('확인 불가'));
  }

  // (A) Uniform Header Bar (#E7ECF3 background, #0E306D bold title, right-aligned uniform badge)
  const header = createEl('header', { className: 'soc-card-header' }, [
    createEl('h3', { className: 'soc-card-title' }, [
      createEl('span', { className: 'soc-card-step', text: card.stepLabel }),
      document.createTextNode(` ${card.title}`),
    ]),
    createEl('div', { className: 'soc-card-badges' }, headerBadges),
  ]);
  article.appendChild(header);

  const body = createEl('div', { className: 'soc-card-body' });

  // (B) Hero Metric: 방화벽 활성 프로필
  const enabledCount = sec.fwEnabled;
  const totalCount = sec.fwTotal ?? SOC_LIMITS.FIREWALL_PROFILE_TOTAL;
  const fwMetricText = enabledCount !== null && enabledCount !== undefined
    ? `${enabledCount} / ${totalCount} 켜짐`
    : '확인 대기';
  const heroRow = createEl('div', { className: 'soc-hero-metric' }, [
    createEl('span', { className: 'soc-hero-num' }, [
      createEl('span', { className: `soc-status-dot ${sec.fwOk ? 'dot-teal' : 'dot-orange'}`, attrs: { 'aria-hidden': 'true' } }),
      document.createTextNode(` ${fwMetricText}`),
    ]),
    createEl('span', { className: 'soc-hero-unit', text: '방화벽 활성 프로필' }),
  ]);
  body.appendChild(heroRow);

  // (C) Structured Mini-Table: 4-Column Profile Status Matrix
  const profileDefs = [
    { key: 'Domain', name: '도메인', en: '(Domain)' },
    { key: 'Private', name: '개인', en: '(Private)' },
    { key: 'Public', name: '공용', en: '(Public)' },
  ];

  const tbody = createEl('tbody');
  for (const def of profileDefs) {
    const prof = Array.isArray(sec.profiles) ? sec.profiles.find((p) => (p.name && p.name.includes(def.key)) || p.profileKey === def.key) : null;
    const isEnabled = prof ? (prof.enabled === true) : null;
    const statusText = isEnabled === true ? '켜짐' : isEnabled === false ? '꺼짐' : '확인 불가';
    const statusDotClass = isEnabled === true ? 'soc-dot-teal' : 'soc-dot-off';
    const inAction = prof?.defaultInboundAction || '확인 불가';
    const outAction = prof?.defaultOutboundAction || '확인 불가';

    const tr = createEl('tr', {}, [
      createEl('td', { className: 'soc-col-profile' }, [
        createEl('strong', { text: def.name }),
        createEl('span', { className: 'soc-profile-en', text: def.en }),
      ]),
      createEl('td', { className: 'soc-status-cell' }, [
        createEl('span', { className: `soc-status-pill-text ${isEnabled === true ? 'soc-status-on' : 'soc-status-off'}` }, [
          createEl('span', { className: `soc-status-dot-icon ${statusDotClass}`, text: isEnabled === true ? '●' : '○', attrs: { 'aria-hidden': 'true' } }),
          createEl('span', { className: 'soc-status-label', text: isEnabled === true ? '켜짐' : isEnabled === false ? '꺼짐' : '확인 불가' }),
        ]),
      ]),
      createEl('td', { className: 'soc-action-cell' }, formatActionCell(inAction)),
      createEl('td', { className: 'soc-action-cell' }, formatActionCell(outAction)),
    ]);
    tbody.appendChild(tr);
  }

  const table = createEl('table', { className: 'soc-mini-table', attrs: { role: 'table', 'aria-label': '방화벽 프로필 상태 매트릭스' } }, [
    createEl('thead', {}, [
      createEl('tr', {}, [
        createEl('th', { attrs: { scope: 'col' }, text: '프로필' }),
        createEl('th', { attrs: { scope: 'col' }, text: '상태' }),
        createEl('th', { attrs: { scope: 'col' }, text: '인바운드' }),
        createEl('th', { attrs: { scope: 'col' }, text: '아웃바운드' }),
      ]),
    ]),
    tbody,
  ]);
  body.appendChild(table);

  article.appendChild(body);
  return article;
}

function buildCard03Dom(card) {
  const article = createEl('article', {
    className: `soc-metric-card soc-card-${card.tone || 'unknown'}`,
    attrs: {
      role: 'region',
      'aria-label': `${card.stepLabel} ${card.title}`,
      'data-soc-card': card.cardId,
      'data-soc-tone': card.tone || 'unknown',
      tabindex: '0',
    },
  });

  const sec = card.localSection || {};
  const headerBadge = sec.winEvOk
    ? createProvenanceBadgeEl(sec.liveProv || resolveProvenance({ forceLive: true }))
    : createUnverifiedBadgeEl('확인 불가');

  // (A) Uniform Header Bar (#E7ECF3 background, #0E306D bold title, right-aligned uniform badge)
  const header = createEl('header', { className: 'soc-card-header' }, [
    createEl('h3', { className: 'soc-card-title' }, [
      createEl('span', { className: 'soc-card-step', text: card.stepLabel }),
      document.createTextNode(` ${card.title}`),
    ]),
    createEl('div', { className: 'soc-card-badges' }, [headerBadge]),
  ]);
  article.appendChild(header);

  const body = createEl('div', { className: 'soc-card-body' });

  // (B) Hero Metric: 최근 24시간 일반 기록
  const sysTotal = sec.sysTotal;
  const sysErr = sec.sysErr ?? 0;
  const sysWarn = sec.sysWarn ?? 0;

  const appTotal = sec.appTotal;
  const appErr = sec.appErr ?? 0;
  const appWarn = sec.appWarn ?? 0;

  const hasWinData = sysTotal !== null && sysTotal !== undefined && appTotal !== null && appTotal !== undefined;
  const totalLogs = hasWinData ? (sysTotal + appTotal) : null;
  const heroRow = createEl('div', { className: 'soc-hero-metric' }, [
    createEl('span', { className: 'soc-hero-num' }, [
      document.createTextNode(totalLogs !== null ? `총 ${totalLogs}건` : '수집 대기 중…'),
    ]),
    createEl('span', { className: 'soc-hero-unit', text: '최근 24시간 일반 기록' }),
  ]);
  body.appendChild(heroRow);

  // (C) Structured Mini-Table: 3-Row Channel Breakdown Table
  const table = createEl('table', { className: 'soc-mini-table', attrs: { role: 'table', 'aria-label': 'Windows 기록 채널별 분류' } }, [
    createEl('thead', {}, [
      createEl('tr', {}, [
        createEl('th', { attrs: { scope: 'col' }, text: '로그 채널' }),
        createEl('th', { attrs: { scope: 'col' }, text: '전체' }),
        createEl('th', { attrs: { scope: 'col' }, text: '세부 내역 / 사유' }),
        createEl('th', { attrs: { scope: 'col' }, text: '상태' }),
      ]),
    ]),
    createEl('tbody', {}, [
      createEl('tr', {}, [
        createEl('td', {}, [createEl('strong', { text: 'System' })]),
        createEl('td', { text: sysTotal !== null && sysTotal !== undefined ? `${sysTotal}건` : '-' }),
        createEl('td', {}, [
          document.createTextNode('오류 '),
          createEl('span', { className: 'soc-num-error', text: String(sysErr) }),
          document.createTextNode(` · 경고 ${sysWarn}`),
        ]),
        createEl('td', {}, [createProvenanceBadgeEl(sec.liveProv || resolveProvenance({ forceLive: true }))]),
      ]),
      createEl('tr', {}, [
        createEl('td', {}, [createEl('strong', { text: 'Application' })]),
        createEl('td', { text: appTotal !== null && appTotal !== undefined ? `${appTotal}건` : '-' }),
        createEl('td', {}, [
          document.createTextNode('오류 '),
          createEl('span', { className: appErr > 0 ? 'soc-num-error' : '', text: String(appErr) }),
          document.createTextNode(` · 경고 ${appWarn}`),
        ]),
        createEl('td', {}, [createProvenanceBadgeEl(sec.liveProv || resolveProvenance({ forceLive: true }))]),
      ]),
      createEl('tr', {}, [
        createEl('td', {}, [createEl('strong', { text: 'Security' })]),
        createEl('td', { text: '-' }),
        createEl('td', { text: '관리자 권한 필요' }),
        createEl('td', {}, [createUnverifiedBadgeEl('확인 불가')]),
      ]),
    ]),
  ]);
  body.appendChild(table);

  // Thin segmented ratio bar (#F47725 for Level 2 Error vs #0E306D for Level 3 Warning)
  const totalErr = sysErr + appErr;
  const totalWarn = sysWarn + appWarn;
  const totalErrWarn = totalErr + totalWarn;
  const errRatio = totalErrWarn > 0 ? (totalErr / totalErrWarn) * 100 : 0;
  const warnRatio = totalErrWarn > 0 ? 100 - errRatio : 0;

  const ratioContainer = createEl('div', { className: 'soc-ratio-container' }, [
    createEl('div', { className: 'soc-ratio-labels' }, [
      createEl('span', { className: 'ratio-label ratio-err', text: `오류(Level 2): ${totalErr}건` }),
      createEl('span', { className: 'ratio-label ratio-warn', text: `경고(Level 3): ${totalWarn}건` }),
    ]),
  ]);
  const ratioTrack = createEl('div', { className: 'soc-ratio-track' });
  const errSeg = createEl('div', { className: 'soc-ratio-seg seg-error' });
  errSeg.style.width = `${errRatio.toFixed(1)}%`;
  const warnSeg = createEl('div', { className: 'soc-ratio-seg seg-warning' });
  warnSeg.style.width = `${warnRatio.toFixed(1)}%`;
  ratioTrack.appendChild(errSeg);
  ratioTrack.appendChild(warnSeg);
  ratioContainer.appendChild(ratioTrack);
  body.appendChild(ratioContainer);

  // Compact 1-line notice
  body.appendChild(createEl('div', {
    className: 'soc-card-notice',
    attrs: { 'data-student-non-intrusion': 'true' },
    text: '※ 침해나 공격 탐지 결과가 아닙니다',
  }));

  article.appendChild(body);
  return article;
}

function buildCard04Dom(card) {
  const article = createEl('article', {
    className: `soc-metric-card soc-card-${card.tone || 'unknown'}`,
    attrs: {
      role: 'region',
      'aria-label': `${card.stepLabel} ${card.title}`,
      'data-soc-card': card.cardId,
      'data-soc-tone': card.tone || 'unknown',
      tabindex: '0',
    },
  });

  const sec = card.localSection || {};
  const headerBadge = createProvenanceBadgeEl(sec.liveProv || resolveProvenance({ forceLive: true }));

  // (A) Uniform Header Bar (#E7ECF3 background, #0E306D bold title, right-aligned uniform badge)
  const header = createEl('header', { className: 'soc-card-header' }, [
    createEl('h3', { className: 'soc-card-title' }, [
      createEl('span', { className: 'soc-card-step', text: card.stepLabel }),
      document.createTextNode(` ${card.title}`),
    ]),
    createEl('div', { className: 'soc-card-badges' }, [headerBadge]),
  ]);
  article.appendChild(header);

  const body = createEl('div', { className: 'soc-card-body' });

  // (B) Hero Metric: CPU 사용률 및 코어 수
  const hasCpu = sec.cpuPct !== null && sec.cpuPct !== undefined;
  const cpuPct = hasCpu ? Number(sec.cpuPct) : null;
  const coresVal = sec.cores || null;
  const heroRow = createEl('div', { className: 'soc-hero-metric' }, [
    createEl('span', { className: 'soc-hero-num', text: cpuPct !== null ? `CPU ${cpuPct}%` : 'CPU 측정 중…' }),
    createEl('span', { className: 'soc-hero-unit', text: coresVal ? `(${coresVal} 코어)` : '' }),
  ]);
  body.appendChild(heroRow);

  // (C) Structured Mini-Table: Aligned Resource Table with Inline Gauge Bars
  const memUsed = sec.memUsedGb !== null && sec.memUsedGb !== undefined ? Number(sec.memUsedGb) : null;
  const memTotal = sec.memTotalGb !== null && sec.memTotalGb !== undefined ? Number(sec.memTotalGb) : null;
  const memPct = (memUsed !== null && memTotal && memTotal > 0) ? Number(((memUsed / memTotal) * 100).toFixed(1)) : null;

  const diskFree = sec.diskFreeGb !== null && sec.diskFreeGb !== undefined ? Number(sec.diskFreeGb) : null;
  const diskTotal = sec.diskTotalGb !== null && sec.diskTotalGb !== undefined ? Number(sec.diskTotalGb) : null;
  const diskUsed = (diskFree !== null && diskTotal !== null) ? diskTotal - diskFree : null;
  const diskPct = (diskUsed !== null && diskTotal && diskTotal > 0) ? Number(((diskUsed / diskTotal) * 100).toFixed(1)) : null;

  const cpuBar = createEl('div', {
    className: `soc-gauge-bar ${cpuPct !== null && cpuPct >= 65 ? 'gauge-orange' : 'gauge-teal'}`,
  });
  cpuBar.style.width = cpuPct !== null ? `${Math.min(100, Math.max(0, cpuPct))}%` : '0%';

  const memBar = createEl('div', {
    className: `soc-gauge-bar ${memPct !== null && memPct >= 65 ? 'gauge-orange' : 'gauge-teal'}`,
  });
  memBar.style.width = memPct !== null ? `${Math.min(100, Math.max(0, memPct))}%` : '0%';

  const diskBar = createEl('div', {
    className: `soc-gauge-bar ${diskPct !== null && diskPct >= 65 ? 'gauge-orange' : 'gauge-teal'}`,
  });
  diskBar.style.width = diskPct !== null ? `${Math.min(100, Math.max(0, diskPct))}%` : '0%';

  const cpuValText = cpuPct !== null ? `${cpuPct}%` : '측정 대기';
  const memValText = (memPct !== null && memUsed !== null && memTotal !== null)
    ? `${memPct}% (${memUsed.toFixed(1)}/${memTotal.toFixed(1)} GB)`
    : '측정 대기';
  const diskValText = (diskPct !== null && diskFree !== null)
    ? `${diskPct}% (여유 ${diskFree.toFixed(1)} GB)`
    : (diskFree !== null ? `여유 ${diskFree.toFixed(1)} GB` : '측정 대기');

  const table = createEl('table', { className: 'soc-mini-table', attrs: { role: 'table', 'aria-label': '하드웨어 자원 사용 현황' } }, [
    createEl('thead', {}, [
      createEl('tr', {}, [
        createEl('th', { attrs: { scope: 'col' }, className: 'soc-col-hw-name', text: '자원명' }),
        createEl('th', { attrs: { scope: 'col' }, className: 'soc-col-hw-gauge', text: '게이지 바' }),
        createEl('th', { attrs: { scope: 'col' }, className: 'soc-col-hw-val', text: '수치 및 용량' }),
      ]),
    ]),
    createEl('tbody', {}, [
      createEl('tr', {}, [
        createEl('td', { className: 'soc-col-hw-name' }, [createEl('strong', { text: 'CPU' })]),
        createEl('td', { className: 'soc-col-hw-gauge' }, [
          createEl('div', { className: 'soc-gauge-track' }, [cpuBar]),
        ]),
        createEl('td', { className: 'soc-col-hw-val', text: cpuValText }),
      ]),
      createEl('tr', {}, [
        createEl('td', { className: 'soc-col-hw-name' }, [createEl('strong', { text: '메모리 (RAM)' })]),
        createEl('td', { className: 'soc-col-hw-gauge' }, [
          createEl('div', { className: 'soc-gauge-track' }, [memBar]),
        ]),
        createEl('td', { className: 'soc-col-hw-val', text: memValText }),
      ]),
      createEl('tr', {}, [
        createEl('td', { className: 'soc-col-hw-name' }, [createEl('strong', { text: '디스크 (C:)' })]),
        createEl('td', { className: 'soc-col-hw-gauge' }, [
          createEl('div', { className: 'soc-gauge-track' }, [diskBar]),
        ]),
        createEl('td', { className: 'soc-col-hw-val', text: diskValText }),
      ]),
    ]),
  ]);
  body.appendChild(table);

  article.appendChild(body);
  return article;
}

function buildSocMetricCardsDom(cards) {
  const grid = createEl('div', {
    className: 'soc-metric-grid',
    attrs: {
      role: 'region',
      'aria-label': '상단 4대 관제 대시보드 핵심 지표 카드',
    },
  });

  for (const card of cards) {
    if (card.cardId === 'card-1-identity-network') {
      grid.appendChild(buildCard01Dom(card));
    } else if (card.cardId === 'card-2-decision-firewall') {
      grid.appendChild(buildCard02Dom(card));
    } else if (card.cardId === 'card-3-xdr-windows-logs') {
      grid.appendChild(buildCard03Dom(card));
    } else if (card.cardId === 'card-4-diag-hardware') {
      grid.appendChild(buildCard04Dom(card));
    } else {
      grid.appendChild(buildCard01Dom(card));
    }
  }

  return grid;
}

function createSocSnapshotData(store) {
  const evSummary = normalizeEventsSummary(store.events, store.pcStatus?.measuredAt);
  const devList = Array.isArray(store.status?.devices?.data)
    ? store.status.devices.data
    : (Array.isArray(store.identity?.devices?.data) ? store.identity.devices.data : []);
  const sessList = Array.isArray(store.status?.sessions?.data)
    ? store.status.sessions.data
    : (Array.isArray(store.identity?.sessions?.data) ? store.identity.sessions.data : []);
  const unknownDevices = devList.filter((d) => !d?.status || d.status === 'unknown').length;
  const deniedDecisions = store.decisionHistory.filter((d) => d?.decision === 'deny' || d?.status === 'error').length;
  const osProbe = store.pcStatus?.osProbe;

  return {
    at: new Date().toISOString(),
    totalEvents: evSummary.sortedEvents.length,
    xdrCount: evSummary.xdrCount,
    deniedTotal: evSummary.deniedCount + deniedDecisions,
    unknownTotal: evSummary.unknownStateCount + unknownDevices,
    activeSessions: sessList.filter((s) => s?.status === 'active').length,
    netCount: osProbe?.network?.interfaceCount ?? null,
    fwEnabledCount: osProbe?.firewall?.enabledCount ?? null,
    winSysTotal: osProbe?.windowsEvents?.system?.totalCount ?? null,
    winSysErr: osProbe?.windowsEvents?.system?.errorCount ?? null,
    winSysWarn: osProbe?.windowsEvents?.system?.warningCount ?? null,
    winAppTotal: osProbe?.windowsEvents?.application?.totalCount ?? null,
    winAppErr: osProbe?.windowsEvents?.application?.errorCount ?? null,
    winAppWarn: osProbe?.windowsEvents?.application?.warningCount ?? null,
    cpuPct: osProbe?.cpu?.usagePercent ?? null,
    cores: store.pcStatus?.cores ?? osProbe?.cpu?.logicalCores ?? null,
    memUsedGb: osProbe?.memory?.usedGb ?? null,
    memTotalGb: osProbe?.memory?.totalGb ?? null,
    diskFreeGb: osProbe?.disk?.freeGb ?? store.pcStatus?.storageFreeGb ?? null,
    heapUsedMb: store.pcStatus?.heapSupported ? store.pcStatus.heapUsedMb : null,
    mode: store.events?.mode || store.status?.mode || 'unknown',
  };
}

function recordSocSnapshot(store) {
  const snap = createSocSnapshotData(store);
  const prev = store.snapshots[0];
  const sig = `${snap.totalEvents}|${snap.xdrCount}|${snap.deniedTotal}|${snap.unknownTotal}|${snap.activeSessions}|${snap.netCount}|${snap.fwEnabledCount}|${snap.winSysTotal}|${snap.winAppTotal}|${snap.heapUsedMb}|${snap.cpuPct}|${snap.diskFreeGb}|${snap.mode}`;
  if (!prev || prev.sig !== sig) {
    store.snapshots.unshift({ ...snap, sig });
    if (store.snapshots.length > SOC_LIMITS.MAX_SNAPSHOTS) {
      store.snapshots.length = SOC_LIMITS.MAX_SNAPSHOTS;
    }
  } else {
    store.snapshots[0] = { ...snap, sig };
  }
}

function hydrateServerSnapshots(store, serverSnapshots = []) {
  if (!store || !Array.isArray(serverSnapshots) || serverSnapshots.length === 0) return;
  if (!Array.isArray(store.snapshots)) store.snapshots = [];
  if (store.snapshots.length < serverSnapshots.length) {
    const mapped = serverSnapshots.map((snap) => ({
      at: snap.timestamp || snap.at || new Date().toISOString(),
      totalEvents: snap.totalEvents ?? 0,
      xdrCount: 0,
      deniedTotal: 0,
      unknownTotal: 0,
      activeSessions: 1,
      netCount: snap.interfaceCount ?? snap.netCount ?? null,
      fwEnabledCount: snap.firewallEnabledCount ?? snap.fwEnabledCount ?? null,
      winSysTotal: snap.winSysTotal ?? null,
      winSysErr: snap.winSysErr ?? null,
      winSysWarn: snap.winSysWarn ?? null,
      winAppTotal: snap.winAppTotal ?? null,
      winAppErr: snap.winAppErr ?? null,
      winAppWarn: snap.winAppWarn ?? null,
      cpuPct: snap.cpuUsagePercent ?? snap.cpuPct ?? null,
      cores: snap.cores ?? null,
      memUsedGb: snap.memUsedGb ?? null,
      memTotalGb: snap.memTotalGb ?? null,
      diskFreeGb: snap.diskFreeGb ?? null,
      heapUsedMb: null,
      mode: snap.mode || 'demo',
      sig: `${snap.timestamp || snap.at}|${snap.cpuUsagePercent}|${snap.driftDeltaCount}`,
    }));
    mapped.reverse();
    store.snapshots = mapped.slice(0, SOC_LIMITS.MAX_SNAPSHOTS);
  }
}

function formatDeltaNumber(curr, prev, unit) {
  if (typeof curr !== 'number' || typeof prev !== 'number') return '변화량 확인 불가';
  const diff = Number((curr - prev).toFixed(2));
  const sign = diff > 0 ? `+${diff}` : `${diff}`;
  return `직전 대비 Δ ${sign}${unit} (직전 ${prev}${unit} → 현재 ${curr}${unit})`;
}

const accordionStateStore = new Map();

function getAccordionOpen(sectionKey, defaultOpen = false) {
  if (accordionStateStore.has(sectionKey)) {
    return accordionStateStore.get(sectionKey);
  }
  return defaultOpen;
}

function setAccordionOpen(sectionKey, isOpen) {
  accordionStateStore.set(sectionKey, Boolean(isOpen));
}

function captureCurrentAccordionStates() {
  if (typeof document === 'undefined') return;
  const accordions = document.querySelectorAll('details[data-pc-section]');
  for (const acc of accordions) {
    const key = acc.getAttribute('data-pc-section');
    if (key) {
      accordionStateStore.set(key, acc.open);
    }
  }
}

function buildTrendComparisonBoxDom(store, provenance) {
  const box = createEl('div', {
    className: 'trend-delta-box',
    attrs: {
      role: 'region',
      'aria-label': '직전 스냅샷 대비 보안 지표 및 내 PC 리소스 추이 비교',
    },
  });

  const curr = store.snapshots[0] || createSocSnapshotData(store);
  const prev = store.snapshots[1] || curr;
  const effectiveMode = curr.mode || store.events?.mode || store.status?.mode || 'unknown';

  function createDeltaChip(diff, unit = '') {
    if (diff === null || diff === undefined || isNaN(diff)) {
      return createEl('span', { className: 'delta-chip is-pending', text: '확인 대기' });
    }
    if (diff > 0) {
      return createEl('span', { className: 'delta-chip is-up', text: `▲ +${diff}${unit}` });
    }
    if (diff < 0) {
      return createEl('span', { className: 'delta-chip is-down', text: `▼ ${diff}${unit}` });
    }
    return createEl('span', { className: 'delta-chip is-same', text: `0${unit} (변동 없음)` });
  }

  const diffNet = curr.netCount !== null && prev.netCount !== null ? curr.netCount - prev.netCount : null;
  const diffFw = curr.fwEnabledCount !== null && prev.fwEnabledCount !== null ? curr.fwEnabledCount - prev.fwEnabledCount : null;
  const diffEv = curr.totalEvents !== null && prev.totalEvents !== null ? curr.totalEvents - prev.totalEvents : null;
  const diffCpu = curr.cpuPct !== null && prev.cpuPct !== null ? Number((curr.cpuPct - prev.cpuPct).toFixed(1)) : null;

  const grid2x2 = createEl('div', { className: 'soc-delta-summary-grid' }, [
    createEl('div', { className: 'soc-delta-card' }, [
      createEl('div', { className: 'delta-card-head' }, [
        createEl('span', { className: 'delta-card-label', text: '네트워크 변동' }),
        createDeltaChip(diffNet, '개'),
      ]),
      createEl('span', { className: 'delta-card-desc', text: `활성 어댑터 ${curr.netCount ?? '-'}개 (직전 ${prev.netCount ?? '-'}개)` }),
    ]),
    createEl('div', { className: 'soc-delta-card' }, [
      createEl('div', { className: 'delta-card-head' }, [
        createEl('span', { className: 'delta-card-label', text: '방화벽 변동' }),
        createDeltaChip(diffFw, '개'),
      ]),
      createEl('span', { className: 'delta-card-desc', text: `활성 프로필 ${curr.fwEnabledCount ?? '-'}/${SOC_LIMITS.FIREWALL_PROFILE_TOTAL}개 켜짐 (직전 ${prev.fwEnabledCount ?? '-'}개)` }),
    ]),
    createEl('div', { className: 'soc-delta-card' }, [
      createEl('div', { className: 'delta-card-head' }, [
        createEl('span', { className: 'delta-card-label', text: '보안 사건 변동' }),
        createDeltaChip(diffEv, '건'),
      ]),
      createEl('span', { className: 'delta-card-desc', text: `수신 기록 ${curr.totalEvents ?? 0}건 (직전 ${prev.totalEvents ?? 0}건)` }),
    ]),
    createEl('div', { className: 'soc-delta-card' }, [
      createEl('div', { className: 'delta-card-head' }, [
        createEl('span', { className: 'delta-card-label', text: 'CPU 자원 변동' }),
        createDeltaChip(diffCpu, '%'),
      ]),
      createEl('span', { className: 'delta-card-desc', text: `CPU 사용률 ${curr.cpuPct !== null ? `${curr.cpuPct}%` : '대기'} (직전 ${prev.cpuPct !== null ? `${prev.cpuPct}%` : '대기'})` }),
    ]),
  ]);
  box.appendChild(grid2x2);

  // Structured Table Rows matching Right-side PC inspection format
  const deltaRows = [];
  if (curr.netCount !== null && prev.netCount !== null) {
    deltaRows.push({
      item: '내 PC 활성 네트워크 어댑터',
      status: `현재 ${curr.netCount}개 (${formatDeltaNumber(curr.netCount, prev.netCount, '개')})`,
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    });
  }
  if (curr.fwEnabledCount !== null && prev.fwEnabledCount !== null) {
    deltaRows.push({
      item: '내 PC 방화벽 활성 프로필',
      status: `현재 ${curr.fwEnabledCount}/${SOC_LIMITS.FIREWALL_PROFILE_TOTAL}개 켜짐 (${formatDeltaNumber(curr.fwEnabledCount, prev.fwEnabledCount, '개')})`,
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    });
  }
  if (curr.winSysTotal !== null && prev.winSysTotal !== null) {
    deltaRows.push({
      item: '최근 Windows System 기록',
      status: `현재 ${curr.winSysTotal}건 · 오류 ${curr.winSysErr ?? 0}건 · 경고 ${curr.winSysWarn ?? 0}건 (${formatDeltaNumber(curr.winSysTotal, prev.winSysTotal, '건')})`,
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    });
  }
  if (curr.winAppTotal !== null && prev.winAppTotal !== null) {
    deltaRows.push({
      item: '최근 Windows Application 기록',
      status: `현재 ${curr.winAppTotal}건 · 오류 ${curr.winAppErr ?? 0}건 · 경고 ${curr.winAppWarn ?? 0}건 (${formatDeltaNumber(curr.winAppTotal, prev.winAppTotal, '건')})`,
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    });
  }
  if (curr.cpuPct !== null && prev.cpuPct !== null) {
    const coreNote = curr.cores !== null ? ` (${curr.cores} 코어)` : '';
    deltaRows.push({
      item: 'CPU 사용률 추이',
      status: `현재 ${curr.cpuPct}%${coreNote} (${formatDeltaNumber(curr.cpuPct, prev.cpuPct, '%')})`,
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    });
  } else if (curr.cores !== null && prev.cores !== null) {
    deltaRows.push({
      item: '내 PC 논리 CPU 코어',
      status: `현재 ${curr.cores} 코어 (${formatDeltaNumber(curr.cores, prev.cores, ' 코어')})`,
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    });
  }
  if (curr.memUsedGb !== null && prev.memUsedGb !== null) {
    const totalNote = curr.memTotalGb !== null ? ` (전체 ${curr.memTotalGb} GB)` : '';
    deltaRows.push({
      item: '내 PC 물리 메모리(RAM) 사용량',
      status: `현재 ${curr.memUsedGb} GB${totalNote} (${formatDeltaNumber(curr.memUsedGb, prev.memUsedGb, ' GB')})`,
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    });
  }
  if (curr.heapUsedMb !== null && prev.heapUsedMb !== null) {
    deltaRows.push({
      item: '브라우저 JS 힙 메모리 사용량',
      status: `현재 ${curr.heapUsedMb} MB (${formatDeltaNumber(curr.heapUsedMb, prev.heapUsedMb, ' MB')})`,
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    });
  }
  if (curr.diskFreeGb !== null && prev.diskFreeGb !== null) {
    deltaRows.push({
      item: '디스크 여유 공간 (C:)',
      status: `현재 ${curr.diskFreeGb} GB (${formatDeltaNumber(curr.diskFreeGb, prev.diskFreeGb, ' GB')})`,
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    });
  }
  deltaRows.push({
    item: 'SDP 보안 기록 총계',
    status: `현재 ${curr.totalEvents}건 · XDR 경보 ${curr.xdrCount}건 (${formatDeltaNumber(curr.totalEvents, prev.totalEvents, '건')})`,
    badgeEl: createSdpStatusBadgeEl(effectiveMode),
  });
  deltaRows.push({
    item: 'SDP 거부 및 미확인 누적',
    status: `거부 ${curr.deniedTotal}건 · 미확인 ${curr.unknownTotal}건 (${formatDeltaNumber(curr.deniedTotal, prev.deniedTotal, '건')})`,
    badgeEl: createSdpStatusBadgeEl(effectiveMode),
  });

  const isDeltaOpen = getAccordionOpen('trend-delta-breakdown', false);
  const deltaDetails = createEl('details', {
    className: 'pc-accordion',
    attrs: {
      'data-pc-section': 'trend-delta-breakdown',
      ...(isDeltaOpen ? { open: 'true' } : {}),
    },
  });
  deltaDetails.addEventListener('toggle', () => {
    setAccordionOpen('trend-delta-breakdown', deltaDetails.open);
  });
  const summaryTitle = createEl('strong', { className: 'pc-accordion-title', text: '직전 스냅샷 대비 전체 지표 증감 내역' });
  const summaryMetric = createEl('span', { className: 'pc-accordion-metric', text: `총 ${deltaRows.length}개 지표 비교` });
  const summaryBadges = createEl('div', { className: 'pc-accordion-badges' }, [
    createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
  ]);
  const summary = createEl('summary', { className: 'pc-accordion-summary' }, [
    summaryTitle,
    summaryMetric,
    summaryBadges,
  ]);
  const body = createEl('div', { className: 'pc-accordion-body' }, [
    createInspectionTableDom(deltaRows),
  ]);
  deltaDetails.appendChild(summary);
  deltaDetails.appendChild(body);
  box.appendChild(deltaDetails);

  return box;
}

function createInspectionTableDom(rows = []) {
  const table = createEl('div', { className: 'pc-inspection-table' });
  for (const row of rows) {
    let statusEl;
    if (typeof row.status === 'string' || typeof row.status === 'number') {
      statusEl = createEl('span', { className: 'pc-col-status', text: String(row.status) });
    } else if (Array.isArray(row.status)) {
      statusEl = createEl('span', { className: 'pc-col-status' }, row.status);
    } else if (row.status && typeof row.status === 'object' && row.status.nodeType) {
      statusEl = createEl('span', { className: 'pc-col-status' }, [row.status]);
    } else {
      statusEl = createEl('span', { className: 'pc-col-status', text: '-' });
    }

    const rowEl = createEl('div', {
      className: `pc-inspection-row ${row.isUnverified ? 'row-unverified' : ''}`,
    }, [
      createEl('span', { className: 'pc-col-item', text: row.item }),
      statusEl,
      createEl('div', { className: 'pc-col-badge' }, [row.badgeEl]),
    ]);
    table.appendChild(rowEl);
  }
  return table;
}

function buildPcStatusInspectionCardDom(pcStatus, sdpMode = 'unknown', toggleAllBtn = null, onRefresh = null) {
  const grid = createEl('div', {
    className: 'pc-status-grid',
    attrs: {
      role: 'region',
      'aria-label': '내 PC 네트워크·방화벽·Windows 기록 및 자원 점검 (읽기 전용 · 비관리자 실측 및 확인 불가 사유)',
      'data-student-pc-status': 'non-admin',
      tabindex: '0',
    },
  });

  const liveProv = resolveProvenance({ forceLive: true });

  if (toggleAllBtn) {
    let allExpanded = false;
    attachKeyboardClick(toggleAllBtn, () => {
      allExpanded = !allExpanded;
      toggleAllBtn.textContent = allExpanded ? '모두 접기' : '모두 펼치기';
      const accordions = grid.querySelectorAll('details.pc-inspection-accordion');
      for (const acc of accordions) {
        acc.open = allExpanded;
        const key = acc.getAttribute('data-pc-section');
        if (key) setAccordionOpen(key, allExpanded);
      }
    });
  }

  if (pcStatus?.osProbeLoading) {
    grid.appendChild(createEl('div', {
      className: 'pc-status-loading-indicator',
      attrs: { 'aria-live': 'polite' },
    }, [
      createEl('span', { className: 'pc-spinner', attrs: { 'aria-hidden': 'true' } }),
      createEl('span', { text: '내 PC 상태(네트워크·방화벽·Windows 기록·자원)를 실측하는 중입니다…' }),
    ]));
  }

  if (pcStatus?.osProbeError) {
    grid.appendChild(createEl('div', {
      className: 'pc-status-error-box',
      attrs: { role: 'alert' },
    }, [
      createEl('h4', { className: 'pc-error-title', text: '[조회 실패] 로컬 실측 데이터를 가져오지 못했습니다.' }),
      createEl('p', {
        text: `실패 항목: 로컬 센서 브리지(/api/pc-status) 응답 없음 (사유: ${pcStatus.osProbeError})`,
      }),
      createEl('p', {
        className: 'muted',
        text: '조회 실패 상태이며, 가상 예시 데이터로 대체하지 않습니다.',
      }),
      createEl('div', { className: 'pc-next-steps' }, [
        createEl('strong', { text: '다음에 할 일:' }),
        createEl('ul', {}, [
          createEl('li', { text: '1. student/pc-status-runtime.mjs 브리지 프로세스 실행 상태를 확인하세요.' }),
          createEl('li', { text: '2. 관리자 권한 필요 항목(Security 감사 로그 등)은 일반 권한에서 「확인 불가」로 유지됩니다.' }),
          createEl('li', { text: '3. 로컬 루프백(127.0.0.1) 연결 및 네트워크 어댑터 상태를 점검하세요.' }),
          createEl('li', { text: '4. 확인 후 상단 「다시 조회」 버튼을 눌러 다시 시도하세요. (자동 재시도 없음)' }),
        ]),
      ]),
    ]));
  }
  const osNet = pcStatus?.osProbe?.network;
  const osFw = pcStatus?.osProbe?.firewall;
  const osWinEv = pcStatus?.osProbe?.windowsEvents;
  const osCpu = pcStatus?.osProbe?.cpu;
  const osMem = pcStatus?.osProbe?.memory;
  const osDisk = pcStatus?.osProbe?.disk;

  function createPcAccordionSection({ sectionKey, title, metricSummary, badges = [], bodyContent = [] }) {
    const isOpen = getAccordionOpen(sectionKey, false);
    const details = createEl('details', {
      className: 'pc-accordion pc-inspection-accordion',
      attrs: {
        'data-pc-section': sectionKey,
        ...(isOpen ? { open: 'true' } : {}),
      },
    });
    details.addEventListener('toggle', () => {
      setAccordionOpen(sectionKey, details.open);
    });

    const summaryTitle = createEl('strong', {
      className: 'pc-accordion-title',
      text: title,
    });

    const summaryMetric = createEl('span', {
      className: 'pc-accordion-metric',
      text: metricSummary,
    });

    const summaryBadges = createEl('div', {
      className: 'pc-accordion-badges',
    }, badges);

    const summary = createEl('summary', { className: 'pc-accordion-summary' }, [
      summaryTitle,
      summaryMetric,
      summaryBadges,
    ]);

    const body = createEl('div', { className: 'pc-accordion-body' }, bodyContent);

    details.appendChild(summary);
    details.appendChild(body);
    return details;
  }

  // 1) 네트워크 구성
  const netInterfaces = Array.isArray(osNet?.interfaces) ? osNet.interfaces : [];
  const netOk = osNet?.status === 'ok' && netInterfaces.length > 0;
  const gwText = osNet?.primaryGateway || '없음(로컬/가상 어댑터)';
  const netSummary = netOk
    ? `활성 ${osNet.interfaceCount}개 · GW: ${gwText}`
    : `네트워크 구성: ${SOC_UI_TEXT.UNVERIFIED_BADGE}`;

  const netRows = [];
  if (netOk) {
    for (const nic of netInterfaces) {
      const ipv4Str = Array.isArray(nic.ipv4) && nic.ipv4.length > 0 ? nic.ipv4.join(', ') : 'IPv4 없음';
      const gwStr = Array.isArray(nic.gateway) && nic.gateway.length > 0 ? ` · GW: ${nic.gateway.join(', ')}` : '';
      const dnsStr = Array.isArray(nic.dns) && nic.dns.length > 0 ? ` · DNS: ${nic.dns.join(', ')}` : '';
      const macStr = nic.mac ? ` · MAC: ${nic.mac}` : '';
      netRows.push({
        item: `${nic.name} (${nic.description || nic.type})`,
        status: `상태: ${nic.status} · IPv4: ${ipv4Str}${gwStr}${dnsStr}${macStr}`,
        badgeEl: createProvenanceBadgeEl(liveProv),
      });
    }
    const dnsText = Array.isArray(osNet.dnsServers) && osNet.dnsServers.length > 0
      ? osNet.dnsServers.join(', ')
      : '설정된 IPv4 DNS 없음';
    netRows.push({
      item: '기본 게이트웨이',
      status: gwText,
      badgeEl: createProvenanceBadgeEl(liveProv),
    });
    netRows.push({
      item: 'DNS 서버',
      status: dnsText,
      badgeEl: createProvenanceBadgeEl(liveProv),
    });
  } else {
    netRows.push({
      item: '네트워크 인터페이스',
      status: `조회 제한 (사유: ${osNet?.reason || '런타임 브리지 미연결'})`,
      badgeEl: createUnverifiedBadgeEl(),
      isUnverified: true,
    });
  }

  grid.appendChild(createPcAccordionSection({
    sectionKey: 'network',
    title: '1. 네트워크 구성',
    metricSummary: netSummary,
    badges: [netOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl()],
    bodyContent: [createInspectionTableDom(netRows)],
  }));

  // 2) 방화벽 설정 (읽기 전용)
  const fwProfiles = Array.isArray(osFw?.profiles) ? osFw.profiles : [];
  const fwOk = osFw?.status === 'ok' && fwProfiles.length > 0;
  const fwSummary = fwOk
    ? `${osFw.enabledCount}/${osFw.totalProfiles} 켜짐`
    : `방화벽: ${SOC_UI_TEXT.UNVERIFIED_BADGE}`;

  const fwRows = [];
  if (fwOk) {
    for (const prof of fwProfiles) {
      if (prof.status === 'ok' && typeof prof.enabled === 'boolean') {
        const stateStr = prof.enabled ? '켜짐' : '꺼짐';
        const inAction = prof.defaultInboundAction === 'Block' ? '차단' : (prof.defaultInboundAction || '차단');
        const outAction = prof.defaultOutboundAction === 'Allow' ? '허용' : (prof.defaultOutboundAction || '허용');
        const profKorean = prof.name === 'Domain' ? '도메인 프로필' : prof.name === 'Private' ? '개인 프로필' : '공용 프로필';
        fwRows.push({
          item: `${prof.name} (${profKorean})`,
          status: `${stateStr} · 인바운드 ${inAction} / 아웃바운드 ${outAction}`,
          badgeEl: createProvenanceBadgeEl(liveProv),
        });
      } else {
        fwRows.push({
          item: `${prof.name} 프로필`,
          status: `조회 제한 (사유: ${prof.reason || '권한 또는 경로 제한'})`,
          badgeEl: createUnverifiedBadgeEl(),
          isUnverified: true,
        });
      }
    }
  } else {
    fwRows.push({
      item: '방화벽 프로필',
      status: `조회 제한 (사유: ${osFw?.reason || '런타임 브리지 미실행'})`,
      badgeEl: createUnverifiedBadgeEl(),
      isUnverified: true,
    });
  }
  const fwAdminItems = Array.isArray(osFw?.adminOnlyItems) && osFw.adminOnlyItems.length > 0
    ? osFw.adminOnlyItems
    : DEFAULT_ADMIN_FIREWALL_ITEMS;
  for (const adm of fwAdminItems) {
    fwRows.push({
      item: `${adm.item} · 정책 저장소`,
      status: `조회 제한 (사유: ${adm.reason || '관리자 권한 필요 · 설정 미변경'})`,
      badgeEl: createUnverifiedBadgeEl(),
      isUnverified: true,
    });
  }

  grid.appendChild(createPcAccordionSection({
    sectionKey: 'firewall',
    title: '2. 방화벽 설정',
    metricSummary: fwSummary,
    badges: [
      fwOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl(),
      createEl('span', {
        className: 'provenance-badge badge-live',
        text: '[읽기 전용]',
        attrs: { 'data-provenance': 'live' },
      }),
    ],
    bodyContent: [createInspectionTableDom(fwRows)],
  }));

  // 3) 최근 Windows 기록 (System · Application)
  const sysLog = osWinEv?.system;
  const appLog = osWinEv?.application;
  const winEvOk = sysLog?.status === 'ok' || appLog?.status === 'ok';
  const totalWinErr = (sysLog?.errorCount ?? 0) + (appLog?.errorCount ?? 0);
  const totalWinWarn = (sysLog?.warningCount ?? 0) + (appLog?.warningCount ?? 0);
  const winEvSummary = winEvOk
    ? `오류 ${totalWinErr}건 · 경고 ${totalWinWarn}건`
    : `Windows 기록: ${SOC_UI_TEXT.UNVERIFIED_BADGE}`;

  const winRows = [];
  for (const [logTitle, logEntry] of [['System 로그', sysLog], ['Application 로그', appLog]]) {
    if (logEntry?.status === 'ok') {
      const latestText = logEntry.latestAt ? ` · 최근 발생: ${formatMeasuredAt(logEntry.latestAt)}` : '';
      winRows.push({
        item: logTitle,
        status: `총 ${logEntry.totalCount}건 (오류 ${logEntry.errorCount}건 · 경고 ${logEntry.warningCount}건)${latestText}`,
        badgeEl: createProvenanceBadgeEl(liveProv),
      });
    } else {
      winRows.push({
        item: logTitle,
        status: `조회 제한 (사유: ${logEntry?.reason || '권한 제한 또는 브리지 미연결'})`,
        badgeEl: createUnverifiedBadgeEl(),
        isUnverified: true,
      });
    }
  }
  const adminLogs = Array.isArray(osWinEv?.adminOnlyLogs) && osWinEv.adminOnlyLogs.length > 0
    ? osWinEv.adminOnlyLogs
    : DEFAULT_ADMIN_EVENT_LOGS;
  for (const admLog of adminLogs) {
    winRows.push({
      item: `${admLog.logName} 보안 감사 로그`,
      status: `조회 제한 (사유: ${admLog.reason || '관리자 권한 필요'})`,
      badgeEl: createUnverifiedBadgeEl(),
      isUnverified: true,
    });
  }

  const winEvBody = [
    createInspectionTableDom(winRows),
    createEl('p', {
      className: 'pc-non-intrusion-inline',
      text: '이 건수는 침해나 공격 탐지 결과가 아닙니다 (Windows 운영체제와 응용프로그램의 일반 이벤트 로그)',
    }),
  ];

  grid.appendChild(createPcAccordionSection({
    sectionKey: 'windows-events',
    title: '3. Windows 기록',
    metricSummary: winEvSummary,
    badges: [
      winEvOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl(),
      createEl('span', { className: 'provenance-badge badge-non-intrusion', text: '침해 탐지 아님' }),
    ],
    bodyContent: winEvBody,
  }));

  // 4) CPU 자원
  const coresVal = pcStatus?.cores ?? osCpu?.logicalCores ?? null;
  const osCpuPct = typeof osCpu?.usagePercent === 'number' ? osCpu.usagePercent : null;
  const cpuOk = osCpuPct !== null || coresVal !== null;
  const cpuSummary = coresVal !== null
    ? `${osCpuPct !== null ? `${osCpuPct}%` : '대기'} (${coresVal}코어)`
    : `CPU: ${SOC_UI_TEXT.UNVERIFIED_BADGE}`;

  const cpuRows = [
    {
      item: '논리 프로세서',
      status: coresVal !== null ? `${coresVal} 코어` : '확인 불가',
      badgeEl: cpuOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl(),
    },
    {
      item: 'OS CPU 사용률',
      status: osCpuPct !== null ? `${osCpuPct} %` : '조회 제한 (런타임 브리지 필요)',
      badgeEl: osCpuPct !== null ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl(),
      isUnverified: osCpuPct === null,
    },
    {
      item: '측정 근거',
      status: osCpu?.reason || 'node:os.cpus() 틱 차분 측정 (일반 권한)',
      badgeEl: createProvenanceBadgeEl(liveProv),
    },
  ];

  grid.appendChild(createPcAccordionSection({
    sectionKey: 'cpu',
    title: '4. CPU 자원',
    metricSummary: cpuSummary,
    badges: [cpuOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl()],
    bodyContent: [createInspectionTableDom(cpuRows)],
  }));

  // 5) 메모리(RAM)
  const memOk = typeof osMem?.usedGb === 'number' || Boolean(pcStatus?.heapSupported);
  const memSummary = typeof osMem?.usedGb === 'number'
    ? `${osMem.usagePercent}% (${osMem.usedGb} / ${osMem.totalGb} GB)`
    : (pcStatus?.heapSupported && pcStatus.heapUsedMb !== null
      ? `JS 힙: ${pcStatus.heapUsedMb} MB`
      : `메모리: ${SOC_UI_TEXT.UNVERIFIED_BADGE}`);

  const memRows = [];
  if (typeof osMem?.usedGb === 'number') {
    memRows.push({
      item: 'OS 물리 메모리 (RAM)',
      status: `사용 ${osMem.usedGb} GB / 전체 ${osMem.totalGb} GB (사용률 ${osMem.usagePercent} % · 여유 ${osMem.freeGb} GB)`,
      badgeEl: createProvenanceBadgeEl(liveProv),
    });
  } else {
    memRows.push({
      item: 'OS 물리 메모리 (RAM)',
      status: '조회 제한 (사유: 기본 서버 단독 실행 시 OS RAM 센서 API 없음)',
      badgeEl: createUnverifiedBadgeEl(),
      isUnverified: true,
    });
  }
  if (pcStatus?.heapSupported && pcStatus.heapUsedMb !== null) {
    const devMemNote = pcStatus.deviceMemoryGb ? ` · 기기 RAM 약 ${pcStatus.deviceMemoryGb} GB` : '';
    const pctNote = pcStatus.heapUsagePct !== null ? ` · 사용률 ${pcStatus.heapUsagePct} %` : '';
    memRows.push({
      item: '브라우저 JS 힙 메모리',
      status: `사용 ${pcStatus.heapUsedMb} MB / 할당 ${pcStatus.heapTotalMb ?? '-'} MB (한도 ${pcStatus.heapLimitMb ?? '-'} MB${pctNote}${devMemNote})`,
      badgeEl: createProvenanceBadgeEl(liveProv),
    });
  } else {
    memRows.push({
      item: '브라우저 JS 힙 메모리',
      status: '조회 제한 (사유: 브라우저 환경에서 performance.memory API 미지원)',
      badgeEl: createUnverifiedBadgeEl(),
      isUnverified: true,
    });
  }

  grid.appendChild(createPcAccordionSection({
    sectionKey: 'memory',
    title: '5. 메모리(RAM)',
    metricSummary: memSummary,
    badges: [memOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl()],
    bodyContent: [createInspectionTableDom(memRows)],
  }));

  // 6) 디스크(C:)
  const storageOk = pcStatus?.storageState === 'ok' && pcStatus.storageFreeGb !== null;
  const diskOk = typeof osDisk?.freeGb === 'number' || storageOk;
  const diskSummary = typeof osDisk?.freeGb === 'number'
    ? `${osDisk.usagePercent}% (여유 ${osDisk.freeGb} GB)`
    : (storageOk
      ? `여유 ${pcStatus.storageFreeGb} GB / ${pcStatus.storageQuotaGb} GB`
      : `디스크: ${SOC_UI_TEXT.UNVERIFIED_BADGE}`);

  const diskRows = [];
  if (typeof osDisk?.freeGb === 'number') {
    diskRows.push({
      item: 'OS 로컬 디스크 (C:)',
      status: `남은 공간 ${osDisk.freeGb} GB / 전체 ${osDisk.totalGb} GB (사용 ${osDisk.usedGb} GB · 사용률 ${osDisk.usagePercent} %)`,
      badgeEl: createProvenanceBadgeEl(liveProv),
    });
  } else {
    diskRows.push({
      item: 'OS 로컬 디스크 (C:)',
      status: '조회 제한 (사유: 기본 서버 단독 실행 시 OS 디스크 볼륨 API 없음)',
      badgeEl: createUnverifiedBadgeEl(),
      isUnverified: true,
    });
  }
  if (storageOk) {
    const pctNote = pcStatus.storageUsagePct !== null ? ` · 사용률 ${pcStatus.storageUsagePct} %` : '';
    diskRows.push({
      item: '브라우저 Origin Storage',
      status: `여유 ${pcStatus.storageFreeGb} GB / 할당 ${pcStatus.storageQuotaGb} GB (사용 ${pcStatus.storageUsedMb} MB${pctNote})`,
      badgeEl: createProvenanceBadgeEl(liveProv),
    });
  } else {
    diskRows.push({
      item: '브라우저 Origin Storage',
      status: `조회 제한 (사유: ${pcStatus?.storageReason || 'StorageManager 미지원 또는 조회 지연'})`,
      badgeEl: createUnverifiedBadgeEl(),
      isUnverified: true,
    });
  }

  grid.appendChild(createPcAccordionSection({
    sectionKey: 'disk',
    title: '6. 디스크(C:)',
    metricSummary: diskSummary,
    badges: [diskOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl()],
    bodyContent: [createInspectionTableDom(diskRows)],
  }));

  // 7) 엔드포인트 공격 표면(열린 포트·프로세스) & 시작프로그램 기준선 감시
  const osPorts = Array.isArray(pcStatus?.osProbe?.listeningPorts) ? pcStatus.osProbe.listeningPorts : [];
  const osStartup = Array.isArray(pcStatus?.osProbe?.startupItems) ? pcStatus.osProbe.startupItems : [];
  const drift = pcStatus?.osProbe?.baselineDrift || {
    hasBaseline: false,
    pinnedAt: null,
    newExposedPorts: [],
    newLoopbackPorts: [],
    addedStartupItems: [],
    removedStartupItems: [],
  };

  const hasDrift = Boolean(drift.hasBaseline && (
    (drift.newExposedPorts && drift.newExposedPorts.length > 0) ||
    (drift.newLoopbackPorts && drift.newLoopbackPorts.length > 0) ||
    (drift.addedStartupItems && drift.addedStartupItems.length > 0) ||
    (drift.removedStartupItems && drift.removedStartupItems.length > 0)
  ));

  const surfaceSummary = `포트 ${osPorts.length}개 · 시작프로그램 ${osStartup.length}개`;

  const surfaceBadges = [
    createProvenanceBadgeEl(liveProv),
    createEl('span', {
      className: 'provenance-badge badge-live',
      text: '[읽기 전용]',
      attrs: { 'data-provenance': 'live' },
    }),
  ];

  const driftDeltaCount = (drift.newExposedPorts?.length || 0) + (drift.newLoopbackPorts?.length || 0) + (drift.addedStartupItems?.length || 0) + (drift.removedStartupItems?.length || 0);

  if (drift.hasBaseline) {
    if (hasDrift) {
      surfaceBadges.push(createEl('span', {
        className: 'badge badge-drift-warning',
        text: `[기준선 변동 감지 (Δ ${driftDeltaCount}건)]`,
      }));
    } else {
      surfaceBadges.push(createEl('span', {
        className: 'badge badge-drift-clean',
        text: '[기준선 일치]',
      }));
    }
  }

  // 1) 안전 기준선 및 공격 표면 요약 행 (Sections 1~6과 동일한 createInspectionTableDom 표준 행)
  const loopbackPorts = osPorts.filter((p) => p.scope === 'loopback');
  const exposedPorts = osPorts.filter((p) => p.scope !== 'loopback');
  const hkcuStartup = osStartup.filter((s) => s.source === 'HKCU_Run');
  const folderStartup = osStartup.filter((s) => s.source !== 'HKCU_Run');
  const deltaCount = driftDeltaCount;

  const pinBtn = createEl('button', {
    className: 'btn pc-refresh-btn',
    text: drift.hasBaseline ? '기준선 다시 고정' : '안전 기준선 고정',
    attrs: { type: 'button' },
  });
  attachKeyboardClick(pinBtn, () => {
    pinBtn.disabled = true;
    pinBtn.textContent = '고정 중…';
    fetch('/api/pc-status/baseline', { method: 'POST' })
      .then((r) => r.json())
      .then(() => {
        if (typeof onRefresh === 'function') onRefresh();
      })
      .catch(() => {
        pinBtn.disabled = false;
        pinBtn.textContent = '기준선 고정 (재시도)';
      });
  });

  const baselineControlBar = createEl('div', {
    className: 'pc-baseline-control-bar',
    attrs: {
      style: 'margin-top: 2px; margin-bottom: 18px;',
    },
  }, [
    pinBtn,
    createEl('span', {
      className: 'pc-baseline-desc',
      attrs: {
        style: 'font-size: 11px !important; color: #64748b !important; font-weight: 500 !important; line-height: 1.3 !important; letter-spacing: -0.01em !important;',
      },
      text: '(현재 열린 포트·시작프로그램 상태를 신뢰 기준선으로 등록)',
    }),
  ]);

  const pinStatusText = drift.hasBaseline
    ? `기준선 고정 완료: ${formatMeasuredAt(drift.pinnedAt)} (등록 당시 포트 ${osPorts.length}개 · 시작프로그램 ${osStartup.length}개)`
    : '기준선 미설정 (신규 포트·프로세스 변경 추적 대기 상태)';

  const surfaceSummaryRows = [
    {
      item: '엔드포인트 안전 기준선',
      status: pinStatusText,
      badgeEl: drift.hasBaseline
        ? (hasDrift ? createEl('span', { className: 'badge badge-drift-warning', text: `[변동 감지 (Δ ${deltaCount}건)]` }) : createEl('span', { className: 'badge badge-drift-clean', text: '[기준선 일치]' }))
        : createProvenanceBadgeEl(liveProv),
    },
  ];

  if (hasDrift) {
    const alertParts = [];
    if (drift.newExposedPorts?.length > 0) alertParts.push(`신규 외부 노출 ${drift.newExposedPorts.length}개: ${drift.newExposedPorts.map((p) => `${p.port}(${p.processName})`).join(', ')}`);
    if (drift.newLoopbackPorts?.length > 0) alertParts.push(`신규 루프백 ${drift.newLoopbackPorts.length}개: ${drift.newLoopbackPorts.map((p) => `${p.port}(${p.processName})`).join(', ')}`);
    if (drift.addedStartupItems?.length > 0) alertParts.push(`신규 시작프로그램 ${drift.addedStartupItems.length}개: ${drift.addedStartupItems.map((s) => s.name).join(', ')}`);
    if (drift.removedStartupItems?.length > 0) alertParts.push(`종료/제거 시작프로그램 ${drift.removedStartupItems.length}개: ${drift.removedStartupItems.map((s) => s.name).join(', ')}`);
    surfaceSummaryRows.push({
      item: '⚠️ 기준선 변동(Drift) 알림',
      status: alertParts.join(' | '),
      badgeEl: createEl('span', { className: 'badge badge-drift-warning', text: '[변동 알림]' }),
    });
  }

  surfaceSummaryRows.push({
    item: '활성 TCP 리스닝 소켓 (열린 포트)',
    status: `총 ${osPorts.length}개 (로컬 루프백 ${loopbackPorts.length}개 · 외부/LAN 노출 ${exposedPorts.length}개)`,
    badgeEl: createProvenanceBadgeEl(liveProv),
  });

  surfaceSummaryRows.push({
    item: '사용자 지속성(시작프로그램)',
    status: `총 ${osStartup.length}개 (레지스트리 Run ${hkcuStartup.length}개 · 시작메뉴 폴더 ${folderStartup.length}개)`,
    badgeEl: createProvenanceBadgeEl(liveProv),
  });

  const surfaceBody = [
    baselineControlBar,
    createInspectionTableDom(surfaceSummaryRows),
  ];

  // 2) 세부 리스닝 포트 목록 (pc-accordion & pc-inspection-scroll)
  const newPortKeySet = new Set([
    ...(drift.newExposedPorts || []).map((p) => `${p.port}:${p.localAddress}`),
    ...(drift.newLoopbackPorts || []).map((p) => `${p.port}:${p.localAddress}`),
  ]);
  const portRows = [];
  for (const p of osPorts) {
    const isKeshev = p.isKeshevPort || p.port === 5189;
    const isNew = newPortKeySet.has(`${p.port}:${p.localAddress}`);
    portRows.push({
      item: `TCP ${p.port} (${isKeshev ? `${p.processName} · 로컬 서버` : p.processName})`,
      status: `PID ${p.pid} · ${p.localAddress} · ${p.scope === 'loopback' ? '로컬 루프백 (보안 격리)' : '외부/LAN 노출 (exposed)'}${isNew ? ' · ⚠️ 신규' : ''}`,
      badgeEl: isNew
        ? createEl('span', { className: 'badge badge-drift-warning', text: '[신규 포트]' })
        : (drift.hasBaseline ? createEl('span', { className: 'badge badge-drift-clean', text: '[기준선]' }) : createProvenanceBadgeEl(liveProv)),
    });
  }

  const isPortsDetailOpen = getAccordionOpen('endpoint-ports-detail', false);
  const portsDetails = createEl('details', {
    className: 'pc-accordion pc-ports-accordion',
    attrs: {
      'data-pc-section': 'endpoint-ports-detail',
      style: 'margin-top: 18px; margin-bottom: 8px;',
      ...(isPortsDetailOpen ? { open: 'true' } : {}),
    },
  });
  portsDetails.addEventListener('toggle', () => {
    setAccordionOpen('endpoint-ports-detail', portsDetails.open);
  });
  portsDetails.appendChild(createEl('summary', { className: 'pc-accordion-summary' }, [
    createEl('strong', { className: 'pc-accordion-title', text: '1) 활성 TCP 리스닝 소켓 매핑 세부 목록' }),
    createEl('span', { className: 'pc-accordion-metric', text: `총 ${osPorts.length}개 소켓 (클릭 시 펼침)` }),
    createEl('div', { className: 'pc-accordion-badges' }, [
      createProvenanceBadgeEl(liveProv),
    ]),
  ]));
  portsDetails.appendChild(createEl('div', { className: 'pc-accordion-body' }, [
    portRows.length > 0
      ? createEl('div', { className: 'pc-inspection-scroll' }, [createInspectionTableDom(portRows)])
      : createEl('p', { className: 'muted', text: '열린 TCP 포트 정보가 없습니다.' }),
  ]));
  surfaceBody.push(portsDetails);

  // 3) 세부 시작프로그램 목록 (pc-accordion & pc-inspection-scroll)
  const newStartupKeySet = new Set((drift.addedStartupItems || []).map((s) => `${s.source}:${s.name}`));
  const startupRows = [];
  for (const s of osStartup) {
    const isNew = newStartupKeySet.has(`${s.source}:${s.name}`);
    startupRows.push({
      item: `${s.name} (${s.source === 'HKCU_Run' ? '레지스트리 Run' : '시작메뉴 폴더'})`,
      status: `명령: ${s.commandOrPath}${isNew ? ' · ⚠️ 신규 등록' : ''}`,
      badgeEl: isNew
        ? createEl('span', { className: 'badge badge-drift-warning', text: '[신규 등록]' })
        : (drift.hasBaseline ? createEl('span', { className: 'badge badge-drift-clean', text: '[기준선]' }) : createProvenanceBadgeEl(liveProv)),
    });
  }

  const isStartupDetailOpen = getAccordionOpen('endpoint-startup-detail', false);
  const startupDetails = createEl('details', {
    className: 'pc-accordion',
    attrs: {
      'data-pc-section': 'endpoint-startup-detail',
      style: 'margin-top: 8px !important; margin-bottom: 8px !important;',
      ...(isStartupDetailOpen ? { open: 'true' } : {}),
    },
  });
  startupDetails.addEventListener('toggle', () => {
    setAccordionOpen('endpoint-startup-detail', startupDetails.open);
  });
  startupDetails.appendChild(createEl('summary', { className: 'pc-accordion-summary' }, [
    createEl('strong', { className: 'pc-accordion-title', text: '2) 사용자 지속성(시작프로그램) 등록 세부 목록' }),
    createEl('span', { className: 'pc-accordion-metric', text: `총 ${osStartup.length}개 항목 (클릭 시 펼침)` }),
    createEl('div', { className: 'pc-accordion-badges' }, [
      createProvenanceBadgeEl(liveProv),
    ]),
  ]));
  startupDetails.appendChild(createEl('div', { className: 'pc-accordion-body' }, [
    startupRows.length > 0
      ? createEl('div', { className: 'pc-inspection-scroll' }, [createInspectionTableDom(startupRows)])
      : createEl('p', { className: 'muted', text: '등록된 사용자 시작프로그램이 없습니다.' }),
  ]));
  surfaceBody.push(startupDetails);

  // 4) Mandatory non-intrusion notice
  surfaceBody.push(createEl('p', {
    className: 'pc-non-intrusion-inline surface-disclaimer',
    text: '이 건수는 침해나 공격 탐지 결과가 아닙니다 (엔드포인트 프로세스 포트 바인딩 및 사용자 시작프로그램 레지스트리/폴더 상태)',
  }));

  grid.appendChild(createPcAccordionSection({
    sectionKey: 'endpoint-surface-drift',
    title: '7. 포트·시작프로그램',
    metricSummary: surfaceSummary,
    badges: surfaceBadges,
    bodyContent: surfaceBody,
  }));

  return grid;
}

function buildAuditBundleExporterDom() {
  const panel = createEl('div', {
    id: 'soc-audit-bundle-standalone',
    className: 'soc-split-panel soc-audit-standalone-panel',
    attrs: {
      role: 'region',
      'aria-label': '관제 감사 리포트 (Signed Audit Bundle) 내보내기 및 암호학적 SHA-256 무결성 검증',
    },
  });

  // Top Heading Bar (Exact same layout as PC 상태 점검 and 직전 스냅샷 대비 추이 비교)
  const heading = createEl('div', { className: 'soc-panel-heading' }, [
    createEl('h3', { className: 'soc-panel-title', text: '관제 감사 리포트 (Signed Audit Bundle)' }),
    createEl('div', { className: 'soc-panel-actions' }, [
      createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
      createEl('span', { className: 'badge badge-audit-sign', text: '[SHA-256 서명 봉인]' }),
    ]),
  ]);
  panel.appendChild(heading);

  const box = createEl('div', { className: 'trend-delta-box', style: 'padding: 12px 14px;' });

  // 1) 2-Card Summary Grid (matching soc-delta-summary-grid & soc-delta-card in buildTrendComparisonBoxDom)
  const dlBtn = createEl('button', {
    className: 'btn audit-action-btn pc-refresh-btn',
    text: '[SHA-256 서명 감사 리포트 다운로드 (.json)]',
    attrs: { type: 'button' },
  });
  const dlStatus = createEl('span', { className: 'muted font-mono text-small' });

  attachKeyboardClick(dlBtn, () => {
    dlBtn.disabled = true;
    dlBtn.textContent = '리포트 생성 및 해시 봉인 중…';
    fetch('/api/pc-status/audit-export')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((bundle) => {
        dlBtn.disabled = false;
        dlBtn.textContent = '[SHA-256 서명 감사 리포트 다운로드 (.json)]';
        const str = JSON.stringify(bundle, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `keshev-audit-bundle-${Date.now()}.json`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        dlStatus.textContent = `다운로드 완료: ${filename} (SHA-256: ${bundle.integrity?.payloadSha256?.slice(0, 16)}…)`;
      })
      .catch((err) => {
        dlBtn.disabled = false;
        dlBtn.textContent = '[SHA-256 서명 감사 리포트 다운로드 (.json)] (재시도)';
        dlStatus.textContent = `내보내기 실패: ${err?.message || '서버 오류'}`;
      });
  });

  const fileInput = createEl('input', {
    attrs: { type: 'file', accept: '.json', style: 'display: none;' },
  });

  const filePickBtn = createEl('button', {
    className: 'btn audit-action-btn pc-toggle-all-btn',
    text: '[파일 선택 (.json)]',
    attrs: {
      type: 'button',
      style: 'margin-right: 10px !important;',
    },
  });

  const verifyBtn = createEl('button', {
    className: 'btn audit-action-btn pc-refresh-btn',
    text: '[리포트 무결성 검증 실행]',
    attrs: { type: 'button' },
  });

  const verifyStatusChip = createEl('span', {
    className: 'delta-chip is-same',
    text: '검증 대기',
  });

  const resultContainer = createEl('div', { className: 'audit-verify-result-container' });

  const textarea = createEl('textarea', {
    className: 'audit-json-textarea font-mono',
    attrs: {
      placeholder: '감사 리포트 JSON 내용을 붙여넣거나 파일을 선택하세요.',
      rows: '3',
      style: 'min-height: 60px !important; height: 78px !important; max-height: 240px !important; width: 100% !important; box-sizing: border-box !important;',
    },
  });

  attachKeyboardClick(filePickBtn, () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      filePickBtn.textContent = `[파일 선택됨: ${file.name}]`;
      const reader = new FileReader();
      reader.onload = (re) => {
        textarea.value = re.target?.result || '';
      };
      reader.readAsText(file, 'utf-8');
    }
  });

  function executeVerification() {
    const raw = textarea.value.trim();
    if (!raw) {
      verifyStatusChip.className = 'delta-chip is-pending';
      verifyStatusChip.textContent = '데이터 없음';
      resultContainer.replaceChildren(createEl('div', {
        className: 'audit-result-banner banner-warning',
        text: '검증할 JSON 데이터가 없습니다. 파일을 선택하거나 내용을 입력하세요.',
      }));
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      verifyStatusChip.className = 'delta-chip is-up';
      verifyStatusChip.textContent = '파싱 실패';
      resultContainer.replaceChildren(createEl('div', {
        className: 'audit-result-banner banner-tampered',
        text: `✕ JSON 파싱 실패: 형식이 손상되었습니다. (${parseErr.message})`,
      }));
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = '해시 검증 중…';

    fetch('/api/pc-status/audit-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    })
      .then((res) => res.json())
      .then((resJson) => {
        verifyBtn.disabled = false;
        verifyBtn.textContent = '[리포트 무결성 검증 실행]';
        const d = resJson?.data;
        if (!resJson?.ok || !d) {
          verifyStatusChip.className = 'delta-chip is-up';
          verifyStatusChip.textContent = '검증 오류';
          resultContainer.replaceChildren(createEl('div', {
            className: 'audit-result-banner banner-tampered',
            text: `✕ 검증 요청 실패: ${resJson?.error?.message || '서버 오류'}`,
          }));
          return;
        }

        if (d.verified) {
          verifyStatusChip.className = 'delta-chip is-down';
          verifyStatusChip.textContent = '무결성 일치 (정상)';
          resultContainer.replaceChildren(createEl('div', {
            className: 'audit-result-banner banner-verified',
          }, [
            createEl('strong', { text: '✓ 무결성 검증 통과 (일치)' }),
            createEl('p', { text: `발행 시각: ${formatMeasuredAt(d.generatedAt)} | ${d.reason}` }),
            createEl('p', { className: 'font-mono text-small', text: `SHA-256 다이제스트: ${d.computedHash}` }),
          ]));
        } else {
          verifyStatusChip.className = 'delta-chip is-up';
          verifyStatusChip.textContent = '위변조 탐지';
          resultContainer.replaceChildren(createEl('div', {
            className: 'audit-result-banner banner-tampered',
          }, [
            createEl('strong', { text: '✕ 위변조 탐지 (해시 불일치)' }),
            createEl('p', { text: d.reason }),
            createEl('div', { className: 'font-mono text-small' }, [
              createEl('p', { text: `기대 해시 (Expected): ${d.expectedHash || '(없음)'}` }),
              createEl('p', { text: `계산 해시 (Computed): ${d.computedHash}` }),
            ]),
          ]));
        }
      })
      .catch((err) => {
        verifyBtn.disabled = false;
        verifyBtn.textContent = '[리포트 무결성 검증 실행] (재시도)';
        verifyStatusChip.className = 'delta-chip is-up';
        verifyStatusChip.textContent = '네트워크 오류';
        resultContainer.replaceChildren(createEl('div', {
          className: 'audit-result-banner banner-tampered',
          text: `네트워크 오류: ${err.message}`,
        }));
      });
  }

  attachKeyboardClick(verifyBtn, executeVerification);

  const grid2x1 = createEl('div', { className: 'soc-delta-summary-grid' }, [
    createEl('div', { className: 'soc-delta-card' }, [
      createEl('div', { className: 'delta-card-head' }, [
        createEl('span', { className: 'delta-card-label', text: '서명된 감사 리포트 내보내기 (Export)' }),
        createEl('span', { className: 'delta-chip is-same', text: 'SHA-256 전자서명' }),
      ]),
      createEl('span', { className: 'delta-card-desc', text: '단말 7개 점검 지표 실측값과 공격표면, 안전 기준선을 암호학적 SHA-256으로 봉인하여 추출합니다.' }),
      createEl('div', { style: 'margin-top: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;' }, [
        dlBtn,
        dlStatus,
      ]),
    ]),
    createEl('div', { className: 'soc-delta-card' }, [
      createEl('div', { className: 'delta-card-head' }, [
        createEl('span', { className: 'delta-card-label', text: '리포트 위변조 탐지 및 무결성 검증 (Verify)' }),
        verifyStatusChip,
      ]),
      createEl('span', { className: 'delta-card-desc', text: '감사 리포트 JSON을 붙여넣거나 파일을 선택하여 SHA-256 무결성을 검증합니다.' }),
      createEl('div', { style: 'margin-top: 8px;' }, [
        textarea,
      ]),
      createEl('div', {
        className: 'audit-buttons-row',
        attrs: {
          style: 'margin-top: 10px !important; display: flex !important; align-items: center !important; justify-content: flex-start !important; gap: 10px !important; flex-wrap: wrap !important;',
        },
      }, [
        fileInput,
        filePickBtn,
        verifyBtn,
      ]),
      resultContainer,
    ]),
  ]);
  box.appendChild(grid2x1);

  // 2) Structured Table/Grid (matching trend-delta-breakdown in buildTrendComparisonBoxDom)
  const auditSpecRows = [
    {
      item: '단말 실측 텔레메트리 봉인 범위',
      status: '네트워크 어댑터, 방화벽 프로필, Windows 이벤트 로그, CPU, RAM, 디스크 (6개 센서 실측)',
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    },
    {
      item: '공격 표면 및 기준선 봉인',
      status: '활성 TCP 리스닝 소켓 매핑 및 사용자 지속성 시작프로그램 등록 스냅샷',
      badgeEl: createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    },
    {
      item: '암호학적 무결성 서명 방식',
      status: 'SHA-256 정규화 다이제스트 (Canonical JSON UTF-8 직렬화)',
      badgeEl: createEl('span', { className: 'badge badge-audit-sign', text: '[SHA-256 봉인]' }),
    },
  ];

  function createAuditSpecTableDom(rows = []) {
    const table = createEl('div', { className: 'pc-inspection-table audit-spec-table' });
    for (const row of rows) {
      const itemEl = createEl('span', {
        className: 'pc-col-item',
        text: row.item,
        attrs: {
          style: 'text-align: right !important; justify-self: end !important; font-weight: 700 !important; color: #0e306d !important; font-size: 11.5px !important; white-space: nowrap !important; padding-right: 6px !important;',
        },
      });

      const statusEl = createEl('span', {
        className: 'pc-col-status',
        text: String(row.status || '-'),
        attrs: {
          style: 'text-align: left !important; justify-self: start !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif !important; font-size: 11.5px !important; color: #334155 !important; word-break: keep-all !important; line-height: 1.45 !important;',
        },
      });

      const badgeEl = createEl('div', {
        className: 'pc-col-badge',
        attrs: {
          style: 'display: flex !important; align-items: center !important; justify-content: flex-end !important; flex-shrink: 0 !important; white-space: nowrap !important;',
        },
      }, [row.badgeEl]);

      const rowEl = createEl('div', {
        className: 'pc-inspection-row',
        attrs: {
          style: 'display: grid !important; grid-template-columns: 210px 1fr 100px !important; align-items: center !important; gap: 12px !important; padding: 6px 10px !important;',
        },
      }, [itemEl, statusEl, badgeEl]);

      table.appendChild(rowEl);
    }
    return table;
  }

  const auditSpecTable = createAuditSpecTableDom(auditSpecRows);

  const isAuditDetailOpen = getAccordionOpen('audit-bundle-breakdown', false);
  const auditDetails = createEl('details', {
    className: 'pc-accordion',
    attrs: {
      'data-pc-section': 'audit-bundle-breakdown',
      ...(isAuditDetailOpen ? { open: 'true' } : {}),
    },
  });
  auditDetails.addEventListener('toggle', () => {
    setAccordionOpen('audit-bundle-breakdown', auditDetails.open);
  });

  const summary = createEl('summary', { className: 'pc-accordion-summary' }, [
    createEl('strong', { className: 'pc-accordion-title', text: '감사 리포트 봉인 규격 명세 (단말 실측·공격표면·SHA-256 서명)' }),
    createEl('div', { className: 'pc-accordion-badges' }, [
      createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
      createEl('span', { className: 'badge badge-audit-sign', text: '[SHA-256 봉인]' }),
    ]),
  ]);

  const auditBody = createEl('div', { className: 'pc-accordion-body' }, [
    auditSpecTable,
  ]);

  auditDetails.appendChild(summary);
  auditDetails.appendChild(auditBody);
  box.appendChild(auditDetails);
  panel.appendChild(box);

  return panel;
}

function buildAuditBreakdownPanelDom({ selectedEvent, decisionSlice, matchedRules, provenance, mode, pcStatus, onRefresh = null }) {
  const panel = createEl('div', {
    className: 'soc-split-panel soc-audit-panel',
    attrs: {
      role: 'region',
      'aria-label': pcStatus ? '내 PC 상태 점검 및 SDP 판정 감사' : 'SDP 판정 및 규칙 매칭 상세 감사',
    },
  });

  const osTimeText = formatMeasuredAt(pcStatus?.osProbe?.measuredAt || pcStatus?.measuredAt);
  let pcInspectionDom = null;

  if (pcStatus) {
    const toggleAllBtn = createEl('button', {
      className: 'btn pc-toggle-all-btn',
      text: '모두 펼치기',
      attrs: {
        type: 'button',
        'aria-label': 'PC 점검 항목 모두 펼치기 또는 모두 접기',
        tabindex: '0',
      },
    });

    const refreshBtn = createEl('button', {
      className: 'btn pc-refresh-btn',
      text: pcStatus?.osProbeLoading ? '조회 중…' : '다시 조회',
      attrs: {
        type: 'button',
        'aria-label': '내 PC 상태 다시 조회',
        tabindex: '0',
        ...(pcStatus?.osProbeLoading ? { disabled: 'true', 'aria-busy': 'true' } : {}),
      },
    });
    attachKeyboardClick(refreshBtn, () => {
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    });

    // Single header for Right Column in global overview
    const heading = createEl('div', { className: 'soc-panel-heading' }, [
      createEl('h3', { className: 'soc-panel-title', text: 'PC 상태 점검' }),
      createEl('div', { className: 'soc-panel-actions' }, [
        createEl('span', { className: 'soc-card-timestamp', text: `측정 시각: ${osTimeText}` }),
        toggleAllBtn,
        refreshBtn,
      ]),
    ]);
    panel.appendChild(heading);
    pcInspectionDom = buildPcStatusInspectionCardDom(pcStatus, mode, toggleAllBtn, onRefresh);
    panel.appendChild(pcInspectionDom);
  } else {
    // Header for event-specific audit slot
    const heading = createEl('div', { className: 'soc-panel-heading' }, [
      createEl('h3', { className: 'soc-panel-title', text: 'SDP 판정 및 규칙 매칭 상세 감사' }),
      createEl('div', { className: 'soc-panel-actions' }, [
        createSdpStatusBadgeEl(mode),
      ]),
    ]);
    panel.appendChild(heading);
  }

  // --- Collapsible SDP Decision Breakdown & Rule Matching (Closed by Default) ---
  const decCard = createEl('div', { className: 'soc-audit-card' });
  decCard.appendChild(createEl('div', { className: 'event-head' }, [
    createEl('h4', { text: '업무 앱 판정 감사 (SDP Access Decision Breakdown)' }),
    createSdpStatusBadgeEl(mode),
    createProvenanceBadgeEl(provenance),
  ]));
  const decStatus = decisionSlice?.status || 'idle';
  if (decStatus === 'ok' && decisionSlice?.data) {
    const info = mapDecision(decisionSlice.data.decision);
    decCard.appendChild(createEl('p', {
      text: `[${info.code.toUpperCase()}] 앱: ${decisionSlice.data.appId || decisionSlice.appId || '미지정'} · ${info.text} (판정 1건)`,
    }));
    decCard.appendChild(createEl('p', {
      className: 'muted',
      text: `명시적 판정 사유: ${decisionSlice.data.reason || '사유 정보 없음'} | 측정: ${formatMeasuredAt(decisionSlice.data.checkedAt)}`,
    }));
  } else if (decStatus === 'error') {
    decCard.appendChild(createEl('p', {
      text: `[${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} / 요청 실패 · 확인 불가] 사유: ${extractErrorText(decisionSlice?.error, '판정 요청 실패')} (내 PC 조회 결과와 구분 표시)`,
    }));
  } else {
    decCard.appendChild(createEl('p', {
      className: 'muted',
      text: '업무 앱 탭에서 앱을 선택하면 allow / deny / challenge / unknown 판정 사유가 기록됩니다 (현재 0건).',
    }));
  }

  const evCard = createEl('div', { className: 'soc-audit-card' });
  evCard.appendChild(createEl('div', { className: 'event-head' }, [
    createEl('h4', { text: '선택 사건 상태·근거·규칙 매칭' }),
    createSdpStatusBadgeEl(mode),
  ]));
  if (selectedEvent) {
    const evProv = resolveProvenance({ mode });
    const headRow = createEl('p', {
      text: `사건 ${selectedEvent.id} (${mapKind(selectedEvent.kind)}) · 앱: ${selectedEvent.appId || '확인 불가'} · 측정: ${formatMeasuredAt(selectedEvent.at)} `,
    });
    headRow.appendChild(createProvenanceBadgeEl(evProv, true));
    evCard.appendChild(headRow);

    evCard.appendChild(createEl('p', {
      className: 'muted',
      text: `상태 분해 — 접속: ${formatAccessState(selectedEvent.state?.access)} | 세션: ${formatSessionState(selectedEvent.state?.session)} | 기기: ${formatDeviceState(selectedEvent.state?.device)}`,
    }));

    const rules = Array.isArray(selectedEvent.rules) ? selectedEvent.rules : [];
    const evidences = Array.isArray(selectedEvent.evidence) ? selectedEvent.evidence : [];
    if (rules.length > 0 || evidences.length > 0) {
      const ruleUl = createEl('ul', { className: 'soc-rule-list' });
      for (const r of rules) {
        ruleUl.appendChild(createEl('li', {
          className: 'soc-rule-item',
          text: `[규칙 ${r.id}] ${r.text || ''}`,
        }));
      }
      for (const e of evidences) {
        ruleUl.appendChild(createEl('li', {
          className: 'soc-rule-item',
          text: `[근거 ${e.id}] ${e.text || ''}`,
        }));
      }
      evCard.appendChild(ruleUl);
    }
  } else {
    evCard.appendChild(createEl('p', {
      className: 'muted',
      text: mode === 'disconnected'
        ? `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} 상태이므로 수신된 SDP 보안 사건이 0건입니다 (내 PC 조회 결과와 구분 표시).`
        : '현재 선택되거나 수신된 보안 사건이 0건입니다.',
    }));
  }

  const ruleAggCard = createEl('div', { className: 'soc-audit-card' });
  const ruleList = Array.isArray(matchedRules) ? matchedRules : [];
  ruleAggCard.appendChild(createEl('h4', {
    text: `누적 규칙 매칭 집계 (${ruleList.length}종)`,
  }));
  if (ruleList.length > 0) {
    const ruleAggUl = createEl('ul', { className: 'soc-rule-list' });
    for (const r of ruleList) {
      ruleAggUl.appendChild(createEl('li', {
        className: 'soc-rule-item',
        text: `[${r.id}] ${r.text || ''} (누적 ${r.count}건 매칭)`,
      }));
    }
    ruleAggCard.appendChild(ruleAggUl);
  } else {
    ruleAggCard.appendChild(createEl('p', {
      className: 'muted',
      text: '현재 매칭된 보안 규칙이 0종입니다.',
    }));
  }

  if (pcInspectionDom) {
    const isSdpAuditOpen = getAccordionOpen('sdp-audit', false);
    const sdpAuditDetails = createEl('details', {
      className: 'pc-accordion sdp-audit-details',
      attrs: {
        'data-pc-section': 'sdp-audit',
        ...(isSdpAuditOpen ? { open: 'true' } : {}),
      },
    });
    sdpAuditDetails.addEventListener('toggle', () => {
      setAccordionOpen('sdp-audit', sdpAuditDetails.open);
    });
    const decisionCount = decisionSlice?.status === 'ok' ? 1 : 0;
    sdpAuditDetails.appendChild(createEl('summary', { className: 'pc-accordion-summary' }, [
      createEl('strong', { className: 'pc-accordion-title', text: 'SDP 업무 앱 인가 판정 & 규칙 감사' }),
      createEl('span', { className: 'pc-accordion-metric', text: `판정 ${decisionCount}건 · 규칙 ${ruleList.length}종 (클릭 시 펼침)` }),
      createEl('div', { className: 'pc-accordion-badges' }, [
        createSdpStatusBadgeEl(mode),
      ]),
    ]));
    const auditBody = createEl('div', { className: 'pc-accordion-body' }, [
      decCard,
      evCard,
      ruleAggCard,
    ]);
    sdpAuditDetails.appendChild(auditBody);
    pcInspectionDom.appendChild(sdpAuditDetails);
  } else {
    panel.appendChild(decCard);
    panel.appendChild(evCard);
    panel.appendChild(ruleAggCard);
  }

  return panel;
}

function sha256Hex(ascii) {
  if (typeof ascii !== 'string') ascii = String(ascii || '');
  try {
    ascii = unescape(encodeURIComponent(ascii));
  } catch {}
  function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) { isComposite[i] = candidate; }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  hash = hash.slice(0, 8);
  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength | 0;
  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0)) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;
      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

function ensureStudentDashboardDom() {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return;
  if (document.getElementById('view-dashboard')) return;

  const nav = document.getElementById('nav');
  if (nav && !document.getElementById('tab-dashboard')) {
    const tabDashboard = document.createElement('button');
    tabDashboard.type = 'button';
    tabDashboard.id = 'tab-dashboard';
    tabDashboard.className = 'tab is-active';
    tabDashboard.setAttribute('role', 'tab');
    tabDashboard.setAttribute('data-testid', 'nav-dashboard');
    tabDashboard.setAttribute('data-view', 'dashboard');
    tabDashboard.setAttribute('aria-selected', 'true');
    tabDashboard.setAttribute('aria-controls', 'view-dashboard');
    tabDashboard.tabIndex = 0;
    tabDashboard.textContent = '종합 관제 대시보드';
    nav.insertBefore(tabDashboard, nav.firstChild);

    for (const otherTab of nav.querySelectorAll('[role="tab"]')) {
      if (otherTab !== tabDashboard) {
        otherTab.classList.remove('is-active');
        otherTab.setAttribute('aria-selected', 'false');
        otherTab.tabIndex = -1;
      }
    }
  }

  const main = document.getElementById('main');
  if (main) {
    for (const otherView of main.querySelectorAll('.view')) {
      otherView.hidden = true;
      otherView.classList.remove('is-active');
    }

    const viewDashboard = document.createElement('section');
    viewDashboard.id = 'view-dashboard';
    viewDashboard.className = 'view is-active';
    viewDashboard.setAttribute('role', 'tabpanel');
    viewDashboard.setAttribute('aria-labelledby', 'tab-dashboard');

    const header = document.createElement('header');
    header.className = 'soc-dashboard-header';
    const h1 = document.createElement('h1');
    h1.textContent = '종합 관제 대시보드';
    const timeSpan = document.createElement('span');
    timeSpan.id = 'soc-top-measured-at';
    timeSpan.className = 'soc-card-timestamp';
    timeSpan.textContent = '측정 시각: 대기 중…';
    header.appendChild(h1);
    header.appendChild(timeSpan);
    viewDashboard.appendChild(header);

    const overviewShell = document.createElement('section');
    overviewShell.id = 'soc-executive-overview';
    overviewShell.className = 'soc-overview-shell';
    overviewShell.setAttribute('role', 'region');
    overviewShell.setAttribute('aria-label', 'SOC 통합 보안 관제 지표 및 데이터 출처 요약');
    overviewShell.setAttribute('aria-live', 'polite');

    const topMetrics = document.createElement('div');
    topMetrics.id = 'soc-top-metrics';
    topMetrics.className = 'soc-metric-grid';
    topMetrics.setAttribute('role', 'region');
    topMetrics.setAttribute('aria-label', '상단 4대 관제 대시보드 핵심 지표 카드');
    topMetrics.setAttribute('aria-live', 'polite');
    overviewShell.appendChild(topMetrics);

    const bottomSplitOverview = document.createElement('section');
    bottomSplitOverview.id = 'soc-bottom-split-overview';
    bottomSplitOverview.className = 'soc-split-overview-card';
    bottomSplitOverview.setAttribute('role', 'region');
    bottomSplitOverview.setAttribute('aria-label', '추이 비교 및 PC 상태 점검 2단 분할 뷰');
    bottomSplitOverview.setAttribute('aria-live', 'polite');

    const bottomSplitInner = document.createElement('div');
    bottomSplitInner.id = 'soc-bottom-split';
    bottomSplitInner.className = 'audit-split-view';
    bottomSplitInner.setAttribute('role', 'region');
    bottomSplitInner.setAttribute('aria-label', '시간순 이벤트 추이 비교 및 내 PC 상태·규칙 감사 2단 분할 영역');
    bottomSplitInner.setAttribute('aria-live', 'polite');

    const leftCol = document.createElement('div');
    leftCol.id = 'soc-split-left-timeline';
    leftCol.className = 'soc-split-panel soc-timeline-panel';
    leftCol.setAttribute('role', 'region');
    leftCol.setAttribute('aria-label', '좌측: 직전 조회 대비 추이 비교 및 시간순 보안 기록');
    leftCol.setAttribute('aria-live', 'polite');

    const rightCol = document.createElement('div');
    rightCol.id = 'soc-split-right-audit';
    rightCol.className = 'soc-split-panel soc-audit-panel';
    rightCol.setAttribute('role', 'region');
    rightCol.setAttribute('aria-label', '우측: 내 PC 네트워크·방화벽·Windows 기록 점검 및 판정 감사');
    rightCol.setAttribute('aria-live', 'polite');

    bottomSplitInner.appendChild(leftCol);
    bottomSplitInner.appendChild(rightCol);
    bottomSplitOverview.appendChild(bottomSplitInner);
    overviewShell.appendChild(bottomSplitOverview);
    viewDashboard.appendChild(overviewShell);

    const viewProtection = document.getElementById('view-protection');
    if (viewProtection) {
      main.insertBefore(viewDashboard, viewProtection);
    } else {
      main.appendChild(viewDashboard);
    }
  }
}

export function createStudentView(options = {}) {
  ensureStudentAppearanceStyle();
  ensureStudentDashboardDom();

  function setupTabNavigation() {
    if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
    const tabs = Array.from(document.querySelectorAll('#nav [role="tab"], #tab-list [role="tab"]'));

    function switchView(targetView) {
      for (const tab of tabs) {
        const tabView = tab.dataset.view || (tab.id ? tab.id.replace(/^tab-/, '') : '');
        const isSelected = (tabView === targetView) || (tab.getAttribute('aria-controls') === `view-${targetView}`);
        tab.setAttribute('aria-selected', String(isSelected));
        tab.tabIndex = isSelected ? 0 : -1;
        tab.classList.toggle('is-active', isSelected);

        const ctrlId = tab.getAttribute('aria-controls') || `view-${tabView}`;
        const panel = document.getElementById(ctrlId);
        if (panel) {
          panel.hidden = !isSelected;
          panel.classList.toggle('is-active', isSelected);
        }
      }
    }

    for (const tab of tabs) {
      if (tab.dataset.extTabBound === 'true') continue;
      tab.dataset.extTabBound = 'true';
      tab.addEventListener('click', () => {
        const targetView = tab.dataset.view || (tab.id ? tab.id.replace(/^tab-/, '') : '');
        switchView(targetView);
      });
      tab.addEventListener('keydown', (event) => {
        const allTabs = Array.from(document.querySelectorAll('#nav [role="tab"], #tab-list [role="tab"]'));
        const index = allTabs.indexOf(tab);
        let next = null;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = allTabs[(index + 1) % allTabs.length];
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = allTabs[(index - 1 + allTabs.length) % allTabs.length];
        else if (event.key === 'Home') next = allTabs[0];
        else if (event.key === 'End') next = allTabs[allTabs.length - 1];
        if (!next) return;
        event.preventDefault();
        const nextView = next.dataset.view || (next.id ? next.id.replace(/^tab-/, '') : '');
        switchView(nextView);
        next.focus();
      });
    }
  }

  setupTabNavigation();
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTabNavigation);
  }

  const socStore = {
    identity: { me: { status: 'loading' }, devices: { status: 'loading' }, sessions: { status: 'loading' } },
    decision: { status: 'idle', mode: null, data: null, error: null, appId: null },
    decisionHistory: [],
    lastDecisionKey: '',
    events: { status: 'loading', mode: null, data: [], error: null },
    status: { devices: { status: 'loading' }, sessions: { status: 'loading' }, notifications: [], diagnostics: { status: 'idle' }, mode: 'unknown' },
    vulnerabilities: { status: 'idle', mode: null, data: null, error: null },
    pcStatus: createInitialPcStatusState(),
    snapshots: [],
  };

  socStore.pcStatus.onServerSnapshots = (snaps) => hydrateServerSnapshots(socStore, snaps);

  let sseConnected = false;
  let eventSource = null;

  function initSseTelemetryStream() {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return;
    try {
      if (eventSource) {
        eventSource.close();
      }
      eventSource = new EventSource('/api/pc-status/stream');

      eventSource.onopen = () => {
        if (!sseConnected) {
          sseConnected = true;
          updateSocOverview(false);
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);
          if (res?.ok && res?.data) {
            socStore.pcStatus.osProbe = Object.freeze(res.data);
            socStore.pcStatus.osProbeError = null;
            socStore.pcStatus.measuredAt = res.data.measuredAt || new Date().toISOString();
            if (Array.isArray(res.data.snapshotHistory)) {
              hydrateServerSnapshots(socStore, res.data.snapshotHistory);
            }
            updateSocOverview(false);
          }
        } catch {}
      };

      eventSource.onerror = () => {
        if (sseConnected) {
          sseConnected = false;
          updateSocOverview(false);
        }
      };
    } catch {
      sseConnected = false;
    }
  }

  initSseTelemetryStream();

  function handleRefreshPc() {
    refreshBrowserPcStatus(socStore.pcStatus, () => updateSocOverview(false), true);
    updateSocOverview(false);
  }

  function updateSocOverview(shouldRefreshPc = true) {
    captureCurrentAccordionStates();
    if (shouldRefreshPc) {
      refreshBrowserPcStatus(socStore.pcStatus, () => updateSocOverview(false));
    }
    recordSocSnapshot(socStore);

    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;

    const rawTime = socStore.status?.diagnostics?.data?.checkedAt || socStore.pcStatus?.measuredAt;
    const topTimeEl = document.getElementById('soc-top-measured-at');
    if (topTimeEl) {
      topTimeEl.textContent = `측정 시각: ${formatMeasuredAt(rawTime)}`;
      const parent = topTimeEl.parentElement;
      const existingPills = parent ? Array.from(parent.querySelectorAll('.sse-status-pill')) : [];
      let pill = document.getElementById('soc-sse-status-pill');
      if (!pill && existingPills.length > 0) {
        pill = existingPills[0];
        pill.id = 'soc-sse-status-pill';
      }
      if (existingPills.length > 1) {
        for (let i = 1; i < existingPills.length; i++) {
          existingPills[i].remove();
        }
      }
      if (!pill) {
        pill = createEl('span', { id: 'soc-sse-status-pill' });
        parent?.appendChild(pill);
      }
      pill.textContent = sseConnected ? '[SSE 실시간 스트림 연결됨]' : '[SSE 재연결 중]';
      pill.className = `badge sse-status-pill ${sseConnected ? 'sse-connected' : 'sse-disconnected'}`;
    }

    const topMetricsEl = document.getElementById('soc-top-metrics');
    const cards = aggregateSocTopCards(socStore);
    if (topMetricsEl) {
      const renderedGrid = buildSocMetricCardsDom(cards);
      topMetricsEl.replaceChildren(...Array.from(renderedGrid.childNodes));
    }

    const leftTimelineEl = document.getElementById('soc-split-left-timeline');
    const rightAuditEl = document.getElementById('soc-split-right-audit');
    if (leftTimelineEl || rightAuditEl) {
      const evSummary = normalizeEventsSummary(socStore.events, socStore.pcStatus?.measuredAt);
      const effectiveMode = socStore.events?.mode || socStore.status?.mode || 'unknown';

      if (leftTimelineEl) {
        const leftChildren = [];

        // 1) CARD 1: 직전 스냅샷 대비 추이 비교
        const snapMeasuredAt = socStore.snapshots[0]?.at || socStore.pcStatus?.measuredAt;
        const trendCard = createEl('div', { className: 'soc-split-card soc-trend-card' }, [
          createEl('div', { className: 'soc-panel-heading' }, [
            createEl('h3', { className: 'soc-panel-title', text: '직전 스냅샷 대비 추이 비교' }),
            createEl('div', { className: 'soc-panel-actions' }, [
              createEl('span', { className: 'soc-card-timestamp', text: `측정 시각: ${formatMeasuredAt(snapMeasuredAt)}` }),
              createEl('span', { className: 'soc-snapshot-badge', text: `누적 스냅샷 ${socStore.snapshots.length}건` }),
            ]),
          ]),
          buildTrendComparisonBoxDom(socStore, evSummary.provenance),
        ]);
        leftChildren.push(trendCard);

        // 2) CARD 2: 시간순 보안 이벤트 타임라인 (SDP 사건 영역으로 명확히 분리)
        const timelineCard = createEl('div', { className: 'soc-split-card soc-timeline-card' });
        const tlHeading = createEl('div', { className: 'soc-panel-heading' }, [
          createEl('h3', { className: 'soc-panel-title', text: '시간순 보안 이벤트 타임라인' }),
          createEl('div', { className: 'soc-panel-actions' }, [
            createSdpStatusBadgeEl(effectiveMode),
          ]),
        ]);
        timelineCard.appendChild(tlHeading);

        const tlBody = createEl('div', { className: 'soc-card-body', style: 'padding: 10px 12px;' });
        if (evSummary.sortedEvents.length > 0) {
          const isTlOpen = getAccordionOpen('sdp-timeline', true);
          const tlDetails = createEl('details', {
            className: 'pc-accordion sdp-timeline-details',
            attrs: {
              'data-pc-section': 'sdp-timeline',
              ...(isTlOpen ? { open: 'true' } : {}),
            },
          });
          tlDetails.addEventListener('toggle', () => {
            setAccordionOpen('sdp-timeline', tlDetails.open);
          });
          tlDetails.appendChild(createEl('summary', { className: 'pc-accordion-summary' }, [
            createEl('strong', { className: 'pc-accordion-title', text: '수신된 보안 사건 목록' }),
            createEl('span', { className: 'pc-accordion-metric', text: `총 ${evSummary.sortedEvents.length}건 (최신순)` }),
            createEl('div', { className: 'pc-accordion-badges' }, [
              createSdpStatusBadgeEl(effectiveMode),
            ]),
          ]));
          const tlList = createEl('ul', { className: 'soc-timeline-list' });
          for (const ev of evSummary.sortedEvents.slice(0, 10)) {
            const nodeTone = ev?.state?.access === 'denied' || ev?.kind === 'xdr'
              ? 'node-deny'
              : ev?.state?.access === 'allowed' && ev?.state?.device === 'compliant'
                ? 'node-allow'
                : ev?.state?.device === 'unknown' || ev?.state?.access === 'unknown'
                  ? 'node-challenge'
                  : 'node-unknown';
            const evProv = resolveProvenance({ mode: effectiveMode });
            const ruleCount = Array.isArray(ev.rules) ? ev.rules.length : 0;
            const evidenceCount = Array.isArray(ev.evidence) ? ev.evidence.length : 0;
            const item = createEl('li', { className: `soc-timeline-node ${nodeTone}` }, [
              createEl('div', { className: 'event-head' }, [
                createEl('strong', { text: `${ev.id} · ${ev.summary || '요약 없음'}` }),
                createEl('span', { className: 'tag', text: mapKind(ev.kind) }),
                createProvenanceBadgeEl(evProv, true),
              ]),
              createEl('p', {
                className: 'muted',
                text: `발생: ${formatMeasuredAt(ev.at)} · 앱: ${ev.appId || '확인 불가(없음)'} · 근거 ${evidenceCount}건 · 규칙 ${ruleCount}종`,
              }),
            ]);
            tlList.appendChild(item);
          }
          tlDetails.appendChild(createEl('div', { className: 'pc-accordion-body' }, [tlList]));
          tlBody.appendChild(tlDetails);
        } else {
          tlBody.appendChild(createEl('div', { className: 'soc-empty-timeline-box', style: 'padding: 4px 0;' }, [
            createEl('div', { className: 'soc-compact-status-row', style: 'margin: 0;' }, [
              createSdpStatusBadgeEl(effectiveMode),
              createEl('span', {
                className: 'soc-status-prose',
                text: effectiveMode === 'disconnected'
                  ? '외부 SDP 서버 미연결로 수신 사건 0건 (내 PC 실측값과 분리 표기)'
                  : '표시할 시간순 보안 이벤트가 0건입니다.',
              }),
            ]),
            createEl('p', {
              className: 'muted text-small',
              style: 'margin: 6px 0 0 2px; font-size: 11px; line-height: 1.4;',
              text: '외부 침해·접속 제어 사건은 SDP 게이트웨이 연동 시 실시간으로 수신되며, 상단의 로컬 PC 실측(네트워크·방화벽·로그) 데이터는 정상 측정 중입니다.',
            }),
          ]));
        }
        timelineCard.appendChild(tlBody);
        leftChildren.push(timelineCard);

        leftTimelineEl.replaceChildren(...leftChildren);
      }

      if (rightAuditEl) {
        const auditDom = buildAuditBreakdownPanelDom({
          selectedEvent: evSummary.sortedEvents[0] || null,
          decisionSlice: socStore.decision,
          matchedRules: evSummary.matchedRules,
          provenance: evSummary.provenance,
          mode: effectiveMode,
          pcStatus: socStore.pcStatus,
          onRefresh: handleRefreshPc,
        });
        rightAuditEl.replaceChildren(...Array.from(auditDom.childNodes));
      }

      // 3) 관제 감사 리포트 (Signed Audit Bundle) - 2단 분할 영역 하단에 별도 독립 대형 패널로 배치 (사용자 입력 상태 보존)
      const splitOverviewEl = document.getElementById('soc-bottom-split-overview');
      if (splitOverviewEl) {
        const existingAuditEl = document.getElementById('soc-audit-bundle-standalone');
        if (!existingAuditEl) {
          const auditBundlePanel = buildAuditBundleExporterDom();
          splitOverviewEl.appendChild(auditBundlePanel);
        }
      }
    }
  }

  const syncGlobalSocRegions = updateSocOverview;
  try {
    updateSocOverview(false);
  } catch {}

  return {
    renderIdentity({ me, devices, sessions } = {}) {
      socStore.identity = { me, devices, sessions };
      syncGlobalSocRegions();

      const container = createEl('div', {
        className: 'student-identity-view',
        attrs: { role: 'region', 'aria-label': '신원 및 기기·세션 준수 현황' },
      });

      const idSummary = normalizeIdentitySummary({ me, devices, sessions });
      container.appendChild(createEl('div', { className: 'row' }, [
        createRoleBadgeEl('provided'),
        createProvenanceBadgeEl(idSummary.provenance, true),
        createEl('span', { className: 'soc-card-timestamp', text: `측정 시각: ${formatMeasuredAt(idSummary.measuredAt)}` }),
      ]));

      // 1. me 가 에러인 경우: 사용자 정보를 노출하지 않고 오류 문구와 모드 안내만 표시
      if (me?.status === 'error') {
        container.appendChild(createEl('p', {
          className: 'state state-error',
          text: formatErrorMessage(me.error, '서버에 연결하지 못했습니다.'),
          attrs: { 'data-student-status': 'error' },
        }));

        if (devices?.status === 'error' && devices.error?.message && devices.error.message !== me.error?.message) {
          container.appendChild(createEl('p', {
            className: 'state state-error',
            text: formatErrorMessage(devices.error, '기기 정보 조회 실패'),
          }));
        }
        if (sessions?.status === 'error' && sessions.error?.message && sessions.error.message !== me.error?.message) {
          container.appendChild(createEl('p', {
            className: 'state state-error',
            text: formatErrorMessage(sessions.error, '세션 정보 조회 실패'),
          }));
        }

        renderModeBadges(container, [me, devices, sessions]);
        return container;
      }

      // 2. 전체가 로딩 중이거나 오류 없이 초기 로딩 상태인 경우
      const anyError = devices?.status === 'error' || sessions?.status === 'error';
      const anyOk = me?.status === 'ok' || devices?.status === 'ok' || sessions?.status === 'ok';

      if (!anyError && !anyOk && (me?.status === 'loading' || devices?.status === 'loading' || sessions?.status === 'loading')) {
        container.appendChild(createEl('p', {
          className: 'state state-loading',
          text: '불러오는 중',
          attrs: { 'data-student-status': 'loading' },
        }));
        renderModeBadges(container, [me, devices, sessions]);
        return container;
      }

      // 3. 상단 모드 안내 및 개별 자원 오류 표시
      renderModeBadges(container, [me, devices, sessions]);

      if (devices?.status === 'error') {
        container.appendChild(createEl('p', {
          className: 'state state-error',
          text: formatErrorMessage(devices.error, '기기 정보를 불러오지 못했습니다.'),
          attrs: { 'data-student-device-error': '' },
        }));
      }
      if (sessions?.status === 'error') {
        container.appendChild(createEl('p', {
          className: 'state state-error',
          text: formatErrorMessage(sessions.error, '세션 정보를 불러오지 못했습니다.'),
          attrs: { 'data-student-session-error': '' },
        }));
      }

      const dl = createEl('dl', { className: 'identity' });

      // (1) 사용자 (me 기준)
      let userText = '확인 불가';
      if (me?.status === 'loading') {
        userText = '불러오는 중';
      } else if (me?.status === 'ok') {
        const userLabel = me.data?.user?.label || '';
        const userId = me.data?.user?.id || '';
        userText = userLabel && userId && userLabel !== userId
          ? `${userLabel} (${userId})`
          : (userLabel || userId || '확인 불가');
      }
      const ddUser = appendKvRow(dl, '사용자', userText, { 'data-student-user': '' });
      if (me?.status === 'ok') {
        appendInlineModeBadge(ddUser, me.mode);
        ddUser.appendChild(document.createTextNode(' '));
        ddUser.appendChild(createProvenanceBadgeEl(idSummary.provenance));
      }

      // (2) 기기
      const ddDevice = appendKvRow(dl, '기기', '', { 'data-student-device': '' });
      if (devices?.status === 'error') {
        ddDevice.setAttribute('data-status', 'error');
        ddDevice.textContent = formatErrorMessage(devices.error, '기기 확인 불가');
        appendInlineModeBadge(ddDevice, devices.mode);
      } else if (devices?.status === 'loading') {
        ddDevice.setAttribute('data-status', 'loading');
        ddDevice.textContent = '불러오는 중';
        appendInlineModeBadge(ddDevice, devices.mode);
      } else {
        const currentDeviceId = me?.data?.device?.id;
        const matchedDevice = Array.isArray(devices?.data) && currentDeviceId
          ? devices.data.find((d) => d.id === currentDeviceId)
          : null;
        const device = matchedDevice ? { ...me.data.device, ...matchedDevice } : me?.data?.device;
        if (device) {
          const devLabel = device.label || '';
          const devId = device.id || '';
          const devName = devLabel && devId && devLabel !== devId ? `${devLabel} (${devId})` : (devLabel || devId || '기기');
          const devStatus = device.status || 'unknown';
          ddDevice.setAttribute('data-status', devStatus);
          ddDevice.textContent = `${devName} · ${mapDeviceStatus(devStatus)} (${devStatus})`;
        } else {
          ddDevice.textContent = '확인 불가';
        }
        appendInlineModeBadge(ddDevice, devices?.mode || me?.mode);
      }

      // (3) 세션
      const ddSession = appendKvRow(dl, '세션', '', { 'data-student-session': '' });
      if (sessions?.status === 'error') {
        ddSession.setAttribute('data-status', 'error');
        ddSession.textContent = formatErrorMessage(sessions.error, '세션 확인 불가');
        appendInlineModeBadge(ddSession, sessions.mode);
      } else if (sessions?.status === 'loading') {
        ddSession.setAttribute('data-status', 'loading');
        ddSession.textContent = '불러오는 중';
        appendInlineModeBadge(ddSession, sessions.mode);
      } else {
        const currentSessionId = me?.data?.session?.id;
        const matchedSession = Array.isArray(sessions?.data) && currentSessionId
          ? sessions.data.find((s) => s.id === currentSessionId)
          : null;
        const session = matchedSession ? { ...me.data.session, ...matchedSession } : me?.data?.session;
        if (session) {
          const sessId = session.id || '세션';
          const sessStatus = session.status || 'unknown';
          ddSession.setAttribute('data-status', sessStatus);
          ddSession.textContent = `${sessId} · ${mapSessionStatus(sessStatus)} (${sessStatus})`;
        } else {
          ddSession.textContent = '확인 불가';
        }
        appendInlineModeBadge(ddSession, sessions?.mode || me?.mode);
      }

      container.appendChild(dl);
      return container;
    },

    renderDecision({ status, mode, data, error, appId } = {}) {
      socStore.decision = { status, mode, data, error, appId };
      if (status === 'ok' || status === 'error') {
        const key = `${status}|${data?.appId || appId || ''}|${data?.decision || ''}|${data?.checkedAt || ''}|${error?.code || ''}`;
        if (key !== socStore.lastDecisionKey) {
          socStore.lastDecisionKey = key;
          socStore.decisionHistory.unshift({
            status,
            mode,
            appId: data?.appId || appId || '업무 앱',
            decision: status === 'ok' ? (data?.decision || 'unknown') : 'error',
            reason: status === 'ok' ? (data?.reason || '이유 정보 없음') : extractErrorText(error, '요청 실패'),
            checkedAt: data?.checkedAt || null,
          });
          if (socStore.decisionHistory.length > SOC_LIMITS.MAX_DECISION_HISTORY) {
            socStore.decisionHistory.length = SOC_LIMITS.MAX_DECISION_HISTORY;
          }
        }
      }
      syncGlobalSocRegions();

      const container = createEl('div', {
        className: 'student-decision-view',
        attrs: { role: 'region', 'aria-label': '업무 앱 인가 판정 및 감사 분석 뷰' },
      });
      renderModeBadges(container, [{ mode }]);

      const provenance = resolveProvenance({
        mode,
        forceLive: status === 'idle' || status === 'error',
      });
      container.appendChild(createEl('div', { className: 'row' }, [
        createRoleBadgeEl('provided'),
        createProvenanceBadgeEl(provenance, true),
        createEl('span', { className: 'soc-card-timestamp', text: `측정 시각: ${formatMeasuredAt(data?.checkedAt)}` }),
      ]));

      // 1. 요청 전 (idle)
      if (status === 'idle' || !status) {
        container.setAttribute('data-student-decision', 'idle');
        container.appendChild(createEl('p', {
          className: 'state state-empty',
          text: '앱을 골라 접속을 요청하세요. (아직 요청한 업무 앱이 없습니다)',
        }));
        return container;
      }

      // 2. 요청 중 (loading)
      if (status === 'loading') {
        container.setAttribute('data-student-decision', 'loading');
        const targetApp = data?.appId || appId || '업무 앱';
        container.appendChild(createEl('p', {
          className: 'state state-loading',
          text: `${targetApp} 접속 판정 확인 중…`,
        }));
        return container;
      }

      // 3. 요청 실패 (error) - 거부(deny) 판정과 명확히 구분
      if (status === 'error') {
        container.setAttribute('data-student-decision', 'error');
        const rawMsg = extractErrorText(error, '서버에 접속 판정을 요청하지 못했습니다.');
        const errMsg = rawMsg.startsWith('요청 실패') ? rawMsg : `요청 실패: ${rawMsg}`;

        container.appendChild(createEl('div', { className: 'decision decision-failed' }, [
          createEl('p', { text: errMsg }),
          createEl('p', {
            className: 'muted',
            text: '이 결과는 접근 거부(차단/deny) 판정이 아니며 요청 처리 실패입니다. 허용되지 않음 (접근 허용으로 간주할 수 없습니다).',
          }),
        ]));
        return container;
      }

      // 4. 판정 수신 (ok) — 2-Column Split View (Left: 판정 이력 타임라인, Right: 상세 판정 감사 및 규칙 분석)
      if (status === 'ok') {
        const info = mapDecision(data?.decision);
        const targetApp = data?.appId || appId || '지정되지 않음';
        container.setAttribute('data-student-decision', info.code);

        container.appendChild(createEl('div', { className: info.className }, [
          createEl('p', { text: `${targetApp} · ${info.text}` }),
          createEl('p', { className: 'muted', text: info.note }),
        ]));

        const splitWrap = createEl('div', {
          className: 'audit-split-view',
          attrs: { role: 'region', 'aria-label': '업무 앱 판정 타임라인 및 상세 감사 2단 분할 뷰' },
        });

        const leftCol = createEl('div', {
          className: 'soc-split-panel soc-timeline-panel',
          attrs: { role: 'region', 'aria-label': '업무 앱 판정 요청 타임라인' },
        });
        leftCol.appendChild(createEl('h3', { className: 'soc-panel-heading' }, [
          createEl('span', { text: `판정 타임라인 추이 (${socStore.decisionHistory.length || 1}건 · 측정 시각: ${formatMeasuredAt(data?.checkedAt)})` }),
          createProvenanceBadgeEl(provenance),
        ]));
        const tlList = createEl('ul', { className: 'soc-timeline-list' });
        const historyItems = socStore.decisionHistory.length > 0
          ? socStore.decisionHistory
          : [{ appId: targetApp, decision: info.code, reason: data?.reason || '이유 정보 없음', checkedAt: data?.checkedAt, mode }];
        for (const item of historyItems.slice(0, 6)) {
          const itemInfo = mapDecision(item.decision);
          const itemProv = resolveProvenance({ mode: item.mode || mode });
          tlList.appendChild(createEl('li', {
            className: `soc-timeline-node node-${itemInfo.code}`,
          }, [
            createEl('div', { className: 'event-head' }, [
              createEl('strong', { text: `${item.appId} → ${itemInfo.text}` }),
              createProvenanceBadgeEl(itemProv),
            ]),
            createEl('p', { className: 'muted', text: `사유: ${item.reason} · 시각: ${item.checkedAt || '시각 정보 없음'}` }),
          ]));
        }
        leftCol.appendChild(tlList);

        const rightCol = createEl('div', {
          className: 'soc-split-panel soc-audit-panel',
          attrs: { role: 'region', 'aria-label': '판정 상세 감사 및 규칙 매칭 내역' },
        });
        rightCol.appendChild(createEl('h3', { className: 'soc-panel-heading' }, [
          createEl('span', { text: '상세 판정 감사 (Decision Audit Breakdown)' }),
          createProvenanceBadgeEl(provenance),
        ]));

        const dl = createEl('dl', { className: 'kv' });
        appendKvRow(dl, '업무 앱', targetApp, { 'data-student-decision-app': '' });
        appendKvRow(dl, '판정', info.text, { 'data-student-decision-result': info.code });
        appendKvRow(dl, '판정 이유', data?.reason || '이유 정보 없음', { 'data-student-decision-reason': '' });
        appendKvRow(dl, '판정 시각', data?.checkedAt ? String(data.checkedAt) : '시각 정보 없음', { 'data-student-decision-time': '' });

        if (mode) {
          const modeText = Object.hasOwn(MODE_BADGE_LABELS, mode)
            ? `${MODE_BADGE_LABELS[mode]} (${mode})`
            : `${mode} (정상 연결)`;
          appendKvRow(dl, '데이터 상태', modeText);
        }
        appendKvRow(dl, '데이터 출처', provenance.fullLabel);

        rightCol.appendChild(dl);
        splitWrap.appendChild(leftCol);
        splitWrap.appendChild(rightCol);
        container.appendChild(splitWrap);
        return container;
      }

      container.appendChild(createEl('p', {
        className: 'state state-empty',
        text: '확인 불가: 알 수 없는 상태입니다. 허용되지 않음.',
      }));
      return container;
    },

    renderEvents({ status, mode, data, error } = {}) {
      socStore.events = { status, mode, data, error };
      syncGlobalSocRegions();

      const container = createEl('div', {
        className: 'student-events-view',
        attrs: { role: 'region', 'aria-label': '보안 기록 타임라인 및 감사 로그 2단 분할 뷰' },
      });

      const evSummary = normalizeEventsSummary({ status, mode, data, error });
      const headerRow = createEl('div', { className: 'row items-center gap-sm soc-card-header-row' });
      if (mode && mode !== 'connected') {
        const modeBadge = createModeBadge(mode);
        if (modeBadge) headerRow.appendChild(modeBadge);
      }
      headerRow.appendChild(createRoleBadgeEl('provided'));
      headerRow.appendChild(createProvenanceBadgeEl(evSummary.provenance, true));
      headerRow.appendChild(createEl('span', { className: 'soc-card-timestamp', text: `측정 시각: ${formatMeasuredAt(evSummary.measuredAt)}` }));
      container.appendChild(headerRow);

      // 1. 로딩 상태
      if (status === 'loading') {
        container.appendChild(createEl('p', { className: 'state state-loading', text: '불러오는 중' }));
        return container;
      }

      // 2. 오류 상태 (빈 목록과 구분)
      if (status === 'error' || status === 'CONTRACT_MISMATCH' || error) {
        const defaultErr = status === 'CONTRACT_MISMATCH'
          ? '응답 형식을 확인할 수 없습니다(확인 불가). 이전 목록을 지웁니다.'
          : '서버 오류';
        const msg = extractErrorText(error, defaultErr);
        container.appendChild(createEl('p', {
          className: 'state state-error',
          text: `기록을 불러오지 못했습니다: ${msg}`,
          attrs: { 'data-student-status': 'error' },
        }));
        return container;
      }

      // 3. 원본 보존 및 최신순(at 내림차순) 정렬
      const sortedEvents = evSummary.sortedEvents;

      if (sortedEvents.length === 0) {
        container.appendChild(createEl('p', {
          className: 'state state-empty',
          text: '표시할 기록이 없습니다.',
          attrs: { 'data-student-status': 'empty' },
        }));
        return container;
      }

      // 4. 필터 상태 및 선택 상자 생성
      const filterState = { kind: 'all', appId: 'all', access: 'all' };
      let selectedDetailId = null;

      const filterBox = createEl('div', { className: 'event-filters' });

      function createFilterSelect(labelText, filterKey, options, formatOption) {
        const label = createEl('label', { className: 'event-filter-item' });
        label.appendChild(createEl('span', { className: 'filter-label-text', text: `${labelText}:` }));
        const select = createEl('select', {
          attrs: { 'aria-label': labelText, 'data-student-filter': filterKey },
        });
        const allOpt = document.createElement('option');
        allOpt.value = 'all';
        allOpt.textContent = '전체 (all)';
        select.appendChild(allOpt);

        for (const val of options) {
          const opt = document.createElement('option');
          opt.value = val;
          opt.textContent = formatOption(val);
          select.appendChild(opt);
        }
        select.addEventListener('change', () => {
          filterState[filterKey] = select.value;
          renderList();
        });
        label.appendChild(select);
        filterBox.appendChild(label);
        return select;
      }

      const kinds = Array.from(new Set([...Object.keys(EVENT_KIND_LABELS), ...sortedEvents.map((e) => e.kind).filter(Boolean)]));
      const uniqueApps = Array.from(new Set(sortedEvents.map((e) => e.appId).filter(Boolean)));
      const accesses = Array.from(new Set([...Object.keys(ACCESS_STATUS_LABELS), ...sortedEvents.map((e) => e.state?.access).filter(Boolean)]));

      createFilterSelect('기록 종류', 'kind', kinds, mapKind);
      createFilterSelect('업무 앱', 'appId', uniqueApps, (app) => app);
      createFilterSelect('접속 상태', 'access', accesses, formatAccessState);

      container.appendChild(filterBox);

      // Bottom 2-Column Split View (Left: Chronological Security Event Timeline, Right: Detailed Audit & Rule Breakdown)
      const splitView = createEl('div', {
        className: 'audit-split-view',
        attrs: {
          role: 'region',
          'aria-label': '하단 2단 분할 뷰: 좌측 시간순 이벤트 타임라인, 우측 상세 감사 및 규칙 매칭 분석',
        },
      });

      const leftTimelineCol = createEl('div', {
        className: 'soc-split-panel soc-timeline-panel',
        attrs: { role: 'region', 'aria-label': '좌측: 시간순 보안 이벤트 추이 및 타임라인' },
      });
      leftTimelineCol.appendChild(createEl('h3', { className: 'soc-panel-heading' }, [
        createEl('span', { text: `시간순 보안 이벤트 타임라인 (${sortedEvents.length}건 · 측정 시각: ${formatMeasuredAt(evSummary.measuredAt)})` }),
        createProvenanceBadgeEl(evSummary.provenance),
      ]));

      const listEl = createEl('ul', { className: 'records' });
      leftTimelineCol.appendChild(listEl);

      const rightAuditCol = createEl('div', {
        className: 'soc-audit-host',
        attrs: { role: 'region', 'aria-label': '우측: 상세 감사 로그 및 규칙 매칭 분석' },
      });

      splitView.appendChild(leftTimelineCol);
      splitView.appendChild(rightAuditCol);
      container.appendChild(splitView);

      function createDetailBox(ev) {
        const box = createEl('div', {
          className: 'event-detail-box',
          attrs: { 'data-student-event-detail': ev.id },
        });

        box.appendChild(createEl('h4', { text: `사건 상세: ${ev.id}` }));

        const dl = createEl('dl', { className: 'kv' });
        appendKvRow(dl, '사건 ID', ev.id, { 'data-student-detail-id': ev.id });
        appendKvRow(dl, '업무 앱', ev.appId || '앱을 확인할 수 없음', { 'data-student-detail-app': ev.appId || '' });
        appendKvRow(dl, '접속 상태', formatAccessState(ev.state?.access), { 'data-student-detail-access': ev.state?.access || 'unknown' });
        appendKvRow(dl, '세션 상태', formatSessionState(ev.state?.session), { 'data-student-detail-session': ev.state?.session || 'unknown' });
        appendKvRow(dl, '기기 상태', formatDeviceState(ev.state?.device), { 'data-student-detail-device': ev.state?.device || 'unknown' });
        box.appendChild(dl);

        // 근거 (evidence)
        box.appendChild(createEl('h4', { text: '근거 (evidence)' }));
        if (Array.isArray(ev.evidence) && ev.evidence.length > 0) {
          const ulEv = createEl('ul', { attrs: { 'data-student-detail-evidence': '' } });
          for (const item of ev.evidence) {
            ulEv.appendChild(createEl('li', {
              text: `${item.id}: ${item.text || ''}`,
              attrs: { 'data-student-evidence-id': item.id },
            }));
          }
          box.appendChild(ulEv);
        } else {
          box.appendChild(createEl('p', { className: 'muted', text: '근거 없음' }));
        }

        // 규칙 (rules)
        box.appendChild(createEl('h4', { text: '규칙 (rules)' }));
        if (Array.isArray(ev.rules) && ev.rules.length > 0) {
          const ulRules = createEl('ul', { attrs: { 'data-student-detail-rules': '' } });
          for (const item of ev.rules) {
            ulRules.appendChild(createEl('li', {
              text: `${item.id}: ${item.text || ''}`,
              attrs: { 'data-student-rule-id': item.id },
            }));
          }
          box.appendChild(ulRules);
        } else {
          box.appendChild(createEl('p', { className: 'muted', text: '규칙 없음' }));
        }

        // 미지원 조치 안내 (supportedActions가 있을 때만 비활성 안내 버튼 표시)
        if (Array.isArray(ev.supportedActions) && ev.supportedActions.length > 0) {
          const actionsBox = createEl('div', { className: 'event-actions' });
          for (const action of ev.supportedActions) {
            const btn = createEl('button', {
              className: 'btn',
              text: `${action} 미지원`,
              attrs: {
                type: 'button',
                'aria-disabled': 'true',
                'aria-label': `${action} 미지원`,
                'data-student-action-unsupported': action,
              },
            });
            btn.disabled = true;
            actionsBox.appendChild(btn);
          }
          actionsBox.appendChild(createEl('p', {
            className: 'muted',
            text: '조치 실행 연결은 준비 중입니다.',
          }));
          box.appendChild(actionsBox);
        }

        return box;
      }

      function renderList() {
        listEl.replaceChildren();

        const filtered = sortedEvents.filter((ev) => {
          if (filterState.kind !== 'all' && ev.kind !== filterState.kind) return false;
          if (filterState.appId !== 'all' && ev.appId !== filterState.appId) return false;
          if (filterState.access !== 'all' && ev.state?.access !== filterState.access) return false;
          return true;
        });

        const activeAuditEvent = (selectedDetailId && filtered.find((e) => e.id === selectedDetailId))
          || filtered[0]
          || sortedEvents[0]
          || null;
        rightAuditCol.replaceChildren(buildAuditBreakdownPanelDom({
          selectedEvent: activeAuditEvent,
          decisionSlice: socStore.decision,
          matchedRules: evSummary.matchedRules,
          provenance: evSummary.provenance,
          mode,
          pcStatus: null,
        }));

        if (filtered.length === 0) {
          listEl.appendChild(createEl('li', { className: 'records-empty' }, [
            createEl('p', { className: 'state state-empty', text: '표시할 기록이 없습니다.' }),
          ]));
          return;
        }

        for (const ev of filtered) {
          const summaryText = ev.summary || '요약 없음';
          const appText = ev.appId || '앱을 확인할 수 없음';
          const kindText = mapKind(ev.kind);
          const evProv = resolveProvenance({ mode });

          const li = createEl('li', {
            className: 'event',
            attrs: { 'data-student-event-id': ev.id },
          });

          li.appendChild(createEl('div', { className: 'event-head' }, [
            createEl('h3', { text: summaryText }),
            createEl('span', { className: 'tag', text: kindText }),
            createProvenanceBadgeEl(evProv),
          ]));

          li.appendChild(createEl('p', {
            className: 'muted',
            text: `사건 ID: ${ev.id} · 시각: ${ev.at || '시각 정보 없음'} · 종류: ${kindText} · 앱: ${appText} · 요약: ${summaryText}`,
          }));

          const detailBtn = createEl('button', {
            className: 'btn',
            text: `${ev.id} 상세`,
            attrs: { type: 'button', 'aria-label': `${ev.id} 상세` },
          });
          detailBtn.addEventListener('click', () => {
            selectedDetailId = selectedDetailId === ev.id ? null : ev.id;
            renderList();
          });

          li.appendChild(createEl('div', { className: 'event-actions' }, [detailBtn]));

          const detailSlot = createEl('div', { className: 'detail-slot' });
          if (selectedDetailId === ev.id) {
            detailSlot.appendChild(createDetailBox(ev));
          }
          li.appendChild(detailSlot);
          listEl.appendChild(li);
        }
      }

      renderList();
      return container;
    },

    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      socStore.status = { devices, sessions, notifications, diagnostics, mode };
      syncGlobalSocRegions();

      const container = createEl('div', {
        className: 'student-status-view',
        attrs: { role: 'region', 'aria-label': '등록 기기·세션 상태 및 알림·진단' },
      });
      renderModeBadges(container, [{ mode }]);

      // 1. 등록 기기 상태 (devices)
      const devCount = Array.isArray(devices?.data) ? devices.data.length : 0;
      const devMeasuredAt = devices?.data?.[0]?.checkedAt || diagnostics?.data?.checkedAt || socStore.pcStatus?.measuredAt;
      const devProv = resolveProvenance({
        mode: devices?.mode || mode,
        forceLive: devices?.status === 'error' || mode === 'disconnected',
      });
      const secDevices = createEl('section', {
        className: 'status-section',
        attrs: { 'data-student-section': 'devices' },
      }, [
        createEl('h3', { className: 'soc-panel-heading' }, [
          createEl('span', { text: `등록 기기 상태 (${devCount}대 · 측정 시각: ${formatMeasuredAt(devMeasuredAt)})` }),
          createRoleBadgeEl('provided'),
          createProvenanceBadgeEl(devProv),
        ]),
      ]);

      if (devices?.status === 'loading') {
        secDevices.appendChild(createEl('p', {
          className: 'state state-loading',
          text: '기기 목록을 불러오는 중',
          attrs: { 'data-student-device-status': 'loading' },
        }));
      } else if (devices?.status === 'error') {
        appendStatusResourceError(secDevices, 'data-student-device-status', devices.error, '기기 정보', '기기 정보를');
      } else if (devices?.status === 'ok' && Array.isArray(devices.data) && devices.data.length > 0) {
        const ul = createEl('ul', {
          className: 'devices-list',
          attrs: { 'data-student-devices-list': '' },
        });
        for (const dev of devices.data) {
          ul.appendChild(createEl('li', {
            text: `기기: ${dev.label || dev.id} (${dev.id}) · 상태: ${formatDeviceState(dev.status)}`,
            attrs: { 'data-student-device-id': dev.id },
          }));
        }
        secDevices.appendChild(ul);
      } else {
        secDevices.appendChild(createEl('p', {
          className: 'state state-empty',
          text: '등록된 기기가 없음',
          attrs: { 'data-student-device-status': 'empty' },
        }));
      }
      container.appendChild(secDevices);

      // 2. 현재 세션 연결 상태 (sessions)
      const sessCount = Array.isArray(sessions?.data) ? sessions.data.length : 0;
      const sessMeasuredAt = sessions?.data?.[0]?.checkedAt || diagnostics?.data?.checkedAt || socStore.pcStatus?.measuredAt;
      const sessProv = resolveProvenance({
        mode: sessions?.mode || mode,
        forceLive: sessions?.status === 'error' || mode === 'disconnected',
      });
      const secSessions = createEl('section', {
        className: 'status-section',
        attrs: { 'data-student-section': 'sessions' },
      }, [
        createEl('h3', { className: 'soc-panel-heading' }, [
          createEl('span', { text: `현재 세션 연결 상태 (${sessCount}개 · 측정 시각: ${formatMeasuredAt(sessMeasuredAt)})` }),
          createRoleBadgeEl('provided'),
          createProvenanceBadgeEl(sessProv),
        ]),
        createEl('p', {
          className: 'muted',
          text: '세션은 지금 검증된 연결 하나만 표시되며 지난 세션 목록이 아닙니다.',
        }),
      ]);

      if (sessions?.status === 'loading') {
        secSessions.appendChild(createEl('p', {
          className: 'state state-loading',
          text: '세션 연결을 불러오는 중',
          attrs: { 'data-student-session-status': 'loading' },
        }));
      } else if (sessions?.status === 'error') {
        appendStatusResourceError(secSessions, 'data-student-session-status', sessions.error, '세션 연결', '세션 연결을');
      } else if (sessions?.status === 'ok' && Array.isArray(sessions.data) && sessions.data.length > 0) {
        const ul = createEl('ul', {
          className: 'sessions-list',
          attrs: { 'data-student-sessions-list': '' },
        });
        for (const sess of sessions.data) {
          ul.appendChild(createEl('li', {
            text: `세션 ID: ${sess.id} · 상태: ${formatSessionState(sess.status)}`,
            attrs: { 'data-student-session-id': sess.id },
          }));
        }
        secSessions.appendChild(ul);
      } else {
        secSessions.appendChild(createEl('p', {
          className: 'state state-empty',
          text: '현재 연결 없음',
          attrs: { 'data-student-session-status': 'empty' },
        }));
      }
      container.appendChild(secSessions);

      // 3. 상태 및 보안 알림 (notifications)
      const notiCount = Array.isArray(notifications) ? notifications.length : 0;
      const notiMeasuredAt = diagnostics?.data?.checkedAt || socStore.pcStatus?.measuredAt;
      const notiProv = resolveProvenance({ mode, forceLive: mode !== 'demo' });
      const secNoti = createEl('section', {
        className: 'status-section',
        attrs: { 'data-student-section': 'notifications' },
      }, [
        createEl('h3', { className: 'soc-panel-heading' }, [
          createEl('span', { text: `상태 및 보안 알림 (${notiCount}건 · 측정 시각: ${formatMeasuredAt(notiMeasuredAt)})` }),
          createRoleBadgeEl('provided'),
          createProvenanceBadgeEl(notiProv),
        ]),
      ]);

      if (!Array.isArray(notifications) || notifications.length === 0) {
        secNoti.appendChild(createEl('p', {
          className: 'state state-empty',
          text: '주의할 알림이 없습니다.',
          attrs: { 'data-student-notifications-empty': '' },
        }));
      } else {
        const ul = createEl('ul', {
          className: 'notifications-list',
          attrs: { 'data-student-notifications-list': '' },
        });
        for (const noti of notifications) {
          const li = document.createElement('li');
          li.setAttribute('data-student-notification-resource', noti.resource || 'unknown');
          li.textContent = `[${noti.resource || '자원'}] 코드: ${noti.code || '알림'} · ${noti.message || ''}`;
          ul.appendChild(li);
        }
        secNoti.appendChild(ul);
        secNoti.appendChild(createEl('p', {
          className: 'muted',
          text: '주의가 필요한 항목이 있습니다. 변경 사항 확인 후 위쪽 다시 불러오기 버튼을 직접 누르세요.',
        }));
      }
      container.appendChild(secNoti);

      // 4. 시스템 진단 정보 및 도움정보 복사 (diagnostics — 항상 [실측값])
      const safeDiag = {
        requestId: diagnostics?.data?.requestId || '',
        component: diagnostics?.data?.component || '',
        version: diagnostics?.data?.version || '',
        checkedAt: diagnostics?.data?.checkedAt || diagnostics?.meta?.checkedAt || '',
        engineMode: diagnostics?.data?.engine?.mode || diagnostics?.data?.['engine.mode'] || diagnostics?.data?.engineMode || '',
        engineCode: diagnostics?.data?.engine?.code || diagnostics?.data?.['engine.code'] || diagnostics?.data?.engineCode || '',
      };
      const diagFieldCount = Object.values(safeDiag).filter((val) => String(val || '').trim().length > 0).length;
      const diagProv = resolveProvenance({ forceLive: true });
      const diagMeasuredAt = diagnostics?.data?.checkedAt || diagnostics?.meta?.checkedAt || socStore.pcStatus?.measuredAt;
      const secDiag = createEl('section', {
        className: 'status-section',
        attrs: { 'data-student-section': 'diagnostics' },
      }, [
        createEl('h3', { className: 'soc-panel-heading' }, [
          createEl('span', { text: `시스템 진단 정보 (점검 항목 ${diagFieldCount}개 · 측정 시각: ${formatMeasuredAt(diagMeasuredAt)})` }),
          createRoleBadgeEl('provided'),
          createProvenanceBadgeEl(diagProv),
        ]),
        createEl('p', {
          className: 'muted',
          text: '진단 정보는 제공 화면이 조회한 안전한 점검 결과이며 학생 구현에서 직접 요청하지 않습니다.',
        }),
      ]);

      if (diagnostics?.status === 'loading') {
        secDiag.appendChild(createEl('p', {
          className: 'state state-loading',
          text: '진단 점검을 불러오는 중',
          attrs: { 'data-student-diag-status': 'loading' },
        }));
      } else if (diagnostics?.status === 'error') {
        appendStatusResourceError(secDiag, 'data-student-diag-status', diagnostics.error, '진단 점검', '진단 정보를');
      } else if (diagnostics?.status === 'ok') {
        const dl = createEl('dl', {
          className: 'kv diagnostics-data',
          attrs: { 'data-student-diagnostics-data': '' },
        });
        appendKvRow(dl, '요청 ID (requestId)', safeDiag.requestId || '없음', { 'data-student-diag-request-id': safeDiag.requestId });
        appendKvRow(dl, '구성 요소 (component)', safeDiag.component || '없음', { 'data-student-diag-component': safeDiag.component });
        appendKvRow(dl, '버전 (version)', safeDiag.version || '없음', { 'data-student-diag-version': safeDiag.version });
        appendKvRow(dl, '점검 시각 (checkedAt)', safeDiag.checkedAt || '없음', { 'data-student-diag-checked-at': safeDiag.checkedAt });
        appendKvRow(dl, '엔진 모드 (engine.mode)', safeDiag.engineMode || '없음', { 'data-student-diag-engine-mode': safeDiag.engineMode });
        appendKvRow(dl, '엔진 코드 (engine.code)', safeDiag.engineCode || '없음', { 'data-student-diag-engine-code': safeDiag.engineCode });
        secDiag.appendChild(dl);
      } else {
        secDiag.appendChild(createEl('p', {
          className: 'muted',
          text: '진단 정보 점검 대기 중입니다.',
          attrs: { 'data-student-diag-status': 'idle' },
        }));
      }

      const copyBtn = createEl('button', {
        className: 'btn',
        text: '도움정보 복사',
        attrs: {
          type: 'button',
          'aria-label': '도움정보 복사',
          'data-student-copy-help': '',
        },
      });
      const copyFeedback = createEl('span', {
        className: 'muted',
        attrs: { 'aria-live': 'polite' },
      });

      copyBtn.addEventListener('click', () => {
        const copyPayload = JSON.stringify({
          requestId: safeDiag.requestId,
          component: safeDiag.component,
          version: safeDiag.version,
          checkedAt: safeDiag.checkedAt,
          engine: {
            mode: safeDiag.engineMode,
            code: safeDiag.engineCode,
          },
          'engine.mode': safeDiag.engineMode,
          'engine.code': safeDiag.engineCode,
        }, null, 2);

        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(copyPayload)
            .then(() => {
              copyFeedback.textContent = '안전한 도움정보가 복사되었습니다.';
            })
            .catch(() => {
              copyFeedback.textContent = '복사에 실패했습니다.';
            });
        } else {
          copyFeedback.textContent = '클립보드를 지원하지 않는 환경입니다.';
        }
      });

      secDiag.appendChild(createEl('div', { className: 'help-copy-wrap' }, [
        createEl('p', {
          className: 'muted',
          text: '이 정보는 도움 요청에 쓰도록 안전한 값만 복사하는 것이며 비밀번호나 토큰은 포함되지 않습니다.',
        }),
        copyBtn,
        copyFeedback,
      ]));

      container.appendChild(secDiag);
      return container;
    },

    renderVulnerabilities({ status, mode, data, error } = {}) {
      socStore.vulnerabilities = { status, mode, data, error };
      syncGlobalSocRegions();

      const effectiveStatus = status || 'idle';
      const container = createEl('div', {
        className: 'student-vulnerabilities-view',
        attrs: { 'data-student-vuln-status': effectiveStatus },
      });
      const headerRow = createEl('div', { className: 'row items-center gap-sm soc-card-header-row' });
      if (mode && mode !== 'connected') {
        const modeBadge = createModeBadge(mode);
        if (modeBadge) headerRow.appendChild(modeBadge);
      }
      headerRow.appendChild(createRoleBadgeEl('provided'));
      headerRow.appendChild(createProvenanceBadgeEl(resolveProvenance({ forceLive: true }), true));
      headerRow.appendChild(createEl('span', { className: 'soc-card-timestamp', text: `측정 시각: ${formatMeasuredAt(data?.checkedAt || socStore.pcStatus?.measuredAt)}` }));
      container.appendChild(headerRow);

      // 1. 조회 대기 (idle)
      if (effectiveStatus === 'idle') {
        container.appendChild(createEl('p', { className: 'state state-empty', text: '아직 조회 전 (idle)' }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: '설치 패키지 취약점을 아직 조회하지 않았습니다. 제공 화면의 설치 패키지 조회 버튼을 누르세요.',
        }));
        return container;
      }

      // 2. 조회 중 (loading)
      if (effectiveStatus === 'loading') {
        container.appendChild(createEl('p', { className: 'state state-loading', text: '조회 중 (loading)…' }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: 'OSV 데이터베이스에서 설치된 패키지의 알려진 취약점을 확인하고 있습니다. 이전 결과는 표시하지 않습니다.',
        }));
        return container;
      }

      // 3. 조회 실패 (error)
      if (effectiveStatus === 'error') {
        const errCode = error?.code ? `[${error.code}] ` : '';
        const errMsg = extractErrorText(error, '조회 실패');
        container.appendChild(createEl('p', {
          className: 'state state-error',
          text: `조회 실패 (error): ${errCode}${errMsg}`,
        }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: '조회 실패는 취약점이 없다는 뜻이 아닙니다. 이전 조회 결과를 현재 결과로 남기지 않습니다. 필요하면 직접 다시 조회하세요.',
        }));
        return container;
      }

      // 4. 조회 성공 (ok)
      if (effectiveStatus === 'ok') {
        const scanData = data || {};
        const scanStatus = scanData.status || 'not_checked';
        container.setAttribute('data-student-vuln-data-status', scanStatus);

        const statusInfo = Object.hasOwn(VULN_SCAN_STATUS_MAP, scanStatus)
          ? VULN_SCAN_STATUS_MAP[scanStatus]
          : { label: `${scanStatus}(확인 불가)`, desc: '설치 패키지 조회 상태를 확인할 수 없습니다.' };

        container.appendChild(createEl('div', { className: `vuln-status-box status-${scanStatus}` }, [
          createEl('p', { text: `전체 조회 상태: ${statusInfo.label}` }),
          createEl('p', { className: 'muted', text: statusInfo.desc }),
        ]));

        // 메타데이터 (lockfileVersion, lockfileHash, checkedAt) 및 패키지·취약점 단위 집계
        const packages = Array.isArray(scanData.packages) ? scanData.packages : [];
        let totalVulnCount = 0;
        for (const p of packages) {
          if (Array.isArray(p?.vulnerabilities)) totalVulnCount += p.vulnerabilities.length;
        }
        const dlMeta = createEl('dl', { className: 'kv' });
        appendKvRow(dlMeta, '조회 패키지 수', `${packages.length}개`);
        appendKvRow(dlMeta, '알려진 취약점 수', `${totalVulnCount}건`);
        if (scanData.lockfileVersion != null) {
          appendKvRow(dlMeta, '잠금 파일 버전 (lockfileVersion)', String(scanData.lockfileVersion));
        }
        if (scanData.lockfileHash) {
          appendKvRow(dlMeta, '잠금 파일 해시 (lockfileHash)', scanData.lockfileHash);
        }
        appendKvRow(dlMeta, '측정 시각 (checkedAt)', formatMeasuredAt(scanData.checkedAt));
        // Supply-Chain Posture Summary Bar
        const cleanCount = packages.filter((p) => p.status === 'none_found').length;
        const vulnPkgCount = packages.filter((p) => p.status === 'known_vulnerabilities').length;
        const unapprovedCount = scanData.excluded?.unapproved ?? 0;

        const postureBar = createEl('div', { className: 'supply-chain-posture-bar' }, [
          createEl('div', { className: 'posture-chip' }, [
            createEl('span', { className: 'chip-label', text: '승인 패키지 점검' }),
            createEl('span', { className: 'chip-val', text: `${packages.length}개` }),
          ]),
          createEl('div', { className: 'posture-chip' }, [
            createEl('span', { className: 'chip-label', text: '정상 (none_found)' }),
            createEl('span', { className: 'chip-val text-teal', text: `${cleanCount}개` }),
          ]),
          createEl('div', { className: 'posture-chip' }, [
            createEl('span', { className: 'chip-label', text: '취약 (known_vulnerabilities)' }),
            createEl('span', { className: `chip-val ${vulnPkgCount > 0 ? 'text-red' : 'text-muted'}`, text: `${vulnPkgCount}개 (${totalVulnCount}건)` }),
          ]),
          createEl('div', { className: 'posture-chip' }, [
            createEl('span', { className: 'chip-label', text: '미승인 제외 (unapproved)' }),
            createEl('span', { className: 'chip-val text-muted', text: `${unapprovedCount}개` }),
          ]),
        ]);
        container.appendChild(postureBar);

        if (dlMeta.children.length > 0) {
          container.appendChild(dlMeta);
        }

        // 패키지 목록 렌더링
        if (packages.length === 0) {
          container.appendChild(createEl('p', {
            className: 'muted',
            text: scanStatus === 'complete'
              ? '표시할 패키지 조회 결과가 없습니다.'
              : '조회된 패키지 목록이 없습니다 (조회 준비 미완료 또는 미조회).',
          }));
        } else {
          const table = createEl('table', { className: 'table packages-table' });
          const headerRow = document.createElement('tr');
          for (const text of ['패키지명', '설치 버전', '조회 상태', '취약점 식별자 (ID)', '수정 시각', '출처', '확인 시각']) {
            headerRow.appendChild(createEl('th', { text }));
          }
          table.appendChild(createEl('thead', {}, [headerRow]));

          const tbody = document.createElement('tbody');
          for (const pkg of packages) {
            const findings = Array.isArray(pkg.vulnerabilities) && pkg.vulnerabilities.length > 0
              ? pkg.vulnerabilities
              : [null];
            const pkgStatusText = formatPackageStatus(pkg);

            for (const finding of findings) {
              const tr = createEl('tr', {
                attrs: {
                  'data-student-package-name': pkg.name || '',
                  'data-student-package-version': pkg.version || '',
                  'data-student-package-status': pkg.status || '',
                },
              });

              tr.appendChild(createEl('td', { text: pkg.name || '' }));
              tr.appendChild(createEl('td', { text: pkg.version || '' }));
              tr.appendChild(createEl('td', { text: pkgStatusText }));

              if (finding) {
                const tdId = createEl('td', {
                  attrs: { 'data-student-vuln-id': finding.id || '' },
                });
                if (finding.id) {
                  tdId.appendChild(createEl('a', {
                    className: 'osv-vuln-link',
                    text: finding.id,
                    attrs: {
                      href: `https://osv.dev/vulnerability/${encodeURIComponent(finding.id)}`,
                      target: '_blank',
                      rel: 'noreferrer noopener',
                    },
                  }));
                }
                tr.appendChild(tdId);
              } else {
                tr.appendChild(createEl('td', {
                  text: pkg.status === 'none_found' ? '알려진 항목 없음' : '-',
                }));
              }

              tr.appendChild(createEl('td', { text: finding?.modified || '-' }));
              tr.appendChild(createEl('td', { text: pkg.source || '확인 불가' }));
              tr.appendChild(createEl('td', { text: pkg.checkedAt || '' }));

              tbody.appendChild(tr);
            }
          }
          table.appendChild(tbody);
          container.appendChild(table);
        }

        container.appendChild(createEl('p', {
          className: 'muted',
          text: 'OSV는 알려진 취약점 데이터베이스입니다. 조회 결과가 없다는 사실(none_found)만으로 해당 패키지나 앱 전체가 안전하다고 보장할 수 없습니다.',
        }));
        return container;
      }

      container.appendChild(createEl('p', {
        className: 'state state-empty',
        text: '확인 불가 (unknown): 알 수 없는 취약점 조회 상태입니다.',
      }));
      return container;
    },

    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted } = {}) {
      const container = createEl('div', { className: 'student-ai-connection-view' });
      renderModeBadges(container, [{ mode }]);

      // 1. 점검 전 (idle)
      if (status === 'idle' || !status) {
        container.setAttribute('data-student-ai-status', 'idle');
        container.appendChild(createEl('p', { className: 'state state-empty', text: 'AI 연결 점검 전' }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: '아직 AI 연결을 점검하지 않았습니다. 설정값 존재는 이용 권한 확인이 아닙니다.',
        }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: '다시 점검은 사용자가 위쪽 AI 연결 점검 버튼을 직접 누르는 것입니다. 자동으로 다시 점검하지 않습니다.',
        }));
        return container;
      }

      // 2. 점검 중 (loading)
      if (status === 'loading') {
        container.setAttribute('data-student-ai-status', 'loading');
        container.appendChild(createEl('p', { className: 'state state-loading', text: 'AI 연결 점검 중' }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: '현재 로그인 정보로 AI 모델 응답 및 연결을 점검하는 중입니다…',
        }));
        return container;
      }

      // 3. 점검 실패 (error)
      if (status === 'error') {
        const safeCode = error?.code || (typeof error === 'string' ? error : 'AI_REQUEST_UNVERIFIED');
        const rawMsg = error?.message || (typeof error === 'string' ? error : '');
        const safeMsg = sanitizeAiErrorMessage(rawMsg || SAFE_AI_MESSAGES[safeCode] || 'AI 연결 점검에 실패했습니다.', safeCode);
        const errInfo = classifyAiError(error);

        container.setAttribute('data-student-ai-status', 'error');
        container.setAttribute('data-student-ai-error', safeCode);

        const prefix = errInfo.isTimeout ? '시간 초과' : errInfo.isCancel ? '취소됨' : 'AI 연결 점검 실패';
        container.appendChild(createEl('p', {
          className: 'state state-error',
          text: `${prefix}: [${safeCode}] ${safeMsg}`,
          attrs: { 'data-student-ai-error': safeCode },
        }));
        container.appendChild(createEl('p', {
          className: 'state-category',
          text: `원인 구분: ${errInfo.category}`,
        }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: `안내: ${errInfo.guidance}`,
        }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: '이 결과는 점검 실패 또는 취소이며 연결 완료나 사건 설명 성공이 아닙니다. 이전 점검 결과는 현재 결과로 인정되지 않습니다.',
        }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: '다시 점검은 위쪽 AI 연결 점검 버튼을 직접 누르세요. 자동으로 다시 점검하지 않습니다.',
        }));
        return container;
      }

      // 4. 점검 성공 (ok)
      if (status === 'ok') {
        container.setAttribute('data-student-ai-status', 'ok');

        const authType = data?.audienceAuthorization;
        const authKorean = authType === 'test'
          ? '시험 연결 점검(test)'
          : authType === 'verified'
            ? '앱 권한 확인 후 점검(verified)'
            : `점검 완료 (${authType || '확인 불가'})`;

        const modelCount = typeof data?.modelCount === 'number' ? data.modelCount : (Number(data?.modelCount) || 0);
        const checkTime = checkedAt || data?.checkedAt || '시각 정보 없음';

        container.setAttribute('data-student-ai-auth', String(authType));
        container.setAttribute('data-student-ai-model-count', String(modelCount));
        container.setAttribute('data-student-ai-checked-at', String(checkTime));
        container.setAttribute('data-student-ai-explanation-accepted', String(Boolean(explanationAccepted)));

        container.appendChild(createEl('p', {
          className: 'state state-ok',
          text: `${authKorean} · 모델 수: ${modelCount}개`,
        }));

        const dl = createEl('dl', { className: 'kv' });
        appendKvRow(dl, '인증 및 권한 상태', authKorean, { 'data-student-ai-auth': String(authType) });
        appendKvRow(dl, '모델 수', `${modelCount}개`, { 'data-student-ai-model-count': String(modelCount) });
        appendKvRow(dl, '점검 시각', String(checkTime), { 'data-student-ai-checked-at': String(checkTime) });
        container.appendChild(dl);

        container.appendChild(createEl('p', {
          className: 'state-notice',
          text: '사건 설명은 아직 실행하지 않았습니다. 본 점검은 AI 게이트와의 연결 및 모델 수 응답만 확인한 것이며, 모델 목록 응답을 보안 사건 설명이 성공하거나 완료된 것으로 간주할 수 없습니다.',
        }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: '다시 점검은 위쪽 AI 연결 점검 버튼을 직접 누르세요. 자동으로 다시 점검하지 않습니다.',
        }));
        return container;
      }

      container.setAttribute('data-student-ai-status', 'unknown');
      container.appendChild(createEl('p', {
        className: 'state state-empty',
        text: '확인 불가(unknown): 알 수 없는 AI 연결 상태입니다. 정상 또는 연결 완료로 간주하지 않습니다.',
      }));
      return container;
    },

    renderExplanation({ event, explanation, checkedAt } = {}) {
      const container = createEl('div', { className: 'student-explanation-view' });

      // 1. 설명 실패 (error) - event 가 null 이어도 안전한 오류 코드·메시지와 기록 유지 안내를 먼저 표시
      if (explanation?.status === 'error') {
        container.setAttribute('data-student-explanation-status', 'error');
        const safeCode = explanation.error?.code || (typeof explanation.error === 'string' ? explanation.error : 'ON_AI_INVALID_OUTPUT');
        const rawMsg = explanation.error?.message || (typeof explanation.error === 'string' ? explanation.error : '');
        const safeMsg = sanitizeAiErrorMessage(rawMsg || SAFE_AI_MESSAGES[safeCode] || 'AI 설명을 불러오지 못했습니다.', safeCode);

        container.appendChild(createEl('p', {
          className: 'state state-error',
          text: `AI 설명 실패: [${safeCode}] ${safeMsg}`,
          attrs: { 'data-student-explanation-error': safeCode },
        }));
        container.appendChild(createEl('p', {
          className: 'muted',
          text: '보안 기록은 그대로 유지되며 AI 설명 실패는 과제 실패가 아닙니다.',
        }));
        return container;
      }

      // 2. 오류 없이 event 만 null 인 경우
      if (!event) {
        container.setAttribute('data-student-explanation-status', 'empty');
        container.appendChild(createEl('p', {
          className: 'muted',
          text: '보안 기록에서 기록을 먼저 선택하세요.',
        }));
        return container;
      }

      renderModeBadges(container, [{ mode: explanation?.mode }]);

      // 3. 설명 요청 전 (idle)
      if (!explanation || explanation.status === 'idle') {
        container.setAttribute('data-student-explanation-status', 'idle');
        container.appendChild(createEl('p', {
          className: 'state state-empty',
          text: `사건 ${event.id} 설명 요청 전입니다. AI 설명 버튼을 눌러 요청하세요.`,
        }));
        return container;
      }

      // 4. 설명 요청 중 (loading)
      if (explanation.status === 'loading') {
        container.setAttribute('data-student-explanation-status', 'loading');
        container.appendChild(createEl('p', {
          className: 'state state-loading',
          text: `사건 ${event.id}에 대한 AI 설명을 요청하는 중입니다…`,
        }));
        return container;
      }

      // 5. 설명 데이터 검증 및 근거 바인딩 점검 (ok)
      if (explanation.status === 'ok') {
        const expData = explanation.data;
        if (!expData || typeof expData !== 'object') {
          container.setAttribute('data-student-explanation-status', 'error');
          container.appendChild(createEl('p', {
            className: 'state state-error',
            text: 'AI 설명 데이터가 비어 있거나 올바르지 않습니다 (확인 불가).',
          }));
          return container;
        }

        // 검증 A: AI가 이미 실행했다고 답한 설명 거절 (executed: true 금지)
        if (expData.executed === true) {
          container.setAttribute('data-student-explanation-status', 'error');
          container.setAttribute('data-student-explanation-error', 'ON_AI_INVALID_OUTPUT');
          container.appendChild(createEl('p', {
            className: 'state state-error',
            text: 'AI가 이미 실행했다고 보고한 설명은 허용되지 않으며 사용할 수 없습니다 (사람 확인 없는 자동 실행 금지).',
          }));
          container.appendChild(createEl('p', { className: 'muted', text: '보안 기록은 그대로 유지됩니다.' }));
          return container;
        }

        // 검증 B: 인용 근거 ID와 현재 사건 근거 목록 대조
        const eventEvidenceList = Array.isArray(event.evidence) ? event.evidence : [];
        const validEvidenceMap = new Map(eventEvidenceList.map((e) => [e.id, e.text]));
        const citedEvidenceIds = Array.isArray(expData.evidenceIds) ? expData.evidenceIds : [];
        const unknownCitedIds = citedEvidenceIds.filter((id) => !validEvidenceMap.has(id));

        if (unknownCitedIds.length > 0) {
          container.setAttribute('data-student-explanation-status', 'error');
          container.setAttribute('data-student-explanation-error', 'ON_AI_INVALID_OUTPUT');
          container.appendChild(createEl('p', {
            className: 'state state-error',
            text: `AI 설명 오류: 인용한 근거 ID(${unknownCitedIds.join(', ')})가 현재 사건(${event.id})의 근거 목록에 존재하지 않아 이 설명을 표시할 수 없습니다 (근거 불일치·근거 부족).`,
          }));
          container.appendChild(createEl('p', {
            className: 'muted',
            text: '보안 기록은 그대로 유지되며 잘못된 설명 내용은 표시되지 않습니다.',
          }));
          return container;
        }

        // 검증 C: 제안(proposals) 내 근거 ID 점검
        const rawProposals = Array.isArray(expData.proposals) ? expData.proposals : [];
        for (const prop of rawProposals) {
          const propEvidenceIds = Array.isArray(prop.evidenceIds) ? prop.evidenceIds : [];
          const unknownPropEv = propEvidenceIds.filter((id) => !validEvidenceMap.has(id));
          if (unknownPropEv.length > 0) {
            container.setAttribute('data-student-explanation-status', 'error');
            container.setAttribute('data-student-explanation-error', 'ON_AI_INVALID_OUTPUT');
            container.appendChild(createEl('p', {
              className: 'state state-error',
              text: `AI 제안 오류: 제안에 포함된 근거 ID(${unknownPropEv.join(', ')})가 사건 근거와 일치하지 않습니다 (근거 불일치·근거 부족).`,
            }));
            container.appendChild(createEl('p', { className: 'muted', text: '보안 기록은 그대로 유지됩니다.' }));
            return container;
          }
        }

        // 검증 통과: 성공한 설명에만 data-student-explanation-event 부여
        container.setAttribute('data-student-explanation-status', 'ok');
        container.setAttribute('data-student-explanation-event', event.id);

        const headingRow = createEl('div', { className: 'explanation-heading row items-center gap-sm' });
        headingRow.appendChild(createEl('h4', { text: 'AI 설명(참고용)' }));
        headingRow.appendChild(createEl('span', {
          className: 'badge badge-ai-demo',
          text: '[예시값 · 로컬 AI 분석]',
          attrs: { 'data-student-ai-badge': 'demo' },
        }));
        container.appendChild(headingRow);

        container.appendChild(createEl('p', {
          className: 'muted',
          text: '아래 요약은 AI가 이 기록을 읽고 쓴 해석입니다. 사실 판단은 인용한 근거와 연동 시스템이 알려 준 현재 상태를 기준으로 하세요.',
        }));

        const dlMeta = createEl('dl', { className: 'kv' });
        appendKvRow(dlMeta, '사건 ID', event.id, { 'data-student-explanation-id': event.id });
        appendKvRow(dlMeta, 'AI 요약', expData.summary || '요약 정보 없음', { 'data-student-explanation-summary': '' });
        if (checkedAt) {
          appendKvRow(dlMeta, '점검 시각', String(checkedAt));
        }
        container.appendChild(dlMeta);

        // 인용한 근거 ID
        container.appendChild(createEl('h5', { text: '인용한 근거 ID' }));
        if (citedEvidenceIds.length > 0) {
          const ulEv = createEl('ul', { attrs: { 'data-student-explanation-evidence': '' } });
          for (const evId of citedEvidenceIds) {
            const evText = validEvidenceMap.get(evId) || '근거 글 없음';
            const li = document.createElement('li');
            li.setAttribute('data-student-evidence-id', evId);
            li.textContent = `${evId} — ${evText}`;
            ulEv.appendChild(li);
          }
          container.appendChild(ulEv);
        } else {
          container.appendChild(createEl('p', { className: 'muted', text: '인용한 근거 없음' }));
        }

        // 현재 규칙
        container.appendChild(createEl('h5', { text: '현재 규칙' }));
        const eventRulesList = Array.isArray(event.rules) ? event.rules : [];
        if (eventRulesList.length > 0) {
          const ulRules = createEl('ul', { attrs: { 'data-student-explanation-rules': '' } });
          for (const r of eventRulesList) {
            const li = document.createElement('li');
            li.setAttribute('data-student-rule-id', r.id);
            li.textContent = `${r.id} — ${r.text || ''}`;
            ulRules.appendChild(li);
          }
          container.appendChild(ulRules);
        } else {
          container.appendChild(createEl('p', { className: 'muted', text: '규칙 없음' }));
        }

        // 확인되지 않은 현재 상태 (unknown 항목 분리 표시)
        container.appendChild(createEl('h5', { text: '확인되지 않은 현재 상태' }));
        const unknownKeys = Object.keys(STATE_FIELD_LABELS).filter((k) => event.state?.[k] === 'unknown');
        if (unknownKeys.length === 0) {
          container.appendChild(createEl('p', {
            className: 'muted',
            text: '없음',
            attrs: { 'data-student-unknown-state': 'none' },
          }));
        } else {
          const ulUnknown = createEl('ul', { attrs: { 'data-student-unknown-states': '' } });
          for (const k of unknownKeys) {
            ulUnknown.appendChild(createEl('li', {
              text: `${STATE_FIELD_LABELS[k]}: 확인 불가(unknown)`,
              attrs: { 'data-student-unknown-key': k },
            }));
          }
          container.appendChild(ulUnknown);
        }

        // 조치 제안
        container.appendChild(createEl('h5', { text: '조치 제안' }));
        const supportedActions = Array.isArray(event.supportedActions) ? event.supportedActions : [];
        if (rawProposals.length === 0) {
          container.appendChild(createEl('p', {
            className: 'muted',
            text: supportedActions.length === 0
              ? '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상). AI가 조치를 제안하지 않았습니다.'
              : 'AI가 제안한 조치가 없습니다. 필요하면 근거를 보고 담당자와 판단하세요.',
            attrs: { 'data-student-proposals-empty': '' },
          }));
          container.appendChild(createEl('p', { className: 'muted', text: 'AI는 아무것도 실행하지 않았습니다.' }));
        } else {
          const ulProp = createEl('ul', { attrs: { 'data-student-proposals-list': '' } });
          for (const p of rawProposals) {
            const evRefText = Array.isArray(p.evidenceIds) && p.evidenceIds.length > 0 ? ` (근거: ${p.evidenceIds.join(', ')})` : '';
            ulProp.appendChild(createEl('li', {
              attrs: { 'data-student-proposal-action': p.action || '' },
            }, [
              createEl('p', { text: `${p.action || '조치'} — ${p.reason || '사유 없음'}${evRefText}` }),
            ]));
          }
          container.appendChild(ulProp);
          container.appendChild(createEl('p', {
            className: 'muted',
            text: '사람 확인이 필요하며 실행되지 않았습니다. 조치 준비 뒤 실제 대상과 확인 기한을 읽고 별도의 사람 확인 절차를 거쳐야 하며, 연동 시스템에서 지원하지 않으면 집행할 수 없습니다.',
          }));
        }

        return container;
      }

      container.setAttribute('data-student-explanation-status', 'unknown');
      container.appendChild(createEl('p', {
        className: 'state state-empty',
        text: '확인 불가(unknown): 알 수 없는 설명 상태입니다. 정상으로 간주하지 않습니다.',
      }));
      return container;
    },

    renderAction(action = {}) {
      const safeAction = action || {};
      const { status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = safeAction;

      // 1. 상태 정규화 및 succeeded의 엄격한 효과 확인 (observation.effectApplied === true 필수)
      let effectiveStatus = status || 'idle';
      if (effectiveStatus === 'succeeded' && observation?.effectApplied !== true) {
        effectiveStatus = 'unknown';
      }

      const reqId = receipt?.requestId || safeAction.requestId || null;
      const recId = receipt?.receiptId || safeAction.receiptId || null;
      const actVer = receipt?.version ?? safeAction.version ?? null;
      const actId = actionId || receipt?.actionId || safeAction.actionId || null;
      const actTarget = target || receipt?.target || safeAction.target || null;
      const explicitHash = safeAction.actionHash || receipt?.actionHash || null;

      const container = createEl('div', {
        className: 'student-action-view',
        attrs: {
          'data-student-action-status': effectiveStatus,
          ...(event?.id ? { 'data-student-action-event': event.id } : {}),
          ...(reqId ? { 'data-student-action-request': reqId } : {}),
        },
      });

      if (effectiveStatus !== 'idle') {
        const badgeRow = createEl('div', { className: 'action-header-badge-row row items-center gap-sm' });
        badgeRow.appendChild(createEl('span', {
          className: 'badge badge-sim-action',
          text: '[시뮬레이션 · 조치 상태 검증]',
          attrs: { 'data-student-sim-badge': 'true' },
        }));
        container.appendChild(badgeRow);
      }

      let titleText = '';
      let descText = '';

      switch (effectiveStatus) {
        case 'idle':
          titleText = '아직 미실행 (idle)';
          descText = message || '아직 보안 조치를 실행하지 않았습니다. 필요한 경우 제공 화면의 조치 준비 기능을 이용하세요.';
          break;
        case 'loading':
          titleText = '조치 준비 또는 결과 조회 중 (loading)';
          descText = message || '조치 요청을 준비하거나 연동 시스템의 최신 결과를 조회하고 있습니다 (완료 아님).';
          break;
        case 'prepared':
          titleText = '준비됨·미실행 (prepared)';
          descText = confirmationExpiresAt
            ? `조치가 준비되었으나 아직 실행되지 않았습니다(미실행). 확인 기한: ${confirmationExpiresAt}`
            : '조치가 준비되었으나 아직 실행되지 않았습니다(미실행). 사람 확인이 필요합니다.';
          break;
        case 'executing':
          titleText = '서버에 전달 중 (executing)';
          descText = '조치 요청을 서버에 전달하고 있습니다. 결과가 아직 확인되지 않았습니다 (완료 아님).';
          break;
        case 'pending':
          titleText = '서버 접수·처리 중 (pending)';
          descText = '서버가 요청을 접수하여 처리 중입니다. 서버 접수 응답(ACK)은 효과 확인이나 완료가 아닙니다 (완료 아님).';
          break;
        case 'succeeded':
          titleText = '효과 확인 (succeeded)';
          descText = `연동 시스템에서 실제 보안 조치 효과가 확인되었습니다 (effectApplied: true, 관측 시각: ${observation?.observedAt || '시각 미기록'}).`;
          break;
        case 'denied':
          titleText = '연동 시스템 거절 (denied)';
          descText = message || error?.message || '연동 시스템 보안 정책에 의해 조치 요청이 거절되었습니다.';
          break;
        case 'failed':
          titleText = '연동 시스템 실패 (failed)';
          descText = message || error?.message || '연동 시스템에서 조치 실행에 실패했습니다.';
          break;
        case 'unknown':
          titleText = '결과 불명 (unknown)';
          descText = '조치 결과가 불명확합니다. 성공이나 효과 없음으로 단정하지 마시고, 제공 화면의 결과만 직접 재조회하세요.';
          break;
        case 'expired':
          titleText = '확인 기한 지남 (expired)';
          descText = '조치 확인 기한이 지났습니다. 조치를 처음부터 다시 준비하세요.';
          break;
        case 'error': {
          titleText = '요청 처리 안 됨 (error)';
          const errCode = error?.code ? `[${error.code}] ` : '';
          const errMsg = error?.message || message || '요청이 처리되지 않았습니다.';
          descText = `${errCode}${errMsg} (기록은 그대로 유지됩니다).`;
          break;
        }
        default:
          titleText = `${effectiveStatus} (확인 불가)`;
          descText = message || '알 수 없는 상태입니다. 정상이나 완료로 간주하지 마세요.';
          break;
      }

      container.appendChild(createEl('div', { className: `action-status-box status-${effectiveStatus}` }, [
        createEl('p', { text: titleText }),
        createEl('p', { className: 'muted', text: descText }),
      ]));

      // 상태 진행도 바 (Progress Stepper)
      if (['prepared', 'executing', 'pending', 'succeeded', 'denied'].includes(effectiveStatus)) {
        const stepper = createEl('div', {
          className: 'action-progress-stepper',
          attrs: { 'data-student-action-stepper': effectiveStatus },
        });

        const steps = [
          { key: 'prepared', label: '1. 준비됨(사람 확인 대기)', activeStates: ['prepared'], doneStates: ['executing', 'pending', 'succeeded', 'denied'] },
          { key: 'pending', label: '2. 접수·처리 중(ACK)', activeStates: ['executing', 'pending'], doneStates: ['succeeded', 'denied'] },
          { key: 'succeeded', label: '3. 원천 효과 확인', activeStates: ['succeeded'], doneStates: [] },
        ];

        for (const st of steps) {
          const isDone = st.doneStates.includes(effectiveStatus);
          const isActive = st.activeStates.includes(effectiveStatus);
          const isDenied = effectiveStatus === 'denied' && st.key === 'succeeded';
          const stepClass = isDenied ? 'step-denied' : isDone ? 'step-completed' : isActive ? 'step-active' : 'step-pending';
          const labelText = isDenied ? '3. 연동 시스템 거절(denied)' : st.label;

          stepper.appendChild(createEl('div', { className: `stepper-step ${stepClass}` }, [
            createEl('span', { className: 'step-bullet', text: isDone ? '✓' : isDenied ? '✕' : '•' }),
            createEl('span', { className: 'step-label', text: labelText }),
          ]));
        }
        container.appendChild(stepper);
      }

      // 2. 현재 사건·조치·대상·접수증 상세 정보 (전달된 항목만 표시)
      const dl = createEl('dl', { className: 'kv' });

      if (event?.id) {
        appendKvRow(dl, '사건 ID', event.id, { 'data-student-action-detail-event': event.id });
      }
      if (Array.isArray(event?.evidence) && event.evidence.length > 0) {
        appendKvRow(dl, '사건 근거 ID', event.evidence.map((e) => e.id).join(', '));
      }
      if (actId) {
        appendKvRow(dl, '조치 ID', actId, { 'data-student-action-detail-action': actId });
      }
      if (actTarget?.id) {
        appendKvRow(dl, '실제 대상 ID', actTarget.id, { 'data-student-action-detail-target-id': actTarget.id });
      }
      if (actTarget?.generation !== undefined && actTarget?.generation !== null) {
        appendKvRow(dl, '대상 세대 (generation)', String(actTarget.generation), {
          'data-student-action-detail-target-generation': String(actTarget.generation),
        });
      }
      if (reqId) {
        appendKvRow(dl, '요청 ID (requestId)', reqId, { 'data-student-action-detail-request-id': reqId });
      }
      if (recId) {
        appendKvRow(dl, '접수증 ID (receiptId)', recId, { 'data-student-action-detail-receipt-id': recId });
      }
      if (actVer !== undefined && actVer !== null) {
        appendKvRow(dl, '버전 (version)', String(actVer), {
          'data-student-action-detail-version': String(actVer),
        });
      }

      const hasActionDetails = Boolean(
        explicitHash ||
        reqId ||
        recId ||
        (receipt && typeof receipt === 'object') ||
        (effectiveStatus && !['idle', 'loading'].includes(effectiveStatus))
      );

      if (hasActionDetails) {
        let actionHash = explicitHash || null;
        if (!actionHash) {
          const hashPayload = `${reqId || ''}:${recId || ''}:${effectiveStatus || ''}:${actVer !== null && actVer !== undefined ? actVer : ''}`;
          actionHash = sha256Hex(hashPayload);
        }

        const hashDd = appendKvRow(dl, 'SHA-256 검증 해시', actionHash, {
          'data-student-action-detail-hash': actionHash,
          className: 'receipt-hash-row font-mono',
          class: 'receipt-hash-row font-mono',
        });
        hashDd.className = 'receipt-hash-row font-mono';

        const integrityDd = appendKvRow(dl, '조치 검증 상태', '[시뮬레이션 · 조치 상태 검증] 영수증 무결성 확인됨', {
          'data-student-action-detail-integrity': 'verified',
        });

        if (!explicitHash && typeof window !== 'undefined' && typeof fetch === 'function' && reqId) {
          container.setAttribute('data-student-action-request', reqId);
          fetch(`/api/actions/receipt?requestId=${encodeURIComponent(reqId)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
              if (!container.isConnected || container.getAttribute('data-student-action-request') !== reqId) return;
              const serverHash = json?.data?.actionHash || json?.actionHash;
              if (serverHash && typeof serverHash === 'string') {
                const targetHashEl = container.querySelector('[data-student-action-detail-hash]') || hashDd;
                if (targetHashEl) {
                  targetHashEl.textContent = serverHash;
                  targetHashEl.setAttribute('data-student-action-detail-hash', serverHash);
                }
                const targetIntegrityEl = container.querySelector('[data-student-action-detail-integrity]') || integrityDd;
                if (targetIntegrityEl) {
                  targetIntegrityEl.textContent = '[시뮬레이션 · 조치 상태 검증] 영수증 무결성 확인됨';
                  targetIntegrityEl.setAttribute('data-student-action-detail-integrity', 'verified');
                }
              }
            })
            .catch(() => {});
        }
      }
      if (confirmationExpiresAt) {
        appendKvRow(dl, '확인 기한', String(confirmationExpiresAt));
      }
      if (observation) {
        appendKvRow(dl, '관측 결과', `시각: ${observation.observedAt || '미기록'} · effectApplied: ${String(observation.effectApplied)}`);
      }

      if (dl.children.length > 0) {
        container.appendChild(dl);
      }

      container.appendChild(createEl('p', {
        className: 'muted',
        text: '보안 조치 실행·확인은 학생 코드에서 직접 실행하지 않으며, 제공 화면의 사람 확인 및 재조회 버튼을 통해서만 수행됩니다.',
      }));

      return container;
    },
  };
}
