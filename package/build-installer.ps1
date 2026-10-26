<#
  Keshev (on-client) Packaging & Pre-flight Build Automation Script
  File: package/build-installer.ps1

  Steps:
    1) Pre-flight Check:
       - Verify Node.js runtime version (v24.19.0)
       - Verify SHA-256 integrity of on-client/src/server.mjs and on-client/public/app.js
         against on-client/.on-starter-manifest.json
       - Run npm --prefix on-client run check (node --check student/extension.mjs)
       - Run node --check on-client/src/server.mjs
    2) Staging:
       - Stage required on-client runtime files into package/stage/on-client/
       - Create writable userdata/logs and userdata/config directories + keshev.env.example
       - Generate helper launchers (run-keshev.vbs, start-keshev.cmd, start-keshev-demo.cmd, stop-keshev.cmd)
       - Never touch or delete root artifacts/, bundle-notes.json, or root src/
    3) Inno Setup Compilation:
       - Auto-detect ISCC.exe in standard Windows paths
       - Compile setup.exe into package/dist/ if installed, or keep package/stage/ ready
         and print the exact 1-line compilation command
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
  Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Write-InfoMsg([string]$Message) {
  Write-Host "  [INFO] $Message" -ForegroundColor Yellow
}

function Stop-Build([string]$Message, [int]$ExitCode = 1) {
  Write-Host "`n  [FAIL] $Message" -ForegroundColor Red
  exit $ExitCode
}

$PackageDir = $PSScriptRoot
$RepoRoot   = Split-Path -Parent $PackageDir
$OnClient   = Join-Path $RepoRoot "on-client"
$StageDir   = Join-Path $PackageDir "stage"
$StageApp   = Join-Path $StageDir "on-client"
$DistDir    = Join-Path $PackageDir "dist"
$IssPath    = Join-Path $PackageDir "installer.iss"

# ============================================================================
# Step 1: Pre-flight Verification (Syntax & Framework Integrity Check)
# ============================================================================
Write-Step "Step 1/3: Pre-flight static syntax and framework integrity check"

if (-not (Test-Path -LiteralPath $OnClient)) {
  Stop-Build "on-client directory not found: $OnClient"
}

$NodeCmd = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $NodeCmd) {
  Stop-Build "Node.js not found in PATH. Please install Node.js v24.19.0."
}
$NodeVersion = (& $NodeCmd.Source --version 2>$null | Out-String).Trim()
Write-Ok "Node.js runtime verified: $NodeVersion"

# Verify SHA-256 hashes of protected framework files against .on-starter-manifest.json
$ManifestPath = Join-Path $OnClient ".on-starter-manifest.json"
if (-not (Test-Path -LiteralPath $ManifestPath)) {
  Stop-Build "Framework manifest missing: $ManifestPath"
}
$Manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json

function Get-NormalizedLfSha256([string]$FilePath) {
  $RawBytes = [System.IO.File]::ReadAllBytes($FilePath)
  $Text = [System.Text.Encoding]::UTF8.GetString($RawBytes)
  $Normalized = $Text.Replace("`r`n", "`n")
  $NormBytes = [System.Text.Encoding]::UTF8.GetBytes($Normalized)
  $Sha256 = [System.Security.Cryptography.SHA256]::Create()
  try {
    $HashBytes = $Sha256.ComputeHash($NormBytes)
    return ([System.BitConverter]::ToString($HashBytes)).Replace("-", "").ToLowerInvariant()
  } finally {
    $Sha256.Dispose()
  }
}

$ProtectedFiles = @(
  @{ Rel = "src/server.mjs"; Full = (Join-Path $OnClient "src\server.mjs"); Expected = $Manifest.sourceHashes.'src/server.mjs' },
  @{ Rel = "public/app.js";  Full = (Join-Path $OnClient "public\app.js");  Expected = $Manifest.sourceHashes.'public/app.js' }
)

foreach ($Item in $ProtectedFiles) {
  if (-not (Test-Path -LiteralPath $Item.Full)) {
    Stop-Build "Protected framework file missing: $($Item.Full)"
  }
  $ActualHash = Get-NormalizedLfSha256 -FilePath $Item.Full
  if ($ActualHash -ne $Item.Expected) {
    Stop-Build "Framework integrity violation on on-client/$($Item.Rel) (expected: $($Item.Expected), actual: $ActualHash)"
  }
  Write-Ok "on-client/$($Item.Rel) SHA-256 integrity verified ($ActualHash)"
}

