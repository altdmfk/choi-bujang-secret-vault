; ============================================================================
; Keshev (케셰브) ZTNA & XDR Security Operations Dashboard — Inno Setup Script
; Target: Windows User-Level Installer (Non-Admin, {localappdata}\Keshev)
; Version: 0.2.11 (Release Candidate / Pre-flight Verified)
; ============================================================================

#define MyAppName "Keshev Security Operations Agent"
#define MyAppDisplayName "케셰브 (Keshev) ZTNA & XDR 보안 관제 에이전트"
#define MyAppVersion "0.2.11"
#define MyAppPublisher "Keshev Security Engineering"
#define MyAppURL "http://127.0.0.1:5189/"
#define MyAppExeWrapper "run-keshev.vbs"

[Setup]
AppId={{8E74A2B1-5C90-4D3E-9F1A-22114E6C5189}
AppName={#MyAppDisplayName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppDisplayName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
; Non-admin user-level installation in %LOCALAPPDATA%\Keshev
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
DefaultDirName={localappdata}\Keshev
DefaultGroupName=Keshev
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=setup
Compression=lzma2/normal
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayName={#MyAppDisplayName}

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Dirs]
; Separate writable user data/logs/config directories preserved across upgrades
Name: "{app}\userdata"; Flags: uninsneveruninstall
Name: "{app}\userdata\logs"; Flags: uninsneveruninstall
Name: "{app}\userdata\config"; Flags: uninsneveruninstall

[Files]
; Core on-client runtime files (excluding temporary logs, secrets, or node_modules clutter)
Source: "stage\on-client\*"; DestDir: "{app}\on-client"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules\*,*.log,.env,.env.local"
Source: "stage\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "stage\package-lock.json"; DestDir: "{app}"; Flags: ignoreversion
; Windowless & CLI helper launchers
Source: "stage\run-keshev.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "stage\start-keshev.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "stage\start-keshev-demo.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "stage\stop-keshev.cmd"; DestDir: "{app}"; Flags: ignoreversion
; User-writable configuration template (never overwritten on upgrade)
Source: "stage\userdata\config\keshev.env.example"; DestDir: "{app}\userdata\config"; Flags: onlyifdoesntexist uninsneveruninstall

[Icons]
; Start Menu Shortcuts
Name: "{group}\케셰브 (Keshev) SOC 대시보드 실행"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\{#MyAppExeWrapper}"""; WorkingDir: "{app}"; Comment: "케셰브 로컬 보안 서버(127.0.0.1:5189)를 백그라운드로 시작하고 대시보드를 엽니다."
Name: "{group}\케셰브 (Keshev) 데모 모드 실행 ([예시값] 점검)"; Filename: "{app}\start-keshev-demo.cmd"; WorkingDir: "{app}"; Comment: "케셰브를 데모 합성 데이터(--demo) 모드로 실행합니다."
Name: "{group}\케셰브 (Keshev) 서버 종료"; Filename: "{app}\stop-keshev.cmd"; WorkingDir: "{app}"; Comment: "실행 중인 케셰브 로컬 루프백 서버를 안전하게 종료합니다."
Name: "{group}\케셰브 (Keshev) 제거 (Uninstall)"; Filename: "{uninstallexe}"
; Desktop Shortcut
Name: "{autodesktop}\케셰브 (Keshev) SOC 대시보드"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\{#MyAppExeWrapper}"""; WorkingDir: "{app}"; Tasks: desktopicon; Comment: "케셰브 ZTNA & XDR 보안 관제 대시보드 실행 (http://127.0.0.1:5189/)"

[Run]
Filename: "{sys}\wscript.exe"; Parameters: """{app}\{#MyAppExeWrapper}"""; WorkingDir: "{app}"; Description: "케셰브(Keshev) 보안 관제 서버 시작 및 브라우저 열기 (http://127.0.0.1:5189/)"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{app}\stop-keshev.cmd"; WorkingDir: "{app}"; Flags: runhidden; RunOnceId: "StopKeshevServer"
