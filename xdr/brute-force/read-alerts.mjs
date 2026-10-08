import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function readAlerts() {
  const filePath = resolve(process.cwd(), 'xdr', 'fixtures', 'brute-force.json');
  const rawData = await readFile(filePath, 'utf8');
  const jsonData = JSON.parse(rawData);
  
  // 시각, 출발 주소, 계정, 규칙 수준, 설명만 추출
  const extracted = jsonData.alerts.map(alert => ({
    timestamp: alert.timestamp,
    srcip: alert.data?.srcip,
    srcuser: alert.data?.srcuser,
    level: alert.rule?.level,
    description: alert.rule?.description
  }));
  
  return extracted;
}

// 스크립트를 직접 실행할 경우 터미널에 한 줄씩 출력
import { fileURLToPath } from 'node:url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const alerts = await readAlerts();
  alerts.forEach(a => {
    console.log(`[${a.timestamp}] IP: ${a.srcip} | USER: ${a.srcuser} | LEVEL: ${a.level} | ${a.description}`);
  });
}
