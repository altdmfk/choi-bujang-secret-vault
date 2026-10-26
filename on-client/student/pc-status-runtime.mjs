/**
 * Non-Admin Read-Only OS, Network, Firewall & Windows Event Log Runtime Bridge
 * File: on-client/student/pc-status-runtime.mjs
 *
 * Loaded via `node --import ./student/pc-status-runtime.mjs src/server.mjs`
 * without modifying protected framework files (`src/server.mjs`, `public/app.js`).
 */
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import { execFile } from 'node:child_process';

const PROBE_CONFIG = Object.freeze({
  ENDPOINT_PATH: '/api/pc-status',
  POWERSHELL_TIMEOUT_MS: 4500,
  POWERSHELL_MAX_BUFFER_BYTES: 1024 * 1024,
  WIN_INSPECTION_CACHE_TTL_MS: 4000,
  CPU_SAMPLER_INTERVAL_MS: 1500,
  CPU_TICK_DELTA_WAIT_MS: 100,
  EVENT_WINDOW_HOURS: 24,
  EVENT_MAX_FETCH: 500,
  FIREWALL_PROFILE_TOTAL: 3,
});

const PC_STATUS_NOTICES = Object.freeze({
  PRIVILEGE_MODE: 'normal-user (일반 권한 · 읽기 전용)',
  READ_ONLY: '방화벽과 보안 설정은 읽기만 하고 바꾸지 않습니다.',
  NON_INTRUSION: '「이 건수는 침해나 공격 탐지 결과가 아닙니다」 — 최근 24시간 Windows 일반 기록(System·Application)의 경고·오류 건수입니다.',
  SDP_SEPARATION: '내 PC 로컬 조회 결과([실측값])와 외부 SDP 서버 연결 상태(「SDP 미연결」)는 따로 표시합니다.',
  ADMIN_REASON_FIREWALL: '관리자 권한이 있어야 읽을 수 있는 항목이므로 설정을 바꾸지 않고 「확인 불가」로 표시합니다.',
  ADMIN_REASON_SECURITY_LOG: '관리자 권한(SeSecurityPrivilege)이 있어야 읽을 수 있는 기록이므로 설정을 바꾸지 않고 「확인 불가」로 표시합니다.',
});

const ADMIN_ONLY_FIREWALL_ITEMS = Object.freeze([
  Object.freeze({
    item: '방화벽 차단 패킷 로그(pfirewall.log) 및 그룹 정책 저장소(PersistentStore)',
    status: '확인 불가',
    reason: PC_STATUS_NOTICES.ADMIN_REASON_FIREWALL,
  }),
]);

const ADMIN_ONLY_EVENT_LOGS = Object.freeze([
  Object.freeze({
    logName: 'Security (Windows 보안 감사 로그)',
    status: '확인 불가',
    reason: PC_STATUS_NOTICES.ADMIN_REASON_SECURITY_LOG,
  }),
]);

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

const cpuSamplerTimer = setInterval(() => {
  try {
    lastCpuSnapshot = readCpuTickSnapshot();
  } catch {
    // Ignore background sampling errors
  }
}, PROBE_CONFIG.CPU_SAMPLER_INTERVAL_MS);

if (typeof cpuSamplerTimer.unref === 'function') {
  cpuSamplerTimer.unref();
}

function readNodeNetworkInterfacesFallback() {
  const rawMap = os.networkInterfaces() || {};
  const list = [];
  for (const [ifName, entries] of Object.entries(rawMap)) {
    if (!Array.isArray(entries)) continue;
    const nonInternal = entries.filter((e) => e && !e.internal);
    if (nonInternal.length === 0) continue;
    const ipv4 = nonInternal
      .filter((e) => e.family === 'IPv4' || e.family === 4)
      .map((e) => e.cidr || e.address)
      .filter(Boolean);
    const ipv6 = nonInternal
      .filter((e) => e.family === 'IPv6' || e.family === 6)
      .map((e) => e.cidr || e.address)
      .filter(Boolean);
    const mac = nonInternal.find((e) => e.mac && e.mac !== '00:00:00:00:00:00')?.mac || null;
    list.push({
      name: ifName,
      description: ifName,
      type: 'NetworkInterface',
      status: 'Up',
      ipv4,
      ipv6,
      mac,
      gateway: [],
      dns: [],
    });
  }
  return list;
}

