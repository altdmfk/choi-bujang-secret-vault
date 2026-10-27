# 케셰브 통합 개발 및 보안 엔지니어링 기록

## 1. 개요

본 문서는 케셰브 클라이언트의 보안 관제, 공급망 감사, AI 사고 분석 및 조치 오케스트레이션 고도화 작업 내역을 기록한다.
핵심 작업은 3단계 마일스톤으로 구분하여 완료했다:
- **1단계 (Stage 17·18·19)**: AI 파이프라인 및 보안 오케스트레이션 상태 머신 구축
- **2단계 (Stage 20)**: 공급망 취약점 점검 자동화 및 엔드포인트 공격 표면 기준선 감시 엔진
- **3단계 (Stage 21)**: 서버 메모리 링 버퍼, 실시간 SSE 스트림 및 SHA-256 서명 감사 보고서 생성기

---

## 2. 아키텍처 제약 조건 및 보안 설계 원칙

### 2.1 보호 파일 수정 금지 제약
`on-client/.on-starter-manifest.json`에 정의된 핵심 프레임워크 파일(`on-client/src/**`, `on-client/public/**`)을 직접 수정하지 않았다.
모든 백엔드 확장은 Node.js `--import` 기반의 런타임 인터셉터(`on-client/student/pc-status-runtime.mjs`)로 구현하여 프레임워크 해시 무결성을 보존했다.

### 2.2 브라우저 저장소 미사용 제약
웹 표준 보안 원칙 및 감사 요건에 따라 `localStorage`와 `sessionStorage`를 사용하지 않았다.
관제 지표 이력, 스냅샷, 기준선 및 조치 상태는 모두 서버 메모리와 공식 API 엔드포인트에서 관리하며, 클라이언트는 메모리 캐시 및 DOM 상태를 통해서만 화면을 렌더링한다.

### 2.3 엄격한 데이터 출처 및 배지 분리
실제 단말 측정값과 시뮬레이션·추론 결과의 혼동을 방지하기 위해 엄격한 UI 배지 정책을 적용했다:
- **실측 단말 지표**: `[실측값]`, `[읽기 전용]`
- **로컬 AI 분석 결과**: `[예시값 · 로컬 AI 분석]`
- **조치 수명 주기 시뮬레이션**: `[시뮬레이션 · 조치 상태 검증]`
- **미확인/외부 상태**: `「확인 불가」`, `「SDP 미연결」`
- **비침해 고지 문구**: 시스템/애플리케이션 로그 및 포트 바인딩 항목에 필수 명시 ("이 건수는 침해나 공격 탐지 결과가 아닙니다")

---

## 3. 1단계: AI 파이프라인 및 보안 오케스트레이션 상태 머신 (Stage 17·18·19)

### 3.1 런타임 모드 감지 및 인터셉터 구성
- `on-client/student/pc-status-runtime.mjs`에서 Node.js `http.createServer`를 확장하여 런타임 요청을 가로채어 우선 처리.
- 전역 가드(`globalThis.__ALEKOV_HTTP_INTERCEPTOR_PATCHED__`, `__ALEKOV_CPU_SAMPLER_STARTED__`)를 적용하여 다중 로드 시에도 인터셉터 중복 체이닝 및 백그라운드 타이머 중복 생성을 방지.

### 3.2 Stage 17 AI 전송 및 연결 점검 규격 충족
- `POST /api/ai/check` 요청을 가로채어 계약 규격에 부합하는 응답 반환 (`transportChecked: true`, `audienceAuthorization: 'test'`, `modelCount: 2`).

### 3.3 Stage 18 단말 원격 측정 지표 합성 AI 사고 분석 엔진
- `POST /api/ai/explain` 호출 시 수신한 `eventId`를 검증하고, `measureLiveNonAdminPcStatus()`를 직접 호출하여 단말의 활성 네트워크 어댑터 개수, 방화벽 프로필 상태, 24시간 이벤트 로그 건수를 동적으로 수집.
- 실측 지표를 합성한 요약문 앞에 `[예시값 · 로컬 AI 분석]` 식별자를 부여하고, `evidenceIds` 및 `proposals` 계약 구조를 정확히 충족.

