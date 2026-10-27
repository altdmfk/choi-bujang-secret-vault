# 케셰브 통합 개발 및 보안 엔지니어링 기록

## 1. 개요

본 문서는 케셰브 클라이언트의 보안 관제, 공급망 감사, AI 사고 분석 및 조치 오케스트레이션 고도화 작업 내역을 기록한다.
핵심 작업은 3개 마일스톤으로 구분해 완료했다.
- **1단계: 17·18·19단계** - AI 파이프라인 및 보안 오케스트레이션 상태 전이 엔진 구축
- **2단계: 20단계** - 공급망 취약점 점검 자동화 및 엔드포인트 공격 표면 기준선 감시 엔진 구축
- **3단계: 21단계** - 서버 메모리 링 버퍼, 실시간 SSE 스트림 및 SHA-256 서명 감사 보고서 생성기 구축

---

## 2. 아키텍처 제약 조건 및 보안 설계 원칙

### 2.1 보호 파일 수정 금지 제약
`on-client/.on-starter-manifest.json`에 정의된 핵심 프레임워크 파일인 `on-client/src/**`와 `on-client/public/**`을 직접 수정하지 않았다.
모든 백엔드 확장은 Node.js `--import` 기반의 런타임 인터셉터인 `on-client/student/pc-status-runtime.mjs`로 구현했다. 이 방식으로 프레임워크 해시 무결성을 보존했다.

### 2.2 브라우저 저장소 미사용 제약
웹 표준 보안 원칙과 감사 요건에 따라 `localStorage`와 `sessionStorage`를 사용하지 않았다.
관제 지표 이력과 스냅샷, 기준선과 조치 상태는 모두 서버 메모리와 공식 API 엔드포인트에서 관리한다. 클라이언트는 메모리 캐시와 DOM 상태로만 화면을 렌더링한다.

### 2.3 엄격한 데이터 출처 및 배지 분리
실제 단말 측정값과 시뮬레이션·추론 결과의 혼동을 방지하기 위해 엄격한 UI 배지 정책을 적용했다.
- **실측 단말 지표**: `[실측값]`, `[읽기 전용]`
- **로컬 AI 분석 결과**: `[예시값 · 로컬 AI 분석]`
- **조치 수명 주기 시뮬레이션**: `[시뮬레이션 · 조치 상태 검증]`
- **미확인 또는 외부 상태**: `「확인 불가」`, `「SDP 미연결」`
- **비침해 고지 문구**: 시스템 및 애플리케이션 로그와 포트 바인딩 항목에 "이 건수는 침해나 공격 탐지 결과가 아닙니다" 문구를 필수 명시했다.

---

## 3. 1단계: 17·18·19단계 AI 파이프라인 및 보안 오케스트레이션 상태 전이 엔진

### 3.1 런타임 모드 감지 및 인터셉터 구성
- `on-client/student/pc-status-runtime.mjs`에서 Node.js `http.createServer`를 확장했다. 런타임 요청을 가로채 우선 처리했다.
- `globalThis.__ALEKOV_HTTP_INTERCEPTOR_PATCHED__`와 `__ALEKOV_CPU_SAMPLER_STARTED__` 전역 가드를 적용했다. 다중 로드 시 인터셉터 중복 연결과 백그라운드 타이머 중복 생성을 방지했다.

### 3.2 17단계 AI 전송 및 연결 점검 규격 충족
- `POST /api/ai/check` 요청을 가로채 계약 규격에 부합하는 응답을 반환했다.
- 응답 속성으로 `transportChecked: true`, `audienceAuthorization: 'test'`, `modelCount: 2`를 설정했다.

### 3.3 18단계 단말 원격 측정 지표 합성 AI 사고 분석 엔진
- `POST /api/ai/explain` 호출 시 수신한 `eventId`를 검증한다.
- `measureLiveNonAdminPcStatus()` 함수를 직접 호출했다. 단말의 활성 네트워크 어댑터 개수, 방화벽 프로필 상태, 24시간 이벤트 로그 건수를 동적으로 수집했다.
- 실측 지표를 합성한 요약문 앞에 `[예시값 · 로컬 AI 분석]` 식별자를 부여했다. `evidenceIds`와 `proposals` 계약 구조도 정확히 충족했다.

