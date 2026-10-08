import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { decide } from './decide.mjs';
import { addXdrBlock } from '../../src/decider.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ALERTS_LOG = path.resolve(__dirname, '../alerts.log');

export function respond(alert) {
  try {
    const result = decide(alert);
    
    // 알림 기록 (alerts.log 에 한 줄씩 쌓기) - 기존 xdr/alerts.log 형식과 통일
    if (result.action === 'block' || result.action === 'alert') {
      const time = alert.timestamp || new Date().toISOString();
      // 기존 포맷: [Timestamp] ACTION alertId: Reason
      const logLine = `[${time}] ${result.action.toUpperCase()} ${alert.id}: ${result.reason}\n`;
      fs.appendFileSync(ALERTS_LOG, logLine, 'utf8');
    }

    // 명확한 차단 후보만 ZTNA 판정기의 거부 규칙에 등록
    if (result.action === 'block') {
      const ip = alert.data?.srcip;
      if (ip) {
        addXdrBlock(ip, alert.id);
      }
    }
  } catch (error) {
    // 파일 I/O 실패 등으로 인해 파이프라인이 중단되지 않도록 안전하게 처리 (2-5단계 500에러 방지 철학)
    console.error(`[respond] 경보 처리 중 오류 발생: ${error.message}`);
  }
}

// 스크립트를 직접 실행했을 때 시험 경보를 다시 흘려 결과를 확인합니다.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fixturePath = path.resolve(__dirname, '../fixtures/web-injection.json');
  const { alerts } = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  
  let blockCount = 0;
  let passCount = 0;
  
  for (const alert of alerts) {
    const beforeResult = decide(alert);
    respond(alert);
    
    if (beforeResult.action === 'block') {
      console.log(`[차단됨] IP: ${alert.data?.srcip} | 경보 ID: ${alert.id} | 이유: ${beforeResult.reason}`);
      blockCount++;
    } else {
      console.log(`[통과됨] IP: ${alert.data?.srcip} | 경보 ID: ${alert.id} | 분류: ${beforeResult.action}`);
      passCount++;
    }
  }
  console.log(`\n총 ${blockCount}건 차단 등록 완료, ${passCount}건 통과.`);
}
