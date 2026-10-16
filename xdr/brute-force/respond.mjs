import { decide } from './decide.mjs';
import { addXdrBlock, decide as decideZtna } from '../../src/decider.mjs';

export async function respond(alert) {
  try {
    const result = await decide(alert);
    const ip = alert?.data?.srcip;

    // 차단 후보(block)만 ZTNA 판정기의 거부 규칙(1시간 만료 시각 + 근거 경보 번호)으로 등록하고 정상/알림 이벤트는 제외
    if (result.action === 'block' && ip) {
      addXdrBlock(ip, alert.id);
    }

    // block 또는 alert 인 경우 xdr/alerts.log 에 한 줄씩 기록
    if (result.action === 'block' || result.action === 'alert') {
      const time = alert?.timestamp || new Date().toISOString();
      const logLine = `[${time}] BRUTE-FORCE ${result.action.toUpperCase()} | IP: ${ip || 'N/A'} | 사유: ${result.reason} | 근거 경보: ${alert?.id || 'N/A'}\n`;
      const fs = await import('node:fs');
      const path = await import('node:path');
      const alertsLogPath = path.resolve(process.cwd(), 'xdr', 'alerts.log');
      fs.appendFileSync(alertsLogPath, logLine, 'utf8');
    }

    return result;
  } catch {
    return { action: 'record', confidence: 0, reason: '오류' };
  }
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]) {
  (async () => {
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      if (path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
        const fixturePath = path.resolve(process.cwd(), 'xdr', 'fixtures', 'brute-force.json');
        const { alerts = [] } = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

        for (const alert of alerts) {
          await respond(alert);
        }

        let blockedCount = 0;
        let allowedCount = 0;

        for (const alert of alerts) {
          const ip = alert?.data?.srcip;
          const ztnaResult = await decideZtna({
            requestId: `retest-${alert.id}`,
            subjectId: alert?.data?.srcuser || 'user01',
            deviceId: 'a1b2c3d4e5f60001',
            deviceRegistered: true,
            classId: 'class-01',
            projectId: 'proj-01',
            service: 'notices',
            method: 'GET',
            route: 'GET /api/notices',
            path: '/api/notices',
            signals: {
              source: ip,
            },
          });

          if (ztnaResult.decision === 'deny') {
            blockedCount += 1;
            console.log(
              `[차단] 경보: ${alert.id} | IP: ${ip} | ZTNA 판정: ${ztnaResult.decision} | 규칙: ${ztnaResult.ruleIds.join(',')}`
            );
          } else {
            allowedCount += 1;
            console.log(
              `[통과] 경보: ${alert.id} | IP: ${ip} | 계정: ${alert?.data?.srcuser || '-'} | ZTNA 판정: ${ztnaResult.decision}`
            );
          }
        }

        console.log(`\n재검증 완료: 명확한 공격 ${blockedCount}건 차단, 그 외/정상 요청 ${allowedCount}건 통과.`);
      }
    } catch {
      // 실행 환경 제약 시 무시
    }
  })();
}
