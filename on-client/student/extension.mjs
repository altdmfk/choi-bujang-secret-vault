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
            btn.setAttribute('aria-disabled', 'true');
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
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