function buildWinReadOnlyProbeScript(windowHours, maxEvents) {
  return `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'SilentlyContinue'

$nics = @()
try {
  $nics = @([System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
    Where-Object { $_.OperationalStatus -eq 'Up' -and $_.NetworkInterfaceType -ne 'Loopback' } |
    ForEach-Object {
      $ipProps = $_.GetIPProperties()
      $ipv4 = @($ipProps.UnicastAddresses |
        Where-Object { $_.Address.AddressFamily -eq 'InterNetwork' } |
        ForEach-Object { "$($_.Address.ToString())/$($_.PrefixLength)" })
      $ipv6 = @($ipProps.UnicastAddresses |
        Where-Object { $_.Address.AddressFamily -eq 'InterNetworkV6' } |
        ForEach-Object { $_.Address.ToString() } | Select-Object -First 2)
      $gw = @($ipProps.GatewayAddresses |
        Where-Object { $_.Address.AddressFamily -eq 'InterNetwork' -and $_.Address.ToString() -ne '0.0.0.0' } |
        ForEach-Object { $_.Address.ToString() })
      $dns = @($ipProps.DnsAddresses |
        Where-Object { $_.AddressFamily -eq 'InterNetwork' } |
        ForEach-Object { $_.ToString() })
      $macBytes = $_.GetPhysicalAddress().GetAddressBytes()
      $mac = if ($macBytes -and $macBytes.Length -gt 0) { ($macBytes | ForEach-Object { $_.ToString('X2') }) -join ':' } else { $null }
      [pscustomobject]@{
        name = [string]$_.Name
        description = [string]$_.Description
        type = [string]$_.NetworkInterfaceType
        status = [string]$_.OperationalStatus
        ipv4 = $ipv4
        ipv6 = $ipv6
        mac = $mac
        gateway = $gw
        dns = $dns
      }
    })
} catch {}

$fwBase = 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters\\FirewallPolicy'
$fwProfiles = @()
$fwError = $null
try {
  $profileDefs = @(
    @{ Key = 'Domain';  Label = 'Domain (도메인)';  Path = "$fwBase\\DomainProfile" },
    @{ Key = 'Private'; Label = 'Private (개인)';   Path = "$fwBase\\StandardProfile" },
    @{ Key = 'Public';  Label = 'Public (공용)';    Path = "$fwBase\\PublicProfile" }
  )
  foreach ($def in $profileDefs) {
    if (Test-Path -LiteralPath $def.Path) {
      $prop = Get-ItemProperty -LiteralPath $def.Path -ErrorAction Stop
      $enProp = if ($null -ne $prop) { $prop.PSObject.Properties['EnableFirewall'] } else { $null }
      $inProp = if ($null -ne $prop) { $prop.PSObject.Properties['DefaultInboundAction'] } else { $null }
      $outProp = if ($null -ne $prop) { $prop.PSObject.Properties['DefaultOutboundAction'] } else { $null }
      $enabled = if ($null -ne $enProp -and $null -ne $enProp.Value) { [bool]([int]$enProp.Value -ne 0) } else { $null }
      $inAct = if ($null -ne $inProp -and $null -ne $inProp.Value -and [int]$inProp.Value -eq 0) { 'Allow (허용)' } else { 'Block (차단 · 기본값)' }
      $outAct = if ($null -ne $outProp -and $null -ne $outProp.Value -and [int]$outProp.Value -eq 1) { 'Block (차단)' } else { 'Allow (허용 · 기본값)' }
      $fwProfiles += [pscustomobject]@{
        profileKey = $def.Key
        name = $def.Label
        status = if ($null -ne $enabled) { 'ok' } else { 'unverified' }
        enabled = $enabled
        defaultInboundAction = $inAct
        defaultOutboundAction = $outAct
      }
    } else {
      $fwProfiles += [pscustomobject]@{
        profileKey = $def.Key
        name = $def.Label
        status = 'unverified'
        enabled = $null
        defaultInboundAction = '확인 불가'
        defaultOutboundAction = '확인 불가'
        reason = '레지스트리 프로필 경로를 찾을 수 없습니다.'
      }
    }
  }
} catch {
  $fwError = $_.Exception.Message
}

function Read-WinLogSummary([string]$LogName, [datetime]$SinceTime) {
  try {
    $events = @(Get-WinEvent -FilterHashtable @{ LogName = $LogName; Level = @(2, 3); StartTime = $SinceTime } -MaxEvents ${maxEvents} -ErrorAction Stop)
    $errCnt = @($events | Where-Object { $_.Level -eq 2 }).Count
    $warnCnt = @($events | Where-Object { $_.Level -eq 3 }).Count
    $latest = if ($events.Count -gt 0 -and $null -ne $events[0].TimeCreated) {
      $events[0].TimeCreated.ToUniversalTime().ToString('o')
    } else { $null }
    return [pscustomobject]@{
      logName = $LogName
      status = 'ok'
      errorCount = $errCnt
      warningCount = $warnCnt
      totalCount = ($errCnt + $warnCnt)
      latestAt = $latest
      reason = '최근 ${windowHours}시간 Windows 이벤트 기록 읽기 전용 조회 (일반 권한)'
    }
  } catch {
    $ex = $_.Exception
    $fqid = [string]$_.FullyQualifiedErrorId
    if ($fqid -match 'NoMatchingEventsFound' -or $ex.Message -match 'No events were found|일치하는 이벤트가 없습니다') {
      return [pscustomobject]@{
        logName = $LogName
        status = 'ok'
        errorCount = 0
        warningCount = 0
        totalCount = 0
        latestAt = $null
        reason = '최근 ${windowHours}시간 내 경고·오류 기록 0건 (읽기 전용 조회)'
      }
    }
    if ($ex -is [System.UnauthorizedAccessException] -or $ex -is [System.Security.SecurityException] -or $ex.Message -match 'Access is denied|액세스가 거부|권한|Privilege') {
      return [pscustomobject]@{
        logName = $LogName
        status = 'unverified'
        errorCount = $null
        warningCount = $null
        totalCount = $null
        latestAt = $null
        reason = "확인 불가 — 관리자 권한이 필요한 항목이므로 설정을 바꾸지 않고 표시합니다. ($($ex.Message))"
      }
    }
    return [pscustomobject]@{
      logName = $LogName
      status = 'unverified'
      errorCount = $null
      warningCount = $null
      totalCount = $null
      latestAt = $null
      reason = "확인 불가 — 이벤트 로그 조회 중 오류가 발생했습니다: $($ex.Message)"
    }
  }
}

$since = (Get-Date).AddHours(-${windowHours})
[pscustomobject]@{
  nics = $nics
  fwProfiles = $fwProfiles
  fwError = $fwError
  sysSummary = (Read-WinLogSummary -LogName 'System' -SinceTime $since)
  appSummary = (Read-WinLogSummary -LogName 'Application' -SinceTime $since)
} | ConvertTo-Json -Depth 5 -Compress
`;
}