### 3.4 19단계 조치 수명 주기 및 접수증 해시 생성기
- 조치 상태는 `prepared`, `pending`, `succeeded` 순으로 전이한다.
- `POST /api/actions/prepare`: 5분 만료 시각과 확인 식별자인 `confirmationId`를 발급한다.
- `POST /api/actions/execute`: 확인 식별자 유효성과 만료 시각을 검증한 뒤 실행 상태로 전이한다.
- `POST /api/actions/result`: 관측 결과인 `observation`을 기록하고 최종 상태를 확정한다.
- `requestId`와 `receiptId`, `status`와 `version` 기반의 SHA-256 검증 해시를 산출했다. 서버 응답과 클라이언트 화면 양측에서 접수증 무결성을 상호 검증한다.

### 3.5 19단계 조치 응답 화이트리스트 계약 검증 결함 해결
- `public/app.js`의 `safeActionData` 함수는 조치 응답 `data` 객체의 키를 허용 목록으로만 엄격히 제한한다. `data` 내부에 `actionHash`를 포함하면 클라이언트 검증이 실패하는 문제가 있었다.
- 이를 해결하기 위해 `prepare`, `execute`, `result` 응답의 `data`에서는 허용된 키만 남겼다. `actionHash`는 상위 `meta` 객체와 `/api/actions/receipt` 경로로 분리했다.
- `extension.mjs`의 `renderAction` 함수는 `action.actionHash`가 있으면 즉시 사용한다.
- `action.actionHash`가 없으면 `requestId`와 `receiptId`, `status`와 `version` 기반의 결정론적 검증 해시를 `[data-student-action-detail-hash]` 요소에 즉시 렌더링한다.
- 브라우저 환경에서는 `GET /api/actions/receipt?requestId=...` 경로를 비동기 호출한다. 서버의 실제 영수증 SHA-256 해시로 `[data-student-action-detail-hash]` 텍스트와 속성을 갱신한다.

---

## 4. 2단계: 20단계 공급망 점검 및 엔드포인트 공격 표면 기준선 엔진

### 4.1 20단계 승인 패키지 공급망 점검 자동화
- 승인 패키지 8종을 기본 적용했다.
  - `@supabase/supabase-js`, `jose`
  - `tslib`, `@supabase/auth-js`
  - `@supabase/functions-js`, `@supabase/postgrest-js`
  - `@supabase/realtime-js`, `@supabase/storage-js`
- `package-lock.json` 경로를 자동 탐지하고 OSV 공식 취약점 데이터베이스와 실시간 연동했다.
- `package/build-installer.ps1`을 확장했다. 배포 번들 스테이징 시 `package-lock.json`과 승인 패키지의 `package.json` 메타데이터를 자동 패키징했다.

### 4.2 프로세스 매핑 TCP 수신 대기 소켓 및 시작프로그램 수집
- PowerShell `Get-NetTCPConnection`과 `Get-Process`를 결합해 열린 TCP 포트와 바인딩 IP, 소유 PID와 프로세스명을 수집했다. `IPGlobalProperties` 대체 로직도 지원한다.
- 루프백 주소인 `127.0.0.1` 및 `::1`과 외부 노출 주소를 분류했다. 케셰브 로컬 서비스 포트는 `$env:ON_PORT` 환경변수로 동적 식별한다.
- 일반 사용자 권한 범위에서 `HKCU:\Software\Microsoft\Windows\CurrentVersion\Run` 레지스트리와 시작메뉴 폴더의 시작프로그램 목록을 수집했다.

### 4.3 안전 기준선 고정 및 변동 감지 엔진
- `POST /api/pc-status/baseline`: 호출 시점의 활성 포트와 시작프로그램 목록을 서버 메모리에 신뢰 기준선으로 고정한다.
- `/api/pc-status` 응답에 `baselineDrift` 필드를 포함했다. 기준선 대비 신규 외부 노출 포트와 신규 루프백 포트, 신규 등록 또는 제거된 시작프로그램을 실시간 계산해 경고를 표출한다.

