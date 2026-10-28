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
import crypto from 'node:crypto';
import { resolve } from 'node:path';

const DEFAULT_APPROVED_PACKAGES = JSON.stringify([
  '@supabase/supabase-js',
  'jose',
  'tslib',
  '@supabase/auth-js',
  '@supabase/functions-js',
  '@supabase/postgrest-js',
  '@supabase/realtime-js',
  '@supabase/storage-js',
]);

if (!process.env.ON_PROJECT_DIRECTORY) {
  const candidateParent = resolve(process.cwd(), '..');
  if (fs.existsSync(resolve(process.cwd(), 'package-lock.json'))) {
    process.env.ON_PROJECT_DIRECTORY = resolve(process.cwd());
  } else if (fs.existsSync(resolve(candidateParent, 'package-lock.json'))) {
    process.env.ON_PROJECT_DIRECTORY = candidateParent;
  }
}

if (!process.env.ON_APPROVED_PUBLIC_PACKAGES) {
  process.env.ON_APPROVED_PUBLIC_PACKAGES = DEFAULT_APPROVED_PACKAGES;
}

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

let cpuSamplerTimer = null;
if (!globalThis.__ALEKOV_CPU_SAMPLER_STARTED__) {
  globalThis.__ALEKOV_CPU_SAMPLER_STARTED__ = true;
  cpuSamplerTimer = setInterval(() => {
    try {
      lastCpuSnapshot = readCpuTickSnapshot();
    } catch {
      // Ignore background sampling errors
    }
  }, PROBE_CONFIG.CPU_SAMPLER_INTERVAL_MS);

  if (typeof cpuSamplerTimer.unref === 'function') {
    cpuSamplerTimer.unref();
  }
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

$conns = @()
try {
  $conns = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue)
} catch {}
if ($conns.Count -eq 0) {
  try {
    $ipProps = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties()
    $conns = @($ipProps.GetActiveTcpListeners() | ForEach-Object {
      [pscustomobject]@{
        LocalAddress = $_.Address.ToString()
        LocalPort = $_.Port
        OwningProcess = 0
      }
    })
  } catch {}
}

$procMap = @{}
try {
  Get-Process -ErrorAction SilentlyContinue | ForEach-Object {
    $procMap[$_.Id] = [string]$_.ProcessName
  }
} catch {}

$targetPort = if ($env:ON_PORT) { [int]$env:ON_PORT } else { 5189 }
$ports = @($conns | ForEach-Object {
  $la = [string]$_.LocalAddress
  $lp = [int]$_.LocalPort
  $pidNum = [int]$_.OwningProcess
  $pName = if ($procMap.ContainsKey($pidNum)) { $procMap[$pidNum] } else { if ($pidNum -eq 4) { 'System' } elseif ($pidNum -eq 0) { 'System/Idle' } else { 'Unknown' } }
  $scope = if ($la -eq '127.0.0.1' -or $la -eq '::1') { 'loopback' } else { 'exposed' }
  [pscustomobject]@{
    port = $lp
    localAddress = $la
    pid = $pidNum
    processName = $pName
    scope = $scope
    isKeshevPort = ($lp -eq $targetPort)
  }
})

$startup = @()
try {
  $runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
  if (Test-Path -LiteralPath $runKey) {
    $props = Get-ItemProperty -LiteralPath $runKey -ErrorAction SilentlyContinue
    if ($null -ne $props) {
      foreach ($p in $props.PSObject.Properties) {
        if ($p.Name -notmatch '^PS.*') {
          $startup += [pscustomobject]@{
            name = [string]$p.Name
            commandOrPath = [string]$p.Value
            source = 'HKCU_Run'
          }
        }
      }
    }
  }
} catch {}

try {
  $folder = [Environment]::GetFolderPath('Startup')
  if ($folder -and (Test-Path -LiteralPath $folder)) {
    Get-ChildItem -LiteralPath $folder -File -ErrorAction SilentlyContinue | ForEach-Object {
      $startup += [pscustomobject]@{
        name = [string]$_.Name
        commandOrPath = [string]$_.FullName
        source = 'StartupFolder'
      }
    }
  }
} catch {}

