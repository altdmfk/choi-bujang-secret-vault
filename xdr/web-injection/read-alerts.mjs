import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the web-injection fixture file
const fixturePath = resolve(__dirname, '../fixtures/web-injection.json');
const content = readFileSync(fixturePath, 'utf8');
const { alerts } = JSON.parse(content);

// Extract exactly: time, source IP, account, rule level, and description per alert.
// Secrets or other unnecessary fields (e.g., urls) are intentionally excluded.
alerts.forEach(alert => {
  const time = alert.timestamp || 'N/A';
  const srcIp = alert.data?.srcip || 'N/A';
  const account = alert.data?.srcuser || 'N/A';
  const level = alert.rule?.level || 'N/A';
  const description = alert.rule?.description || 'N/A';
  
  console.log(`시각: ${time} | 출발 주소: ${srcIp} | 계정: ${account} | 규칙 수준: ${level} | 설명: ${description}`);
});