const WIN_READONLY_PROBE_SCRIPT = buildWinReadOnlyProbeScript(
  PROBE_CONFIG.EVENT_WINDOW_HOURS,
  PROBE_CONFIG.EVENT_MAX_FETCH,
);

let cachedWinInspection = null;
let cachedWinInspectionAtMs = 0;
let inflightWinPromise = null;

function createUnverifiedLogSummary(logName, reasonMsg) {
  return {
    logName,
    status: 'unverified',
    errorCount: null,
    warningCount: null,
    totalCount: null,
    latestAt: null,
    reason: `확인 불가 — ${reasonMsg}`,
  };
}

function buildFallbackInspectionResult(fallbackInterfaces, reasonMsg, measuredAt = new Date().toISOString()) {
  const hasInterfaces = fallbackInterfaces.length > 0;
  return {
    network: {
      status: hasInterfaces ? 'ok' : 'unverified',
      measuredAt,
      interfaceCount: fallbackInterfaces.length,
      primaryGateway: null,
      dnsServers: [],
      interfaces: fallbackInterfaces,
      reason: hasInterfaces
        ? `node:os.networkInterfaces() 일반 권한 조회 (게이트웨이/DNS 상세: ${reasonMsg})`
        : reasonMsg,
    },
    firewall: {
      status: 'unverified',
      measuredAt,
      readOnly: true,
      readOnlyNotice: PC_STATUS_NOTICES.READ_ONLY,
      enabledCount: null,
      totalProfiles: PROBE_CONFIG.FIREWALL_PROFILE_TOTAL,
      profiles: [],
      adminOnlyItems: ADMIN_ONLY_FIREWALL_ITEMS,
      reason: `확인 불가 — ${reasonMsg}`,
    },
    windowsEvents: {
      status: 'unverified',
      measuredAt,
      windowHours: PROBE_CONFIG.EVENT_WINDOW_HOURS,
      nonIntrusionDisclaimer: PC_STATUS_NOTICES.NON_INTRUSION,
      system: createUnverifiedLogSummary('System', reasonMsg),
      application: createUnverifiedLogSummary('Application', reasonMsg),
      adminOnlyLogs: ADMIN_ONLY_EVENT_LOGS,
      reason: `확인 불가 — ${reasonMsg}`,
    },
  };
}

