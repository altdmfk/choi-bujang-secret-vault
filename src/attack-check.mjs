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

  // 3단계 자기 점검: 비로그인 상태에서 보호된 /api/notes 요청이 401 거부되는지 확인
  const response = await fetch(new URL('/api/notes', app), {
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });

  const blocked = response.status === 401;

  return [{
    attackId: 'anonymous_api_read',
    expected: '비로그인 상태에서 /api/notes 요청 시 401 거부',
    observed: blocked ? '비로그인 요청에서 401 Unauthorized로 정상 차단됨' : `비로그인 요청이 차단되지 않음 (HTTP ${response.status})`
  }];
}