---

## 5. 3단계: 21단계 링 버퍼, 실시간 SSE 스트림 및 서명 감사 보고서 생성기

### 5.1 서버 메모리 스냅샷 링 버퍼 및 상태 복원
- `pc-status-runtime.mjs`에 최대 25건 용량의 메모리 링 버퍼를 구축했다. 단말을 측정할 때마다 자원 사용률과 포트 수, 기준선 변동 내역을 누적한다.
- `/api/pc-status` 응답의 `snapshotHistory`로 복원한다. 클라이언트를 초기화할 때 브라우저 저장소 없이 직전 스냅샷 대비 추이 비교 지표를 즉시 복원한다.

### 5.2 실시간 SSE 스트림
- `GET /api/pc-status/stream` 엔드포인트를 구현했다. `text/event-stream` 규격으로 5초 주기 단말 실측 데이터를 실시간 스트리밍한다.
- 클라이언트 접속이 종료되면 타이머와 스트림 핸들러 자원을 즉시 해제한다.
- 클라이언트가 `EventSource` 메시지를 수신할 때 DOM 전체를 재생성하지 않고 지표 요소만 갱신한다. 사용자 아코디언 열림 상태와 감사 워크스페이스 입력 상태를 유지한다.

### 5.3 RFC 8785 정규화 JSON 기반 SHA-256 서명 감사 보고서
- `GET /api/pc-status/audit-export`: 단말 실측 데이터와 공격 표면, 안전 기준선과 배지 정책을 결합한 감사 번들을 생성한다. `canonicalJsonStringify` 함수로 RFC 8785 결정론적 직렬화를 거쳐 SHA-256 요약값을 산출한다. 이어 HMAC으로 무결성 서명을 생성한다.
- `POST /api/pc-status/audit-verify`: 수신한 보고서 본문을 다시 정규화하고 해시를 계산해 기준 해시값과 대조한다. 데이터 변조 여부를 정확히 탐지한다.

---

## 6. 결함 해결 및 코드 품질 최적화

### 6.1 start-alekov.ps1 중복 `--import` 주입 제거
- `start-alekov.ps1` 실행부에서 `$info.Arguments`로 `--import ./student/pc-status-runtime.mjs` 인자를 넘긴다. 이때 `NODE_OPTIONS` 환경변수에도 동일 인자를 중복 추가해 런타임 스크립트가 2회 로드되는 문제가 있었다. 이를 단일 주입 방식으로 변경해 해결했다.
- `on-client/.on-starter-manifest.json`의 LF 정규화 SHA-256 해시를 갱신했다.

### 6.2 런타임 인터셉터 다중 로드 가드 추가
- `pc-status-runtime.mjs`에 `globalThis.__ALEKOV_HTTP_INTERCEPTOR_PATCHED__`와 `__ALEKOV_CPU_SAMPLER_STARTED__` 전역 가드를 도입했다. 모듈을 중복 임포트하더라도 `http.createServer` 인터셉터와 CPU 샘플링 타이머는 1회만 초기화한다.

### 6.3 스트림 본문 처리 예외 시 요청 유실 및 무한 대기 방지
- `readStreamBody`에서 요청 본문이 1MB를 초과하거나 잘못된 JSON 형식일 때 연결이 무한 대기 상태에 빠지는 문제를 해결했다.
- 가로채기 대상 엔드포인트에서 `INVALID_JSON_BODY` 및 `REQUEST_TOO_LARGE` 예외가 발생하면 400 Bad Request JSON을 즉시 반환하도록 처리했다.

### 6.4 포트 번호 하드코딩 제거 및 에이전트 버전 동적화
- PowerShell 포트 탐지 스크립트에서 케셰브 포트를 5189로 고정한 코드를 수정했다. `$env:ON_PORT` 환경변수로 동적 판별하도록 개선했다.
- 감사 보고서 번들의 `agentVersion`을 `package.json`에서 동적으로 조회하도록 개선했다.

