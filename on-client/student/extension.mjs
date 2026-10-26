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

function createEl(tag, { className, text, attrs } = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v !== undefined && v !== null) node.setAttribute(k, String(v));
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
  try {
    const ko = parsed.toLocaleString('ko-KR', { hour12: false });
    return `${ko} (${targetIso})`;
  } catch {
    return targetIso;
  }
}

const SOC_LIMITS = Object.freeze({
  PC_STATUS_ENDPOINT: '/api/pc-status',
  FETCH_THROTTLE_MS: 400,
  MAX_SNAPSHOTS: 10,
  MAX_DECISION_HISTORY: 20,
  FIREWALL_PROFILE_TOTAL: 3,
});

const SOC_UI_TEXT = Object.freeze({
  LIVE_BADGE: '[실측값]',
  LIVE_FULL: '[실측값] 내 PC에서 실제로 잰 값',
  DEMO_BADGE: '[예시값]',
  DEMO_FULL: '[예시값] 실제 조회 결과가 아닌 설명용 값',
  UNVERIFIED_BADGE: '「확인 불가」',
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

function probeNodeOsRuntimeIfAvailable(pcStatus, onResolved) {
  const nowMs = Date.now();
  if (
    pcStatus.osProbeLoading
    || (pcStatus.lastOsProbeFetchMs && nowMs - pcStatus.lastOsProbeFetchMs < SOC_LIMITS.FETCH_THROTTLE_MS)
  ) {
    return;
  }
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return;
  }

  pcStatus.osProbeLoading = true;
  pcStatus.lastOsProbeFetchMs = nowMs;
  fetch(SOC_LIMITS.PC_STATUS_ENDPOINT, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
    .then((res) => (res && res.ok ? res.json() : null))
    .then((payload) => {
      if (payload && payload.ok === true && payload.data && typeof payload.data === 'object') {
        pcStatus.osProbe = Object.freeze(payload.data);
        if (!pcStatus.cores && Number(payload.data?.cpu?.logicalCores) > 0) {
          pcStatus.cores = Number(payload.data.cpu.logicalCores);
        }
        if (typeof onResolved === 'function') onResolved();
      }
    })
    .catch(() => {
      // Keep osProbe as null if runtime bridge is not active
    })
    .finally(() => {
      pcStatus.osProbeLoading = false;
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

function refreshBrowserPcStatus(pcStatus, onStorageResolved) {
  pcStatus.measuredAt = new Date().toISOString();
  probeNodeOsRuntimeIfAvailable(pcStatus, onStorageResolved);

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
  let headline = `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} · 확인 불가 (기기 0대 / 세션 0건)`;
  let subline = `사유: 외부 SDP 서버 미연결 상태이므로 ${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE}로 따로 표시합니다 (내 PC 조회 결과와 구분).`;

  if (me?.status === 'loading' || devices?.status === 'loading' || sessions?.status === 'loading') {
    tone = 'unknown';
    headline = `신원·기기 확인 중… (기기 ${totalDevices}대 / 세션 ${sessList.length}건)`;
    subline = '로컬 서버에서 신원 및 기기 상태를 조회하고 있습니다.';
  } else if (me?.status === 'error' || devices?.status === 'error' || sessions?.status === 'error') {
    tone = 'deny';
    headline = effectiveMode === 'disconnected'
      ? `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} · 신원·기기 확인 불가 (0대 / 0건)`
      : '조회 실패 · 확인 불가 (0대 / 0건)';
    subline = `사유: ${extractErrorText(me?.error || devices?.error || sessions?.error, '외부 SDP 서버 미연결 상태입니다.')} (내 PC 조회 결과(${SOC_UI_TEXT.LIVE_BADGE})와 구분해 표시합니다.)`;
  } else if (me?.status === 'ok') {
    const devStatus = me.data?.device?.status || 'unknown';
    const sessStatus = me.data?.session?.status || 'unknown';
    const userLabel = me.data?.user?.label || userId || '사용자';
    const demoNote = effectiveMode === 'demo' ? ` · ${SOC_UI_TEXT.DEMO_BADGE} 설명용 데모 데이터 (SDP 미연결)` : '';
    if (devStatus === 'compliant' && sessStatus === 'active') {
      tone = 'allow';
      headline = `${userLabel} · 기준 충족 (기기 ${compliantCount}대 / 세션 ${activeSessionCount}건)${demoNote}`;
      subline = `준수 기기 ${compliantCount}대 · 활성 세션 ${activeSessionCount}건${demoNote}`;
    } else if (devStatus === 'noncompliant' || sessStatus === 'revoked' || sessStatus === 'expired') {
      tone = 'deny';
      headline = `${userLabel} · 기준 미충족/만료 (미충족 ${noncompliantCount}대)${demoNote}`;
      subline = `기기(${mapDeviceStatus(devStatus)}) · 세션(${mapSessionStatus(sessStatus)})${demoNote}`;
    } else {
      tone = 'challenge';
      headline = `${userLabel} · 기기 확인 불가(${devStatus} · 미확인 ${unknownDeviceCount}대)${demoNote}`;
      subline = `세션(${mapSessionStatus(sessStatus)}, ${activeSessionCount}건) · 사유: 기기 보안 준수 미검증(unknown ≠ allow)${demoNote}`;
    }
  }

  return Object.freeze({
    cardId: 'identity-compliance',
    stepLabel: 'SOC CARD 01 · SDP IDENTITY & DEVICE',
    title: '신원 및 기기 준수 현황 (SDP 영역)',
    tone,
    headline,
    subline,
    measuredAt: formatMeasuredAt(measuredAt),
    provenance,
    sdpMode: effectiveMode,
    showSdpBadge: true,
    kpis: Object.freeze([
      { label: effectiveMode === 'connected' ? 'SDP 연결됨' : `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} (내 PC 조회와 별도)`, chipClass: effectiveMode === 'connected' ? 'chip-allow' : 'chip-deny' },
      { label: `준수 기기 ${compliantCount}대`, chipClass: compliantCount > 0 ? 'chip-allow' : 'chip-unknown' },
      { label: `미확인 기기 ${unknownDeviceCount}대`, chipClass: unknownDeviceCount > 0 ? 'chip-challenge' : 'chip-unknown' },
      { label: `활성 세션 ${activeSessionCount}건`, chipClass: activeSessionCount > 0 ? 'chip-allow' : 'chip-unknown' },
    ]),
  });
}

function normalizeDecisionSummary(decisionSlice = {}, decisionHistory = [], eventsSlice = {}, fallbackMeasuredAt = null) {
  const status = decisionSlice?.status || 'idle';
  const mode = decisionSlice?.mode || eventsSlice?.mode || 'unknown';
  const currentDecision = status === 'ok' ? (decisionSlice?.data?.decision || 'unknown') : null;
  const targetApp = decisionSlice?.data?.appId || decisionSlice?.appId || null;
  const reason = status === 'ok'
    ? (decisionSlice?.data?.reason || '사유 정보 없음')
    : status === 'error'
      ? `${SOC_UI_TEXT.UNVERIFIED_BADGE} — 사유: ${extractErrorText(decisionSlice?.error, 'SDP 판정 요청 실패 (SDP 미연결)')}`
      : mode === 'disconnected'
        ? `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} 상태 — 아직 요청한 업무 앱이 없습니다 (내 PC 조회 결과와 구분).`
        : '아직 요청한 업무 앱이 없습니다 (누적 요청 0건).';

  const provenance = resolveProvenance({
    mode,
    forceLive: status === 'idle' || status === 'error',
  });

  const stats = { allow: 0, deny: 0, challenge: 0, unknown: 0, failed: 0 };
  for (const item of decisionHistory) {
    if (item?.status === 'error') stats.failed += 1;
    else if (item?.decision && Object.hasOwn(stats, item.decision)) stats[item.decision] += 1;
    else if (item?.status === 'ok') stats.unknown += 1;
  }

  const eventsList = Array.isArray(eventsSlice?.data) ? eventsSlice.data : [];
  const deniedAccessEvents = eventsList.filter((e) => e?.kind === 'access' && e?.state?.access === 'denied').length;
  const totalDecisions = decisionHistory.length;

  let tone = 'unknown';
  let headline = mode === 'disconnected'
    ? `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} · 판정 대기 (요청 ${totalDecisions}건)`
    : `판정 대기 (idle · 요청 ${totalDecisions}건)`;
  if (status === 'loading') {
    tone = 'unknown';
    headline = `${targetApp || '업무 앱'} 판정 확인 중… (누적 ${totalDecisions}건)`;
  } else if (status === 'error') {
    tone = 'deny';
    headline = `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} · ${targetApp || '업무 앱'} 요청 실패 (${stats.failed}건)`;
  } else if (status === 'ok') {
    const mapped = mapDecision(currentDecision);
    tone = mapped.code === 'allow' ? 'allow' : mapped.code === 'deny' ? 'deny' : mapped.code === 'challenge' ? 'challenge' : 'unknown';
    headline = `${targetApp || '업무 앱'} · ${mapped.text} (누적 ${totalDecisions}건)`;
  }

  const rawTime = decisionSlice?.data?.checkedAt || decisionHistory[0]?.checkedAt || fallbackMeasuredAt;

  return Object.freeze({
    cardId: 'access-decisions',
    stepLabel: 'SOC CARD 02 · ZTNA ACCESS DECISIONS',
    title: '업무 앱 접근 판정 통계 (SDP 영역)',
    tone,
    headline,
    subline: reason,
    measuredAt: formatMeasuredAt(rawTime),
    provenance,
    sdpMode: mode,
    showSdpBadge: true,
    kpis: Object.freeze([
      { label: mode === 'connected' ? 'SDP 연결됨' : SOC_UI_TEXT.SDP_DISCONNECTED_BADGE, chipClass: mode === 'connected' ? 'chip-allow' : 'chip-deny' },
      { label: `허용(allow) ${stats.allow}건`, chipClass: stats.allow > 0 ? 'chip-allow' : 'chip-unknown' },
      { label: `거부(deny) ${stats.deny + deniedAccessEvents}건`, chipClass: (stats.deny + deniedAccessEvents) > 0 ? 'chip-deny' : 'chip-unknown' },
      { label: `추가확인/실패 ${stats.challenge + stats.unknown + stats.failed}건`, chipClass: (stats.challenge + stats.unknown + stats.failed) > 0 ? 'chip-challenge' : 'chip-unknown' },
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
    stepLabel: 'SOC CARD 03 · SDP/XDR EVENTS & RULES',
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

function normalizeDiagAndVulnSummary({ diagnostics, vulnerabilities, notifications, pcStatus } = {}) {
  const provenance = resolveProvenance({ forceLive: true });
  const diagStatus = diagnostics?.status || 'idle';
  const vulnStatus = vulnerabilities?.status || 'idle';

  const netObj = pcStatus?.osProbe?.network;
  const fwObj = pcStatus?.osProbe?.firewall;
  const winEvObj = pcStatus?.osProbe?.windowsEvents;

  const netCount = typeof netObj?.interfaceCount === 'number' ? netObj.interfaceCount : null;
  const netText = netCount !== null ? `네트워크 ${netCount}개` : '네트워크 확인 불가';

  const fwEnabled = typeof fwObj?.enabledCount === 'number' ? fwObj.enabledCount : null;
  const fwTotal = typeof fwObj?.totalProfiles === 'number' ? fwObj.totalProfiles : SOC_LIMITS.FIREWALL_PROFILE_TOTAL;
  const fwText = fwEnabled !== null ? `방화벽 ${fwEnabled}/${fwTotal} 켜짐(읽기전용)` : '방화벽 확인 불가';

  const sysTotal = typeof winEvObj?.system?.totalCount === 'number' ? winEvObj.system.totalCount : null;
  const appTotal = typeof winEvObj?.application?.totalCount === 'number' ? winEvObj.application.totalCount : null;
  const winLogText = (sysTotal !== null && appTotal !== null)
    ? `Windows 기록 System ${sysTotal}건·App ${appTotal}건`
    : 'Windows 기록 확인 불가';

  const osCpuPct = pcStatus?.osProbe?.cpu?.usagePercent ?? null;
  const coresVal = pcStatus?.cores ?? pcStatus?.osProbe?.cpu?.logicalCores ?? null;
  const osMemUsedGb = pcStatus?.osProbe?.memory?.usedGb ?? null;
  const osDiskFreeGb = pcStatus?.osProbe?.disk?.freeGb ?? null;
  const hwText = coresVal !== null
    ? `CPU ${osCpuPct !== null ? `${osCpuPct}%` : `${coresVal}코어`}${osMemUsedGb !== null ? ` · RAM ${osMemUsedGb}GB` : ''}${osDiskFreeGb !== null ? ` · 디스크 여유 ${osDiskFreeGb}GB` : ''}`
    : '자원 측정 중';

  let tone = 'allow';
  if (vulnStatus === 'error' || diagStatus === 'error' || netCount === null) {
    tone = 'challenge';
  }

  const headline = `${netText} · ${fwText} · ${winLogText}`;
  const subline = `${SOC_UI_TEXT.NON_INTRUSION_CLAIM} · 방화벽·보안 설정은 읽기만 하며, 내 PC 조회(${SOC_UI_TEXT.LIVE_BADGE})는 ${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE}과 따로 표시합니다 (${hwText}).`;
  const rawTime = pcStatus?.osProbe?.measuredAt || pcStatus?.measuredAt || diagnostics?.data?.checkedAt || vulnerabilities?.data?.checkedAt;
  const notiCount = Array.isArray(notifications) ? notifications.length : 0;

  return Object.freeze({
    cardId: 'diagnostics-vuln',
    stepLabel: 'SOC CARD 04 · LOCAL PC NETWORK · FIREWALL · WINDOWS LOGS',
    title: '내 PC 네트워크·방화벽·Windows 기록 실측 (로컬 조회)',
    tone,
    headline,
    subline,
    nonIntrusionBanner: SOC_UI_TEXT.NON_INTRUSION_BANNER,
    measuredAt: formatMeasuredAt(rawTime),
    provenance,
    sdpMode: 'local-pc-only',
    showSdpBadge: false,
    kpis: Object.freeze([
      { label: `${netText} ${netCount !== null ? SOC_UI_TEXT.LIVE_BADGE : SOC_UI_TEXT.UNVERIFIED_BADGE}`, chipClass: netCount !== null ? 'chip-allow' : 'chip-unknown' },
      { label: `${fwText} ${fwEnabled !== null ? SOC_UI_TEXT.LIVE_BADGE : SOC_UI_TEXT.UNVERIFIED_BADGE}`, chipClass: fwEnabled !== null ? 'chip-allow' : 'chip-unknown' },
      { label: `${winLogText} (침해·공격 탐지 아님)`, chipClass: sysTotal !== null ? 'chip-challenge' : 'chip-unknown' },
      { label: `관리자 권한 항목: ${SOC_UI_TEXT.UNVERIFIED_BADGE} / 알림 ${notiCount}건`, chipClass: 'chip-unknown' },
    ]),
  });
}

function aggregateSocTopCards(store) {
  const fallbackTime = store.pcStatus?.measuredAt || new Date().toISOString();
  const card1 = normalizeIdentitySummary({
    me: store.identity?.me,
    devices: store.status?.devices || store.identity?.devices,
    sessions: store.status?.sessions || store.identity?.sessions,
    mode: store.status?.mode,
    measuredAt: store.status?.diagnostics?.data?.checkedAt || fallbackTime,
  });
  const card2 = normalizeDecisionSummary(store.decision, store.decisionHistory, store.events, fallbackTime);
  const card3 = normalizeEventsSummary(store.events, fallbackTime);
  const card4 = normalizeDiagAndVulnSummary({
    diagnostics: store.status?.diagnostics,
    vulnerabilities: store.vulnerabilities,
    notifications: store.status?.notifications,
    pcStatus: store.pcStatus,
  });
  return Object.freeze([card1, card2, card3, card4]);
}

function buildSocMetricCardsDom(cards) {
  const grid = createEl('div', {
    className: 'soc-metric-grid',
    attrs: {
      role: 'region',
      'aria-label': '상단 4대 SOC 핵심 지표 카드',
    },
  });

  for (const card of cards) {
    const article = createEl('article', {
      className: `soc-metric-card soc-card-${card.tone || 'unknown'}`,
      attrs: {
        role: 'region',
        'aria-label': card.title,
        'data-soc-card': card.cardId,
        'data-soc-tone': card.tone || 'unknown',
      },
    });

    const headerBadges = [
      createRoleBadgeEl('custom'),
      createProvenanceBadgeEl(card.provenance),
    ];
    if (card.showSdpBadge) {
      headerBadges.push(createSdpStatusBadgeEl(card.sdpMode));
    }

    const header = createEl('header', { className: 'soc-card-header' }, [
      createEl('span', { className: 'soc-card-step', text: card.stepLabel }),
      createEl('div', { className: 'row' }, headerBadges),
    ]);
    article.appendChild(header);
    article.appendChild(createEl('h3', { className: 'soc-card-title', text: card.title }));
    article.appendChild(createEl('p', { className: 'soc-card-value', text: card.headline }));
    article.appendChild(createEl('p', { className: 'soc-card-sub muted', text: card.subline }));
    if (card.nonIntrusionBanner) {
      article.appendChild(createEl('p', {
        className: 'soc-non-intrusion-banner',
        text: card.nonIntrusionBanner,
      }));
    }
    article.appendChild(createEl('p', {
      className: 'soc-card-timestamp',
      text: `잰 시각: ${card.measuredAt}`,
    }));

    if (Array.isArray(card.kpis) && card.kpis.length > 0) {
      const kpiWrap = createEl('div', { className: 'soc-card-kpis' });
      for (const kpi of card.kpis) {
        kpiWrap.appendChild(createEl('span', {
          className: `soc-kpi-chip ${kpi.chipClass || 'chip-unknown'}`,
          text: kpi.label,
        }));
      }
      article.appendChild(kpiWrap);
    }

    grid.appendChild(article);
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

function formatDeltaNumber(curr, prev, unit) {
  if (typeof curr !== 'number' || typeof prev !== 'number') return '변화량 확인 불가';
  const diff = Number((curr - prev).toFixed(2));
  const sign = diff > 0 ? `+${diff}` : `${diff}`;
  return `직전 대비 Δ ${sign}${unit} (직전 ${prev}${unit} → 현재 ${curr}${unit})`;
}

function buildTrendComparisonBoxDom(store, provenance) {
  const box = createEl('div', {
    className: 'trend-delta-box',
    attrs: {
      role: 'region',
      'aria-label': '직전 스냅샷 대비 보안 지표 및 내 PC 리소스 추이 비교 (Δ)',
    },
  });

  const curr = store.snapshots[0] || createSocSnapshotData(store);
  const prev = store.snapshots[1] || curr;
  const effectiveMode = curr.mode || store.events?.mode || store.status?.mode || 'unknown';

  box.appendChild(createEl('div', { className: 'event-head' }, [
    createEl('strong', { text: `스냅샷 추이 비교 (Δ) — 내 PC 실측(${SOC_UI_TEXT.LIVE_BADGE}) 및 SDP 상태 추이` }),
    createRoleBadgeEl('custom'),
    createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    createSdpStatusBadgeEl(effectiveMode),
  ]));
  box.appendChild(createEl('p', {
    className: 'soc-card-timestamp',
    text: `현재 잰 시각: ${formatMeasuredAt(curr.at)} | 비교 기준 시각: ${formatMeasuredAt(prev.at)} (누적 스냅샷 ${store.snapshots.length}건)`,
  }));

  const ul = createEl('ul', { className: 'trend-delta-list' });
  if (curr.netCount !== null && prev.netCount !== null) {
    ul.appendChild(createEl('li', {
      className: 'trend-delta-item',
      text: `내 PC 활성 네트워크 어댑터: 현재 ${curr.netCount}개 — ${formatDeltaNumber(curr.netCount, prev.netCount, '개')} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  if (curr.fwEnabledCount !== null && prev.fwEnabledCount !== null) {
    ul.appendChild(createEl('li', {
      className: 'trend-delta-item',
      text: `내 PC 방화벽 활성 프로필(Domain·Private·Public, 읽기 전용): 현재 ${curr.fwEnabledCount}/${SOC_LIMITS.FIREWALL_PROFILE_TOTAL}개 켜짐 — ${formatDeltaNumber(curr.fwEnabledCount, prev.fwEnabledCount, '개')} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  if (curr.winSysTotal !== null && prev.winSysTotal !== null) {
    ul.appendChild(createEl('li', {
      className: 'trend-delta-item',
      text: `최근 Windows System 기록(${SOC_UI_TEXT.NON_INTRUSION_CLAIM}): 현재 ${curr.winSysTotal}건 (오류 ${curr.winSysErr ?? 0}건 · 경고 ${curr.winSysWarn ?? 0}건) — ${formatDeltaNumber(curr.winSysTotal, prev.winSysTotal, '건')} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  if (curr.winAppTotal !== null && prev.winAppTotal !== null) {
    ul.appendChild(createEl('li', {
      className: 'trend-delta-item',
      text: `최근 Windows Application 기록(${SOC_UI_TEXT.NON_INTRUSION_CLAIM}): 현재 ${curr.winAppTotal}건 (오류 ${curr.winAppErr ?? 0}건 · 경고 ${curr.winAppWarn ?? 0}건) — ${formatDeltaNumber(curr.winAppTotal, prev.winAppTotal, '건')} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  if (curr.cpuPct !== null && prev.cpuPct !== null) {
    const coreNote = curr.cores !== null ? ` (${curr.cores} 코어)` : '';
    ul.appendChild(createEl('li', {
      className: 'trend-delta-item',
      text: `CPU 사용률 추이: 현재 ${curr.cpuPct}%${coreNote} — ${formatDeltaNumber(curr.cpuPct, prev.cpuPct, '%')} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  } else if (curr.cores !== null && prev.cores !== null) {
    ul.appendChild(createEl('li', {
      className: 'trend-delta-item',
      text: `내 PC 논리 CPU 코어: 현재 ${curr.cores} 코어 — ${formatDeltaNumber(curr.cores, prev.cores, ' 코어')} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  if (curr.memUsedGb !== null && prev.memUsedGb !== null) {
    const totalNote = curr.memTotalGb !== null ? ` (전체 ${curr.memTotalGb} GB)` : '';
    ul.appendChild(createEl('li', {
      className: 'trend-delta-item',
      text: `내 PC 물리 메모리(RAM) 사용량: 현재 ${curr.memUsedGb} GB${totalNote} — ${formatDeltaNumber(curr.memUsedGb, prev.memUsedGb, ' GB')} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  if (curr.heapUsedMb !== null && prev.heapUsedMb !== null) {
    ul.appendChild(createEl('li', {
      className: 'trend-delta-item',
      text: `브라우저 JS 힙 메모리 사용량: 현재 ${curr.heapUsedMb} MB — ${formatDeltaNumber(curr.heapUsedMb, prev.heapUsedMb, ' MB')} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  if (curr.diskFreeGb !== null && prev.diskFreeGb !== null) {
    ul.appendChild(createEl('li', {
      className: 'trend-delta-item',
      text: `디스크 여유 공간: 현재 ${curr.diskFreeGb} GB — ${formatDeltaNumber(curr.diskFreeGb, prev.diskFreeGb, ' GB')} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  const sdpNote = effectiveMode === 'demo'
    ? `${SOC_UI_TEXT.DEMO_BADGE} 설명용 값 (${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE})`
    : effectiveMode === 'connected'
      ? `${SOC_UI_TEXT.LIVE_BADGE} SDP 연결됨`
      : `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} (내 PC 조회 결과와 구분)`;
  ul.appendChild(createEl('li', {
    className: 'trend-delta-item',
    text: `SDP 보안 기록 총계 (${sdpNote}): 현재 ${curr.totalEvents}건 (XDR 경보 ${curr.xdrCount}건) — ${formatDeltaNumber(curr.totalEvents, prev.totalEvents, '건')}`,
  }));
  ul.appendChild(createEl('li', {
    className: 'trend-delta-item',
    text: `SDP 거부·요청실패 누적: 현재 ${curr.deniedTotal}건 | 미확인(unknown) 상태: 현재 ${curr.unknownTotal}건 — ${formatDeltaNumber(curr.deniedTotal, prev.deniedTotal, '건')} (${provenance?.label || SOC_UI_TEXT.LIVE_BADGE})`,
  }));
  box.appendChild(ul);
  return box;
}

function buildPcStatusInspectionCardDom(pcStatus, sdpMode = 'unknown') {
  const card = createEl('div', {
    className: 'soc-audit-card',
    attrs: {
      role: 'region',
      'aria-label': '내 PC 네트워크·방화벽·Windows 기록 및 자원 점검 (읽기 전용 · 비관리자 실측 및 확인 불가 사유)',
      'data-student-pc-status': 'non-admin',
    },
  });

  const liveProv = resolveProvenance({ forceLive: true });
  card.appendChild(createEl('div', { className: 'event-head' }, [
    createEl('h4', { text: '내 PC 네트워크 구성 · 방화벽 설정 · 최근 Windows 기록(System·Application) 및 자원 점검' }),
    createRoleBadgeEl('custom'),
    createProvenanceBadgeEl(liveProv, true),
    createSdpStatusBadgeEl(sdpMode, true),
  ]));

  const noticeBox = createEl('div', {
    className: 'pc-non-intrusion-notice',
    attrs: { 'data-student-non-intrusion-notice': 'true' },
  }, [
    createEl('p', {
      className: 'pc-notice-headline',
      text: `안내 (Windows System·Application 기록): ${SOC_UI_TEXT.NON_INTRUSION_CLAIM}`,
    }),
    createEl('p', {
      className: 'pc-notice-sub',
      text: `1) 방화벽과 보안 설정은 읽기만 하고 바꾸지 않습니다. 관리자 권한이 필요한 항목은 ${SOC_UI_TEXT.UNVERIFIED_BADGE}와 이유로 표시합니다.`,
    }),
    createEl('p', {
      className: 'pc-notice-sub',
      text: `2) 외부 SDP 서버에 연결되지 않았으면 ${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE}로 따로 표시하며, 내 PC 조회 결과(${SOC_UI_TEXT.LIVE_BADGE})와 섞지 않습니다.`,
    }),
    createEl('p', {
      className: 'pc-notice-sub',
      text: `3) 내 PC에서 실제로 잰 값(${SOC_UI_TEXT.LIVE_BADGE})과 설명용 데모 값(${SOC_UI_TEXT.DEMO_BADGE})은 배지로 구별해 표시합니다.`,
    }),
  ]);
  card.appendChild(noticeBox);

  const grid = createEl('div', { className: 'pc-status-grid' });
  const osTimeText = formatMeasuredAt(pcStatus?.osProbe?.measuredAt || pcStatus?.measuredAt);

  const osNet = pcStatus?.osProbe?.network;
  const osFw = pcStatus?.osProbe?.firewall;
  const osWinEv = pcStatus?.osProbe?.windowsEvents;
  const osCpu = pcStatus?.osProbe?.cpu;
  const osMem = pcStatus?.osProbe?.memory;
  const osDisk = pcStatus?.osProbe?.disk;

  // 1) 이 PC의 네트워크 구성
  const netInterfaces = Array.isArray(osNet?.interfaces) ? osNet.interfaces : [];
  const netOk = osNet?.status === 'ok' && netInterfaces.length > 0;
  const netItem = createEl('div', {
    className: `pc-status-item ${netOk ? '' : 'pc-item-unverified'}`,
    attrs: { 'data-pc-section': 'network' },
  });
  netItem.appendChild(createEl('div', { className: 'pc-status-head' }, [
    createEl('span', { text: '1. 이 PC의 네트워크 구성 (읽기 전용)' }),
    createEl('div', { className: 'row' }, [
      createRoleBadgeEl('custom'),
      netOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl(),
    ]),
  ]));
  if (netOk) {
    const gwText = osNet.primaryGateway || '없음(로컬/가상 어댑터)';
    const dnsText = Array.isArray(osNet.dnsServers) && osNet.dnsServers.length > 0
      ? osNet.dnsServers.join(', ')
      : '설정된 IPv4 DNS 없음';
    netItem.appendChild(createEl('p', {
      text: `활성 네트워크 인터페이스: ${osNet.interfaceCount}개 · 기본 게이트웨이: ${gwText} · DNS 서버: ${dnsText} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
    const netUl = createEl('ul', { className: 'soc-rule-list' });
    for (const nic of netInterfaces) {
      const ipv4Str = Array.isArray(nic.ipv4) && nic.ipv4.length > 0 ? nic.ipv4.join(', ') : 'IPv4 없음';
      const gwStr = Array.isArray(nic.gateway) && nic.gateway.length > 0 ? ` · 게이트웨이: ${nic.gateway.join(', ')}` : '';
      const dnsStr = Array.isArray(nic.dns) && nic.dns.length > 0 ? ` · DNS: ${nic.dns.join(', ')}` : '';
      const macStr = nic.mac ? ` · MAC: ${nic.mac}` : '';
      netUl.appendChild(createEl('li', {
        className: 'soc-rule-item',
        text: `${SOC_UI_TEXT.LIVE_BADGE} ${nic.name} (${nic.description || nic.type}) — 상태: ${nic.status} · IPv4: ${ipv4Str}${gwStr}${dnsStr}${macStr}`,
      }));
    }
    netItem.appendChild(netUl);
    netItem.appendChild(createEl('p', {
      className: 'muted',
      text: `측정 근거: ${osNet.reason}`,
    }));
  } else {
    netItem.appendChild(createEl('p', {
      className: 'pc-status-reason',
      text: `이 PC의 네트워크 구성: ${SOC_UI_TEXT.UNVERIFIED_BADGE} — 이유: ${osNet?.reason || '런타임 브리지(student/pc-status-runtime.mjs) 미연결 또는 조회 대기 중입니다.'}`,
    }));
  }
  netItem.appendChild(createEl('p', { className: 'soc-card-timestamp', text: `잰 시각: ${osTimeText}` }));
  grid.appendChild(netItem);

  // 2) 이 PC의 방화벽 설정 (읽기 전용)
  const fwProfiles = Array.isArray(osFw?.profiles) ? osFw.profiles : [];
  const fwOk = osFw?.status === 'ok' && fwProfiles.length > 0;
  const fwItem = createEl('div', {
    className: `pc-status-item ${fwOk ? '' : 'pc-item-unverified'}`,
    attrs: { 'data-pc-section': 'firewall' },
  });
  fwItem.appendChild(createEl('div', { className: 'pc-status-head' }, [
    createEl('span', { text: '2. 이 PC의 방화벽 설정 (읽기 전용)' }),
    createEl('div', { className: 'row' }, [
      createRoleBadgeEl('custom'),
      fwOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl(),
    ]),
  ]));
  fwItem.appendChild(createEl('p', {
    className: 'pc-readonly-pill',
    text: SOC_UI_TEXT.READONLY_PILL,
  }));
  if (fwOk) {
    fwItem.appendChild(createEl('p', {
      text: `Windows Defender 방화벽 활성 프로필: ${osFw.enabledCount}/${osFw.totalProfiles}개 켜짐 ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
    const fwUl = createEl('ul', { className: 'soc-rule-list' });
    for (const prof of fwProfiles) {
      if (prof.status === 'ok' && typeof prof.enabled === 'boolean') {
        const stateStr = prof.enabled ? '켜짐 (Enabled: True)' : '꺼짐 (Enabled: False)';
        fwUl.appendChild(createEl('li', {
          className: 'soc-rule-item',
          text: `${SOC_UI_TEXT.LIVE_BADGE} 프로필 ${prof.name}: 상태=${stateStr} · 기본 인바운드=${prof.defaultInboundAction} · 기본 아웃바운드=${prof.defaultOutboundAction}`,
        }));
      } else {
        fwUl.appendChild(createEl('li', {
          className: 'soc-rule-item',
          text: `${SOC_UI_TEXT.UNVERIFIED_BADGE} 프로필 ${prof.name}: 이유 — ${prof.reason || '권한 또는 경로 제한으로 읽지 못해 확인 불가로 표시합니다.'}`,
        }));
      }
    }
    fwItem.appendChild(fwUl);
  } else {
    fwItem.appendChild(createEl('p', {
      className: 'pc-status-reason',
      text: `방화벽 프로필 상태: ${SOC_UI_TEXT.UNVERIFIED_BADGE} — 이유: ${osFw?.reason || '런타임 브리지 미실행 또는 권한 제한으로 확인 불가로 표시합니다.'}`,
    }));
  }
  const fwAdminItems = Array.isArray(osFw?.adminOnlyItems) && osFw.adminOnlyItems.length > 0
    ? osFw.adminOnlyItems
    : DEFAULT_ADMIN_FIREWALL_ITEMS;
  for (const adm of fwAdminItems) {
    fwItem.appendChild(createEl('p', {
      className: 'pc-status-reason',
      text: `[관리자 권한 필요 항목] ${adm.item}: 「${adm.status || '확인 불가'}」 — 이유: ${adm.reason}`,
    }));
  }
  fwItem.appendChild(createEl('p', { className: 'soc-card-timestamp', text: `잰 시각: ${osTimeText}` }));
  grid.appendChild(fwItem);

  // 3) 최근 Windows 기록 (System · Application) 경고·오류 건수
  const sysLog = osWinEv?.system;
  const appLog = osWinEv?.application;
  const winEvOk = sysLog?.status === 'ok' || appLog?.status === 'ok';
  const winEvItem = createEl('div', {
    className: `pc-status-item ${winEvOk ? '' : 'pc-item-unverified'}`,
    attrs: { 'data-pc-section': 'windows-events' },
  });
  winEvItem.appendChild(createEl('div', { className: 'pc-status-head' }, [
    createEl('span', { text: '3. 최근 Windows 기록 (System · Application) 경고·오류 건수 (최근 24시간)' }),
    createEl('div', { className: 'row' }, [
      createRoleBadgeEl('custom'),
      winEvOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl(),
    ]),
  ]));
  winEvItem.appendChild(createEl('p', {
    className: 'pc-non-intrusion-inline',
    text: `${SOC_UI_TEXT.NON_INTRUSION_CLAIM} (Windows 운영체제와 응용프로그램의 일반 경고·오류 건수이며, 침해 판정이나 SDP XDR 사건과 별개입니다.)`,
  }));

  const winUl = createEl('ul', { className: 'soc-rule-list' });
  for (const [logTitle, logEntry] of [['Windows System 기록', sysLog], ['Windows Application 기록', appLog]]) {
    if (logEntry?.status === 'ok') {
      const latestText = logEntry.latestAt ? ` · 최근 발생: ${formatMeasuredAt(logEntry.latestAt)}` : '';
      winUl.appendChild(createEl('li', {
        className: 'soc-rule-item',
        text: `${SOC_UI_TEXT.LIVE_BADGE} ${logTitle} (최근 24시간): 오류(Level 2) ${logEntry.errorCount}건 · 경고(Level 3) ${logEntry.warningCount}건 · 합계 ${logEntry.totalCount}건${latestText} (침해·공격 탐지 아님)`,
      }));
    } else {
      winUl.appendChild(createEl('li', {
        className: 'soc-rule-item',
        text: `${logTitle}: ${SOC_UI_TEXT.UNVERIFIED_BADGE} — 이유: ${logEntry?.reason || '권한 제한 또는 런타임 브리지 미연결로 확인 불가로 표시합니다.'}`,
      }));
    }
  }
  winEvItem.appendChild(winUl);

  const adminLogs = Array.isArray(osWinEv?.adminOnlyLogs) && osWinEv.adminOnlyLogs.length > 0
    ? osWinEv.adminOnlyLogs
    : DEFAULT_ADMIN_EVENT_LOGS;
  for (const admLog of adminLogs) {
    winEvItem.appendChild(createEl('p', {
      className: 'pc-status-reason',
      text: `[관리자 권한 필요 기록] ${admLog.logName}: 「${admLog.status || '확인 불가'}」 — 이유: ${admLog.reason}`,
    }));
  }
  winEvItem.appendChild(createEl('p', { className: 'soc-card-timestamp', text: `잰 시각: ${osTimeText}` }));
  grid.appendChild(winEvItem);

  // 4) CPU 사용률 (%) 및 논리 코어 수 (코어)
  const coresVal = pcStatus?.cores ?? osCpu?.logicalCores ?? null;
  const osCpuPct = typeof osCpu?.usagePercent === 'number' ? osCpu.usagePercent : null;
  const cpuOk = osCpuPct !== null || coresVal !== null;

  const cpuItem = createEl('div', { className: `pc-status-item ${cpuOk ? '' : 'pc-item-unverified'}` });
  cpuItem.appendChild(createEl('div', { className: 'pc-status-head' }, [
    createEl('span', { text: '4. CPU 코어 수 (코어) 및 사용률 (%)' }),
    createEl('div', { className: 'row' }, [
      createRoleBadgeEl('custom'),
      cpuOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl(),
    ]),
  ]));
  if (coresVal !== null) {
    const loadDesc = osCpuPct !== null ? `OS CPU 사용률: ${osCpuPct} %` : `OS CPU 사용률: ${SOC_UI_TEXT.UNVERIFIED_BADGE}`;
    cpuItem.appendChild(createEl('p', {
      text: `논리 프로세서: ${coresVal} 코어 · ${loadDesc} ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  if (osCpuPct === null) {
    cpuItem.appendChild(createEl('p', {
      className: 'muted',
      text: `OS CPU 사용률(%): ${SOC_UI_TEXT.UNVERIFIED_BADGE} — 이유: 기본 서버 단독 실행 시 OS 센서 API가 없습니다. student/pc-status-runtime.mjs 브리지 포함 실행 시 측정됩니다.`,
    }));
  } else {
    cpuItem.appendChild(createEl('p', {
      className: 'muted',
      text: `측정 근거: ${osCpu?.reason || 'node:os.cpus() 틱 차분 측정 (일반 권한)'}`,
    }));
  }
  cpuItem.appendChild(createEl('p', { className: 'soc-card-timestamp', text: `잰 시각: ${osTimeText}` }));
  grid.appendChild(cpuItem);

  // 5) 메모리 사용량 (GB / MB)
  const memOk = typeof osMem?.usedGb === 'number' || Boolean(pcStatus?.heapSupported);
  const memItem = createEl('div', { className: `pc-status-item ${memOk ? '' : 'pc-item-unverified'}` });
  memItem.appendChild(createEl('div', { className: 'pc-status-head' }, [
    createEl('span', { text: '5. 메모리 사용량 (MB / GB)' }),
    createEl('div', { className: 'row' }, [
      createRoleBadgeEl('custom'),
      memOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl(),
    ]),
  ]));
  if (typeof osMem?.usedGb === 'number') {
    memItem.appendChild(createEl('p', {
      text: `OS 물리 메모리 (RAM): 사용 ${osMem.usedGb} GB / 전체 ${osMem.totalGb} GB (여유 ${osMem.freeGb} GB · 사용률 ${osMem.usagePercent} %) ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  if (pcStatus?.heapSupported && pcStatus.heapUsedMb !== null) {
    const devMemNote = pcStatus.deviceMemoryGb ? ` · 브라우저 보고 기기 RAM 약 ${pcStatus.deviceMemoryGb} GB` : '';
    const pctNote = pcStatus.heapUsagePct !== null ? ` · 사용률 ${pcStatus.heapUsagePct} %` : '';
    memItem.appendChild(createEl('p', {
      text: `브라우저 JS 힙 메모리: 사용 ${pcStatus.heapUsedMb} MB / 할당 ${pcStatus.heapTotalMb ?? '-'} MB (한도 ${pcStatus.heapLimitMb ?? '-'} MB${pctNote}${devMemNote}) ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  } else {
    memItem.appendChild(createEl('p', {
      className: 'pc-status-reason',
      text: `브라우저 JS 힙 메모리: ${SOC_UI_TEXT.UNVERIFIED_BADGE} — 이유: 현재 브라우저 환경에서 performance.memory API를 지원하지 않습니다.`,
    }));
  }
  if (typeof osMem?.usedGb !== 'number') {
    memItem.appendChild(createEl('p', {
      className: 'muted',
      text: `OS 물리 메모리(GB): ${SOC_UI_TEXT.UNVERIFIED_BADGE} — 이유: 기본 서버 단독 실행 시 OS RAM 조회 API가 없습니다.`,
    }));
  }
  memItem.appendChild(createEl('p', { className: 'soc-card-timestamp', text: `잰 시각: ${osTimeText}` }));
  grid.appendChild(memItem);

  // 6) 디스크 남은 공간 (GB / MB)
  const storageOk = pcStatus?.storageState === 'ok' && pcStatus.storageFreeGb !== null;
  const diskOk = typeof osDisk?.freeGb === 'number' || storageOk;
  const diskItem = createEl('div', { className: `pc-status-item ${diskOk ? '' : 'pc-item-unverified'}` });
  diskItem.appendChild(createEl('div', { className: 'pc-status-head' }, [
    createEl('span', { text: '6. 디스크 남은 공간 (GB / MB)' }),
    createEl('div', { className: 'row' }, [
      createRoleBadgeEl('custom'),
      diskOk ? createProvenanceBadgeEl(liveProv) : createUnverifiedBadgeEl(),
    ]),
  ]));
  if (typeof osDisk?.freeGb === 'number') {
    diskItem.appendChild(createEl('p', {
      text: `OS 로컬 디스크: 남은 공간 ${osDisk.freeGb} GB / 전체 ${osDisk.totalGb} GB (사용 ${osDisk.usedGb} GB · 사용률 ${osDisk.usagePercent} %) ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  }
  if (storageOk) {
    const pctNote = pcStatus.storageUsagePct !== null ? ` · 사용률 ${pcStatus.storageUsagePct} %` : '';
    diskItem.appendChild(createEl('p', {
      text: `브라우저 할당 디스크(Origin Storage): 남은 공간 ${pcStatus.storageFreeGb} GB / 할당 ${pcStatus.storageQuotaGb} GB (사용 ${pcStatus.storageUsedMb} MB${pctNote}) ${SOC_UI_TEXT.LIVE_BADGE}`,
    }));
  } else {
    diskItem.appendChild(createEl('p', {
      className: 'pc-status-reason',
      text: `브라우저 할당 디스크(Origin Storage): ${SOC_UI_TEXT.UNVERIFIED_BADGE} — 이유: ${pcStatus?.storageReason || 'StorageManager 미지원 또는 조회 지연'}`,
    }));
  }
  if (typeof osDisk?.freeGb !== 'number') {
    diskItem.appendChild(createEl('p', {
      className: 'muted',
      text: `OS 로컬 디스크 남은 공간(GB): ${SOC_UI_TEXT.UNVERIFIED_BADGE} — 이유: 기본 서버 단독 실행 시 디스크 볼륨 조회 API가 없습니다.`,
    }));
  }
  diskItem.appendChild(createEl('p', {
    className: 'soc-card-timestamp',
    text: `잰 시각: ${formatMeasuredAt(pcStatus?.storageMeasuredAt || pcStatus?.measuredAt)}`,
  }));
  grid.appendChild(diskItem);

  card.appendChild(grid);
  return card;
}

function buildRoleSeparationCardDom() {
  const card = createEl('div', { className: 'soc-audit-card' });
  card.appendChild(createEl('div', { className: 'event-head' }, [
    createEl('h4', { text: `${SOC_UI_TEXT.LIVE_BADGE} · ${SOC_UI_TEXT.DEMO_BADGE} · ${SOC_UI_TEXT.UNVERIFIED_BADGE} · ${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} 구분 안내` }),
    createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
    createProvenanceBadgeEl(resolveProvenance({ mode: 'demo' })),
    createUnverifiedBadgeEl(),
    createSdpStatusBadgeEl('disconnected'),
  ]));
  const items = [
    `${SOC_UI_TEXT.LIVE_BADGE} (내 PC에서 실제로 잰 값): 네트워크 구성(인터페이스·IPv4·게이트웨이·DNS), 방화벽 설정(Domain·Private·Public 읽기 전용 상태), 최근 Windows 기록(System·Application 경고·오류 건수 — 침해·공격 탐지 아님), CPU·RAM·디스크 측정값`,
    `${SOC_UI_TEXT.DEMO_BADGE} (실제 조회 결과가 아닌 설명용 값): 데모 모드(--demo) 실행 시 제공 엔진(demoEngine)이 공급하는 가상 사용자(practice-user)·가상 기기(practice-pc)·가상 업무 앱 3종·가상 사건 1건(event-01)`,
    `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE}: 외부 SDP 서버에 연결되지 않은 상태를 나타내며, 내 PC 로컬 조회 결과(${SOC_UI_TEXT.LIVE_BADGE})와 구분해 표시합니다.`,
    `${SOC_UI_TEXT.UNVERIFIED_BADGE}: 방화벽과 보안 설정은 읽기만 하고 바꾸지 않습니다. 관리자 권한이 필요한 항목(Windows Security 감사 로그, 방화벽 pfirewall.log 및 PersistentStore 정책 저장소)은 설정을 바꾸지 않고 이유와 함께 표시합니다.`,
  ];
  const ul = createEl('ul', { className: 'soc-rule-list' });
  for (const text of items) {
    ul.appendChild(createEl('li', { className: 'soc-rule-item', text }));
  }
  card.appendChild(ul);
  return card;
}

function buildAuditBreakdownPanelDom({ selectedEvent, decisionSlice, matchedRules, provenance, mode, pcStatus }) {
  const panel = createEl('div', {
    className: 'soc-split-panel soc-audit-panel',
    attrs: {
      role: 'region',
      'aria-label': '상세 감사 로그 및 규칙 매칭 분석 (allow / deny / challenge / unknown)',
    },
  });

  panel.appendChild(createEl('h3', { className: 'soc-panel-heading' }, [
    createEl('span', { text: '내 PC 네트워크·방화벽·Windows 기록(읽기 전용) & SDP 판정 감사' }),
    createEl('div', { className: 'row' }, [
      createRoleBadgeEl('custom'),
      createProvenanceBadgeEl(resolveProvenance({ forceLive: true })),
      createSdpStatusBadgeEl(mode),
    ]),
  ]));

  if (pcStatus) {
    panel.appendChild(buildPcStatusInspectionCardDom(pcStatus, mode));
  }
  panel.appendChild(buildRoleSeparationCardDom());

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
      text: `명시적 판정 사유: ${decisionSlice.data.reason || '사유 정보 없음'} | 잰 시각: ${formatMeasuredAt(decisionSlice.data.checkedAt)}`,
    }));
  } else if (decStatus === 'error') {
    decCard.appendChild(createEl('p', {
      text: `[${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} / 요청 실패 · 확인 불가] 사유: ${extractErrorText(decisionSlice?.error, '판정 요청 실패')} (차단/허용 판정이 아니며 내 PC 조회 결과와 구분 표시함)`,
    }));
  } else {
    decCard.appendChild(createEl('p', {
      className: 'muted',
      text: '업무 앱 탭에서 앱을 선택하면 allow / deny / challenge / unknown 판정 사유와 잰 시각이 기록됩니다 (현재 0건).',
    }));
  }
  panel.appendChild(decCard);

  const evCard = createEl('div', { className: 'soc-audit-card' });
  evCard.appendChild(createEl('div', { className: 'event-head' }, [
    createEl('h4', { text: '선택 사건 상태·근거·규칙 매칭 (SDP Event Rule Breakdown)' }),
    createSdpStatusBadgeEl(mode),
  ]));
  if (selectedEvent) {
    const evProv = resolveProvenance({ mode });
    const headRow = createEl('p', {
      text: `사건 ${selectedEvent.id} (${mapKind(selectedEvent.kind)}) · 앱: ${selectedEvent.appId || '확인 불가(앱 ID 없음)'} · 잰 시각: ${formatMeasuredAt(selectedEvent.at)} `,
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
        ? `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} 상태이므로 수신된 SDP 보안 사건이 0건입니다 (내 PC의 Windows System·Application 기록 조회 결과와 구분해 표시함).`
        : '현재 선택되거나 수신된 보안 사건이 0건입니다.',
    }));
  }
  panel.appendChild(evCard);

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
  panel.appendChild(ruleAggCard);

  return panel;
}

export function createStudentView() {
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

  function syncGlobalSocRegions(shouldRefreshPc = true) {
    if (shouldRefreshPc) {
      refreshBrowserPcStatus(socStore.pcStatus, () => syncGlobalSocRegions(false));
    }
    recordSocSnapshot(socStore);

    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;

    const topMetricsEl = document.getElementById('soc-top-metrics');
    const cards = aggregateSocTopCards(socStore);
    if (topMetricsEl) {
      const renderedGrid = buildSocMetricCardsDom(cards);
      topMetricsEl.replaceChildren(...Array.from(renderedGrid.childNodes));
    }

    const effectiveModeForTrend = socStore.events?.mode || socStore.status?.mode || 'unknown';
    if (typeof document.querySelectorAll === 'function') {
      const allGrids = document.querySelectorAll('.student-status-view > .soc-metric-grid');
      for (const gridEl of allGrids) {
        const freshGrid = buildSocMetricCardsDom(cards);
        gridEl.replaceChildren(...Array.from(freshGrid.childNodes));
      }
      const allPcCards = document.querySelectorAll('[data-student-pc-status="non-admin"]');
      for (const pcCardEl of allPcCards) {
        const freshPcCard = buildPcStatusInspectionCardDom(socStore.pcStatus, effectiveModeForTrend);
        pcCardEl.replaceChildren(...Array.from(freshPcCard.childNodes));
      }
      const trendProv = resolveProvenance({ mode: effectiveModeForTrend, forceLive: effectiveModeForTrend !== 'demo' });
      const allTrendBoxes = document.querySelectorAll('.student-status-view > .trend-delta-box, .student-events-view .trend-delta-box');
      for (const trendEl of allTrendBoxes) {
        const freshTrend = buildTrendComparisonBoxDom(socStore, trendProv);
        trendEl.replaceChildren(...Array.from(freshTrend.childNodes));
      }
    }

    const leftTimelineEl = document.getElementById('soc-split-left-timeline');
    const rightAuditEl = document.getElementById('soc-split-right-audit');
    if (leftTimelineEl || rightAuditEl) {
      const evSummary = normalizeEventsSummary(socStore.events, socStore.pcStatus?.measuredAt);
      const effectiveMode = socStore.events?.mode || socStore.status?.mode || 'unknown';

      if (leftTimelineEl) {
        const leftChildren = [
          createEl('h3', { className: 'soc-panel-heading' }, [
            createEl('span', { text: '직전 스냅샷 대비 추이 비교(Δ) 및 시간순 기록' }),
            createEl('div', { className: 'row' }, [
              createRoleBadgeEl('custom'),
              createProvenanceBadgeEl(evSummary.provenance),
              createSdpStatusBadgeEl(effectiveMode),
            ]),
          ]),
          buildTrendComparisonBoxDom(socStore, evSummary.provenance),
          createEl('p', {
            className: 'muted',
            text: `${evSummary.headline} — ${evSummary.subline} | 잰 시각: ${evSummary.measuredAt}`,
          }),
        ];

        if (evSummary.sortedEvents.length > 0) {
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
                text: `잰 시각: ${formatMeasuredAt(ev.at)} · 앱: ${ev.appId || '확인 불가(없음)'} · 근거 ${evidenceCount}건 · 규칙 ${ruleCount}종 · 접속: ${formatAccessState(ev.state?.access)} · 기기: ${formatDeviceState(ev.state?.device)}`,
              }),
            ]);
            tlList.appendChild(item);
          }
          leftChildren.push(tlList);
        } else {
          leftChildren.push(createEl('p', {
            className: 'state state-empty',
            text: effectiveMode === 'disconnected'
              ? `${SOC_UI_TEXT.SDP_DISCONNECTED_BADGE} — 외부 SDP 서버에 연결되지 않아 수신된 SDP 보안 사건이 0건입니다 (내 PC 조회 결과(${SOC_UI_TEXT.LIVE_BADGE})와 구분 표시 · 잰 시각: ${evSummary.measuredAt}).`
              : `표시할 시간순 보안 이벤트가 0건입니다 (잰 시각: ${evSummary.measuredAt}).`,
          }));
        }
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
        });
        rightAuditEl.replaceChildren(...Array.from(auditDom.childNodes));
      }
    }
  }

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
        createRoleBadgeEl('custom'),
        createProvenanceBadgeEl(idSummary.provenance, true),
        createEl('span', { className: 'soc-card-timestamp', text: `잰 시각: ${formatMeasuredAt(idSummary.measuredAt)}` }),
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
        createRoleBadgeEl('custom'),
        createProvenanceBadgeEl(provenance, true),
        createEl('span', { className: 'soc-card-timestamp', text: `잰 시각: ${formatMeasuredAt(data?.checkedAt)}` }),
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
          createEl('span', { text: `판정 타임라인 추이 (${socStore.decisionHistory.length || 1}건 · 잰 시각: ${formatMeasuredAt(data?.checkedAt)})` }),
          createRoleBadgeEl('custom'),
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
      renderModeBadges(container, [{ mode }]);

      const evSummary = normalizeEventsSummary({ status, mode, data, error });
      container.appendChild(createEl('div', { className: 'row' }, [
        createRoleBadgeEl('provided'),
        createRoleBadgeEl('custom'),
        createProvenanceBadgeEl(evSummary.provenance, true),
        createEl('span', { className: 'soc-card-timestamp', text: `잰 시각: ${formatMeasuredAt(evSummary.measuredAt)}` }),
      ]));

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

      const filterBox = createEl('div', { className: 'event-filters row' });

      function createFilterSelect(labelText, filterKey, options, formatOption) {
        const label = createEl('label', { text: `${labelText}: ` });
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
        createEl('span', { text: `추이 비교(Δ) 및 시간순 보안 이벤트 타임라인 (${sortedEvents.length}건 · 잰 시각: ${formatMeasuredAt(evSummary.measuredAt)})` }),
        createRoleBadgeEl('custom'),
        createProvenanceBadgeEl(evSummary.provenance),
      ]));
      leftTimelineCol.appendChild(buildTrendComparisonBoxDom(socStore, evSummary.provenance));

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
          pcStatus: socStore.pcStatus,
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
        attrs: { role: 'region', 'aria-label': 'SOC 상태 집계 및 시스템 진단 매트릭스' },
      });
      renderModeBadges(container, [{ mode }]);

      // Top 4 SOC Metric Cards rendered via normalized state aggregation
      const socCards = aggregateSocTopCards(socStore);
      container.appendChild(buildSocMetricCardsDom(socCards));

      // 0-A. 내 PC 상태 비관리자 점검 카드 ([내가 바꾼 부분] — 네트워크·방화벽·Windows 기록·CPU·메모리·디스크 실측값 및 확인 불가 사유)
      container.appendChild(buildPcStatusInspectionCardDom(socStore.pcStatus, mode));

      // 0-B. 직전 스냅샷 대비 상태·보안 지표 추이 비교(Δ) 및 제공 기능 vs 내가 바꾼 부분 구분
      const statusProv = resolveProvenance({ mode, forceLive: mode !== 'demo' });
      container.appendChild(buildTrendComparisonBoxDom(socStore, statusProv));
      container.appendChild(buildRoleSeparationCardDom());

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
          createEl('span', { text: `등록 기기 상태 (${devCount}대 · 잰 시각: ${formatMeasuredAt(devMeasuredAt)})` }),
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
          createEl('span', { text: `현재 세션 연결 상태 (${sessCount}개 · 잰 시각: ${formatMeasuredAt(sessMeasuredAt)})` }),
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
          createEl('span', { text: `상태 및 보안 알림 (${notiCount}건 · 잰 시각: ${formatMeasuredAt(notiMeasuredAt)})` }),
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
          createEl('span', { text: `시스템 진단 정보 (점검 항목 ${diagFieldCount}개 · 잰 시각: ${formatMeasuredAt(diagMeasuredAt)})` }),
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
      renderModeBadges(container, [{ mode }]);
      container.appendChild(createEl('div', { className: 'row' }, [
        createRoleBadgeEl('provided'),
        createRoleBadgeEl('custom'),
        createProvenanceBadgeEl(resolveProvenance({ forceLive: true }), true),
        createEl('span', { className: 'soc-card-timestamp', text: `잰 시각: ${formatMeasuredAt(data?.checkedAt || socStore.pcStatus?.measuredAt)}` }),
      ]));

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
        appendKvRow(dlMeta, '잰 시각 (checkedAt)', formatMeasuredAt(scanData.checkedAt));
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
                tr.appendChild(createEl('td', {
                  text: finding.id || '',
                  attrs: { 'data-student-vuln-id': finding.id || '' },
                }));
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

        container.appendChild(createEl('h4', { text: 'AI 설명(참고용)' }));
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

    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      // 1. 상태 정규화 및 succeeded의 엄격한 효과 확인 (observation.effectApplied === true 필수)
      let effectiveStatus = status || 'idle';
      if (effectiveStatus === 'succeeded' && observation?.effectApplied !== true) {
        effectiveStatus = 'unknown';
      }

      const container = createEl('div', {
        className: 'student-action-view',
        attrs: {
          'data-student-action-status': effectiveStatus,
          ...(event?.id ? { 'data-student-action-event': event.id } : {}),
          ...(receipt?.requestId ? { 'data-student-action-request': receipt.requestId } : {}),
        },
      });

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

      // 2. 현재 사건·조치·대상·접수증 상세 정보 (전달된 항목만 표시)
      const dl = createEl('dl', { className: 'kv' });

      if (event?.id) {
        appendKvRow(dl, '사건 ID', event.id, { 'data-student-action-detail-event': event.id });
      }
      if (Array.isArray(event?.evidence) && event.evidence.length > 0) {
        appendKvRow(dl, '사건 근거 ID', event.evidence.map((e) => e.id).join(', '));
      }
      if (actionId) {
        appendKvRow(dl, '조치 ID', actionId, { 'data-student-action-detail-action': actionId });
      }
      if (target?.id) {
        appendKvRow(dl, '실제 대상 ID', target.id, { 'data-student-action-detail-target-id': target.id });
      }
      if (target?.generation !== undefined && target?.generation !== null) {
        appendKvRow(dl, '대상 세대 (generation)', String(target.generation), {
          'data-student-action-detail-target-generation': String(target.generation),
        });
      }
      if (receipt?.requestId) {
        appendKvRow(dl, '요청 ID (requestId)', receipt.requestId, { 'data-student-action-detail-request-id': receipt.requestId });
      }
      if (receipt?.receiptId) {
        appendKvRow(dl, '접수증 ID (receiptId)', receipt.receiptId, { 'data-student-action-detail-receipt-id': receipt.receiptId });
      }
      if (receipt?.version !== undefined && receipt?.version !== null) {
        appendKvRow(dl, '버전 (version)', String(receipt.version), {
          'data-student-action-detail-version': String(receipt.version),
        });
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