$since = (Get-Date).AddHours(-${windowHours})
[pscustomobject]@{
  nics = $nics
  fwProfiles = $fwProfiles
  fwError = $fwError
  sysSummary = (Read-WinLogSummary -LogName 'System' -SinceTime $since)
  appSummary = (Read-WinLogSummary -LogName 'Application' -SinceTime $since)
  ports = $ports
  startup = $startup
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
    listeningPorts: [],
    startupItems: [],
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
            listeningPorts: Array.isArray(parsed?.ports) ? parsed.ports : [],
            startupItems: Array.isArray(parsed?.startup) ? parsed.startup : [],
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

let inflightMeasureStatusPromise = null;

export async function measureLiveNonAdminPcStatus() {
  if (inflightMeasureStatusPromise) {
    return inflightMeasureStatusPromise;
  }

  inflightMeasureStatusPromise = (async () => {
    try {
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

      const payloadData = {
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
        listeningPorts: winInspection.listeningPorts || [],
        startupItems: winInspection.startupItems || [],
        baselineDrift: computeBaselineDrift(winInspection.listeningPorts || [], winInspection.startupItems || []),
      };

      recordSnapshot(payloadData);
      payloadData.snapshotHistory = snapshotHistory.slice();

      return {
        ok: true,
        data: payloadData,
      };
    } finally {
      inflightMeasureStatusPromise = null;
    }
  })();

  return inflightMeasureStatusPromise;
}

// Stage 21 Server-Memory Snapshot Ring Buffer (max 25)
const MAX_SNAPSHOT_HISTORY = 25;
const snapshotHistory = [];

function recordSnapshot(data) {
  if (!data) return;
  const snap = {
    timestamp: data.measuredAt || new Date().toISOString(),
    cpuUsagePercent: data.cpu?.usagePercent ?? null,
    cores: data.cpu?.logicalCores ?? null,
    memoryUsagePercent: data.memory?.usagePercent ?? null,
    memUsedGb: data.memory?.usedGb ?? null,
    memTotalGb: data.memory?.totalGb ?? null,
    diskUsagePercent: data.disk?.usagePercent ?? null,
    diskFreeGb: data.disk?.freeGb ?? null,
    interfaceCount: data.network?.interfaceCount ?? 0,
    firewallEnabledCount: data.firewall?.enabledCount ?? 0,
    winSysTotal: data.windowsEvents?.system?.totalCount ?? null,
    winAppTotal: data.windowsEvents?.application?.totalCount ?? null,
    listeningPortsCount: Array.isArray(data.listeningPorts) ? data.listeningPorts.length : 0,
    startupItemsCount: Array.isArray(data.startupItems) ? data.startupItems.length : 0,
    hasBaseline: Boolean(data.baselineDrift?.hasBaseline),
    driftDeltaCount: data.baselineDrift?.hasBaseline
      ? ((data.baselineDrift.newExposedPorts?.length || 0) +
         (data.baselineDrift.newLoopbackPorts?.length || 0) +
         (data.baselineDrift.addedStartupItems?.length || 0) +
         (data.baselineDrift.removedStartupItems?.length || 0))
      : 0,
    mode: 'demo',
  };
  snapshotHistory.push(snap);
  if (snapshotHistory.length > MAX_SNAPSHOT_HISTORY) {
    snapshotHistory.shift();
  }
}

// Stage 21 Ephemeral/deterministic secret for HMAC signature verification across restarts
const AUDIT_SIGNING_SECRET = process.env.ON_AUDIT_SIGNING_SECRET ||
  crypto.createHash('sha256')
    .update(`keshev-audit-v1:${os.hostname()}:${os.homedir()}:${process.arch}`)
    .digest('hex');

// Stage 20 Baseline Pinning & Drift Detection State
let pinnedBaseline = null;

function computeBaselineDrift(currentPorts = [], currentStartup = []) {
  if (!pinnedBaseline) {
    return {
      hasBaseline: false,
      pinnedAt: null,
      newExposedPorts: [],
      newLoopbackPorts: [],
      addedStartupItems: [],
      removedStartupItems: [],
    };
  }

  const baselinePortKeys = new Set(
    (pinnedBaseline.listeningPorts || []).map((p) => `${p.port}:${p.localAddress}`)
  );
  const newPorts = currentPorts.filter(
    (p) => !baselinePortKeys.has(`${p.port}:${p.localAddress}`)
  );
  const newExposedPorts = newPorts.filter((p) => p.scope === 'exposed');
  const newLoopbackPorts = newPorts.filter((p) => p.scope === 'loopback');

  const baselineStartupKeys = new Set(
    (pinnedBaseline.startupItems || []).map((s) => `${s.source}:${s.name}`)
  );
  const currentStartupKeys = new Set(
    currentStartup.map((s) => `${s.source}:${s.name}`)
  );
  const addedStartupItems = currentStartup.filter(
    (s) => !baselineStartupKeys.has(`${s.source}:${s.name}`)
  );
  const removedStartupItems = (pinnedBaseline.startupItems || []).filter(
    (s) => !currentStartupKeys.has(`${s.source}:${s.name}`)
  );

  return {
    hasBaseline: true,
    pinnedAt: pinnedBaseline.pinnedAt,
    newExposedPorts,
    newLoopbackPorts,
    addedStartupItems,
    removedStartupItems,
  };
}

// Stage 17, 18, 19 Simulation & Demo Mode Interceptor
const isDemoMode = process.argv.includes('--demo') || process.env.ON_AI_DEMO_EXPLAIN === '1';

// In-memory action records for Stage 19 SOAR state machine (LRU bounded)
const MAX_DEMO_ACTIONS = 50;
const demoActionsMap = new Map();

function saveDemoAction(key, record) {
  if (demoActionsMap.has(key)) {
    demoActionsMap.delete(key);
  } else if (demoActionsMap.size >= MAX_DEMO_ACTIONS) {
    const oldestKey = demoActionsMap.keys().next().value;
    if (oldestKey !== undefined) {
      demoActionsMap.delete(oldestKey);
    }
  }
  demoActionsMap.set(key, record);
}

function sendDemoJson(res, statusCode, body) {
  if (res.destroyed || res.writableEnded) return;
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-on-request-id': crypto.randomUUID(),
  });
  res.end(payload);
}

