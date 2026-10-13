# BYTE BACK 방어전 시작 틀 R5

이 저장소는 1단계에서 학생 본인이 GitHub 저장소와 Vercel 배포를 만드는 출발점입니다. 실제 학생 자료, 토큰, 비밀키를 넣지 마세요.

## 학생이 하는 일: 세 걸음

1. GitHub 계정을 만듭니다.
2. 방어전 1단계 카드의 **Deploy** 버튼을 누릅니다. Vercel에 GitHub로 로그인하고, 새 저장소가 **본인 계정의 Public 저장소**인지 확인한 뒤 Deploy를 누릅니다.
3. 배포가 끝나면 화면에 나온 `https://…vercel.app` 주소를 방어전 1단계 카드에 붙여넣고 제출합니다. 저장소 주소나 설정 파일은 적지 않습니다.

배포가 끝나면 `/`에서 점령된 자료실을 볼 수 있습니다. 이 공개 상태를 확인하는 것이 1단계의 출발점입니다. 1단계 접수와 심판 판정은 포털에서 확인합니다.

## 시작 틀의 자동 처리

`vercel.json`은 정적 결과물 `public`을 배포합니다. 빌드 명령 `npm run build`는 Vercel이 제공하는 GitHub 저장소 소유자·이름, 커밋 SHA, 배포 URL을 검증하고 `public/aleph.json`을 생성합니다. 이 값이 없으면 빌드가 실패하므로, 성공한 것처럼 빈 주소를 내보내지 않습니다. `aleph.json`의 내용만으로 저장소 소유권이나 방어 성공을 인정하지 않습니다. 심판이 공개 저장소의 실제 커밋과 배포된 자료를 따로 대조해야 합니다.

`aleph.config.json`의 `repoUrl`과 `publicAppUrl`은 이전 제출 묶음 방식의 자리표시자입니다. 1단계에서는 학생이 편집하지 않습니다. 2단계 이후 코딩 도구가 필요한 설정과 보호 기능을 단계별로 작성합니다. `npm run bundle`과 `bundle-notes.json`도 1단계의 세 걸음에는 포함되지 않습니다.

로컬에서 화면만 확인할 때는 `npm run build -- --local`을 사용합니다. 로컬 실행은 Vercel 배포나 심판 접수를 증명하지 않습니다.

## 8단계 현재 작동하는 기능 및 다시 실행하는 방법

- **작동하는 기능**:
  - (5단계) Supabase Auth를 통한 사용자 로그인(A, B 계정) 및 로그아웃 지원, 본인 소유 메모만 조회/수정/삭제 허용, 원본 자료 저장소 직접 접근 차단(`originalApiUrl`).
  - (6단계) 반 엔진과 연동하여 보호 서비스 ID(`notes`) 및 읽기 경로(`GET /notes/:id`)를 설정 파일(`aleph.config.json`)에 연결하고, ZTNA 판정기(`src/decider.mjs`)에 기기 등록 및 사용자 바인딩 검증 규칙(`device_registered`)을 구현하여 미등록 기기 또는 타인 기기의 접근을 차단(`device_not_registered`).
  - (7단계) 가상 접속 정보 입력 검증(`validateConnectionContext`) 및 복합 이상 접속 검사 규칙(`step_up_required`)을 구현하여 평소와 다른 시각 + 낯선 네트워크 + 대량 읽기가 복합 발생한 가상 사건에 대해 단순 영구 차단 대신 추가 확인(`step_up`)을 요청하고, 재인증 통과 시(`stepUp.verified === true`) 정상 허용.
  - (8단계) 내 자료실 메모(`note:<id>`)와 강사 공지(`notice:<id>`)를 서로 다른 자원 ID로 분리 표시하고, 판정기(`src/decider.mjs`)에 구역 규칙(`zone_rule`)을 추가하여 자기 메모 읽기·수정은 허용하고 타인 메모 접근·강사 공지 수정·알 수 없는 경로·쿼리 선택·`:id` 깊이의 `export` 등 기능 경로를 거부(`zone_violation`). 또한 자료 API(`api/notes.js`, `api/notices.js`)에서도 검증된 사용자와 저장된 소유자·강사 권한을 대조하여 본문·헤더의 `role`이나 `owner_id` 위조 및 교차 구역 조회를 `403`과 짧은 거부 사유로 차단.
  - (보너스 XDR-01 ~ XDR-06) 무차별 로그인 대입(`brute-force`), 웹 주입(`web-injection`), 알려진 취약점 악용(`known-cve`), 지속성 프로그램(`persistence`), 권한 가로채기(`privilege`), 자료 빼돌리기(`exfiltration`) 공격 패턴 탐지 및 ZTNA 판정기 차단 연동 보존.