function normalizeNicEntry(nic) {
  const toArray = (v) => (Array.isArray(v) ? v : (v ? [String(v)] : []));
  return {
    name: nic?.name || '이름 없음',
    description: nic?.description || nic?.name || '',
    type: nic?.type || 'Ethernet',
    status: nic?.status || 'Up',
    ipv4: toArray(nic?.ipv4),
    ipv6: toArray(nic?.ipv6),
    mac: nic?.mac || null,
    gateway: toArray(nic?.gateway),
    dns: toArray(nic?.dns),
  };
}

function queryWindowsReadOnlyInspection() {
  const nowMs = Date.now();
  if (cachedWinInspection && nowMs - cachedWinInspectionAtMs < PROBE_CONFIG.WIN_INSPECTION_CACHE_TTL_MS) {
    return Promise.resolve(cachedWinInspection);
  }
  if (inflightWinPromise) {
    return inflightWinPromise;
  }

  const fallbackInterfaces = readNodeNetworkInterfacesFallback();

  if (process.platform !== 'win32') {
    const nonWinResult = buildFallbackInspectionResult(
      fallbackInterfaces,
      '현재 실행 환경이 Windows가 아니므로 Windows 방화벽·이벤트 로그 조회는 「확인 불가」로 표시합니다.',
    );
    cachedWinInspection = nonWinResult;
    cachedWinInspectionAtMs = nowMs;
    return Promise.resolve(nonWinResult);
  }

  inflightWinPromise = new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', WIN_READONLY_PROBE_SCRIPT],
      {
        timeout: PROBE_CONFIG.POWERSHELL_TIMEOUT_MS,
        windowsHide: true,
        encoding: 'utf8',
        maxBuffer: PROBE_CONFIG.POWERSHELL_MAX_BUFFER_BYTES,
      },
      (err, stdout) => {
        const measuredAt = new Date().toISOString();
        if (err) {
          const isTimeout = Boolean(err.killed) || String(err.message || '').toLowerCase().includes('timed out');
          const reasonMsg = isTimeout
            ? `PowerShell 조회 응답 지연(${PROBE_CONFIG.POWERSHELL_TIMEOUT_MS}ms 시간 초과)으로 확인 불가 처리했습니다.`
            : `PowerShell 조회 실패(${err.message || '오류'})로 확인 불가 처리했습니다.`;
          const fallback = buildFallbackInspectionResult(fallbackInterfaces, reasonMsg, measuredAt);
          cachedWinInspection = fallback;
          cachedWinInspectionAtMs = Date.now();
          inflightWinPromise = null;
          resolve(fallback);
          return;
        }

        try {
          const parsed = JSON.parse(String(stdout || '').trim());
          const netList = Array.isArray(parsed?.nics) && parsed.nics.length > 0
            ? parsed.nics.map(normalizeNicEntry)
            : fallbackInterfaces;

          const allGateways = [...new Set(netList.flatMap((n) => n.gateway || []).filter(Boolean))];
          const allDns = [...new Set(netList.flatMap((n) => n.dns || []).filter(Boolean))];

          const fwProfiles = Array.isArray(parsed?.fwProfiles) ? parsed.fwProfiles : [];
          const enabledProfiles = fwProfiles.filter((p) => p?.enabled === true).length;
          const fwOk = fwProfiles.length > 0 && fwProfiles.some((p) => p?.status === 'ok');

          const sys = parsed?.sysSummary || createUnverifiedLogSummary('System', 'System 로그 응답 없음');
          const app = parsed?.appSummary || createUnverifiedLogSummary('Application', 'Application 로그 응답 없음');
          const evOk = sys.status === 'ok' || app.status === 'ok';

          const result = {
            network: {
              status: netList.length > 0 ? 'ok' : 'unverified',
              measuredAt,
              interfaceCount: netList.length,
              primaryGateway: allGateways[0] || null,
              dnsServers: allDns,
              interfaces: netList,
              reason: netList.length > 0
                ? 'Windows .NET NetworkInterface 및 node:os.networkInterfaces() 읽기 전용 조회 (일반 권한)'
                : '활성 네트워크 인터페이스를 확인할 수 없습니다.',
            },
            firewall: {
              status: fwOk ? 'ok' : 'unverified',
              measuredAt,
              readOnly: true,
              readOnlyNotice: PC_STATUS_NOTICES.READ_ONLY,
              enabledCount: enabledProfiles,
              totalProfiles: fwProfiles.length || PROBE_CONFIG.FIREWALL_PROFILE_TOTAL,
              profiles: fwProfiles,
              adminOnlyItems: ADMIN_ONLY_FIREWALL_ITEMS,
              reason: fwOk
                ? 'Windows Defender 방화벽 프로필(Domain·Private·Public) 읽기 전용 조회 (설정 변경 없음)'
                : (parsed?.fwError || '방화벽 프로필을 읽지 못해 확인 불가로 표시합니다.'),
            },
            windowsEvents: {
              status: evOk ? 'ok' : 'unverified',
              measuredAt,
              windowHours: PROBE_CONFIG.EVENT_WINDOW_HOURS,
              nonIntrusionDisclaimer: PC_STATUS_NOTICES.NON_INTRUSION,
              system: sys,
              application: app,
              adminOnlyLogs: ADMIN_ONLY_EVENT_LOGS,
              reason: evOk
                ? `Windows 이벤트 로그(System·Application, 최근 ${PROBE_CONFIG.EVENT_WINDOW_HOURS}시간 경고·오류) 읽기 전용 조회`
                : 'Windows 이벤트 로그를 확인하지 못했습니다.',
            },
          };

          cachedWinInspection = result;
          cachedWinInspectionAtMs = Date.now();
          inflightWinPromise = null;
          resolve(result);
        } catch (parseErr) {
          const fallback = buildFallbackInspectionResult(
            fallbackInterfaces,
            `PowerShell JSON 응답 파싱 실패(${parseErr?.message || '형식 오류'})로 확인 불가 처리했습니다.`,
            measuredAt,
          );
          cachedWinInspection = fallback;
          cachedWinInspectionAtMs = Date.now();
          inflightWinPromise = null;
          resolve(fallback);
        }
      },
    );
  });

  return inflightWinPromise;
}

