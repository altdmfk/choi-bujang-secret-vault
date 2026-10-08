import { addXdrBlock } from '../../src/decider.mjs';

// 가상의 분석 AI(Jev) 호출 함수 - 응답 안 하는 상황(Timeout 등) 시뮬레이션
async function askJev(alert) {
  throw new Error('Jev did not respond in time');
}

export async function decide(alert) {
  const desc = alert.rule?.description || '';
  const level = alert.rule?.level || 0;

  let confidence = 0.1; // 기본은 정상 이벤트
  let reason = '정상 로그';
  let action = 'record';

  if (level >= 10) {
    confidence = 0.9;
    action = 'block';
    reason = 'Single IP High Volume Failures';
  } else if (level >= 5) {
    confidence = 0.6;
    action = 'alert';
    reason = '단발성 실패 (패턴 확인 필요)';
    try {
      confidence = await askJev(alert);
    } catch (err) {
      confidence = 0.5;
    }
  } else {
    confidence = 0.1;
    action = 'record';
    reason = '정상 로그';
  }

  // 4. 차단 후보만 내 ZTNA 판정기의 거부 규칙으로 넣는 연결
  if (action === 'block') {
    const ip = alert.data?.srcip;
    if (ip) {
      addXdrBlock(ip, alert.id);
    }
  } else if (action === 'alert') {
    try {
      const { appendFile } = await import('node:fs/promises');
      const { resolve } = await import('node:path');
      await appendFile(resolve(process.cwd(), 'xdr', 'alerts.log'), `[${new Date().toISOString()}] ALERT ${alert.id}: ${reason}\n`, 'utf8');
    } catch (e) {}
  }

  return { action, confidence, reason };
}