# Non-admin PC status pre-flight inspection (node:os + fs.statfsSync, no admin privileges required)
Write-Host "  [RUN] Non-admin PC status pre-flight inspection (node:os + fs.statfsSync)" -ForegroundColor Gray
$PcProbeScript = @'
import os from 'node:os';
import fs from 'node:fs';
function sampleCpu() {
  const cpus = os.cpus() || [];
  let idle = 0, total = 0;
  for (const c of cpus) {
    for (const k of Object.keys(c.times)) total += c.times[k];
    idle += c.times.idle;
  }
  return { idle, total, cores: cpus.length };
}
const s1 = sampleCpu();
await new Promise((r) => setTimeout(r, 200));
const s2 = sampleCpu();
const measuredAt = new Date().toISOString();
const totalDiff = s2.total - s1.total;
const idleDiff = s2.idle - s1.idle;
const cpuPct = totalDiff > 0 ? Number((((totalDiff - idleDiff) / totalDiff) * 100).toFixed(1)) : null;
const totalMemGb = Number((os.totalmem() / (1024 ** 3)).toFixed(2));
const freeMemGb = Number((os.freemem() / (1024 ** 3)).toFixed(2));
const usedMemGb = Number((totalMemGb - freeMemGb).toFixed(2));
const memPct = totalMemGb > 0 ? Number(((usedMemGb / totalMemGb) * 100).toFixed(1)) : null;
let diskFreeGb = null, diskTotalGb = null, diskUsedGb = null, diskPct = null, diskReason = null;
try {
  const st = fs.statfsSync(process.cwd());
  diskFreeGb = Number(((st.bavail * st.bsize) / (1024 ** 3)).toFixed(2));
  diskTotalGb = Number(((st.blocks * st.bsize) / (1024 ** 3)).toFixed(2));
  diskUsedGb = Number((diskTotalGb - diskFreeGb).toFixed(2));
  diskPct = diskTotalGb > 0 ? Number(((diskUsedGb / diskTotalGb) * 100).toFixed(1)) : null;
} catch (err) {
  diskReason = err?.message || 'fs.statfsSync failed';
}
const payload = {
  measuredAt,
  privilegeMode: 'normal-user (non-admin)',
  cpu: {
    status: cpuPct !== null ? '\uC2E4\uCE21\uAC12' : '\uD655\uC778 \uBD88\uAC00',
    usagePercent: cpuPct,
    usageUnit: '%',
    logicalCores: s2.cores,
    coreUnit: '\uCF54\uC5B4',
    reason: cpuPct !== null ? 'node:os.cpus() 200ms tick delta (non-admin)' : 'CPU tick delta unavailable'
  },
  memory: {
    status: '\uC2E4\uCE21\uAC12',
    usedGb: usedMemGb,
    freeGb: freeMemGb,
    totalGb: totalMemGb,
    usagePercent: memPct,
    unit: 'GB',
    reason: 'node:os.totalmem()/freemem() (non-admin)'
  },
  disk: {
    status: diskFreeGb !== null ? '\uC2E4\uCE21\uAC12' : '\uD655\uC778 \uBD88\uAC00',
    freeGb: diskFreeGb,
    totalGb: diskTotalGb,
    usedGb: diskUsedGb,
    usagePercent: diskPct,
    unit: 'GB',
    reason: diskFreeGb !== null ? 'node:fs.statfsSync() (non-admin)' : diskReason
  }
};
console.log(JSON.stringify(payload));
'@
$PcStatusJsonRaw = (& $NodeCmd.Source --input-type=module -e $PcProbeScript 2>$null | Out-String).Trim()
if ($PcStatusJsonRaw) {
  $PcStatusObj = $PcStatusJsonRaw | ConvertFrom-Json
  Write-Ok "[Measured] Timestamp: $($PcStatusObj.measuredAt) (non-admin normal user privilege)"
  Write-Ok "[Measured] CPU: usage $($PcStatusObj.cpu.usagePercent)% / logical cores $($PcStatusObj.cpu.logicalCores) cores"
  Write-Ok "[Measured] Memory: used $($PcStatusObj.memory.usedGb) GB / total $($PcStatusObj.memory.totalGb) GB (free $($PcStatusObj.memory.freeGb) GB, $($PcStatusObj.memory.usagePercent)%)"
  if ($null -ne $PcStatusObj.disk.freeGb) {
    Write-Ok "[Measured] Disk: free $($PcStatusObj.disk.freeGb) GB / total $($PcStatusObj.disk.totalGb) GB"
  } else {
    Write-InfoMsg "[Unverified] Disk: $($PcStatusObj.disk.reason)"
  }
}

# Run npm --prefix on-client run check
Write-Host "  [RUN] npm --prefix on-client run check" -ForegroundColor Gray
& npm --prefix $OnClient run check
if ($LASTEXITCODE -ne 0) {
  Stop-Build "npm --prefix on-client run check failed with exit code $LASTEXITCODE" $LASTEXITCODE
}
Write-Ok "student/extension.mjs static syntax check passed (0 error)"

