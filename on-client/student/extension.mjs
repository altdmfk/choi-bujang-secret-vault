// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.

function mapDeviceStatus(status) {
  switch (status) {
    case 'compliant':
      return '보안 기준 충족';
    case 'noncompliant':
      return '보안 기준 미충족';
    case 'unknown':
      return '확인 불가';
    default:
      return status ? `${status} (확인 불가)` : '확인 불가';
  }
}

function mapSessionStatus(status) {
  switch (status) {
    case 'active':
      return '활성';
    case 'expired':
      return '만료';
    case 'revoked':
      return '철회됨';
    case 'unknown':
      return '확인 불가';
    default:
      return status ? `${status} (확인 불가)` : '확인 불가';
  }
}

function createModeBadge(mode) {
  if (!mode || mode === 'connected') return null;
  const badge = document.createElement('span');
  badge.className = mode === 'demo' ? 'tag tag-demo' : 'tag';
  badge.setAttribute('data-student-mode', mode);
  switch (mode) {
    case 'demo':
      badge.textContent = '예제 자료';
      break;
    case 'disconnected':
      badge.textContent = '연결 없음';
      break;
    case 'unknown':
      badge.textContent = '확인 불가';
      break;
    default:
      badge.textContent = mode;
      break;
  }
  return badge;
}

function formatErrorMessage(error, defaultMsg = '확인 불가') {
  if (!error) return `연결 실패: ${defaultMsg}`;
  const msg = typeof error === 'string' ? error : (error.message || error.code || defaultMsg);
  if (msg.startsWith('연결 실패') || msg.startsWith('확인 불가')) {
    return msg;
  }
  return `연결 실패: ${msg}`;
}

function isTimeoutError(error) {
  if (!error) return false;
  if (typeof error === 'string') {
    return error.toUpperCase().includes('TIMEOUT') || error.includes('시간 초과') || error.includes('시간초과');
  }
  if (error.code && (String(error.code).toUpperCase().includes('TIMEOUT') || String(error.code).includes('시간 초과'))) return true;
  if (typeof error.message === 'string' && (error.message.toUpperCase().includes('TIMEOUT') || error.message.includes('시간 초과') || error.message.includes('시간초과'))) return true;
  return false;
}

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
  let code = '';
  let message = '';
  if (typeof error === 'string') {
    code = error;
    message = error;
  } else if (error && typeof error === 'object') {
    code = error.code ? String(error.code) : '';
    message = error.message ? String(error.message) : '';
  }
  const combined = `${code} ${message}`.toUpperCase();

  // 1. 취소 (Cancelled)
  if (code === 'CANCELLED' || code === 'WB_CLCO_CANCELLED' || code === 'REQUEST_CANCELLED' || combined.includes('취소') || combined.includes('CANCEL')) {
    return {
      category: '취소됨',
      guidance: 'AI 요청이 취소되었습니다. 이전 결과는 현재 결과가 아니며, 점검이 성공한 것이 아닙니다.',
      isTimeout: false,
      isCancel: true,
    };
  }

  // 2. 시간 초과 / 네트워크
  if (code === 'TIMEOUT' || code === 'WB_CLCO_TIMEOUT' || code === 'REQUEST_TIMEOUT' || code === 'ENGINE_TIMEOUT' || combined.includes('TIMEOUT') || combined.includes('시간 초과') || combined.includes('시간초과')) {
    return {
      category: '시간 초과',
      guidance: 'AI 응답 시간이 초과되었습니다. 잠시 뒤 위쪽 AI 연결 점검 버튼을 직접 눌러 다시 점검하세요.',
      isTimeout: true,
      isCancel: false,
    };
  }

  if (code === 'NETWORK_ERROR' || code === 'WB_CLCO_NETWORK_ERROR' || combined.includes('NETWORK') || combined.includes('네트워크')) {
    return {
      category: '네트워크 오류',
      guidance: '네트워크 연결 상태를 확인한 뒤 잠시 후 위쪽 버튼을 직접 눌러 다시 점검하세요.',
      isTimeout: false,
      isCancel: false,
    };
  }

  // 3. 요청 제한
  if (code === 'WB_CLCO_RATE_LIMITED' || combined.includes('RATE_LIMITED') || combined.includes('요청 제한')) {
    return {
      category: '요청 제한',
      guidance: 'AI 요청이 잠시 제한되었습니다. 잠시 후 위쪽 AI 연결 점검 버튼을 직접 눌러 다시 요청하세요.',
      isTimeout: false,
      isCancel: false,
    };
  }

  // 4. 모델 없음
  if (code === 'MODEL_NOT_CONFIGURED' || code === 'ON_AI_MODEL_LIST_EMPTY' || (combined.includes('MODEL') && (combined.includes('EMPTY') || combined.includes('NOT_CONFIGURED') || combined.includes('모델')))) {
    return {
      category: '쓸 수 있는 모델 없음',
      guidance: '현재 앱 권한으로 사용할 수 있는 AI 모델이 설정되어 있지 않습니다. 담당자에게 모델 허용 설정을 확인 요청하세요.',
      isTimeout: false,
      isCancel: false,
    };
  }

  // 5. 사용량 · 한도
  if (code === 'WB_CLCO_COHORT_BUDGET_EXHAUSTED' || combined.includes('BUDGET') || combined.includes('사용량')) {
    return {
      category: '반 사용량 소진',
      guidance: '반의 AI 사용량이 소진되었습니다. 담당자에게 확인을 요청하세요.',
      isTimeout: false,
      isCancel: false,
    };
  }

  if (code === 'WB_CLCO_LIMIT_REACHED' || combined.includes('LIMIT') || combined.includes('한도')) {
    return {
      category: '이용 한도 도달',
      guidance: 'AI 이용 한도에 도달했습니다. 담당자에게 확인을 요청하세요.',
      isTimeout: false,
      isCancel: false,
    };
  }

  // 6. 이용 시간
  if (code === 'WB_CLCO_SESSION_CLOSED' || combined.includes('SESSION_CLOSED') || combined.includes('이용 시간')) {
    return {
      category: '이용 시간 아님',
      guidance: '현재 AI 이용 시간이 아닙니다. 이용 가능 시간을 확인하세요.',
      isTimeout: false,
      isCancel: false,
    };
  }

  // 7. 인증 실패 · 접근 제한
  if (code === 'WB_CLCO_AUTH_REQUIRED' || combined.includes('AUTH_REQUIRED')) {
    return {
      category: '인증 실패',
      guidance: '앱 전용 열쇠의 인증을 확인해야 합니다. 계정 연결 상태를 다시 확인하고, Workbench 열쇠를 복사해 붙이지 마세요. 계속되면 담당자에게 확인을 요청하세요.',
      isTimeout: false,
      isCancel: false,
    };
  }

  if (code === 'WB_CLCO_ACCESS_BLOCKED' || combined.includes('ACCESS_BLOCKED') || combined.includes('접근 제한')) {
    return {
      category: '접근 제한',
      guidance: '학생 앱의 이용 권한이 차단되었거나 접근이 제한되었습니다. 계정 연결과 담당자 확인이 필요합니다.',
      isTimeout: false,
      isCancel: false,
    };
  }

  // 8. 권한 준비 중 · 확인 불가
  if (code === 'ON_AI_PROVISIONING_PENDING' || combined.includes('PROVISIONING') || combined.includes('권한 준비')) {
    return {
      category: '권한 준비 중',
      guidance: '학생 앱 이용 권한의 발급 및 연결을 준비 중입니다 (학생 잘못이 아님). 담당자에게 확인을 요청하세요.',
      isTimeout: false,
      isCancel: false,
    };
  }

  if (code === 'ON_AI_AUTHORIZATION_CHANGED') {
    return {
      category: '권한 변경 확인 필요',
      guidance: 'AI 이용 권한 내용이 점검 도중 바뀌었습니다. 다시 점검하기 전에 담당자에게 현재 권한을 확인하세요.',
      isTimeout: false,
      isCancel: false,
    };
  }

  if (code === 'SUBJECT_SCOPE_UNVERIFIED' || code === 'AI_REQUEST_UNVERIFIED' || combined.includes('UNVERIFIED') || combined.includes('확인 불가')) {
    return {
      category: '확인 불가',
      guidance: 'AI 연결 또는 응답을 확인할 수 없습니다. 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.',
      isTimeout: false,
      isCancel: false,
    };
  }

  // 기본 기타 오류
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

  const modeWrap = document.createElement('div');
  modeWrap.className = 'mode-badges';
  modeWrap.style.marginBottom = '8px';
  modeWrap.style.display = 'flex';
  modeWrap.style.gap = '6px';
  modeWrap.style.flexWrap = 'wrap';

  for (const m of modesToShow) {
    const badge = createModeBadge(m);
    if (badge) modeWrap.appendChild(badge);
  }
  target.appendChild(modeWrap);
  return modeWrap;
}

function appendInlineModeBadge(target, mode) {
  if (!mode || mode === 'connected') return;
  const badge = createModeBadge(mode);
  if (badge) {
    target.appendChild(document.createTextNode(' '));
    target.appendChild(badge);
  }
}

function mapDecision(decision) {
  switch (decision) {
    case 'allow':
      return {
        code: 'allow',
        text: '접근 허용 (allow)',
        note: '서버 정책에 따라 이 업무 앱 접근이 허용되었습니다. (실제 앱 접속 성공을 보장하지는 않습니다.)',
        className: 'decision decision-allow',
      };
    case 'deny':
      return {
        code: 'deny',
        text: '접근 거부 (deny)',
        note: '보안 정책에 따라 이 업무 앱 접근이 거부되었습니다.',
        className: 'decision decision-deny',
      };
    case 'challenge':
      return {
        code: 'challenge',
        text: '추가 확인 필요 (challenge)',
        note: '추가 인증 또는 확인이 필요합니다. 본 앱이 추가 인증 절차를 대신 수행하지 않습니다.',
        className: 'decision decision-challenge',
      };
    case 'unknown':
    default:
      return {
        code: 'unknown',
        text: '확인 불가 (unknown)',
        note: '판정을 확인할 수 없습니다. 허용되지 않음 (접근 허용 또는 정상으로 간주할 수 없습니다).',
        className: 'decision decision-unknown',
      };
  }
}