- **다시 실행하는 방법**:
  - 로컬 환경: `.env.local`에 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`를 작성한 뒤 `npx vercel dev`로 실행합니다.
  - 가상 사건 연습: `node scripts/fixture-7.mjs` 명령으로 정상 사건(`allow`)과 복합 이상 사건(`step_up`) 판정을 비교합니다.
  - 판정기 종합 연습: `node scripts/decider-test.mjs` 명령으로 6~8단계 규칙(`device_registered`, `step_up_required`, `zone_rule`) 통과를 확인합니다.
  - 배포 환경: GitHub 푸시 시 Vercel에서 자동 배포되며 `https://choi-bujang-secret-vault-neon.vercel.app`에서 확인할 수 있습니다.
  - XDR 실행: `npm run xdr:run -- exfiltration` 명령으로 경보 판정(`xdr/exfiltration/result.json`) 및 `node xdr/exfiltration/respond.mjs`로 ZTNA 차단 연동 확인.

## 9단계 현재 작동하는 기능 및 다시 실행하는 방법

- **작동하는 기능**: `src/detect.mjs`의 `detect(events)`가 가상 사건에서 `at`, `method`, `identity.sub`만 읽습니다(메모 내용·토큰·실명은 복사하지 않음). 같은 `sub`의 `GET`이 어느 10분 구간에서든 120건을 넘으면 `{ action: 'propose_revocation', reasonCode: 'burst_read', subject }`를, 그 밖에는 `{ action: 'observe' }`를 돌려줍니다. 접속 허용/거부 판정기(`src/decider.mjs`)의 응답은 바꾸지 않았습니다.
- **한계**: 네트워크·기기 값은 사건 계약에 없어 이 규칙에 쓰지 않았습니다. 회수 API나 기기 권한 변경은 없고 제안만 돌려줍니다. 운영 반 엔진의 사건 전달·접속 회수 연결과 실제 회수 시간은 심판이 확인합니다.
- **다시 실행하는 방법**: `npm run detect:test` (가상 사건 6건 연습이며 심판 판정이 아닙니다.)

## 10단계 메모 한 건 복원

- **서비스·경로**: 보호 서비스 `notes`의 복원 경로 `POST /api/restore` (`aleph.config.json`의 `restoreRoute`, `api/restore.js`). 본문은 `{ "id": "<메모 ID>", "contentHash": "<sha256 16진수 64자리>" }`이고 로그인 토큰이 필요합니다.
- **미리보기**: 본문에 `"dryRun": true`를 포함하면 실제로 쓰지 않고 복원할 버전(`backupVersion`)과 바뀔 항목(`changed`)을 미리 확인할 수 있습니다(`{ "restored": false, "dryRun": true, "verified": true, "backupVersion": "...", "changed": [...] }`).
- **동작**: 비공개 사본 테이블 `notes_backup`(`id`, `owner_id`, `title`, `content`, `content_hash`)에서 지정한 한 건만 `notes`로 되돌립니다. 사본의 ID·소유자(검증된 로그인 사용자)·내용 해시가 모두 같을 때만 쓰고, 다르면 쓰지 않습니다. 복원 쓰기 후 사후 재검증(`id`, `owner_id`, `title`, `contentHash`)이 실패하면 복원 전 상태로 자동으로 되돌립니다(롤백). 다른 메모와 감사 기록은 건드리지 않습니다. 응답에는 메모 본문을 넣지 않습니다.
- **거부**: 로그인 없음 `401`, 타인 소유 또는 사본 없음 `403`(같은 응답), 해시 불일치·변조된 사본 `409`, 형식 오류 `400`(dryRun 타입 오류 포함).
- **사본 준비(학생이 Supabase 화면의 SQL 편집기에서 직접)**: `notes_backup` 테이블을 만들고 행 수준 보안을 켠 뒤 `anon`·`authenticated` 권한을 모두 회수합니다. 가상 메모 사본은 **공개 저장소에 두지 말고** 시험 계정 B의 가상 메모로만 넣습니다. 해시는 `encode(sha256(convert_to(content,'UTF8')),'hex')`로 계산합니다.
- **시험**: `npm run test:restore` (가상 데이터 9건. 실제 DB·배포·심판 확인이 아닙니다.) 배포한 뒤 계정 B로 `POST /api/restore`를 보내는 실제 확인은 학생이 따로 해야 합니다.