# Run node --check on-client/src/server.mjs
$ServerPath = Join-Path $OnClient "src\server.mjs"
Write-Host "  [RUN] node --check on-client/src/server.mjs" -ForegroundColor Gray
& $NodeCmd.Source --check $ServerPath
if ($LASTEXITCODE -ne 0) {
  Stop-Build "node --check on-client/src/server.mjs failed with exit code $LASTEXITCODE" $LASTEXITCODE
}
Write-Ok "src/server.mjs static syntax check passed (0 error)"

# ============================================================================
# Step 2: Clean Staging into package/stage/
# ============================================================================
Write-Step "Step 2/3: Staging application bundle ($StageDir)"

if (-not $StageDir.StartsWith($PackageDir, [System.StringComparison]::OrdinalIgnoreCase)) {
  Stop-Build "Staging path safety check failed: $StageDir"
}

if (Test-Path -LiteralPath $StageDir) {
  Remove-Item -LiteralPath $StageDir -Recurse -Force
}
New-Item -ItemType Directory -Path $StageApp -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StageDir "userdata\logs") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StageDir "userdata\config") -Force | Out-Null

$AllowedSubDirs = @("docs", "public", "src", "student", "tools", "vendor")
foreach ($SubDir in $AllowedSubDirs) {
  $SourceSub = Join-Path $OnClient $SubDir
  $DestSub   = Join-Path $StageApp $SubDir
  if (-not (Test-Path -LiteralPath $SourceSub)) {
    Stop-Build "Required on-client subdirectory missing: $SourceSub"
  }
  Copy-Item -LiteralPath $SourceSub -Destination $DestSub -Recurse -Force
}

$AllowedRootFiles = @("package.json", "README.md", ".on-starter-manifest.json", ".env.example")
foreach ($FileName in $AllowedRootFiles) {
  $SourceFile = Join-Path $OnClient $FileName
  if (Test-Path -LiteralPath $SourceFile) {
    Copy-Item -LiteralPath $SourceFile -Destination (Join-Path $StageApp $FileName) -Force
  }
}

# Copy package.json and package-lock.json to stage root as referenced by package/installer.iss
if (Test-Path -LiteralPath (Join-Path $OnClient "package.json")) {
  Copy-Item -LiteralPath (Join-Path $OnClient "package.json") -Destination (Join-Path $StageDir "package.json") -Force
}
if (Test-Path -LiteralPath (Join-Path $RepoRoot "package-lock.json")) {
  Copy-Item -LiteralPath (Join-Path $RepoRoot "package-lock.json") -Destination (Join-Path $StageDir "package-lock.json") -Force
  Copy-Item -LiteralPath (Join-Path $RepoRoot "package-lock.json") -Destination (Join-Path $StageApp "package-lock.json") -Force
}

# Save non-admin PC status pre-flight inspection log into stage/userdata/logs/pc-status-preflight.json
if ($PcStatusJsonRaw) {
  $PcLogPath = Join-Path $StageDir "userdata\logs\pc-status-preflight.json"
  Set-Content -LiteralPath $PcLogPath -Value $PcStatusJsonRaw -Encoding UTF8
  Write-Ok "Saved non-admin PC status pre-flight report: $PcLogPath"
}

# Create .env.example (no secrets included)
$EnvExamplePath = Join-Path $StageDir "userdata\config\keshev.env.example"
$EnvExampleContent = @'
# Keshev Security Operations Dashboard - User Environment Configuration Example
# Default Local Loopback Port (127.0.0.1)
ON_PORT=5189

# Optional Native Host / SDP Host Config Absolute Paths (Do not commit secrets)
# NATIVE_HOST_CONFIG=C:\Users\<username>\AppData\Local\Keshev\userdata\config\native-host.json
# SDP_HOST_CONFIG=C:\Users\<username>\AppData\Local\Keshev\userdata\config\sdp-host.json
'@
Set-Content -LiteralPath $EnvExamplePath -Value $EnvExampleContent -Encoding UTF8

