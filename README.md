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

## 주의사항 및 취약점 안내

- **이전 공개 커밋·배포 이력은 지워지지 않았습니다**: 최신 코드와 정적 파일에서 자료를 제거하더라도, 과거의 공개 커밋 이력(Git history)이나 이전 Vercel 배포 버전 기록에는 과거 데이터가 남아 있을 수 있습니다.