## 10단계 시험 정책 복원

- **명령**: `npm run policy:restore -- <커밋 SHA>` (미리보기) / `npm run policy:restore -- <커밋 SHA> --apply --confirm <SHA 앞 12자리>` (실제 실행).
- **동작**: 안전 정책 버전(과거 커밋)에서 `aleph.config.json`의 시험 정책 항목(`allowedRoutes`, `protectedService`, `originalApiUrl`, `restoreRoute`, `identityProvider`)만 되돌립니다.
- **안전 규칙**:
  1. `--confirm <SHA 앞 12자리>` 없이는 파일 쓰기 없이 버전과 바뀔 항목만 보여 줍니다(미리보기).
  2. 실제로 쓰기 직전에 검증한 사본을 다시 읽어 재검증하며, 사본이 없거나 검증 실패 시 멈춥니다.
  3. 사후 검증(`diffPolicies > 0`)이 실패하면 복원 전 상태로 자동으로 되돌립니다(롤백).
  4. 실제 운영 정책은 건드리지 않으며(`--production` 지정 시 즉시 거부), 그 밖의 설정, `src/decider.mjs`의 `RULE_IDS`, Git 기록, XDR 감사 이력은 절대 건드리지 않고 보존합니다.
- **시험**: `npm run test:policy-restore` (로컬 단위 테스트 6건 통과).

## 11단계 나만의 접속 앱 (설치형 웹앱 및 기기 승인)

- **설치형 웹앱 설정**: PWA 매니페스트(`public/manifest.json`), 앱 아이콘(`public/icon.svg`), 테마 색상 및 실시간 오프라인 상태 감지 경고 배너를 구성했습니다. 별도의 접속 프로그램을 만들거나 설치하지 않습니다.
- **기기 승인 확인 엔드포인트 및 서버리스 서명 검증**: `api/device.js`에서 로그인 토큰을 검증하고, 기기 승인 요청(`POST`) 시 HMAC-SHA256 기반 기기 승인 토큰(`src/device-verifier.mjs`)을 발급합니다. 비인증 요청은 `401`로 거부됩니다.
- **보호 자료실 접근 통제 및 API 레벨 차단**: 자료 API(`api/notes.js`, `api/notices.js`)에서도 기기 승인 토큰을 검증하여, 승인되지 않은 기기의 직접 접근을 `403 DEVICE_NOT_APPROVED`로 차단합니다. 화면에서도 기기 승인 전에는 강사 공지, 메모 목록, 메모 작성기를 완전히 숨깁니다.
- **서버 검증 후 승인 연동**: 클라이언트의 단순 버튼 클릭이나 브라우저 저장소 조작만으로는 권한이 부여되지 않으며, 서버가 발급한 서명 토큰을 통해서만 자료 조회가 허용됩니다. 기기 키나 토큰(로그인 세션 포함)은 브라우저 저장소(Storage)에 일절 저장하지 않고 자바스크립트 메모리 변수로만 관리하며, 화면에도 기기 식별자 텍스트를 노출하지 않습니다.
- **시험**: `node --test test/device.test.mjs` (비인증 차단, 토큰 서명 및 승인 검증 3건 통과), `npm run build -- --local` (로컬 빌드 검증).

## 복구 뒤 1~9단계 다시 확인하는 순서

복구한 뒤 아래 순서대로 실행하고, **결과 칸은 직접 실행한 것만** 고칩니다. 실행하지 않은 항목은 `미실행`으로 둡니다. 토큰·비밀번호는 이 표나 로그에 붙이지 않습니다. 로컬 연습은 가상 요청이며 심판 판정이 아닙니다.

**0. 먼저: 자료와 정책이 돌아왔는지**

