import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function readAlerts() {
  const fixturePath = resolve(__dirname, '../fixtures/known-cve.json');
  const raw = await readFile(fixturePath, 'utf8');
  const { alerts = [] } = JSON.parse(raw);

  // 원본 경보를 수정하지 않고 시각·출발 주소·계정·규칙 수준·설명만 추출 (url, useragent 등 제외)
  return alerts.map((alert) => ({
    timestamp: alert.timestamp || 'N/A',
    srcip: alert.data?.srcip || 'N/A',
    srcuser: alert.data?.srcuser || 'N/A',
    level: alert.rule?.level ?? 'N/A',
    description: alert.rule?.description || 'N/A',
  }));
}

if (process.argv[1] === __filename) {
  const extracted = await readAlerts();
  for (const item of extracted) {
    console.log(
      `시각: ${item.timestamp} | 출발 주소: ${item.srcip} | 계정: ${item.srcuser} | 규칙 수준: ${item.level} | 설명: ${item.description}`
    );
  }
}