function canonicalJsonStringify(obj) {
  if (typeof obj === 'string') {
    return JSON.stringify(obj.normalize('NFC'));
  }
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJsonStringify).join(',') + ']';
  }
  const entries = Object.entries(obj).map(([k, v]) => [k.normalize('NFC'), v]);
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return '{' + entries.map(([k, v]) => JSON.stringify(k) + ':' + canonicalJsonStringify(v)).join(',') + '}';
}

async function readStreamBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1048576) {
      const err = new Error('REQUEST_TOO_LARGE');
      err.code = 'REQUEST_TOO_LARGE';
      throw err;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch (parseErr) {
    const err = new Error('JSON_PARSE_ERROR: ' + parseErr.message);
    err.code = 'INVALID_JSON_BODY';
    throw err;
  }
}

let originalCreateServer = http.createServer;
if (!globalThis.__ALEKOV_HTTP_INTERCEPTOR_PATCHED__) {
  globalThis.__ALEKOV_HTTP_INTERCEPTOR_PATCHED__ = true;
  originalCreateServer = http.createServer;
  http.createServer = function patchedCreateServer(optionsOrListener, maybeListener) {
  const isFuncFirst = typeof optionsOrListener === 'function';
  const originalListener = isFuncFirst ? optionsOrListener : maybeListener;

  if (typeof originalListener !== 'function') {
    return originalCreateServer.apply(this, arguments);
  }

  const wrappedListener = async function pcStatusInterceptor(req, res) {
    try {
      const pathname = (req?.url || '/').split('?')[0];

      // 0. Student Appearance & Dashboard CSS Bundle (CSP style-src 'self' 준수)
      if (req?.method === 'GET' && pathname === '/student/appearance.css') {
        let appearanceCssContent = ':root{--accent:#0e306d;--accent-soft:#e2e6ed;--bg:#f8fafc;--surface:#ffffff}\n';
        try {
          const appJsonPath = resolve(process.cwd(), 'student/appearance.json');
          if (fs.existsSync(appJsonPath)) {
            const aj = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
            if (aj?.palette?.accent) {
              const acc = aj.palette.accent;
              const bg = aj.palette.background || '#f8fafc';
              const surf = aj.palette.surface || '#ffffff';
              appearanceCssContent = `:root{--accent:${acc};--accent-soft:#e2e6ed;--bg:${bg};--surface:${surf}}\n`;
            }
          }
        } catch {}

        let dashboardCss = '';
        try {
          const dashPath = resolve(process.cwd(), 'student/dashboard.css');
          if (fs.existsSync(dashPath)) {
            dashboardCss = fs.readFileSync(dashPath, 'utf8');
          }
        } catch {}

        res.writeHead(200, {
          'content-type': 'text/css; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        res.end(appearanceCssContent + '\n' + dashboardCss);
        return;
      }

      // 1. Live PC Status Endpoint (항상 동작)
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

      // 1-1. Live Baseline Pinning Endpoint (항상 동작)
      if (req?.method === 'POST' && pathname === '/api/pc-status/baseline') {
        const live = await measureLiveNonAdminPcStatus();
        pinnedBaseline = {
          pinnedAt: new Date().toISOString(),
          listeningPorts: live.data?.listeningPorts || [],
          startupItems: live.data?.startupItems || [],
        };
        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        res.end(JSON.stringify({
          ok: true,
          data: {
            pinnedAt: pinnedBaseline.pinnedAt,
            listeningPortsCount: pinnedBaseline.listeningPorts.length,
            startupItemsCount: pinnedBaseline.startupItems.length,
          },
        }));
        return;
      }

      // 1-2. Live Real-Time SSE Stream Endpoint (항상 동작)
      if (req?.method === 'GET' && pathname === '/api/pc-status/stream') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        });
        if (typeof res.flushHeaders === 'function') res.flushHeaders();

        let isClosed = false;
        let streamInterval = null;
        const cleanup = () => {
          if (!isClosed) {
            isClosed = true;
            if (streamInterval !== null) {
              clearInterval(streamInterval);
              streamInterval = null;
            }
            try { res.end(); } catch {}
          }
        };

        req.once('close', cleanup);
        req.once('end', cleanup);
        res.once('close', cleanup);

        const pushStatus = async () => {
          if (isClosed || res.destroyed || res.writableEnded) return;
          try {
            const status = await measureLiveNonAdminPcStatus();
            if (isClosed || res.destroyed || res.writableEnded) return;
            res.write(`data: ${JSON.stringify(status)}\n\n`);
          } catch {
            // ignore
          }
        };

        await pushStatus();

        if (!isClosed && !res.destroyed && !res.writableEnded) {
          streamInterval = setInterval(pushStatus, 5000);
          if (typeof streamInterval.unref === 'function') {
            streamInterval.unref();
          }
        }
        return;
      }

      // 1-3. Cryptographic SHA-256 Signed Audit Bundle Export (항상 동작)
      if (req?.method === 'GET' && pathname === '/api/pc-status/audit-export') {
        const live = await measureLiveNonAdminPcStatus();
        const auditPayload = {
          generatedAt: new Date().toISOString(),
          agentVersion: (() => {
            try {
              const p = resolve(process.cwd(), 'package.json');
              if (fs.existsSync(p)) {
                const pj = JSON.parse(fs.readFileSync(p, 'utf8'));
                if (pj.version) return pj.version;
              }
            } catch {}
            return '0.2.11';
          })(),
          application: 'Keshev Security Operations Center',
          badgePolicy: {
            liveMeasured: '[실측값]',
            readOnly: '[읽기 전용]',
            aiAnalysisDemo: '[예시값 · 로컬 AI 분석]',
            simulationAction: '[시뮬레이션 · 조치 상태 검증]',
            unverified: '「확인 불가」',
            sdpDisconnected: '「SDP 미연결」',
            nonIntrusionNotice: '이 건수는 침해나 공격 탐지 결과가 아닙니다',
          },
          livePcStatus: live.data,
          systemInfo: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            uptime: process.uptime(),
          },
          snapshotHistoryCount: snapshotHistory.length,
        };

        const canonicalString = canonicalJsonStringify(auditPayload);
        const payloadSha256 = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
        const signature = crypto.createHmac('sha256', AUDIT_SIGNING_SECRET)
          .update(payloadSha256, 'utf8')
          .digest('hex');

        const bundle = {
          bundleType: 'keshev-soc-audit-bundle',
          version: 1,
          integrity: {
            algorithm: 'SHA-256',
            payloadSha256,
            signature,
            canonicalBytes: Buffer.byteLength(canonicalString, 'utf8'),
          },
          payload: auditPayload,
        };

        res.writeHead(200, {
          'content-type': 'application/json; charset=utf-8',
          'content-disposition': `attachment; filename="keshev-audit-bundle-${Date.now()}.json"`,
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        res.end(JSON.stringify(bundle, null, 2));
        return;
      }

      // 1-4. Cryptographic SHA-256 Signed Audit Bundle Verification (항상 동작)
      if (req?.method === 'POST' && pathname === '/api/pc-status/audit-verify') {
        const bundle = await readStreamBody(req);
        if (!bundle || typeof bundle !== 'object' || !bundle.payload || !bundle.integrity) {
          sendDemoJson(res, 400, {
            ok: false,
            error: {
              code: 'INVALID_BUNDLE_FORMAT',
              message: '올바른 감사 리포트 번들 형식이 아닙니다. payload와 integrity 객체가 필요합니다.',
            },
          });
          return;
        }

        const canonicalString = canonicalJsonStringify(bundle.payload);
        const computedHash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
        const expectedHash = String(bundle.integrity?.payloadSha256 || '');

        const verified = Boolean(expectedHash && computedHash.toLowerCase() === expectedHash.toLowerCase());

        let signatureVerified = false;
        if (verified && bundle.integrity?.signature) {
          const expectedSig = crypto.createHmac('sha256', AUDIT_SIGNING_SECRET)
            .update(computedHash, 'utf8')
            .digest('hex');
          signatureVerified = (expectedSig === bundle.integrity.signature);
        }

        sendDemoJson(res, 200, {
          ok: true,
          data: {
            verified,
            hashMatch: verified,
            signatureVerified,
            computedHash,
            expectedHash,
            generatedAt: bundle.payload?.generatedAt ?? null,
            bundleType: bundle.bundleType || 'unknown',
            canonicalBytes: Buffer.byteLength(canonicalString, 'utf8'),
            reason: verified
              ? '무결성 검증 통과: 감사 리포트 페이로드의 SHA-256 해시가 무결하게 일치합니다.'
              : `위변조 탐지: 기대 해시(${expectedHash})와 재계산된 해시(${computedHash})가 불일치합니다.`,
          },
        });
        return;
      }

      // 2. Demo / Simulation Mode Interceptors (17, 18, 19단계)
      if (isDemoMode) {
        // [Stage 17/18/19 Enriched Events]
        if (req?.method === 'GET' && pathname === '/api/events') {
          const demoEvents = [
            {
              id: 'event-01',
              kind: 'access',
              at: '2026-10-12T03:00:00.000Z',
              appId: 'repository',
              summary: '개발 저장소 접속이 제한됐습니다.',
              evidence: [{ id: 'e-01', text: '서버 예제 판정: deny' }],
              rules: [{ id: 'rule-01', text: '기기 상태 확인이 필요합니다.' }],
              state: { access: 'denied', session: 'active', device: 'unknown' },
              supportedActions: ['isolate_session', 'require_step_up'],
            },
          ];
          sendDemoJson(res, 200, {
            ok: true,
            data: demoEvents,
            meta: { mode: 'demo', checkedAt: new Date().toISOString(), starterVersion: '0.1.0' },
          });
          return;
        }

        // [Stage 17 AI Connection Check]
        if (req?.method === 'POST' && pathname === '/api/ai/check') {
          await readStreamBody(req);
          sendDemoJson(res, 200, {
            ok: true,
            data: {
              transportChecked: true,
              audienceAuthorization: 'test',
              modelCount: 2,
              help: {
                component: 'on-ai',
                code: 'ON_AI_TEST_TRANSPORT_ONLY',
                appCredentialsConfigured: false,
                provisioning: 'pending',
                automaticRetries: 0,
                workbenchRequiredAtRuntime: false,
              },
            },
            meta: { mode: 'demo', checkedAt: new Date().toISOString(), starterVersion: '0.1.0' },
          });
          return;
        }

        // [Stage 18 AI Incident Explanation with Telemetry Grounding]
        if (req?.method === 'POST' && pathname === '/api/ai/explain') {
          const body = await readStreamBody(req);
          if (body?.eventId !== 'event-01') {
            sendDemoJson(res, 404, {
              ok: false,
              error: { code: 'EVENT_NOT_FOUND', message: '본인 기록에서 사건을 찾을 수 없습니다.' },
              meta: { mode: 'demo', checkedAt: new Date().toISOString(), starterVersion: '0.1.0' },
            });
            return;
          }

          let netCount = 0;
          let fwText = '확인 불가 (일반 권한 제한)';
          let evText = '확인 불가';
          try {
            const pcStatus = await measureLiveNonAdminPcStatus();
            netCount = pcStatus.data?.network?.interfaceCount ?? 0;
            const fwProfiles = pcStatus.data?.firewall?.profiles || [];
            const fwEnabled = fwProfiles.filter((p) => p.enabled === true).length;
            fwText = pcStatus.data?.firewall?.status === 'ok'
              ? `활성 프로필 ${fwEnabled}/${pcStatus.data?.firewall?.totalProfiles || 3}개`
              : '확인 불가 (일반 권한 제한)';
            const sysErr = pcStatus.data?.windowsEvents?.system?.errorCount ?? 0;
            const sysWarn = pcStatus.data?.windowsEvents?.system?.warningCount ?? 0;
            const appErr = pcStatus.data?.windowsEvents?.application?.errorCount ?? 0;
            const appWarn = pcStatus.data?.windowsEvents?.application?.warningCount ?? 0;
            const totalEvents = sysErr + sysWarn + appErr + appWarn;
            evText = `최근 24시간 이벤트 로그 ${totalEvents}건 (오류 ${sysErr + appErr}건, 경고 ${sysWarn + appWarn}건)`;
          } catch {
            // fallback
          }

          const summary = `[예시값 · 로컬 AI 분석] 사건 event-01 분석 결과: 개발 저장소 접속이 서버 예제 보안 정책에 의해 거부(deny)되었습니다. 로컬 PC 실측 상태 점검 결과, 활성 네트워크 어댑터 ${netCount}개, 방화벽 프로필 상태(${fwText}), ${evText}으로 관측되었습니다. 기기 상태가 아직 보안 기준에 부합하는지 확인되지 않았으므로(unknown), 세션 격리(isolate_session) 또는 단계별 인증 요구(require_step_up) 조치 수행을 권장하며 사람의 최종 확인이 필수적입니다.`;

          sendDemoJson(res, 200, {
            ok: true,
            data: {
              explanation: {
                summary,
                evidenceIds: ['e-01'],
                proposals: [
                  {
                    action: 'isolate_session',
                    evidenceIds: ['e-01'],
                    reason: '단말 기기 보안 상태 및 방화벽 설정 확인 전까지 세션을 안전하게 격리합니다.',
                  },
                  {
                    action: 'require_step_up',
                    evidenceIds: ['e-01'],
                    reason: '추가 본인 인증 및 단말 준수 상태 점검을 거쳐 접근을 재승인합니다.',
                  },
                ],
                requiresHumanConfirmation: true,
                executed: false,
              },
            },
            meta: { mode: 'demo', checkedAt: new Date().toISOString(), starterVersion: '0.1.0' },
          });
          return;
        }

        // [Stage 19 SOAR Action Lifecycle: prepare]
        if (req?.method === 'POST' && pathname === '/api/actions/prepare') {
          const body = await readStreamBody(req);
          const eventId = body?.eventId || 'event-01';
          const actionId = body?.actionId || 'isolate_session';
          const requestId = crypto.randomUUID();
          const receiptId = crypto.randomUUID();
          const confirmationId = 'ac-on-' + crypto.randomBytes(32).toString('base64url').slice(0, 43);
          const confirmationExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          const target = { id: 'device:practice-pc', generation: 1 };
          const hashPayload = `${requestId}:${receiptId}:${actionId}:${target.id}:${target.generation}`;
          const actionHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

          const record = {
            requestId,
            receiptId,
            eventId,
            actionId,
            confirmationId,
            confirmationExpiresAt,
            target,
            status: 'prepared',
            version: 1,
            replayed: false,
            actionHash,
            preparedAt: new Date().toISOString(),
            executedAt: null,
            observation: null,
          };
          saveDemoAction(requestId, record);

          sendDemoJson(res, 200, {
            ok: true,
            data: {
              requestId,
              receiptId,
              eventId,
              actionId,
              status: 'prepared',
              version: 1,
              replayed: false,
              confirmationId,
              confirmationExpiresAt,
              target,
            },
            meta: { mode: 'demo', checkedAt: new Date().toISOString(), starterVersion: '0.1.0', actionHash: record.actionHash },
          });
          return;
        }

        // [Stage 19 SOAR Action Lifecycle: execute]
        if (req?.method === 'POST' && pathname === '/api/actions/execute') {
          const body = await readStreamBody(req);
          const { requestId, confirmationId } = body || {};
          const record = demoActionsMap.get(requestId);
          if (!record) {
            sendDemoJson(res, 404, {
              ok: false,
              error: { code: 'ACTION_NOT_FOUND', message: '조치 요청을 찾을 수 없습니다.' },
              meta: { mode: 'demo', checkedAt: new Date().toISOString(), starterVersion: '0.1.0' },
            });
            return;
          }

          if (Date.parse(record.confirmationExpiresAt) <= Date.now() || record.confirmationId !== confirmationId) {
            sendDemoJson(res, 409, {
              ok: false,
              error: { code: 'ACTION_CONFIRMATION_EXPIRED', message: '조치 확인 기한이 지났거나 확인 정보가 올바르지 않습니다.' },
              meta: { mode: 'demo', checkedAt: new Date().toISOString(), starterVersion: '0.1.0' },
            });
            return;
          }

          record.status = 'pending';
          record.version = 2;
          record.executedAt = new Date().toISOString();
          const execHashPayload = `${record.requestId}:${record.receiptId}:${record.actionId}:${record.target.id}:${record.target.generation}:${record.executedAt}`;
          record.actionHash = crypto.createHash('sha256').update(execHashPayload).digest('hex');
          saveDemoAction(record.requestId, record);

          sendDemoJson(res, 200, {
            ok: true,
            data: {
              requestId: record.requestId,
              receiptId: record.receiptId,
              eventId: record.eventId,
              actionId: record.actionId,
              status: 'pending',
              version: 2,
              replayed: false,
            },
            meta: { mode: 'demo', checkedAt: new Date().toISOString(), starterVersion: '0.1.0', actionHash: record.actionHash },
          });
          return;
        }

        // [Stage 19 SOAR Action Lifecycle: result]
        if (req?.method === 'POST' && pathname === '/api/actions/result') {
          const body = await readStreamBody(req);
          const { requestId } = body || {};
          const record = demoActionsMap.get(requestId);
          if (!record) {
            sendDemoJson(res, 404, {
              ok: false,
              error: { code: 'ACTION_NOT_FOUND', message: '조치 요청을 찾을 수 없습니다.' },
              meta: { mode: 'demo', checkedAt: new Date().toISOString(), starterVersion: '0.1.0' },
            });
            return;
          }

          record.status = 'succeeded';
          record.version = 3;
          if (!record.observation) {
            record.observation = {
              observedAt: new Date().toISOString(),
              effectApplied: true,
            };
          }
          saveDemoAction(record.requestId, record);

          sendDemoJson(res, 200, {
            ok: true,
            data: {
              requestId: record.requestId,
              receiptId: record.receiptId,
              eventId: record.eventId,
              actionId: record.actionId,
              status: 'succeeded',
              version: 3,
              replayed: false,
              observation: record.observation,
            },
            meta: { mode: 'demo', checkedAt: new Date().toISOString(), starterVersion: '0.1.0', actionHash: record.actionHash },
          });
          return;
        }

        // [Stage 19 Verifiable SHA-256 Receipt Inspection]
        if (req?.method === 'GET' && pathname === '/api/actions/receipt') {
          const urlObj = new URL(req.url, 'http://localhost');
          const reqId = urlObj.searchParams.get('requestId');
          if (reqId) {
            const record = demoActionsMap.get(reqId);
            if (!record) {
              sendDemoJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: '영수증을 찾을 수 없습니다.' } });
              return;
            }
            sendDemoJson(res, 200, { ok: true, data: record });
            return;
          }
          const allRecords = Array.from(demoActionsMap.values()).slice(-20);
          sendDemoJson(res, 200, { ok: true, data: allRecords });
          return;
        }
      }
    } catch (interceptorErr) {
      if (interceptorErr?.code === 'INVALID_JSON_BODY' || interceptorErr?.code === 'REQUEST_TOO_LARGE') {
        sendDemoJson(res, 400, {
          ok: false,
          error: { code: interceptorErr.code, message: interceptorErr.message },
          meta: { checkedAt: new Date().toISOString() },
        });
        return;
      }
      // Fall through to default server handler if other measurement fails
    }
    return originalListener.apply(this, arguments);
  };

  if (isFuncFirst) {
    return originalCreateServer.call(this, wrappedListener);
  }
  return originalCreateServer.call(this, optionsOrListener, wrappedListener);
};
}
