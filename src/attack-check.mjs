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

  // 1) 무인증 조회 (GET) - 실제 시험 가능
  const anonReqId = `req-anon-${Date.now().toString(36)}`;
  const anonNotes = await fetch(new URL('/api/notes', app), {
    headers: {
      'x-attack-id': 'anonymous_api_read',
      'x-request-id': anonReqId
    },
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  const anonRequestId = anonNotes.headers.get('x-request-id') || anonReqId;

  // 2) 쿼리 파라미터 금지 조회 (GET) - 실제 시험 가능
  const queryReqId = `req-query-${Date.now().toString(36)}`;
  const queryRes = await fetch(new URL('/api/notes?select=*', app), {
    headers: {
      'x-attack-id': 'query_parameter_forbidden',
      'x-request-id': queryReqId
    },
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  const queryRequestId = queryRes.headers.get('x-request-id') || queryReqId;

  return [{
    attackId: 'anonymous_api_read',
    expected: '비로그인 상태에서 /api/notes 요청 시 401 거부',
    observed: `HTTP ${anonNotes.status} (${anonRequestId})`
  }, {
    attackId: 'cross_subject_note_read',
    expected: '로그인 및 타인 메모 식별자 필요 점검 (미실행)',
    observed: 'not_run'
  }, {
    attackId: 'unapproved_device_read',
    expected: '로그인 신원 및 미승인 기기 토큰 필요 점검 (미실행)',
    observed: 'not_run'
  }, {
    attackId: 'query_parameter_forbidden',
    expected: '쿼리 파라미터 포함 요청 시 401 또는 403 거부',
    observed: `HTTP ${queryRes.status} (${queryRequestId})`
  }, {
    attackId: 'anonymous_restore',
    expected: '비로그인 상태에서 복원 쓰기 요청 (격리 환경 미실행)',
    observed: 'not_run'
  }];
}
