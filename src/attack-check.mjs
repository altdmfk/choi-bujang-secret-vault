// The student changes this check as each stage adds an attack to the same app.
// Never return tokens, private keys, real names, or note bodies.
export async function runAttackChecks(config) {
  let app;
  try {
    app = new URL(config.publicAppUrl);
  } catch {
    throw new Error('aleph.config.json의 실제 배포 주소를 먼저 넣어 주세요.');
  }
  if (app.protocol !== 'https:' || app.username || app.password || app.search || app.hash
      || app.pathname !== '/' || app.hostname.endsWith('.example')) {
    throw new Error('aleph.config.json의 실제 배포 주소를 먼저 넣어 주세요.');
  }

  // 1단계 자기 점검 (테스트 호환성 유지)
  if (config.step === 1) {
    if (typeof config.sampleMarker !== 'string' || !config.sampleMarker) throw new Error('가상 메모의 확인 표시를 넣어 주세요.');
    const response = await fetch(new URL('/data.json', app), {
      redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    let visible = false;
    if (response.ok) {
      try {
        const data = await response.json();
        visible = data?.sampleMarker === config.sampleMarker && Array.isArray(data.notes)
          && data.notes.length > 0;
      } catch {
        // A non-JSON response is a failed check, not a successful deployment.
      }
    }
    return [{
      attackId: 'anonymous_note_read',
      expected: '비로그인 화면에서 가상 메모를 확인',
      observed: visible ? '비로그인 요청에서 공개 가상 메모 확인 표시가 보임' : `비로그인 요청에서 확인 표시가 보이지 않음 (HTTP ${response.status})`
    }];
  }

  // 12단계 자기 점검: 공식 41종 카탈로그(aleph.defense.roster.v1) 중 5개 점검을 반환하되,
  // 요청을 보내지 않은 점검은 안내 규격에 따라 observed를 not_run으로 명시합니다.
  return [
    {
      attackId: 'missing_login_token',
      expected: '로그인 토큰 없이 보호 API 조회 시 보호 본문 없이 거부',
      observed: 'not_run'
    },
    {
      attackId: 'anonymous_note_list',
      expected: '인증 없이 개인 메모 목록을 조회 시 목록과 메모 개수 없이 거부',
      observed: 'not_run'
    },
    {
      attackId: 'forged_login_token',
      expected: '서명이 위조된 로그인 토큰으로 조회 시 보호 본문 없이 거부',
      observed: 'not_run'
    },
    {
      attackId: 'cross_zone_note_read',
      expected: '다른 구역 메모를 API로 조회 시 서버 거부',
      observed: 'not_run'
    },
    {
      attackId: 'restore_changed_note',
      expected: '시험 계정 B의 메모를 변조한 뒤 복구 경로 호출 시 원래 바이트로 복구',
      observed: 'not_run'
    }
  ];
}