export async function measureLiveNonAdminPcStatus() {
  const before = lastCpuSnapshot || readCpuTickSnapshot();
  const [winInspection] = await Promise.all([
    queryWindowsReadOnlyInspection(),
    new Promise((resolve) => setTimeout(resolve, PROBE_CONFIG.CPU_TICK_DELTA_WAIT_MS)),
  ]);
  const after = readCpuTickSnapshot();
  lastCpuSnapshot = after;

  const measuredAt = new Date().toISOString();
  const totalDiff = after.total - before.total;
  const idleDiff = after.idle - before.idle;
  const cpuPct = totalDiff > 0
    ? Number((((totalDiff - idleDiff) / totalDiff) * 100).toFixed(1))
    : null;

  const totalMemGb = Number((os.totalmem() / (1024 ** 3)).toFixed(2));
  const freeMemGb = Number((os.freemem() / (1024 ** 3)).toFixed(2));
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
      privilegeMode: PC_STATUS_NOTICES.PRIVILEGE_MODE,
      readOnlyGuarantee: PC_STATUS_NOTICES.READ_ONLY,
      nonIntrusionDisclaimer: PC_STATUS_NOTICES.NON_INTRUSION,
      sdpSeparationNotice: PC_STATUS_NOTICES.SDP_SEPARATION,
      cpu: {
        usagePercent: cpuPct,
        logicalCores: after.cores > 0 ? after.cores : null,
        reason: cpuPct !== null
          ? 'node:os.cpus() 틱 차분 측정 (일반 권한)'
          : 'CPU 틱 차분을 계산할 수 없습니다.',
      },
      memory: {
        usedGb: usedMemGb,
        freeGb: freeMemGb,
        totalGb: totalMemGb,
        usagePercent: memPct,
        reason: 'node:os.totalmem()/freemem() 조회 (일반 권한)',
      },
      disk: {
        freeGb: diskFreeGb,
        totalGb: diskTotalGb,
        usedGb: diskUsedGb,
        usagePercent: diskPct,
        reason: diskFreeGb !== null
          ? 'node:fs.statfsSync() 볼륨 조회 (일반 권한)'
          : diskReason,
      },
      network: winInspection.network,
      firewall: winInspection.firewall,
      windowsEvents: winInspection.windowsEvents,
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
      const pathname = (req?.url || '/').split('?')[0];
      if (req?.method === 'GET' && pathname === PROBE_CONFIG.ENDPOINT_PATH) {
        const payload = await measureLiveNonAdminPcStatus();
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        res.end(JSON.stringify(payload));
        return;
      }
    } catch {
      // Fall through to default server handler if measurement fails
    }
    return originalListener.apply(this, arguments);
  };

  if (isFuncFirst) {
    return originalCreateServer.call(this, wrappedListener);
  }
  return originalCreateServer.call(this, optionsOrListener, wrappedListener);
};