| 확인 | 명령·방법 | 정상 | 결과 |
| --- | --- | --- | --- |
| 정책 차이 | `npm run policy:diff -- <복원한 커밋 SHA>` | 변경 범위 0건 | 2026-10-13 로컬 통과 (커밋 91371c4 기준 변경 범위 0건 차이 없음) |
| 정책 복원 시험 | `npm run test:policy-restore` | 6건 통과 | 2026-10-13 로컬 통과 (단위 테스트 6건) |
| 복원 시험 | `npm run test:restore` | 9건 통과 | 2026-10-13 로컬 통과(가상 데이터 9건) |
| 메모 한 건 | 배포 뒤 계정 B가 `POST /api/restore` (`{id, contentHash}`) | `200`, `notes`의 ID·소유자·내용 해시가 사본과 같음 | 2026-10-13 배포 주소: B 맞는 해시 `200`, 틀린 해시 `409`, B가 A 메모 복원 `403`, 복원 뒤 B 조회 `200`(학생 실행 보고). 행 내용 대조는 상태 코드만으로 확인할 수 없어 미실행 |

**1~9단계 정상 요청 → 금지 요청** (정상이 먼저 성공해야 금지 결과가 의미 있습니다.)

| 단계 | 정상 요청 (유지되어야 함) | 금지 요청 (다시 거부되어야 함) | 방법 | 결과 |
| --- | --- | --- | --- | --- |
| 1 | `/`와 `/data.json`의 공개 가상 메모 | 해당 없음(공개 자료 확인) | 배포 주소를 브라우저로 열기 | 미실행 |
| 2 | 단계 카드 기준 | 단계 카드 기준 | 저장소에 이 단계 계약 문서가 없어 학생이 단계 카드를 보고 채움 | 미실행 |
| 3 | 로그인 후 `GET /api/notes` | 로그인 없는 `GET /api/notes` → `401` | `npm run bundle`의 자기 점검(실제 요청 1건) 또는 브라우저 | 2026-10-13 배포 주소: 로그인 없음 `401`, 로그인 후 목록 `200`(학생 실행 보고) |
| 4 | 단계 카드 기준 | 단계 카드 기준 | 저장소에 이 단계 계약 문서가 없어 학생이 단계 카드를 보고 채움 | 미실행 |
| 5 | A가 자기 메모 조회·수정, B가 자기 메모 조회 | B가 A 메모 조회·수정·삭제 → `403`, 원본 저장소 주소(`originalApiUrl`) 직접 요청 거부 | 배포 주소에서 A·B 로그인 후 각각 요청 | 2026-10-13 배포 주소: A 자기 메모 조회 `200`, B가 A 메모 조회 `403`(학생 실행 보고) / 수정·삭제·`originalApiUrl` 직접 요청 미실행 |
| 6 | 등록된 기기의 `GET /notes/:id` 허용 | 미등록·타인 기기 → `device_not_registered` | `node scripts/decider-test.mjs` | 2026-10-13 로컬 통과(가상 요청) |
| 7 | 평소와 같은 접속 `allow`, 재인증 통과(`stepUp.verified`) 시 허용 | 시각·네트워크·대량 읽기가 겹친 접속 → `step_up_required` | `node scripts/fixture-7.mjs`, `node scripts/decider-test.mjs` | 미실행(`fixture-7`) / 2026-10-13 로컬 통과(`decider-test`) |
| 8 | 자기 `note:<id>` 읽기·수정, 강사 공지 읽기 | 타인 메모·강사 공지 수정·`export` 등 기능 경로·쿼리 선택 → `zone_violation` 또는 `403` | `node scripts/decider-test.mjs`, 배포 주소에서 B가 A 메모 요청 | 2026-10-13 배포 주소: B가 A 메모 조회 `403`(학생 실행 보고) / 공지·`export`·쿼리 선택 배포 요청 미실행 / 로컬 통과(`decider-test`) |
| 9 | 같은 사용자의 `GET` 120건 이하는 `observe` | 10분 안 120건 초과 → `propose_revocation`/`burst_read` | `npm run detect:test` | 2026-10-13 로컬 통과(가상 사건) |

**마지막**: `git status`로 의도하지 않은 변경이 없는지 확인한 뒤 `npm run bundle`을 실행합니다. 번들의 `attackAttempts`에는 실제로 보낸 요청만 남으며 심판의 판정이 아닙니다.

## 주의사항 및 취약점 안내

- **이전 공개 커밋·배포 이력은 지워지지 않았습니다**: 최신 코드와 정적 파일에서 자료를 제거하더라도, 과거의 공개 커밋 이력(Git history)이나 이전 Vercel 배포 버전 기록에는 과거 데이터가 남아 있을 수 있습니다.
