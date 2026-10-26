/**
 * Non-Admin Real-Time OS Status Runtime Bridge (on-client/student/pc-status-runtime.mjs)
 *
 * Loaded via `node --import ./student/pc-status-runtime.mjs src/server.mjs`
 * without modifying protected framework files (`src/server.mjs`, `public/app.js`).
 *
 * Exposes `GET /api/pc-status` on the same loopback server (`127.0.0.1:5189`) so that
 * `student/extension.mjs` can fetch live, non-admin OS metrics (`node:os`, `node:fs.statfsSync`)
 * on every refresh with zero hardcoded values.
 */
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';

function readCpuTickSnapshot() {
  const cpus = os.cpus() || [];
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    if (cpu && cpu.times) {
      for (const key of Object.keys(cpu.times)) {
        total += Number(cpu.times[key]) || 0;
      }
      idle += Number(cpu.times.idle) || 0;
    }
  }
  return { idle, total, cores: cpus.length };
}

let lastCpuSnapshot = readCpuTickSnapshot();

// Keep a rolling 500ms non-admin CPU tick window so GET /api/pc-status responds instantaneously
const cpuSamplerTimer = setInterval(() => {
  try {
    lastCpuSnapshot = readCpuTickSnapshot();
  } catch {
    // Ignore sampling errors
  }
}, 1500);
if (typeof cpuSamplerTimer.unref === 'function') {
  cpuSamplerTimer.unref();
}

async function measureLiveNonAdminPcStatus() {
  const before = lastCpuSnapshot || readCpuTickSnapshot();
  await new Promise((resolve) => setTimeout(resolve, 120));
  const after = readCpuTickSnapshot();
  lastCpuSnapshot = after;

  const measuredAt = new Date().toISOString();
  const totalDiff = after.total - before.total;
  const idleDiff = after.idle - before.idle;
  const cpuPct = totalDiff > 0
    ? Number((((totalDiff - idleDiff) / totalDiff) * 100).toFixed(1))
    : null;

  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const totalMemGb = Number((totalMemBytes / (1024 ** 3)).toFixed(2));
  const freeMemGb = Number((freeMemBytes / (1024 ** 3)).toFixed(2));
  const usedMemGb = Number((totalMemGb - freeMemGb).toFixed(2));
  const memPct = totalMemGb > 0
    ? Number(((usedMemGb / totalMemGb) * 100).toFixed(1))
    : null;

  let diskFreeGb = null;
  let diskTotalGb = null;
  let diskUsedGb = null;
  let diskPct = null;
  let diskReason = null;
  try {
    const stat = fs.statfsSync(process.cwd());
    diskFreeGb = Number(((Number(stat.bavail) * Number(stat.bsize)) / (1024 ** 3)).toFixed(2));
    diskTotalGb = Number(((Number(stat.blocks) * Number(stat.bsize)) / (1024 ** 3)).toFixed(2));
    diskUsedGb = Number((diskTotalGb - diskFreeGb).toFixed(2));
    diskPct = diskTotalGb > 0
      ? Number(((diskUsedGb / diskTotalGb) * 100).toFixed(1))
      : null;
  } catch (err) {
    diskReason = err?.message || 'fs.statfsSync 조회 실패';
  }

  return {
    ok: true,
    data: {
      measuredAt,
      privilegeMode: 'normal-user (non-admin)',
      cpu: {
        usagePercent: cpuPct,
        logicalCores: after.cores > 0 ? after.cores : null,
        reason: cpuPct !== null
          ? 'node:os.cpus() 실시간 틱 차분 측정 (일반 권한)'
          : 'CPU 틱 차분을 계산할 수 없습니다.',
      },
      memory: {
        usedGb: usedMemGb,
        freeGb: freeMemGb,
        totalGb: totalMemGb,
        usagePercent: memPct,
        reason: 'node:os.totalmem()/freemem() 실시간 조회 (일반 권한)',
      },
      disk: {
        freeGb: diskFreeGb,
        totalGb: diskTotalGb,
        usedGb: diskUsedGb,
        usagePercent: diskPct,
        reason: diskFreeGb !== null
          ? 'node:fs.statfsSync() 실시간 볼륨 조회 (일반 권한)'
          : diskReason,
      },
    },
  };
}

const originalCreateServer = http.createServer;
http.createServer = function patchedCreateServer(optionsOrListener, maybeListener) {
  const isFuncFirst = typeof optionsOrListener === 'function';
  const originalListener = isFuncFirst ? optionsOrListener : maybeListener;

  if (typeof originalListener !== 'function') {
    return originalCreateServer.apply(this, arguments);
  }

  const wrappedListener = async function pcStatusInterceptor(req, res) {
    try {
      const rawUrl = req?.url || '/';
      const pathname = rawUrl.split('?')[0];
      if (req?.method === 'GET' && pathname === '/api/pc-status') {
        const payload = await measureLiveNonAdminPcStatus();
        const body = JSON.stringify(payload);
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        res.end(body);
        return;
      }
    } catch {
      // Fall through or return safe 503 if measurement fails
    }
    return originalListener.apply(this, arguments);
  };

  if (isFuncFirst) {
    return originalCreateServer.call(this, wrappedListener);
  }
  return originalCreateServer.call(this, optionsOrListener, wrappedListener);
};