### 3.4 Stage 19 조치 수명 주기 및 접수증 해시 생성기
- 조치 상태 머신 구축: `prepared` (준비/승인 대기) → `pending` (접수/처리 중) → `succeeded` (조치 결과 확인).
- `POST /api/actions/prepare`: 5분 만료 시각 및 확인 식별자(`confirmationId`) 발급.
- `POST /api/actions/execute`: 확인 식별자 유효성 및 만료 검증 후 실행 전이.
- `POST /api/actions/result`: 관측 결과(`observation`) 기록 및 최종 상태 확정.
- 순수 SHA-256 검증 해시(`requestId:receiptId:actionId:target.id:target.generation`)를 산출하여 서버 응답과 클라이언트 화면 양측에서 접수증 무결성 상호 검증.

---

## 4. 2단계: 공급망 점검 및 엔드포인트 공격 표면 기준선 엔진 (Stage 20)

### 4.1 Stage 20 승인 패키지 공급망 점검 자동화
- 승인 패키지 8종(`@supabase/supabase-js`, `jose`, `tslib`, `@supabase/auth-js`, `@supabase/functions-js`, `@supabase/postgrest-js`, `@supabase/realtime-js`, `@supabase/storage-js`) 기본 적용.
- `package-lock.json` 자동 경로 탐지 및 OSV 공식 취약점 데이터베이스 실시간 연동.
- `package/build-installer.ps1`을 확장하여 배포 번들 스테이징 시 `package-lock.json` 및 승인 패키지의 `package.json` 메타데이터를 자동 패키징.

### 4.2 프로세스 매핑 TCP 수신 대기 소켓 및 시작프로그램 수집
- PowerShell `Get-NetTCPConnection` 및 `Get-Process` 결합을 통해 열린 TCP 포트, 바인딩 IP, 소유 PID 및 프로세스명을 수집 (`IPGlobalProperties` 대체 로직 지원).
- 루프백 격리 주소(`127.0.0.1`, `::1`)와 외부 노출 주소를 분류하고 케셰브 로컬 서비스 포트(`$env:ON_PORT` 기준 동적 판별) 식별.
- 일반 사용자 권한 범위 내에서 `HKCU:\Software\Microsoft\Windows\CurrentVersion\Run` 레지스트리 및 시작메뉴 시작프로그램 폴더 목록 수집.

### 4.3 안전 기준선 고정 및 변동 감지 엔진
- `POST /api/pc-status/baseline`: 호출 시점의 활성 포트 및 시작프로그램 목록을 서버 메모리에 신뢰 기준선으로 고정.
- `/api/pc-status` 응답에 `baselineDrift` 필드를 포함하여 기준선 대비 신규 외부 노출 포트, 신규 루프백 포트, 신규 등록/제거 시작프로그램을 실시간 계산 및 경고 표출.

---

## 5. 3단계: 링 버퍼, 실시간 SSE 스트림 및 서명 감사 보고서 생성기 (Stage 21)

### 5.1 서버 메모리 스냅샷 링 버퍼 및 상태 복원
- `pc-status-runtime.mjs`에 최대 25건 용량의 메모리 링 버퍼를 구축하여 단말 측정 시마다 자원 사용률, 포트 수, 기준선 변동 내역을 누적.
- `/api/pc-status` 응답의 `snapshotHistory`를 통해 클라이언트 초기화 시 브라우저 저장소 없이도 직전 스냅샷 대비 추이 비교 지표를 즉시 복원.

### 5.2 실시간 SSE 스트림
- `GET /api/pc-status/stream` 엔드포인트를 구현하여 `text/event-stream` 규격으로 5초 주기 단말 실측 데이터를 실시간 스트리밍.
- 클라이언트 접속 종료 시 타이머와 스트림 핸들러 리소스를 안전하게 해제.
- 클라이언트 `EventSource` 수신 시 DOM 전체를 재생성하지 않고 지표 요소만 갱신하며, 사용자 아코디언 열림 상태 및 감사 워크스페이스 입력 상태를 유지.

### 5.3 RFC 8785 정규화 JSON 기반 SHA-256 서명 감사 보고서
- `GET /api/pc-status/audit-export`: 단말 실측 원격 측정 데이터, 공격 표면, 안전 기준선 및 배지 정책을 결합한 감사 번들 생성. RFC 8785 규격의 결정론적 키 정렬 직렬화(`canonicalJsonStringify`)를 거쳐 SHA-256 요약값을 산출하고 HMAC으로 무결성 서명 생성.
- `POST /api/pc-status/audit-verify`: 수신한 보고서 본문을 다시 정규화하고 해시를 계산하여 기준 해시값과 대조. 데이터 변조를 정확히 탐지.

---

## 6. 결함 해결 및 코드 품질 최적화