function formatAccessState(status) {
  const s = status || 'unknown';
  switch (s) {
    case 'allowed':
      return '허용됨(allowed)';
    case 'denied':
      return '거부됨(denied)';
    case 'unknown':
    default:
      return '확인 불가(unknown)';
  }
}

function formatDeviceState(status) {
  const s = status || 'unknown';
  switch (s) {
    case 'compliant':
      return '보안 기준 충족(compliant)';
    case 'noncompliant':
      return '보안 기준 미충족(noncompliant)';
    case 'unknown':
    default:
      return '확인 불가(unknown)';
  }
}

function formatSessionState(status) {
  const s = status || 'unknown';
  switch (s) {
    case 'active':
      return '활성(active)';
    case 'expired':
      return '만료(expired)';
    case 'revoked':
      return '철회됨(revoked)';
    case 'unknown':
    default:
      return '확인 불가(unknown)';
  }
}

function mapKind(kind) {
  switch (kind) {
    case 'access':
      return '접속(access)';
    case 'xdr':
      return 'XDR 경보(xdr)';
    default:
      return kind ? `${kind}(unknown)` : '확인 불가(unknown)';
  }
}

export function createStudentView(context = {}) {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const container = document.createElement('div');
      container.className = 'student-identity-view';

      // 1. me 가 에러인 경우: 사용자 정보를 일체 노출하지 않고 오류 문구 표시
      if (me?.status === 'error') {
        const msg = formatErrorMessage(me.error, '서버에 연결하지 못했습니다.');

        const errorP = document.createElement('p');
        errorP.className = 'state state-error';
        errorP.setAttribute('data-student-status', 'error');
        errorP.textContent = msg;
        container.appendChild(errorP);

        if (devices?.status === 'error' && devices.error?.message && devices.error.message !== me.error?.message) {
          const devErrP = document.createElement('p');
          devErrP.className = 'state state-error';
          devErrP.textContent = formatErrorMessage(devices.error, '기기 정보 조회 실패');
          container.appendChild(devErrP);
        }
        if (sessions?.status === 'error' && sessions.error?.message && sessions.error.message !== me.error?.message) {
          const sessErrP = document.createElement('p');
          sessErrP.className = 'state state-error';
          sessErrP.textContent = formatErrorMessage(sessions.error, '세션 정보 조회 실패');
          container.appendChild(sessErrP);
        }

        renderModeBadges(container, [me, devices, sessions]);
        return container;
      }

      // 2. 전체가 로딩 중이거나 오류 없이 초기 로딩 상태인 경우
      const anyError = devices?.status === 'error' || sessions?.status === 'error';
      const anyOk = me?.status === 'ok' || devices?.status === 'ok' || sessions?.status === 'ok';

      if (!anyError && !anyOk && (me?.status === 'loading' || devices?.status === 'loading' || sessions?.status === 'loading')) {
        const loadingP = document.createElement('p');
        loadingP.className = 'state state-loading';
        loadingP.setAttribute('data-student-status', 'loading');
        loadingP.textContent = '불러오는 중';
        container.appendChild(loadingP);

        renderModeBadges(container, [me, devices, sessions]);
        return container;
      }

      // 3. me 가 ok 이거나 개별 자원의 로딩/오류/데이터가 존재하는 경우
      // 상단 모드 안내 (me, devices, sessions 의 모드 안내가 가려지지 않음)
      renderModeBadges(container, [me, devices, sessions]);

      // 개별 자원 오류가 있으면 상단 오류 메시지 표시
      if (devices?.status === 'error') {
        const devErrP = document.createElement('p');
        devErrP.className = 'state state-error';
        devErrP.setAttribute('data-student-device-error', '');
        devErrP.textContent = formatErrorMessage(devices.error, '기기 정보를 불러오지 못했습니다.');
        container.appendChild(devErrP);
      }
      if (sessions?.status === 'error') {
        const sessErrP = document.createElement('p');
        sessErrP.className = 'state state-error';
        sessErrP.setAttribute('data-student-session-error', '');
        sessErrP.textContent = formatErrorMessage(sessions.error, '세션 정보를 불러오지 못했습니다.');
        container.appendChild(sessErrP);
      }

      const dl = document.createElement('dl');
      dl.className = 'identity';

      // (1) 사용자 (me 기준)
      const dtUser = document.createElement('dt');
      dtUser.textContent = '사용자';
      const ddUser = document.createElement('dd');
      ddUser.setAttribute('data-student-user', '');

      if (me?.status === 'loading') {
        ddUser.textContent = '불러오는 중';
      } else if (me?.status === 'ok') {
        const user = me.data?.user;
        const userLabel = user?.label || '';
        const userId = user?.id || '';
        if (userLabel && userId && userLabel !== userId) {
          ddUser.textContent = `${userLabel} (${userId})`;
        } else {
          ddUser.textContent = userLabel || userId || '확인 불가';
        }
        appendInlineModeBadge(ddUser, me.mode);
      } else {
        ddUser.textContent = '확인 불가';
      }
      dl.appendChild(dtUser);
      dl.appendChild(ddUser);

      // (2) 기기 (devices 오류/로딩을 me.data.device 보다 먼저 처리)
      const dtDevice = document.createElement('dt');
      dtDevice.textContent = '기기';
      const ddDevice = document.createElement('dd');
      ddDevice.setAttribute('data-student-device', '');

      if (devices?.status === 'error') {
        ddDevice.setAttribute('data-status', 'error');
        ddDevice.textContent = formatErrorMessage(devices.error, '기기 확인 불가');
        appendInlineModeBadge(ddDevice, devices.mode);
      } else if (devices?.status === 'loading') {
        ddDevice.setAttribute('data-status', 'loading');
        ddDevice.textContent = '불러오는 중';
        appendInlineModeBadge(ddDevice, devices.mode);
      } else {
        // 현재 로그인 기기: me.data.device 를 우선 사용하며, devices.data 목록이 전달되면 해당 ID 와 일치하는 항목만 연결
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
          const devStatusKorean = mapDeviceStatus(devStatus);
          ddDevice.textContent = `${devName} · ${devStatusKorean} (${devStatus})`;
        } else {
          ddDevice.textContent = '확인 불가';
        }
        appendInlineModeBadge(ddDevice, devices?.mode || me?.mode);
      }
      dl.appendChild(dtDevice);
      dl.appendChild(ddDevice);

      // (3) 세션 (sessions 오류/로딩을 me.data.session 보다 먼저 처리)
      const dtSession = document.createElement('dt');
      dtSession.textContent = '세션';
      const ddSession = document.createElement('dd');
      ddSession.setAttribute('data-student-session', '');

      if (sessions?.status === 'error') {
        ddSession.setAttribute('data-status', 'error');
        ddSession.textContent = formatErrorMessage(sessions.error, '세션 확인 불가');
        appendInlineModeBadge(ddSession, sessions.mode);
      } else if (sessions?.status === 'loading') {
        ddSession.setAttribute('data-status', 'loading');
        ddSession.textContent = '불러오는 중';
        appendInlineModeBadge(ddSession, sessions.mode);
      } else {
        // 현재 로그인 세션: me.data.session 을 우선 사용하며, sessions.data 목록이 전달되면 해당 ID 와 일치하는 항목만 연결
        const currentSessionId = me?.data?.session?.id;
        const matchedSession = Array.isArray(sessions?.data) && currentSessionId
          ? sessions.data.find((s) => s.id === currentSessionId)
          : null;
        const session = matchedSession ? { ...me.data.session, ...matchedSession } : me?.data?.session;
        if (session) {
          const sessId = session.id || '세션';
          const sessStatus = session.status || 'unknown';
          ddSession.setAttribute('data-status', sessStatus);
          const sessStatusKorean = mapSessionStatus(sessStatus);
          ddSession.textContent = `${sessId} · ${sessStatusKorean} (${sessStatus})`;
        } else {
          ddSession.textContent = '확인 불가';
        }
        appendInlineModeBadge(ddSession, sessions?.mode || me?.mode);
      }
      dl.appendChild(dtSession);
      dl.appendChild(ddSession);

      container.appendChild(dl);
      return container;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const container = document.createElement('div');
      container.className = 'student-decision-view';

      const modeBadge = createModeBadge(mode);
      if (modeBadge) {
        const modeWrap = document.createElement('div');
        modeWrap.className = 'mode-badges';
        modeWrap.style.marginBottom = '8px';
        modeWrap.appendChild(modeBadge);
        container.appendChild(modeWrap);
      }

      // 1. 요청 전 (idle)
      if (status === 'idle' || !status) {
        container.setAttribute('data-student-decision', 'idle');
        const p = document.createElement('p');
        p.className = 'state state-empty';
        p.textContent = '앱을 골라 접속을 요청하세요. (아직 요청한 업무 앱이 없습니다)';
        container.appendChild(p);
        return container;
      }

      // 2. 요청 중 (loading)
      if (status === 'loading') {
        container.setAttribute('data-student-decision', 'loading');
        const p = document.createElement('p');
        p.className = 'state state-loading';
        const targetApp = data?.appId || appId || '업무 앱';
        p.textContent = `${targetApp} 접속 판정 확인 중…`;
        container.appendChild(p);
        return container;
      }

      // 3. 요청 실패 (error) - 거부(deny) 판정과 명확히 구분
      if (status === 'error') {
        container.setAttribute('data-student-decision', 'error');
        const errorBox = document.createElement('div');
        errorBox.className = 'decision decision-failed';

        const headP = document.createElement('p');
        const rawMsg = typeof error === 'string' ? error : (error?.message || error?.code || '서버에 접속 판정을 요청하지 못했습니다.');
        const errMsg = rawMsg.startsWith('요청 실패') ? rawMsg : `요청 실패: ${rawMsg}`;
        headP.textContent = errMsg;
        errorBox.appendChild(headP);

        const noteP = document.createElement('p');
        noteP.className = 'muted';
        noteP.textContent = '이 결과는 접근 거부(차단/deny) 판정이 아니며 요청 처리 실패입니다. 허용되지 않음 (접근 허용으로 간주할 수 없습니다).';
        errorBox.appendChild(noteP);

        container.appendChild(errorBox);
        return container;
      }

      // 4. 판정 수신 (ok)
      if (status === 'ok') {
        const decisionVal = data?.decision;
        const info = mapDecision(decisionVal);
        container.setAttribute('data-student-decision', info.code);

        const banner = document.createElement('div');
        banner.className = info.className;

        const titleP = document.createElement('p');
        const targetApp = data?.appId || appId || '지정되지 않음';
        titleP.textContent = `${targetApp} · ${info.text}`;
        banner.appendChild(titleP);

        const noteP = document.createElement('p');
        noteP.className = 'muted';
        noteP.textContent = info.note;
        banner.appendChild(noteP);

        container.appendChild(banner);

        const dl = document.createElement('dl');
        dl.className = 'kv';

        const dtApp = document.createElement('dt');
        dtApp.textContent = '업무 앱';
        const ddApp = document.createElement('dd');
        ddApp.setAttribute('data-student-decision-app', '');
        ddApp.textContent = targetApp;
        dl.appendChild(dtApp);
        dl.appendChild(ddApp);

        const dtDec = document.createElement('dt');
        dtDec.textContent = '판정';
        const ddDec = document.createElement('dd');
        ddDec.setAttribute('data-student-decision-result', info.code);
        ddDec.textContent = info.text;
        dl.appendChild(dtDec);
        dl.appendChild(ddDec);

        const dtReason = document.createElement('dt');
        dtReason.textContent = '판정 이유';
        const ddReason = document.createElement('dd');
        ddReason.setAttribute('data-student-decision-reason', '');
        ddReason.textContent = data?.reason || '이유 정보 없음';
        dl.appendChild(dtReason);
        dl.appendChild(ddReason);

        const dtTime = document.createElement('dt');
        dtTime.textContent = '판정 시각';
        const ddTime = document.createElement('dd');
        ddTime.setAttribute('data-student-decision-time', '');
        ddTime.textContent = data?.checkedAt ? String(data.checkedAt) : '시각 정보 없음';
        dl.appendChild(dtTime);
        dl.appendChild(ddTime);

        if (mode) {
          const dtMode = document.createElement('dt');
          dtMode.textContent = '데이터 상태';
          const ddMode = document.createElement('dd');
          switch (mode) {
            case 'demo':
              ddMode.textContent = '예제 자료 (demo)';
              break;
            case 'disconnected':
              ddMode.textContent = '연결 없음 (disconnected)';
              break;
            case 'unknown':
              ddMode.textContent = '확인 불가 (unknown)';
              break;
            default:
              ddMode.textContent = `${mode} (정상 연결)`;
              break;
          }
          dl.appendChild(dtMode);
          dl.appendChild(ddMode);
        }

        container.appendChild(dl);
        return container;
      }

      // 기타 예외 상태
      const fallbackP = document.createElement('p');
      fallbackP.className = 'state state-empty';
      fallbackP.textContent = '확인 불가: 알 수 없는 상태입니다. 허용되지 않음.';
      container.appendChild(fallbackP);
      return container;
    },
    renderEvents({ status, mode, data, error } = {}) {
      const container = document.createElement('div');
      container.className = 'student-events-view';

      const modeBadge = createModeBadge(mode);
      if (modeBadge) {
        const modeWrap = document.createElement('div');
        modeWrap.className = 'mode-badges';
        modeWrap.style.marginBottom = '8px';
        modeWrap.appendChild(modeBadge);
        container.appendChild(modeWrap);
      }

      // 1. 로딩 상태
      if (status === 'loading') {
        const p = document.createElement('p');
        p.className = 'state state-loading';
        p.textContent = '불러오는 중';
        container.appendChild(p);
        return container;
      }

      // 2. 오류 상태 (빈 목록과 명확히 구분, CONTRACT_MISMATCH 및 오류 처리)
      if (status === 'error' || status === 'CONTRACT_MISMATCH' || error) {
        const p = document.createElement('p');
        p.className = 'state state-error';
        p.setAttribute('data-student-status', 'error');
        const rawMsg = typeof error === 'string' ? error : (error?.message || error?.code);
        const msg = rawMsg || (status === 'CONTRACT_MISMATCH' ? '응답 형식을 확인할 수 없습니다(확인 불가). 이전 목록을 지웁니다.' : '서버 오류');
        p.textContent = `기록을 불러오지 못했습니다: ${msg}`;
        container.appendChild(p);
        return container;
      }

      // 3. 정상 상태이지만 기록이 없는 경우
      const sortedEvents = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(b?.at || 0).getTime() - new Date(a?.at || 0).getTime())
        : [];

      if (sortedEvents.length === 0) {
        const p = document.createElement('p');
        p.className = 'state state-empty';
        p.setAttribute('data-student-status', 'empty');
        p.textContent = '표시할 기록이 없습니다.';
        container.appendChild(p);
        return container;
      }

      // 4. 필터 상태 관리 (기록 종류, 업무 앱, 접속 상태)
      const filterState = {
        kind: 'all',
        appId: 'all',
        access: 'all',
      };

      let selectedDetailId = null;

      // 필터 영역 생성
      const filterBox = document.createElement('div');
      filterBox.className = 'event-filters';
      filterBox.style.display = 'flex';
      filterBox.style.gap = '12px';
      filterBox.style.flexWrap = 'wrap';
      filterBox.style.alignItems = 'center';
      filterBox.style.marginBottom = '12px';

      // (1) 기록 종류 필터
      const labelKind = document.createElement('label');
      labelKind.textContent = '기록 종류: ';
      const selectKind = document.createElement('select');
      selectKind.setAttribute('aria-label', '기록 종류');
      selectKind.setAttribute('data-student-filter', 'kind');
      const optKindAll = document.createElement('option');
      optKindAll.value = 'all';
      optKindAll.textContent = '전체 (all)';
      selectKind.appendChild(optKindAll);

      const kinds = Array.from(new Set(['access', 'xdr', ...sortedEvents.map((e) => e.kind).filter(Boolean)]));
      for (const k of kinds) {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = mapKind(k);
        selectKind.appendChild(opt);
      }
      labelKind.appendChild(selectKind);
      filterBox.appendChild(labelKind);

      // (2) 업무 앱 필터
      const labelApp = document.createElement('label');
      labelApp.textContent = '업무 앱: ';
      const selectApp = document.createElement('select');
      selectApp.setAttribute('aria-label', '업무 앱');
      selectApp.setAttribute('data-student-filter', 'appId');
      const optAppAll = document.createElement('option');
      optAppAll.value = 'all';
      optAppAll.textContent = '전체 (all)';
      selectApp.appendChild(optAppAll);

      const uniqueApps = Array.from(new Set(sortedEvents.map((e) => e.appId).filter(Boolean)));
      for (const app of uniqueApps) {
        const opt = document.createElement('option');
        opt.value = app;
        opt.textContent = app;
        selectApp.appendChild(opt);
      }
      labelApp.appendChild(selectApp);
      filterBox.appendChild(labelApp);

      // (3) 접속 상태 필터
      const labelAccess = document.createElement('label');
      labelAccess.textContent = '접속 상태: ';
      const selectAccess = document.createElement('select');
      selectAccess.setAttribute('aria-label', '접속 상태');
      selectAccess.setAttribute('data-student-filter', 'access');
      const optAccessAll = document.createElement('option');
      optAccessAll.value = 'all';
      optAccessAll.textContent = '전체 (all)';
      selectAccess.appendChild(optAccessAll);

      const accesses = Array.from(new Set(['allowed', 'denied', 'unknown', ...sortedEvents.map((e) => e.state?.access).filter(Boolean)]));
      for (const acc of accesses) {
        const opt = document.createElement('option');
        opt.value = acc;
        opt.textContent = formatAccessState(acc);
        selectAccess.appendChild(opt);
      }
      labelAccess.appendChild(selectAccess);
      filterBox.appendChild(labelAccess);

      container.appendChild(filterBox);

      // 목록 컨테이너
      const listEl = document.createElement('ul');
      listEl.className = 'records';
      listEl.style.listStyle = 'none';
      listEl.style.padding = '0';
      listEl.style.margin = '0';
      container.appendChild(listEl);

      function renderList() {
        listEl.replaceChildren();

        const filtered = sortedEvents.filter((ev) => {
          if (filterState.kind !== 'all' && ev.kind !== filterState.kind) return false;
          if (filterState.appId !== 'all' && ev.appId !== filterState.appId) return false;
          if (filterState.access !== 'all' && ev.state?.access !== filterState.access) return false;
          return true;
        });

        if (filtered.length === 0) {
          const liEmpty = document.createElement('li');
          liEmpty.className = 'records-empty';
          const p = document.createElement('p');
          p.className = 'state state-empty';
          p.textContent = '표시할 기록이 없습니다.';
          liEmpty.appendChild(p);
          listEl.appendChild(liEmpty);
          return;
        }

        for (const ev of filtered) {
          const li = document.createElement('li');
          li.className = 'event';
          li.setAttribute('data-student-event-id', ev.id);
          li.style.border = '1px solid var(--border)';
          li.style.borderRadius = 'var(--radius)';
          li.style.padding = '12px 14px';
          li.style.marginBottom = '12px';

          // 상단 요약 및 종류
          const headDiv = document.createElement('div');
          headDiv.className = 'event-head';
          headDiv.style.display = 'flex';
          headDiv.style.alignItems = 'center';
          headDiv.style.gap = '8px';

          const h3 = document.createElement('h3');
          h3.style.margin = '0';
          h3.textContent = ev.summary || '요약 없음';
          headDiv.appendChild(h3);

          const tagKind = document.createElement('span');
          tagKind.className = 'tag';
          tagKind.textContent = mapKind(ev.kind);
          headDiv.appendChild(tagKind);

          li.appendChild(headDiv);

          // 메타 정보 (사건 ID, 시각, 앱, 요약)
          const metaP = document.createElement('p');
          metaP.className = 'muted';
          metaP.style.margin = '6px 0';
          const appText = ev.appId || '앱을 확인할 수 없음';
          metaP.textContent = `사건 ID: ${ev.id} · 시각: ${ev.at || '시각 정보 없음'} · 종류: ${mapKind(ev.kind)} · 앱: ${appText}`;
          li.appendChild(metaP);

          const summaryP = document.createElement('p');
          summaryP.style.margin = '4px 0 8px';
          summaryP.textContent = ev.summary || '요약 없음';
          li.appendChild(summaryP);

          // 상세 버튼
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'event-actions';

          const detailBtn = document.createElement('button');
          detailBtn.type = 'button';
          detailBtn.className = 'btn';
          detailBtn.setAttribute('aria-label', `${ev.id} 상세`);
          detailBtn.textContent = `${ev.id} 상세`;
          actionsDiv.appendChild(detailBtn);
          li.appendChild(actionsDiv);

          // 상세 영역 슬롯
          const detailSlot = document.createElement('div');
          detailSlot.className = 'detail-slot';
          detailSlot.style.marginTop = '8px';

          if (selectedDetailId === ev.id) {
            detailSlot.appendChild(createDetailBox(ev));
          }

          detailBtn.addEventListener('click', () => {
            if (selectedDetailId === ev.id) {
              selectedDetailId = null;
            } else {
              selectedDetailId = ev.id;
            }
            renderList();
          });

          li.appendChild(detailSlot);
          listEl.appendChild(li);
        }
      }

      function createDetailBox(ev) {
        const box = document.createElement('div');
        box.className = 'event-detail-box';
        box.setAttribute('data-student-event-detail', ev.id);
        box.style.borderTop = '1px solid var(--border)';
        box.style.paddingTop = '10px';
        box.style.marginTop = '10px';

        const headDetail = document.createElement('h4');
        headDetail.style.margin = '0 0 8px';
        headDetail.textContent = `사건 상세: ${ev.id}`;
        box.appendChild(headDetail);

        // 세 상태 및 기본 정보
        const dl = document.createElement('dl');
        dl.className = 'kv';

        const dtId = document.createElement('dt');
        dtId.textContent = '사건 ID';
        const ddId = document.createElement('dd');
        ddId.setAttribute('data-student-detail-id', ev.id);
        ddId.textContent = ev.id;
        dl.appendChild(dtId);
        dl.appendChild(ddId);

        const dtApp = document.createElement('dt');
        dtApp.textContent = '업무 앱';
        const ddApp = document.createElement('dd');
        ddApp.setAttribute('data-student-detail-app', ev.appId || '');
        ddApp.textContent = ev.appId || '앱을 확인할 수 없음';
        dl.appendChild(dtApp);
        dl.appendChild(ddApp);

        const dtAccess = document.createElement('dt');
        dtAccess.textContent = '접속 상태';
        const ddAccess = document.createElement('dd');
        ddAccess.setAttribute('data-student-detail-access', ev.state?.access || 'unknown');
        ddAccess.textContent = formatAccessState(ev.state?.access);
        dl.appendChild(dtAccess);
        dl.appendChild(ddAccess);

        const dtSession = document.createElement('dt');
        dtSession.textContent = '세션 상태';
        const ddSession = document.createElement('dd');
        ddSession.setAttribute('data-student-detail-session', ev.state?.session || 'unknown');
        ddSession.textContent = formatSessionState(ev.state?.session);
        dl.appendChild(dtSession);
        dl.appendChild(ddSession);

        const dtDevice = document.createElement('dt');
        dtDevice.textContent = '기기 상태';
        const ddDevice = document.createElement('dd');
        ddDevice.setAttribute('data-student-detail-device', ev.state?.device || 'unknown');
        ddDevice.textContent = formatDeviceState(ev.state?.device);
        dl.appendChild(dtDevice);
        dl.appendChild(ddDevice);

        box.appendChild(dl);

        // 근거 (evidence)
        const hEvidence = document.createElement('h4');
        hEvidence.style.margin = '10px 0 4px';
        hEvidence.textContent = '근거 (evidence)';
        box.appendChild(hEvidence);

        if (Array.isArray(ev.evidence) && ev.evidence.length > 0) {
          const ulEv = document.createElement('ul');
          ulEv.setAttribute('data-student-detail-evidence', '');
          ulEv.style.margin = '0 0 8px';
          ulEv.style.paddingLeft = '18px';
          for (const item of ev.evidence) {
            const liItem = document.createElement('li');
            liItem.setAttribute('data-student-evidence-id', item.id);
            liItem.textContent = `${item.id}: ${item.text || ''}`;
            ulEv.appendChild(liItem);
          }
          box.appendChild(ulEv);
        } else {
          const pNone = document.createElement('p');
          pNone.className = 'muted';
          pNone.textContent = '근거 없음';
          box.appendChild(pNone);
        }

        // 규칙 (rules)
        const hRules = document.createElement('h4');
        hRules.style.margin = '10px 0 4px';
        hRules.textContent = '규칙 (rules)';
        box.appendChild(hRules);

        if (Array.isArray(ev.rules) && ev.rules.length > 0) {
          const ulRules = document.createElement('ul');
          ulRules.setAttribute('data-student-detail-rules', '');
          ulRules.style.margin = '0 0 8px';
          ulRules.style.paddingLeft = '18px';
          for (const item of ev.rules) {
            const liItem = document.createElement('li');
            liItem.setAttribute('data-student-rule-id', item.id);
            liItem.textContent = `${item.id}: ${item.text || ''}`;
            ulRules.appendChild(liItem);
          }
          box.appendChild(ulRules);
        } else {
          const pNone = document.createElement('p');
          pNone.className = 'muted';
          pNone.textContent = '규칙 없음';
          box.appendChild(pNone);
        }

        // 미지원 조치 안내 (supportedActions 지원)
        if (Array.isArray(ev.supportedActions) && ev.supportedActions.length > 0) {
          const actionsBox = document.createElement('div');
          actionsBox.style.marginTop = '10px';
          for (const action of ev.supportedActions) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn';
            btn.disabled = true;
            btn.setAttribute('disabled', '');
            btn.setAttribute('aria-disabled', 'true');
            btn.setAttribute('aria-label', `${action} 미지원`);
            btn.setAttribute('data-student-action-unsupported', action);
            btn.textContent = `${action} 미지원`;
            actionsBox.appendChild(btn);
          }
          const noteAction = document.createElement('p');
          noteAction.className = 'muted';
          noteAction.textContent = '조치 실행 연결은 준비 중입니다.';
          actionsBox.appendChild(noteAction);
          box.appendChild(actionsBox);
        }

        return box;
      }

      // 필터 변경 이벤트 리스너
      selectKind.addEventListener('change', () => {
        filterState.kind = selectKind.value;
        renderList();
      });
      selectApp.addEventListener('change', () => {
        filterState.appId = selectApp.value;
        renderList();
      });
      selectAccess.addEventListener('change', () => {
        filterState.access = selectAccess.value;
        renderList();
      });

      // 초기 렌더링
      renderList();

      return container;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const container = document.createElement('div');
      container.className = 'student-status-view';

      // 상단 모드 뱃지 (demo, disconnected 등)
      const modeBadge = createModeBadge(mode);
      if (modeBadge) {
        const modeWrap = document.createElement('div');
        modeWrap.className = 'mode-badges';
        modeWrap.style.marginBottom = '12px';
        modeWrap.appendChild(modeBadge);
        container.appendChild(modeWrap);
      }

      // 1. 등록 기기 상태 (devices)
      const secDevices = document.createElement('section');
      secDevices.className = 'status-section';
      secDevices.setAttribute('data-student-section', 'devices');

      const hDevices = document.createElement('h3');
      hDevices.textContent = '등록 기기 상태';
      secDevices.appendChild(hDevices);

      if (devices?.status === 'loading') {
        const p = document.createElement('p');
        p.className = 'state state-loading';
        p.setAttribute('data-student-device-status', 'loading');
        p.textContent = '기기 목록을 불러오는 중';
        secDevices.appendChild(p);
      } else if (devices?.status === 'error') {
        const isTimeout = isTimeoutError(devices.error);
        const pErr = document.createElement('p');
        pErr.className = 'state state-error';
        pErr.setAttribute('data-student-device-status', 'error');
        const devErrMsg = typeof devices.error === 'string' ? devices.error : (devices.error?.message || devices.error?.code || '오류 발생');
        pErr.textContent = isTimeout
          ? `시간 초과: 기기 정보 응답 시간이 초과되었습니다 (${devErrMsg}).`
          : `기기 정보를 불러오지 못했습니다: ${devErrMsg}`;
        secDevices.appendChild(pErr);

        const pRetry = document.createElement('p');
        pRetry.className = 'muted';
        pRetry.textContent = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.';
        secDevices.appendChild(pRetry);
      } else if (devices?.status === 'ok') {
        if (!Array.isArray(devices.data) || devices.data.length === 0) {
          const p = document.createElement('p');
          p.className = 'state state-empty';
          p.setAttribute('data-student-device-status', 'empty');
          p.textContent = '등록된 기기가 없음';
          secDevices.appendChild(p);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'devices-list';
          ul.setAttribute('data-student-devices-list', '');
          for (const dev of devices.data) {
            const li = document.createElement('li');
            li.setAttribute('data-student-device-id', dev.id);
            li.textContent = `기기: ${dev.label || dev.id} (${dev.id}) · 상태: ${formatDeviceState(dev.status)}`;
            ul.appendChild(li);
          }
          secDevices.appendChild(ul);
        }
      } else {
        const p = document.createElement('p');
        p.className = 'state state-empty';
        p.setAttribute('data-student-device-status', 'empty');
        p.textContent = '등록된 기기가 없음';
        secDevices.appendChild(p);
      }
      container.appendChild(secDevices);

      // 2. 현재 세션 연결 상태 (sessions)
      const secSessions = document.createElement('section');
      secSessions.className = 'status-section';
      secSessions.setAttribute('data-student-section', 'sessions');

      const hSessions = document.createElement('h3');
      hSessions.textContent = '현재 세션 연결 상태';
      secSessions.appendChild(hSessions);

      const pSessionNotice = document.createElement('p');
      pSessionNotice.className = 'muted';
      pSessionNotice.textContent = '세션은 지금 검증된 연결 하나만 표시되며 지난 세션 목록이 아닙니다.';
      secSessions.appendChild(pSessionNotice);

      if (sessions?.status === 'loading') {
        const p = document.createElement('p');
        p.className = 'state state-loading';
        p.setAttribute('data-student-session-status', 'loading');
        p.textContent = '세션 연결을 불러오는 중';
        secSessions.appendChild(p);
      } else if (sessions?.status === 'error') {
        const isTimeout = isTimeoutError(sessions.error);
        const pErr = document.createElement('p');
        pErr.className = 'state state-error';
        pErr.setAttribute('data-student-session-status', 'error');
        const sessErrMsg = typeof sessions.error === 'string' ? sessions.error : (sessions.error?.message || sessions.error?.code || '오류 발생');
        pErr.textContent = isTimeout
          ? `시간 초과: 세션 연결 응답 시간이 초과되었습니다 (${sessErrMsg}).`
          : `세션 연결을 불러오지 못했습니다: ${sessErrMsg}`;
        secSessions.appendChild(pErr);

        const pRetry = document.createElement('p');
        pRetry.className = 'muted';
        pRetry.textContent = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.';
        secSessions.appendChild(pRetry);
      } else if (sessions?.status === 'ok') {
        if (!Array.isArray(sessions.data) || sessions.data.length === 0) {
          const p = document.createElement('p');
          p.className = 'state state-empty';
          p.setAttribute('data-student-session-status', 'empty');
          p.textContent = '현재 연결 없음';
          secSessions.appendChild(p);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'sessions-list';
          ul.setAttribute('data-student-sessions-list', '');
          for (const sess of sessions.data) {
            const li = document.createElement('li');
            li.setAttribute('data-student-session-id', sess.id);
            li.textContent = `세션 ID: ${sess.id} · 상태: ${formatSessionState(sess.status)}`;
            ul.appendChild(li);
          }
          secSessions.appendChild(ul);
        }
      } else {
        const p = document.createElement('p');
        p.className = 'state state-empty';
        p.setAttribute('data-student-session-status', 'empty');
        p.textContent = '현재 연결 없음';
        secSessions.appendChild(p);
      }
      container.appendChild(secSessions);

      // 3. 상태 및 보안 알림 (notifications)
      const secNoti = document.createElement('section');
      secNoti.className = 'status-section';
      secNoti.setAttribute('data-student-section', 'notifications');

      const hNoti = document.createElement('h3');
      hNoti.textContent = '상태 및 보안 알림';
      secNoti.appendChild(hNoti);

      if (!Array.isArray(notifications) || notifications.length === 0) {
        const p = document.createElement('p');
        p.className = 'state state-empty';
        p.setAttribute('data-student-notifications-empty', '');
        p.textContent = '주의할 알림이 없습니다.';
        secNoti.appendChild(p);
      } else {
        const ul = document.createElement('ul');
        ul.className = 'notifications-list';
        ul.setAttribute('data-student-notifications-list', '');
        for (const noti of notifications) {
          const li = document.createElement('li');
          li.setAttribute('data-student-notification-resource', noti.resource || 'unknown');
          li.textContent = `[${noti.resource || '자원'}] 코드: ${noti.code || '알림'} · ${noti.message || ''}`;
          ul.appendChild(li);
        }
        secNoti.appendChild(ul);

        const pNoticeNext = document.createElement('p');
        pNoticeNext.className = 'muted';
        pNoticeNext.textContent = '주의가 필요한 항목이 있습니다. 변경 사항 확인 후 위쪽 다시 불러오기 버튼을 직접 누르세요.';
        secNoti.appendChild(pNoticeNext);
      }
      container.appendChild(secNoti);

      // 4. 시스템 진단 정보 및 도움정보 복사 (diagnostics)
      const secDiag = document.createElement('section');
      secDiag.className = 'status-section';
      secDiag.setAttribute('data-student-section', 'diagnostics');

      const hDiag = document.createElement('h3');
      hDiag.textContent = '시스템 진단 정보';
      secDiag.appendChild(hDiag);

      const pDiagNotice = document.createElement('p');
      pDiagNotice.className = 'muted';
      pDiagNotice.textContent = '진단 정보는 제공 화면이 조회한 안전한 점검 결과이며 학생 구현에서 직접 요청하지 않습니다.';
      secDiag.appendChild(pDiagNotice);

      const safeDiag = {
        requestId: diagnostics?.data?.requestId || '',
        component: diagnostics?.data?.component || '',
        version: diagnostics?.data?.version || '',
        checkedAt: diagnostics?.data?.checkedAt || diagnostics?.meta?.checkedAt || '',
        engineMode: diagnostics?.data?.engine?.mode || diagnostics?.data?.['engine.mode'] || diagnostics?.data?.engineMode || '',
        engineCode: diagnostics?.data?.engine?.code || diagnostics?.data?.['engine.code'] || diagnostics?.data?.engineCode || '',
      };

      if (diagnostics?.status === 'loading') {
        const p = document.createElement('p');
        p.className = 'state state-loading';
        p.setAttribute('data-student-diag-status', 'loading');
        p.textContent = '진단 점검을 불러오는 중';
        secDiag.appendChild(p);
      } else if (diagnostics?.status === 'error') {
        const isTimeout = isTimeoutError(diagnostics.error);
        const pErr = document.createElement('p');
        pErr.className = 'state state-error';
        pErr.setAttribute('data-student-diag-status', 'error');
        const diagErrMsg = typeof diagnostics.error === 'string' ? diagnostics.error : (diagnostics.error?.message || diagnostics.error?.code || '오류 발생');
        pErr.textContent = isTimeout
          ? `시간 초과: 진단 점검 응답 시간이 초과되었습니다 (${diagErrMsg}).`
          : `진단 정보를 불러오지 못했습니다: ${diagErrMsg}`;
        secDiag.appendChild(pErr);

        const pRetry = document.createElement('p');
        pRetry.className = 'muted';
        pRetry.textContent = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.';
        secDiag.appendChild(pRetry);
      } else if (diagnostics?.status === 'ok') {
        const dl = document.createElement('dl');
        dl.className = 'kv diagnostics-data';
        dl.setAttribute('data-student-diagnostics-data', '');

        const dtReq = document.createElement('dt');
        dtReq.textContent = '요청 ID (requestId)';
        const ddReq = document.createElement('dd');
        ddReq.setAttribute('data-student-diag-request-id', safeDiag.requestId);
        ddReq.textContent = safeDiag.requestId || '없음';
        dl.appendChild(dtReq);
        dl.appendChild(ddReq);

        const dtComp = document.createElement('dt');
        dtComp.textContent = '구성 요소 (component)';
        const ddComp = document.createElement('dd');
        ddComp.setAttribute('data-student-diag-component', safeDiag.component);
        ddComp.textContent = safeDiag.component || '없음';
        dl.appendChild(dtComp);
        dl.appendChild(ddComp);

        const dtVer = document.createElement('dt');
        dtVer.textContent = '버전 (version)';
        const ddVer = document.createElement('dd');
        ddVer.setAttribute('data-student-diag-version', safeDiag.version);
        ddVer.textContent = safeDiag.version || '없음';
        dl.appendChild(dtVer);
        dl.appendChild(ddVer);

        const dtTime = document.createElement('dt');
        dtTime.textContent = '점검 시각 (checkedAt)';
        const ddTime = document.createElement('dd');
        ddTime.setAttribute('data-student-diag-checked-at', safeDiag.checkedAt);
        ddTime.textContent = safeDiag.checkedAt || '없음';
        dl.appendChild(dtTime);
        dl.appendChild(ddTime);

        const dtMode = document.createElement('dt');
        dtMode.textContent = '엔진 모드 (engine.mode)';
        const ddMode = document.createElement('dd');
        ddMode.setAttribute('data-student-diag-engine-mode', safeDiag.engineMode);
        ddMode.textContent = safeDiag.engineMode || '없음';
        dl.appendChild(dtMode);
        dl.appendChild(ddMode);

        const dtCode = document.createElement('dt');
        dtCode.textContent = '엔진 코드 (engine.code)';
        const ddCode = document.createElement('dd');
        ddCode.setAttribute('data-student-diag-engine-code', safeDiag.engineCode);
        ddCode.textContent = safeDiag.engineCode || '없음';
        dl.appendChild(dtCode);
        dl.appendChild(ddCode);

        secDiag.appendChild(dl);
      } else {
        const p = document.createElement('p');
        p.className = 'muted';
        p.setAttribute('data-student-diag-status', 'idle');
        p.textContent = '진단 정보 점검 대기 중입니다.';
        secDiag.appendChild(p);
      }

      // 도움정보 복사 버튼 (학생 상태 칸 안에 필수 위치)
      const copyWrap = document.createElement('div');
      copyWrap.className = 'help-copy-wrap';
      copyWrap.style.marginTop = '12px';

      const pCopyNote = document.createElement('p');
      pCopyNote.className = 'muted';
      pCopyNote.textContent = '이 정보는 도움 요청에 쓰도록 안전한 값만 복사하는 것이며 비밀번호나 토큰은 포함되지 않습니다.';
      copyWrap.appendChild(pCopyNote);

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn';
      copyBtn.setAttribute('aria-label', '도움정보 복사');
      copyBtn.setAttribute('data-student-copy-help', '');
      copyBtn.textContent = '도움정보 복사';

      const copyFeedback = document.createElement('span');
      copyFeedback.className = 'muted';
      copyFeedback.style.marginLeft = '10px';
      copyFeedback.setAttribute('aria-live', 'polite');

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

      copyWrap.appendChild(copyBtn);
      copyWrap.appendChild(copyFeedback);
      secDiag.appendChild(copyWrap);

      container.appendChild(secDiag);

      return container;
    },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted } = {}) {
      const container = document.createElement('div');
      container.className = 'student-ai-connection-view';

      // 상단 모드 뱃지 (demo, disconnected 등)
      const modeBadge = createModeBadge(mode);
      if (modeBadge) {
        const modeWrap = document.createElement('div');
        modeWrap.className = 'mode-badges';
        modeWrap.style.marginBottom = '10px';
        modeWrap.appendChild(modeBadge);
        container.appendChild(modeWrap);
      }

      // 1. 점검 전 (idle 또는 미정의)
      if (status === 'idle' || !status) {
        container.setAttribute('data-student-ai-status', 'idle');

        const pIdle = document.createElement('p');
        pIdle.className = 'state state-empty';
        pIdle.textContent = 'AI 연결 점검 전';
        container.appendChild(pIdle);

        const pDesc = document.createElement('p');
        pDesc.className = 'muted';
        pDesc.textContent = '아직 AI 연결을 점검하지 않았습니다. 설정값 존재는 이용 권한 확인이 아닙니다.';
        container.appendChild(pDesc);

        const pManual = document.createElement('p');
        pManual.className = 'muted';
        pManual.textContent = '다시 점검은 사용자가 위쪽 AI 연결 점검 버튼을 직접 누르는 것입니다. 자동으로 다시 점검하지 않습니다.';
        container.appendChild(pManual);

        return container;
      }

      // 2. 점검 중 (loading)
      if (status === 'loading') {
        container.setAttribute('data-student-ai-status', 'loading');

        const pLoading = document.createElement('p');
        pLoading.className = 'state state-loading';
        pLoading.textContent = 'AI 연결 점검 중';
        container.appendChild(pLoading);

        const pDesc = document.createElement('p');
        pDesc.className = 'muted';
        pDesc.textContent = '현재 로그인 정보로 AI 모델 응답 및 연결을 점검하는 중입니다…';
        container.appendChild(pDesc);

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

        const pError = document.createElement('p');
        pError.className = 'state state-error';
        pError.setAttribute('data-student-ai-error', safeCode);
        if (errInfo.isTimeout) {
          pError.textContent = `시간 초과: [${safeCode}] ${safeMsg}`;
        } else if (errInfo.isCancel) {
          pError.textContent = `취소됨: [${safeCode}] ${safeMsg}`;
        } else {
          pError.textContent = `AI 연결 점검 실패: [${safeCode}] ${safeMsg}`;
        }
        container.appendChild(pError);

        const pCategory = document.createElement('p');
        pCategory.className = 'state-category';
        pCategory.style.fontWeight = 'bold';
        pCategory.style.margin = '6px 0 4px';
        pCategory.textContent = `원인 구분: ${errInfo.category}`;
        container.appendChild(pCategory);

        const pGuidance = document.createElement('p');
        pGuidance.className = 'muted';
        pGuidance.style.margin = '4px 0 8px';
        pGuidance.textContent = `안내: ${errInfo.guidance}`;
        container.appendChild(pGuidance);

        const pNotice = document.createElement('p');
        pNotice.className = 'muted';
        pNotice.style.margin = '4px 0 8px';
        pNotice.textContent = '이 결과는 점검 실패 또는 취소이며 연결 완료나 사건 설명 성공이 아닙니다. 이전 점검 결과는 현재 결과로 인정되지 않습니다.';
        container.appendChild(pNotice);

        const pManual = document.createElement('p');
        pManual.className = 'muted';
        pManual.textContent = '다시 점검은 위쪽 AI 연결 점검 버튼을 직접 누르세요. 자동으로 다시 점검하지 않습니다.';
        container.appendChild(pManual);

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

        const pSuccess = document.createElement('p');
        pSuccess.className = 'state state-ok';
        pSuccess.style.fontWeight = 'bold';
        pSuccess.textContent = `${authKorean} · 모델 수: ${modelCount}개`;
        container.appendChild(pSuccess);

        const dl = document.createElement('dl');
        dl.className = 'kv';
        dl.style.margin = '8px 0';

        const dtAuth = document.createElement('dt');
        dtAuth.textContent = '인증 및 권한 상태';
        const ddAuth = document.createElement('dd');
        ddAuth.setAttribute('data-student-ai-auth', String(authType));
        ddAuth.textContent = authKorean;
        dl.appendChild(dtAuth);
        dl.appendChild(ddAuth);

        const dtCount = document.createElement('dt');
        dtCount.textContent = '모델 수';
        const ddCount = document.createElement('dd');
        ddCount.setAttribute('data-student-ai-model-count', String(modelCount));
        ddCount.textContent = `${modelCount}개`;
        dl.appendChild(dtCount);
        dl.appendChild(ddCount);

        const dtTime = document.createElement('dt');
        dtTime.textContent = '점검 시각';
        const ddTime = document.createElement('dd');
        ddTime.setAttribute('data-student-ai-checked-at', String(checkTime));
        ddTime.textContent = String(checkTime);
        dl.appendChild(dtTime);
        dl.appendChild(ddTime);

        container.appendChild(dl);

        // 사건 설명 미실행 필수 경고 및 구분 안내
        const pWarning = document.createElement('p');
        pWarning.className = 'state-notice';
        pWarning.style.margin = '8px 0';
        pWarning.style.padding = '8px 10px';
        pWarning.style.backgroundColor = 'var(--bg-subtle, #f6f8fa)';
        pWarning.style.border = '1px solid var(--border, #d0d7de)';
        pWarning.style.borderRadius = 'var(--radius, 6px)';
        pWarning.textContent = '사건 설명은 아직 실행하지 않았습니다. 본 점검은 AI 게이트와의 연결 및 모델 수 응답만 확인한 것이며, 모델 목록 응답을 보안 사건 설명이 성공하거나 완료된 것으로 간주할 수 없습니다.';
        container.appendChild(pWarning);

        const pManual = document.createElement('p');
        pManual.className = 'muted';
        pManual.textContent = '다시 점검은 위쪽 AI 연결 점검 버튼을 직접 누르세요. 자동으로 다시 점검하지 않습니다.';
        container.appendChild(pManual);

        return container;
      }

      // 기타 알 수 없는 상태
      container.setAttribute('data-student-ai-status', 'unknown');
      const pFallback = document.createElement('p');
      pFallback.className = 'state state-empty';
      pFallback.textContent = '확인 불가(unknown): 알 수 없는 AI 연결 상태입니다. 정상 또는 연결 완료로 간주하지 않습니다.';
      container.appendChild(pFallback);
      return container;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const container = document.createElement('div');
      container.className = 'student-explanation-view';

      // 1. 설명 실패 (error) - event 가 null 이어도 안전한 오류 코드·메시지와 실패 이유를 먼저 표시
      if (explanation?.status === 'error') {
        container.setAttribute('data-student-explanation-status', 'error');
        const safeCode = explanation.error?.code || (typeof explanation.error === 'string' ? explanation.error : 'ON_AI_INVALID_OUTPUT');
        const rawMsg = explanation.error?.message || (typeof explanation.error === 'string' ? explanation.error : '');
        const safeMsg = sanitizeAiErrorMessage(rawMsg || SAFE_AI_MESSAGES[safeCode] || 'AI 설명을 불러오지 못했습니다.', safeCode);

        const pError = document.createElement('p');
        pError.className = 'state state-error';
        pError.setAttribute('data-student-explanation-error', safeCode);
        pError.textContent = `AI 설명 실패: [${safeCode}] ${safeMsg}`;
        container.appendChild(pError);

        const pNotice = document.createElement('p');
        pNotice.className = 'muted';
        pNotice.textContent = '보안 기록은 그대로 유지되며 AI 설명 실패는 과제 실패가 아닙니다.';
        container.appendChild(pNotice);

        return container;
      }

      // 2. 오류 없이 event 만 null 인 경우 - 보안 기록을 먼저 선택하도록 안내
      if (!event) {
        container.setAttribute('data-student-explanation-status', 'empty');
        const pNoEvent = document.createElement('p');
        pNoEvent.className = 'muted';
        pNoEvent.textContent = '보안 기록에서 기록을 먼저 선택하세요.';
        container.appendChild(pNoEvent);
        return container;
      }

      // 상단 모드 뱃지 (explanation 에 mode 가 있는 경우)
      if (explanation?.mode) {
        const modeBadge = createModeBadge(explanation.mode);
        if (modeBadge) {
          const modeWrap = document.createElement('div');
          modeWrap.className = 'mode-badges';
          modeWrap.style.marginBottom = '8px';
          modeWrap.appendChild(modeBadge);
          container.appendChild(modeWrap);
        }
      }

      // 3. 설명 요청 전 (idle)
      if (!explanation || explanation.status === 'idle') {
        container.setAttribute('data-student-explanation-status', 'idle');
        const pIdle = document.createElement('p');
        pIdle.className = 'state state-empty';
        pIdle.textContent = `사건 ${event.id} 설명 요청 전입니다. AI 설명 버튼을 눌러 요청하세요.`;
        container.appendChild(pIdle);
        return container;
      }

      // 4. 설명 요청 중 (loading)
      if (explanation.status === 'loading') {
        container.setAttribute('data-student-explanation-status', 'loading');
        const pLoading = document.createElement('p');
        pLoading.className = 'state state-loading';
        pLoading.textContent = `사건 ${event.id}에 대한 AI 설명을 요청하는 중입니다…`;
        container.appendChild(pLoading);
        return container;
      }

      // 5. 설명 데이터 검증 및 근거 바인딩 점검 (ok)
      if (explanation.status === 'ok') {
        const expData = explanation.data;
        if (!expData || typeof expData !== 'object') {
          container.setAttribute('data-student-explanation-status', 'error');
          const pErr = document.createElement('p');
          pErr.className = 'state state-error';
          pErr.textContent = 'AI 설명 데이터가 비어 있거나 올바르지 않습니다 (확인 불가).';
          container.appendChild(pErr);
          return container;
        }

        // 검증 A: AI 가 이미 실행했다고 답한 설명은 거절 (executed: true 금지)
        if (expData.executed === true) {
          container.setAttribute('data-student-explanation-status', 'error');
          container.setAttribute('data-student-explanation-error', 'ON_AI_INVALID_OUTPUT');
          const pErr = document.createElement('p');
          pErr.className = 'state state-error';
          pErr.textContent = 'AI가 이미 실행했다고 보고한 설명은 허용되지 않으며 사용할 수 없습니다 (사람 확인 없는 자동 실행 금지).';
          container.appendChild(pErr);

          const pNotice = document.createElement('p');
          pNotice.className = 'muted';
          pNotice.textContent = '보안 기록은 그대로 유지됩니다.';
          container.appendChild(pNotice);
          return container;
        }

        // 검증 B: 근거 일치성 확인 (evidence binding)
        const eventEvidenceList = Array.isArray(event.evidence) ? event.evidence : [];
        const validEvidenceMap = new Map(eventEvidenceList.map((e) => [e.id, e.text]));
        const citedEvidenceIds = Array.isArray(expData.evidenceIds) ? expData.evidenceIds : [];

        // 인용한 근거 중 사건 근거 목록에 없는 것이 있는지 점검 (근거 부족/불일치)
        const unknownCitedIds = citedEvidenceIds.filter((id) => !validEvidenceMap.has(id));
        if (unknownCitedIds.length > 0) {
          container.setAttribute('data-student-explanation-status', 'error');
          container.setAttribute('data-student-explanation-error', 'ON_AI_INVALID_OUTPUT');
          const pErr = document.createElement('p');
          pErr.className = 'state state-error';
          pErr.textContent = `AI 설명 오류: 인용한 근거 ID(${unknownCitedIds.join(', ')})가 현재 사건(${event.id})의 근거 목록에 존재하지 않아 이 설명을 표시할 수 없습니다 (근거 불일치·근거 부족).`;
          container.appendChild(pErr);

          const pNotice = document.createElement('p');
          pNotice.className = 'muted';
          pNotice.textContent = '보안 기록은 그대로 유지되며 잘못된 설명 내용은 표시되지 않습니다.';
          container.appendChild(pNotice);
          return container;
        }

        // 검증 C: 제안(proposals) 내의 근거 ID 점검
        const rawProposals = Array.isArray(expData.proposals) ? expData.proposals : [];
        for (const prop of rawProposals) {
          const propEvidenceIds = Array.isArray(prop.evidenceIds) ? prop.evidenceIds : [];
          const unknownPropEv = propEvidenceIds.filter((id) => !validEvidenceMap.has(id));
          if (unknownPropEv.length > 0) {
            container.setAttribute('data-student-explanation-status', 'error');
            container.setAttribute('data-student-explanation-error', 'ON_AI_INVALID_OUTPUT');
            const pErr = document.createElement('p');
            pErr.className = 'state state-error';
            pErr.textContent = `AI 제안 오류: 제안에 포함된 근거 ID(${unknownPropEv.join(', ')})가 사건 근거와 일치하지 않습니다 (근거 불일치·근거 부족).`;
            container.appendChild(pErr);

            const pNotice = document.createElement('p');
            pNotice.className = 'muted';
            pNotice.textContent = '보안 기록은 그대로 유지됩니다.';
            container.appendChild(pNotice);
            return container;
          }
        }

        // 모든 검증 통과 -> 성공한 설명에만 data-student-explanation-event=event.id 부여
        container.setAttribute('data-student-explanation-status', 'ok');
        container.setAttribute('data-student-explanation-event', event.id);

        // (1) 참고용 AI 설명 제목 및 안내
        const h4Title = document.createElement('h4');
        h4Title.style.margin = '0 0 6px';
        h4Title.textContent = 'AI 설명(참고용)';
        container.appendChild(h4Title);

        const pDisclaimer = document.createElement('p');
        pDisclaimer.className = 'muted';
        pDisclaimer.style.margin = '0 0 10px';
        pDisclaimer.textContent = '아래 요약은 AI가 이 기록을 읽고 쓴 해석입니다. 사실 판단은 인용한 근거와 연동 시스템이 알려 준 현재 상태를 기준으로 하세요.';
        container.appendChild(pDisclaimer);

        // (2) 이벤트 ID 및 참고용 AI 요약
        const dlMeta = document.createElement('dl');
        dlMeta.className = 'kv';
        dlMeta.style.margin = '0 0 12px';

        const dtEventId = document.createElement('dt');
        dtEventId.textContent = '사건 ID';
        const ddEventId = document.createElement('dd');
        ddEventId.setAttribute('data-student-explanation-id', event.id);
        ddEventId.textContent = event.id;
        dlMeta.appendChild(dtEventId);
        dlMeta.appendChild(ddEventId);

        const dtSummary = document.createElement('dt');
        dtSummary.textContent = 'AI 요약';
        const ddSummary = document.createElement('dd');
        ddSummary.setAttribute('data-student-explanation-summary', '');
        ddSummary.textContent = expData.summary || '요약 정보 없음';
        dlMeta.appendChild(dtSummary);
        dlMeta.appendChild(ddSummary);

        if (checkedAt) {
          const dtChecked = document.createElement('dt');
          dtChecked.textContent = '점검 시각';
          const ddChecked = document.createElement('dd');
          ddChecked.textContent = String(checkedAt);
          dlMeta.appendChild(dtChecked);
          dlMeta.appendChild(ddChecked);
        }
        container.appendChild(dlMeta);

        // (3) 인용한 근거 ID (형식: "근거 ID — 근거 글")
        const h5Evidence = document.createElement('h5');
        h5Evidence.style.margin = '10px 0 6px';
        h5Evidence.textContent = '인용한 근거 ID';
        container.appendChild(h5Evidence);

        if (citedEvidenceIds.length > 0) {
          const ulEv = document.createElement('ul');
          ulEv.setAttribute('data-student-explanation-evidence', '');
          ulEv.style.margin = '0 0 10px';
          ulEv.style.paddingLeft = '18px';
          for (const evId of citedEvidenceIds) {
            const evText = validEvidenceMap.get(evId) || '근거 글 없음';
            const li = document.createElement('li');
            li.setAttribute('data-student-evidence-id', evId);
            li.textContent = `${evId} — ${evText}`;
            ulEv.appendChild(li);
          }
          container.appendChild(ulEv);
        } else {
          const pNoEv = document.createElement('p');
          pNoEv.className = 'muted';
          pNoEv.textContent = '인용한 근거 없음';
          container.appendChild(pNoEv);
        }

        // (4) 현재 규칙 (형식: "규칙 ID — 규칙 글")
        const h5Rules = document.createElement('h5');
        h5Rules.style.margin = '10px 0 6px';
        h5Rules.textContent = '현재 규칙';
        container.appendChild(h5Rules);

        const eventRulesList = Array.isArray(event.rules) ? event.rules : [];
        if (eventRulesList.length > 0) {
          const ulRules = document.createElement('ul');
          ulRules.setAttribute('data-student-explanation-rules', '');
          ulRules.style.margin = '0 0 10px';
          ulRules.style.paddingLeft = '18px';
          for (const r of eventRulesList) {
            const li = document.createElement('li');
            li.setAttribute('data-student-rule-id', r.id);
            li.textContent = `${r.id} — ${r.text || ''}`;
            ulRules.appendChild(li);
          }
          container.appendChild(ulRules);
        } else {
          const pNoRules = document.createElement('p');
          pNoRules.className = 'muted';
          pNoRules.textContent = '규칙 없음';
          container.appendChild(pNoRules);
        }

        // (5) 확인되지 않은 현재 상태 (access·session·device 중 unknown 인 값을 각각 확인 불가로 표시)
        const h5Unknown = document.createElement('h5');
        h5Unknown.style.margin = '10px 0 6px';
        h5Unknown.textContent = '확인되지 않은 현재 상태';
        container.appendChild(h5Unknown);

        const stateLabels = { access: '접속', session: '세션', device: '기기' };
        const unknownKeys = ['access', 'session', 'device'].filter((k) => event.state?.[k] === 'unknown');

        if (unknownKeys.length === 0) {
          const pNoUnknown = document.createElement('p');
          pNoUnknown.className = 'muted';
          pNoUnknown.setAttribute('data-student-unknown-state', 'none');
          pNoUnknown.textContent = '없음';
          container.appendChild(pNoUnknown);
        } else {
          const ulUnknown = document.createElement('ul');
          ulUnknown.setAttribute('data-student-unknown-states', '');
          ulUnknown.style.margin = '0 0 10px';
          ulUnknown.style.paddingLeft = '18px';
          for (const k of unknownKeys) {
            const li = document.createElement('li');
            li.setAttribute('data-student-unknown-key', k);
            li.textContent = `${stateLabels[k]}: 확인 불가(unknown)`;
            ulUnknown.appendChild(li);
          }
          container.appendChild(ulUnknown);
        }

        // (6) 조치 제안 (이유와 미실행 상태 표시, 지원 조치가 없으면 제안이 없는 이유 설명)
        const h5Proposals = document.createElement('h5');
        h5Proposals.style.margin = '10px 0 6px';
        h5Proposals.textContent = '조치 제안';
        container.appendChild(h5Proposals);

        const supportedActions = Array.isArray(event.supportedActions) ? event.supportedActions : [];
        if (rawProposals.length === 0) {
          const pNoProp = document.createElement('p');
          pNoProp.className = 'muted';
          pNoProp.setAttribute('data-student-proposals-empty', '');
          if (supportedActions.length === 0) {
            pNoProp.textContent = '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상). AI가 조치를 제안하지 않았습니다.';
          } else {
            pNoProp.textContent = 'AI가 제안한 조치가 없습니다. 필요하면 근거를 보고 담당자와 판단하세요.';
          }
          container.appendChild(pNoProp);

          const pNoExec = document.createElement('p');
          pNoExec.className = 'muted';
          pNoExec.textContent = 'AI는 아무것도 실행하지 않았습니다.';
          container.appendChild(pNoExec);
        } else {
          const ulProp = document.createElement('ul');
          ulProp.setAttribute('data-student-proposals-list', '');
          ulProp.style.margin = '0 0 10px';
          ulProp.style.paddingLeft = '18px';
          for (const p of rawProposals) {
            const li = document.createElement('li');
            li.setAttribute('data-student-proposal-action', p.action || '');
            const pAction = document.createElement('p');
            pAction.style.margin = '0 0 4px';
            const evRefText = Array.isArray(p.evidenceIds) && p.evidenceIds.length > 0 ? ` (근거: ${p.evidenceIds.join(', ')})` : '';
            pAction.textContent = `${p.action || '조치'} — ${p.reason || '사유 없음'}${evRefText}`;
            li.appendChild(pAction);
            ulProp.appendChild(li);
          }
          container.appendChild(ulProp);

          const pNoticeProp = document.createElement('p');
          pNoticeProp.className = 'muted';
          pNoticeProp.textContent = '사람 확인이 필요하며 실행되지 않았습니다. 조치 준비 뒤 실제 대상과 확인 기한을 읽고 별도의 사람 확인 절차를 거쳐야 하며, 연동 시스템에서 지원하지 않으면 집행할 수 없습니다.';
          container.appendChild(pNoticeProp);
        }

        return container;
      }

      // 기타 알 수 없는 상태
      container.setAttribute('data-student-explanation-status', 'unknown');
      const pFallback = document.createElement('p');
      pFallback.className = 'state state-empty';
      pFallback.textContent = '확인 불가(unknown): 알 수 없는 설명 상태입니다. 정상으로 간주하지 않습니다.';
      container.appendChild(pFallback);
      return container;
    },
    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      const container = document.createElement('div');
      container.className = 'student-action-view';

      // 1. 상태 정규화 및 succeeded의 엄격한 효과 확인 (observation.effectApplied === true 필수)
      let effectiveStatus = status || 'idle';
      let isEffectConfirmed = false;

      if (effectiveStatus === 'succeeded') {
        if (observation && observation.effectApplied === true) {
          isEffectConfirmed = true;
        } else {
          // effectApplied 가 true 가 아니면 성공으로 간주하지 않고 결과 불명(unknown)으로 처리
          effectiveStatus = 'unknown';
        }
      }

      // 바깥 컨테이너 필수 데이터 속성 지정
      container.setAttribute('data-student-action-status', effectiveStatus);
      if (event?.id) {
        container.setAttribute('data-student-action-event', event.id);
      }
      if (receipt?.requestId) {
        container.setAttribute('data-student-action-request', receipt.requestId);
      }

      // 상단 상태 안내 배너
      const statusBox = document.createElement('div');
      statusBox.className = `action-status-box status-${effectiveStatus}`;
      statusBox.style.padding = '10px 12px';
      statusBox.style.borderRadius = 'var(--radius, 6px)';
      statusBox.style.marginBottom = '12px';
      statusBox.style.border = '1px solid var(--border, #d0d7de)';

      const titleP = document.createElement('p');
      titleP.style.margin = '0 0 4px';
      titleP.style.fontWeight = 'bold';

      const descP = document.createElement('p');
      descP.className = 'muted';
      descP.style.margin = '0';

      switch (effectiveStatus) {
        case 'idle':
          titleP.textContent = '아직 미실행 (idle)';
          descP.textContent = message || '아직 보안 조치를 실행하지 않았습니다. 필요한 경우 제공 화면의 조치 준비 기능을 이용하세요.';
          break;

        case 'loading':
          titleP.textContent = '조치 준비 또는 결과 조회 중 (loading)';
          descP.textContent = message || '조치 요청을 준비하거나 연동 시스템의 최신 결과를 조회하고 있습니다 (완료 아님).';
          break;

        case 'prepared':
          titleP.textContent = '준비됨·미실행 (prepared)';
          descP.textContent = confirmationExpiresAt
            ? `조치가 준비되었으나 아직 실행되지 않았습니다(미실행). 확인 기한: ${confirmationExpiresAt}`
            : '조치가 준비되었으나 아직 실행되지 않았습니다(미실행). 사람 확인이 필요합니다.';
          break;

        case 'executing':
          titleP.textContent = '서버에 전달 중 (executing)';
          descP.textContent = '조치 요청을 서버에 전달하고 있습니다. 결과가 아직 확인되지 않았습니다 (완료 아님).';
          break;

        case 'pending':
          titleP.textContent = '서버 접수·처리 중 (pending)';
          descP.textContent = '서버가 요청을 접수하여 처리 중입니다. 서버 접수 응답(ACK)은 효과 확인이나 완료가 아닙니다 (완료 아님).';
          break;

        case 'succeeded':
          titleP.textContent = '효과 확인 (succeeded)';
          descP.textContent = `연동 시스템에서 실제 보안 조치 효과가 확인되었습니다 (effectApplied: true, 관측 시각: ${observation?.observedAt || '시각 미기록'}).`;
          break;

        case 'denied':
          titleP.textContent = '연동 시스템 거절 (denied)';
          descP.textContent = message || error?.message || '연동 시스템 보안 정책에 의해 조치 요청이 거절되었습니다.';
          break;

        case 'failed':
          titleP.textContent = '연동 시스템 실패 (failed)';
          descP.textContent = message || error?.message || '연동 시스템에서 조치 실행에 실패했습니다.';
          break;

        case 'unknown':
          titleP.textContent = '결과 불명 (unknown)';
          descP.textContent = '조치 결과가 불명확합니다. 성공이나 효과 없음으로 단정하지 마시고, 제공 화면의 결과만 직접 재조회하세요.';
          break;

        case 'expired':
          titleP.textContent = '확인 기한 지남 (expired)';
          descP.textContent = '조치 확인 기한이 지났습니다. 조치를 처음부터 다시 준비하세요.';
          break;

        case 'error':
          titleP.textContent = '요청 처리 안 됨 (error)';
          const errCode = error?.code ? `[${error.code}] ` : '';
          const errMsg = error?.message || message || '요청이 처리되지 않았습니다.';
          descP.textContent = `${errCode}${errMsg} (기록은 그대로 유지됩니다).`;
          break;

        default:
          titleP.textContent = `${effectiveStatus} (확인 불가)`;
          descP.textContent = message || '알 수 없는 상태입니다. 정상이나 완료로 간주하지 마세요.';
          break;
      }

      statusBox.appendChild(titleP);
      statusBox.appendChild(descP);
      container.appendChild(statusBox);

      // 2. 현재 사건, 조치, 대상, 접수증 상세 정보 (받은 범위 내에서 있는 것만 표시)
      const dl = document.createElement('dl');
      dl.className = 'kv';
      dl.style.margin = '0 0 12px';

      let hasDetails = false;

      // 사건 ID (event.id)
      if (event?.id) {
        hasDetails = true;
        const dt = document.createElement('dt');
        dt.textContent = '사건 ID';
        const dd = document.createElement('dd');
        dd.setAttribute('data-student-action-detail-event', event.id);
        dd.textContent = event.id;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 근거 ID 목록 (event.evidence)
      if (Array.isArray(event?.evidence) && event.evidence.length > 0) {
        hasDetails = true;
        const dt = document.createElement('dt');
        dt.textContent = '사건 근거 ID';
        const dd = document.createElement('dd');
        dd.textContent = event.evidence.map((e) => e.id).join(', ');
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 조치 ID (actionId)
      if (actionId) {
        hasDetails = true;
        const dt = document.createElement('dt');
        dt.textContent = '조치 ID';
        const dd = document.createElement('dd');
        dd.setAttribute('data-student-action-detail-action', actionId);
        dd.textContent = actionId;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 대상 ID 및 대상 세대 (target.id, target.generation)
      if (target?.id) {
        hasDetails = true;
        const dt = document.createElement('dt');
        dt.textContent = '실제 대상 ID';
        const dd = document.createElement('dd');
        dd.setAttribute('data-student-action-detail-target-id', target.id);
        dd.textContent = target.id;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      if (target?.generation !== undefined && target?.generation !== null) {
        hasDetails = true;
        const dt = document.createElement('dt');
        dt.textContent = '대상 세대 (generation)';
        const dd = document.createElement('dd');
        dd.setAttribute('data-student-action-detail-target-generation', String(target.generation));
        dd.textContent = String(target.generation);
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 요청 ID (receipt.requestId)
      if (receipt?.requestId) {
        hasDetails = true;
        const dt = document.createElement('dt');
        dt.textContent = '요청 ID (requestId)';
        const dd = document.createElement('dd');
        dd.setAttribute('data-student-action-detail-request-id', receipt.requestId);
        dd.textContent = receipt.requestId;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 접수증 ID (receipt.receiptId)
      if (receipt?.receiptId) {
        hasDetails = true;
        const dt = document.createElement('dt');
        dt.textContent = '접수증 ID (receiptId)';
        const dd = document.createElement('dd');
        dd.setAttribute('data-student-action-detail-receipt-id', receipt.receiptId);
        dd.textContent = receipt.receiptId;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 버전 (receipt.version)
      if (receipt?.version !== undefined && receipt?.version !== null) {
        hasDetails = true;
        const dt = document.createElement('dt');
        dt.textContent = '버전 (version)';
        const dd = document.createElement('dd');
        dd.setAttribute('data-student-action-detail-version', String(receipt.version));
        dd.textContent = String(receipt.version);
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 확인 기한 (confirmationExpiresAt)
      if (confirmationExpiresAt) {
        hasDetails = true;
        const dt = document.createElement('dt');
        dt.textContent = '확인 기한';
        const dd = document.createElement('dd');
        dd.textContent = String(confirmationExpiresAt);
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      // 관측 결과 (observation: observedAt, effectApplied)
      if (observation) {
        hasDetails = true;
        const dt = document.createElement('dt');
        dt.textContent = '관측 결과';
        const dd = document.createElement('dd');
        dd.textContent = `시각: ${observation.observedAt || '미기록'} · effectApplied: ${String(observation.effectApplied)}`;
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      if (hasDetails) {
        container.appendChild(dl);
      }

      // 3. 안내 문구 (실행 버튼 미생성 및 제공 화면 버튼 이용 안내)
      const noticeP = document.createElement('p');
      noticeP.className = 'muted';
      noticeP.style.marginTop = '8px';
      noticeP.textContent = '보안 조치 실행·확인은 학생 코드에서 직접 실행하지 않으며, 제공 화면의 사람 확인 및 재조회 버튼을 통해서만 수행됩니다.';
      container.appendChild(noticeP);

      return container;
    },
  };
}