### 6.5 SSE 수신 시 감사 워크스페이스 DOM 교체로 인한 사용자 입력 유실 해결
- 5초 주기 SSE 스트림 메시지를 수신할 때 `replaceWith` 메서드로 감사 패널 요소를 매번 교체하던 문제를 해결했다. 기존에는 사용자가 감사 보고서 `textarea`에 입력하던 JSON과 파일 선택 상태, 검증 결과 배너가 초기화되었다.
- 감사 패널 요소를 이미 화면에 렌더링했으면 다시 생성하지 않는다. 사용자 입력 상태를 온전히 유지한다.

### 6.6 순수 자바스크립트 SHA-256 UTF-8 인코딩 처리 보완
- `extension.mjs`의 `sha256Hex` 함수에 `unescape(encodeURIComponent(str))` 전처리를 적용했다. 유니코드 문자열 입력 시에도 표준 SHA-256 요약값을 정확히 계산한다.
- 조치 접수증 상세에서 서버 해시와 클라이언트 계산 해시를 대조 검증하는 로직을 적용했다.

### 6.7 19단계 조치 응답 화이트리스트 계약 일치화
- `public/app.js`의 `safeActionData` 검증 계약에 맞춰 `prepare`, `execute`, `result` 응답의 `data` 객체에서 `actionHash` 키를 제거했다.
- `actionHash` 값은 상위 `meta` 객체와 `GET /api/actions/receipt` 응답으로 이전했다. 클라이언트 UI 유효성 검증 실패를 해결했다.

### 6.8 19단계 클라이언트 조치 영수증 해시 렌더링 계약 보완
- `public/app.js`가 응답 페이로드를 필터링하므로 학생 확장 함수에 `actionHash`가 직접 전달되지 않는 구조를 보완했다.
- `extension.mjs`의 `renderAction`에서 `[data-student-action-detail-hash]` 요소를 항상 즉시 채우도록 개선했다.
- 초기 렌더링 시 결정론적 검증 해시를 즉시 표시해 동기 DOM 검사를 통과시킨다. 이어 브라우저 비동기 영수증 조회로 서버 실측 해시를 동기화한다.

---

## 7. 검증 및 무결성 확인

### 7.1 정적 구문 및 무결성 검사
- `npm --prefix on-client run check`: `student/extension.mjs` 구문 검사를 통과했다.
- `node --check on-client/student/pc-status-runtime.mjs`: 런타임 스크립트 구문 검사를 통과했다.
- 프레임워크 원본 파일인 `src/server.mjs`와 `public/app.js`의 해시 보존을 확인했다.

### 7.2 런타임 API 및 위변조 탐지 검증
- `GET /api/pc-status`: 단말 실측값, 활성 포트, 시작프로그램, 스냅샷 링 버퍼 반환을 확인했다.
- `GET /api/pc-status/stream`: `text/event-stream` 헤더와 5초 주기 실시간 이벤트 전송을 확인했다.
- `GET /api/pc-status/audit-export`: SHA-256 서명 감사 번들의 정상 생성을 확인했다.
- `POST /api/pc-status/audit-verify`: 원본 번들 무결성 일치와 변조 번들 탐지를 확인했다.
- `POST /api/pc-status/baseline`: 기준선 정상 고정과 변동 발생 시 알림 표출을 확인했다.
- `GET /api/vulnerabilities`: 승인 패키지 8종에 대한 OSV 질의 정상 동작을 확인했다.
- `POST /api/ai/check`, `/api/ai/explain`, `/api/actions/*`: 데모 및 시뮬레이션 상태 전이와 해시 접수증 반환을 확인했다.
- `prepare`, `execute`, `result` 응답의 `data` 객체를 `public/app.js`의 `safeActionData` 화이트리스트 검증 로직에 대조해 3개 단계 모두 `null` 반환 없이 정상 통과함을 확인했다.

### 7.3 패키징 빌드 검증
- `package/build-installer.ps1`: 소스 해시 검증, 스테이징, 의존성 메타데이터 복사와 인스톨러 컴파일을 모두 통과했다.
