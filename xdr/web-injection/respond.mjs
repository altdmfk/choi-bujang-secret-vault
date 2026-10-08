import { decide } from './decide.mjs';
import { addXdrBlock } from '../../src/decider.mjs';

export async function respond(alert) {
  try {
    const result = await decide(alert);
    
    if (result.action === 'block') {
      const ip = alert.data?.srcip;
      if (ip) {
        addXdrBlock(ip, alert.id);
      }
    }

    if (result.action === 'block' || result.action === 'alert') {
      const time = alert.timestamp || new Date().toISOString();
      const logLine = [ + time + ]  + result.action.toUpperCase() +   + alert.id + :  + result.reason + \n;
      const fs = await import('node:fs');
      const path = await import('node:path');
      const ALERTS_LOG = path.resolve(process.cwd(), 'xdr', 'alerts.log');
      fs.appendFileSync(ALERTS_LOG, logLine, 'utf8');
    }
  } catch (error) {
  }
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]) {
  (async () => {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      if (process.argv[1] === fileURLToPath(import.meta.url)) {
        const fixturePath = path.resolve(process.cwd(), 'xdr', 'fixtures', 'web-injection.json');
        const { alerts } = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        
        let blockCount = 0;
        let passCount = 0;
        
        for (const alert of alerts) {
          const beforeResult = await decide(alert);
          await respond(alert);
          
          if (beforeResult.action === 'block') {
            console.log([차단] IP:  + alert.data?.srcip +  | 경보 ID:  + alert.id +  | 이유:  + beforeResult.reason);
            blockCount++;
          } else {
            console.log([통과] IP:  + alert.data?.srcip +  | 경보 ID:  + alert.id +  | 분류:  + beforeResult.action);
            passCount++;
          }
        }
        console.log(\n총  + blockCount + 건 차단 등록 완료,  + passCount + 건 통과.);
      }
    } catch (e) {}
  })();
}
