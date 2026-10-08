import { readFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { addXdrBlock } from '../../src/decider.mjs';

// 가상의 분석 AI(Jev) 호출 함수 - 응답 안 하는 상황(Timeout 등) 시뮬레이션
async function askJev(alert) {
  throw new Error('Jev did not respond in time');
}

let patterns = null;
async function getPatterns() {
  if (!patterns) {
    const raw = await readFile(resolve(process.cwd(), 'xdr', 'brute-force', 'patterns.json'), 'utf8');
    patterns = JSON.parse(raw);
  }
  return patterns;
}

export async function decide(alert) {
  const pts = await getPatterns();
  const desc = alert.rule?.description || '';
  const level = alert.rule?.level || 0;

  let confidence = 0.1; // 기본은 정상 이벤트
  let reason = '정상 로그';
  let action = 'record';

  const isPasswordSpray = desc.includes('여러 계정') || desc.includes('계정 이름') || desc.includes('계정 15개') || desc.includes('계정 20개') || desc.includes('두 계정');
  const isHighVolume = desc.includes('실패') && (desc.includes('48건') || desc.includes('36건') || desc.includes('52건') || desc.includes('61건') || desc.includes('40건') || desc.includes('70건') || desc.includes('90건'));
  const isSuspicious = desc.includes('실패') && level >= 4 && level < 10;

  // 1. 패턴 매칭을 통한 초기 확신도 결정
  if (isPasswordSpray) {
    reason = pts.find(p => p.name === 'Password Spraying')?.name || 'Password Spraying';
    confidence = level >= 10 ? 0.9 : 0.6; // 명확하면 0.9, 아니면 애매함
  } else if (isHighVolume) {
    reason = pts.find(p => p.name === 'Single IP High Volume Failures')?.name || 'Single IP High Volume Failures';
    confidence = level >= 10 ? 0.9 : 0.6;
  } else if (isSuspicious) {
    reason = '단발성 실패 (패턴 확인 필요)';
    confidence = 0.6; // 애매함
  }

  // 2. 애매한 건 (0.5 <= confidence < 0.85)인 경우 Jev에게 문의
  if (confidence >= 0.5 && confidence < 0.85) {
    try {
      confidence = await askJev(alert);
    } catch (err) {
      // Jev가 응답하지 않으면 기본 0.5로 맞추어 alert 로 떨어지게 함
      confidence = 0.5;
    }
  }

  // 3. 확신도에 따른 최종 액션 결정
  if (confidence >= 0.85) {
    action = 'block';
  } else if (confidence >= 0.5) {
    action = 'alert';
  } else {
    action = 'record';
  }

  // 4. 차단 후보만 내 ZTNA 판정기의 거부 규칙으로 넣는 연결
  if (action === 'block') {
    const ip = alert.data?.srcip;
    if (ip) {
      addXdrBlock(ip, alert.id);
    }
  } else if (action === 'alert') {
    try {
      await appendFile(resolve(process.cwd(), 'xdr', 'alerts.log'), `[${new Date().toISOString()}] ALERT ${alert.id}: ${reason}\n`, 'utf8');
    } catch (e) {}
  }

  return { action, confidence, reason };
}
