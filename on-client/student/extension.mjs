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

export function createStudentView(context = {}) {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const container = document.createElement('div');
      container.className = 'student-identity-view';

      const mode = me?.mode || devices?.mode || sessions?.mode || null;
      const modeBadge = createModeBadge(mode);

      // 1. 에러 상태 (me 또는 관련 자원의 error)
      const isError = me?.status === 'error' || (!me?.status && (devices?.status === 'error' || sessions?.status === 'error'));
      if (isError) {
        const errorObj = me?.error || devices?.error || sessions?.error;
        const msg = errorObj?.message || '서버에 연결하지 못했습니다.';

        const errorP = document.createElement('p');
        errorP.className = 'state state-error';
        errorP.setAttribute('data-student-status', 'error');
        errorP.textContent = `연결 실패: ${msg}`;
        container.appendChild(errorP);

        if (modeBadge) {
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 2. 로딩 상태
      const isLoading = me?.status === 'loading' || (!me?.status && (devices?.status === 'loading' || sessions?.status === 'loading'));
      if (isLoading) {
        const loadingP = document.createElement('p');
        loadingP.className = 'state state-loading';
        loadingP.setAttribute('data-student-status', 'loading');
        loadingP.textContent = '불러오는 중';
        container.appendChild(loadingP);

        if (modeBadge) {
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 3. 정상(ok) 상태
      if (me?.status === 'ok' || devices?.status === 'ok' || sessions?.status === 'ok') {
        container.setAttribute('data-student-status', 'ok');

        if (modeBadge) {
          const modeWrap = document.createElement('div');
          modeWrap.style.marginBottom = '8px';
          modeWrap.appendChild(modeBadge);
          container.appendChild(modeWrap);
        }

        const dl = document.createElement('dl');
        dl.className = 'identity';

        // 사용자
        const user = me?.data?.user;
        const dtUser = document.createElement('dt');
        dtUser.textContent = '사용자';
        const ddUser = document.createElement('dd');
        ddUser.setAttribute('data-student-user', '');
        const userLabel = user?.label || '';
        const userId = user?.id || '';
        if (userLabel && userId && userLabel !== userId) {
          ddUser.textContent = `${userLabel} (${userId})`;
        } else {
          ddUser.textContent = userLabel || userId || '확인 불가';
        }
        dl.appendChild(dtUser);
        dl.appendChild(ddUser);

        // 기기
        const device = me?.data?.device || (Array.isArray(devices?.data) ? devices.data[0] : null);
        const dtDevice = document.createElement('dt');
        dtDevice.textContent = '기기';
        const ddDevice = document.createElement('dd');
        ddDevice.setAttribute('data-student-device', '');
        if (device) {
          const devLabel = device.label || '';
          const devId = device.id || '';
          const devName = devLabel && devId && devLabel !== devId ? `${devLabel} (${devId})` : (devLabel || devId || '기기');
          const devStatus = device.status || 'unknown';
          ddDevice.setAttribute('data-status', devStatus);
          const devStatusKorean = mapDeviceStatus(devStatus);
          ddDevice.textContent = `${devName} · ${devStatusKorean} (${devStatus})`;
        } else if (devices?.status === 'loading') {
          ddDevice.textContent = '불러오는 중';
        } else if (devices?.status === 'error') {
          ddDevice.textContent = `연결 실패: ${devices.error?.message || '확인 불가'}`;
        } else {
          ddDevice.textContent = '확인 불가';
        }
        dl.appendChild(dtDevice);
        dl.appendChild(ddDevice);

        // 세션
        const session = me?.data?.session || (Array.isArray(sessions?.data) ? sessions.data[0] : null);
        const dtSession = document.createElement('dt');
        dtSession.textContent = '세션';
        const ddSession = document.createElement('dd');
        ddSession.setAttribute('data-student-session', '');
        if (session) {
          const sessId = session.id || '세션';
          const sessStatus = session.status || 'unknown';
          ddSession.setAttribute('data-status', sessStatus);
          const sessStatusKorean = mapSessionStatus(sessStatus);
          ddSession.textContent = `${sessId} · ${sessStatusKorean} (${sessStatus})`;
        } else if (sessions?.status === 'loading') {
          ddSession.textContent = '불러오는 중';
        } else if (sessions?.status === 'error') {
          ddSession.textContent = `연결 실패: ${sessions.error?.message || '확인 불가'}`;
        } else {
          ddSession.textContent = '확인 불가';
        }
        dl.appendChild(dtSession);
        dl.appendChild(ddSession);

        container.appendChild(dl);
        return container;
      }

      // 4. 예외/초기 fallback
      const fallbackP = document.createElement('p');
      fallbackP.className = 'state state-empty';
      fallbackP.textContent = '확인 불가: 표시할 사용자·기기·세션 정보가 없습니다.';
      container.appendChild(fallbackP);
      if (modeBadge) {
        container.appendChild(modeBadge);
      }
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