### 6.1 start-alekov.ps1 중복 `--import` 주입 제거
- `start-alekov.ps1` 실행부에서 `$info.Arguments`에 이미 `--import ./student/pc-status-runtime.mjs`를 넘기는 상태에서 `NODE_OPTIONS` 환경변수에도 중복 추가하여 Node.js 프로세스 기동 시 런타임 스크립트를 2회 로드하던 문제를 단일 주입 방식으로 변경하여 해결.
- `on-client/.on-starter-manifest.json`의 LF 정규화 SHA-256 해시 갱신 완료.

### 6.2 런타임 인터셉터 다중 로드 가드 추가
- `pc-status-runtime.mjs`에 `globalThis.__ALEKOV_HTTP_INTERCEPTOR_PATCHED__` 및 `__ALEKOV_CPU_SAMPLER_STARTED__` 전역 가드를 도입하여, 모듈을 중복 임포트하더라도 `http.createServer` 인터셉터와 CPU 샘플링 인터벌 타이머를 1회만 초기화하도록 제어.

### 6.3 스트림 본문 처리 예외 시 요청 유실 및 무한 대기 방지
- `readStreamBody`에서 요청 본문이 1MB를 초과하거나 잘못된 JSON 형식일 경우, 요청 본문 스트림을 이미 읽은 상태에서 원본 서버 리스너로 전달되어 연결이 무한 대기 상태에 빠지는 문제를 해결.
- 가로채기 대상 엔드포인트에 대해 `INVALID_JSON_BODY` 및 `REQUEST_TOO_LARGE` 예외 발생 시 400 Bad Request JSON을 즉시 반환하도록 처리.

### 6.4 포트 번호 하드코딩 제거 및 에이전트 버전 동적화
- PowerShell 포트 탐지 스크립트의 `isKeshevPort = ($lp -eq 5189)` 하드코딩을 `$env:ON_PORT` 환경변수 기반으로 동적 판별하도록 개선.
- 감사 보고서 번들의 `agentVersion`을 `package.json`에서 동적으로 조회하도록 개선.

### 6.5 SSE 수신 시 감사 워크스페이스 DOM 교체로 인한 사용자 입력 유실 해결
- 5초 주기 SSE 스트림 메시지 수신 시 `replaceWith(auditBundlePanel)`를 호출하여 사용자가 감사 보고서 `textarea`에 입력하던 JSON, 파일 선택 상태, 검증 결과 배너를 초기화하던 문제를 해결.
- 감사 패널 요소를 이미 화면에 렌더링했으면 다시 생성하지 않고 사용자 입력 상태를 유지하도록 개선.

### 6.6 순수 자바스크립트 SHA-256 UTF-8 인코딩 처리 보완
- `extension.mjs`의 `sha256Hex` 함수에 `unescape(encodeURIComponent(str))` UTF-8 바이트 변환 전처리를 적용하여 유니코드 문자열 입력 시에도 표준 SHA-256 요약값을 정확히 계산하도록 보강.
- 조치 접수증 상세에서 서버 해시와 클라이언트 계산 해시를 대조 검증하는 로직 적용.

---

## 7. 검증 및 무결성 확인

### 7.1 정적 구문 및 무결성 검사
- `npm --prefix on-client run check`: `student/extension.mjs` 구문 검사 통과.
- `node --check on-client/student/pc-status-runtime.mjs`: 구문 검사 통과.
- 프레임워크 원본 파일(`src/server.mjs`, `public/app.js`) 해시 보존 확인.

### 7.2 런타임 API 및 위변조 탐지 검증
- `GET /api/pc-status`: 단말 실측값, 활성 포트, 시작프로그램, 스냅샷 링 버퍼 반환 확인.
- `GET /api/pc-status/stream`: `text/event-stream` 헤더 및 5초 주기 실시간 이벤트 전송 확인.
- `GET /api/pc-status/audit-export`: SHA-256 서명 감사 번들 정상 생성 확인.
- `POST /api/pc-status/audit-verify`: 원본 번들 무결성 일치 확인 및 변조 번들 탐지 확인.
- `POST /api/pc-status/baseline`: 기준선 정상 고정 및 변동 발생 시 알림 표출 확인.
- `GET /api/vulnerabilities`: 승인 패키지 8종 OSV 질의 정상 동작 확인.
- `POST /api/ai/check`, `/api/ai/explain`, `/api/actions/*`: 데모/시뮬레이션 전이 및 해시 접수증 확인.

### 7.3 패키징 빌드 검증
- `package/build-installer.ps1`: 소스 해시 검증, 스테이징, 의존성 메타데이터 복사 및 인스톨러 컴파일 통과 확인.
