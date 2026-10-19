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
    renderDecision() { return '학생 구현 대기: 서버의 판정과 이유를 연결하세요.'; },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