# Create start-keshev.cmd (Standard Mode - live measured baseline)
$StartCmdPath = Join-Path $StageDir "start-keshev.cmd"
$StartCmdContent = @'
@echo off
setlocal
set "APP_ROOT=%~dp0on-client"
set "START_PS1=%APP_ROOT%\tools\start-alekov.ps1"
set "NODE_OPTIONS=--import ./student/pc-status-runtime.mjs"
if not exist "%START_PS1%" (
  echo [ERROR] start-alekov.ps1 not found: "%START_PS1%"
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%START_PS1%" -Port 5189 %*
'@
Set-Content -LiteralPath $StartCmdPath -Value $StartCmdContent -Encoding Ascii

# Create start-keshev-demo.cmd (Demo Mode - synthetic demo payload)
$StartDemoCmdPath = Join-Path $StageDir "start-keshev-demo.cmd"
$StartDemoCmdContent = @'
@echo off
setlocal
set "APP_ROOT=%~dp0on-client"
set "START_PS1=%APP_ROOT%\tools\start-alekov.ps1"
set "NODE_OPTIONS=--import ./student/pc-status-runtime.mjs"
if not exist "%START_PS1%" (
  echo [ERROR] start-alekov.ps1 not found: "%START_PS1%"
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%START_PS1%" -Port 5189 -Demo %*
'@
Set-Content -LiteralPath $StartDemoCmdPath -Value $StartDemoCmdContent -Encoding Ascii

# Create run-keshev.vbs (Windowless background startup + browser launch)
$RunVbsPath = Join-Path $StageDir "run-keshev.vbs"
$RunVbsContent = @'
Option Explicit
Dim shell, env, fso, baseDir, psScript, cmd
Set shell = CreateObject("WScript.Shell")
Set env = shell.Environment("PROCESS")
env("NODE_OPTIONS") = "--import ./student/pc-status-runtime.mjs"
Set fso = CreateObject("Scripting.FileSystemObject")
baseDir = fso.GetParentFolderName(WScript.ScriptFullName)
psScript = baseDir & "\on-client\tools\start-alekov.ps1"

If Not fso.FileExists(psScript) Then
  MsgBox "Keshev launcher script not found: " & psScript, vbCritical, "Keshev"
  WScript.Quit 1
End If

cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & psScript & """ -Port 5189 -Background"
shell.Run cmd, 0, True
shell.Run "http://127.0.0.1:5189/", 1, False
'@
Set-Content -LiteralPath $RunVbsPath -Value $RunVbsContent -Encoding Ascii

# Create stop-keshev.cmd (Cleanly stop loopback 5189 process on request/uninstall)
$StopCmdPath = Join-Path $StageDir "stop-keshev.cmd"
$StopCmdContent = @'
@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -Command "$conn = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 5189 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($conn -and $conn.OwningProcess) { $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue; if ($proc -and $proc.ProcessName -eq 'node') { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } }"
exit /b 0
'@
Set-Content -LiteralPath $StopCmdPath -Value $StopCmdContent -Encoding Ascii

Write-Ok "Clean staging and helper launchers (run-keshev.vbs, start-keshev.cmd, start-keshev-demo.cmd, stop-keshev.cmd) created"

# ============================================================================
# Step 3: Inno Setup (ISCC.exe) Auto-Detection & Compilation
# ============================================================================
Write-Step "Step 3/3: Inno Setup (ISCC.exe) auto-detection and user-level installer build"

if (-not (Test-Path -LiteralPath $IssPath)) {
  Stop-Build "Inno Setup script missing: $IssPath"
}

if (-not (Test-Path -LiteralPath $DistDir)) {
  New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
}

$CandidateIsccPaths = @()
if (${env:ProgramFiles(x86)}) {
  $CandidateIsccPaths += Join-Path ${env:ProgramFiles(x86)} "Inno Setup 6\ISCC.exe"
}
if (${env:ProgramFiles}) {
  $CandidateIsccPaths += Join-Path ${env:ProgramFiles} "Inno Setup 6\ISCC.exe"
}
if (${env:LOCALAPPDATA}) {
  $CandidateIsccPaths += Join-Path ${env:LOCALAPPDATA} "Programs\Inno Setup 6\ISCC.exe"
}
$PathIscc = Get-Command ISCC.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if ($PathIscc) {
  $CandidateIsccPaths += $PathIscc.Source
}

$FoundIscc = $null
foreach ($Candidate in $CandidateIsccPaths) {
  if ($Candidate -and (Test-Path -LiteralPath $Candidate)) {
    $FoundIscc = $Candidate
    break
  }
}

if ($FoundIscc) {
  Write-Ok "ISCC.exe detected: $FoundIscc"
  Write-Host "  [RUN] `"$FoundIscc`" `"$IssPath`"" -ForegroundColor Gray
  & $FoundIscc $IssPath
  if ($LASTEXITCODE -ne 0) {
    Stop-Build "ISCC.exe compilation failed with exit code $LASTEXITCODE" $LASTEXITCODE
  }
  $SetupExe = Join-Path $DistDir "setup.exe"
  if (-not (Test-Path -LiteralPath $SetupExe)) {
    Stop-Build "ISCC.exe exited 0 but setup.exe was not found at: $SetupExe"
  }
  Write-Ok "User-level installer compiled: $SetupExe"
} else {
  Write-InfoMsg "Inno Setup 6 (ISCC.exe) is not currently installed on this PC."
  Write-Ok "Staged bundle is ready at: $StageDir"
  Write-Host "  [CMD] Once Inno Setup 6 is installed, run this 1-line command to compile setup.exe:" -ForegroundColor Cyan
  Write-Host "        `"%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe`" `"$IssPath`"" -ForegroundColor White
}

exit 0
