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

## 보너스 xdr-02 저장점 현재 작동하는 기능 및 다시 실행하는 방법

- **작동하는 기능**:
  - (5단계) Supabase Auth를 통한 사용자 로그인(A, B 계정) 및 로그아웃 지원, 본인 소유 메모만 조회/수정/삭제 허용, 원본 자료 저장소 직접 접근 차단(`originalApiUrl`).
  - (보너스 XDR-01) 무차별 로그인 공격(Brute Force) 패턴을 적용하여 악성 IP를 차단.
  - (보너스 XDR-02) 웹 주입 공격(SQL 주입, 스크립트 주입, 경로 탐색) 패턴 탐지 모듈을 적용하여 `data.count`에 따른 반복 시도는 즉각 ZTNA 판정기(`src/decider.mjs`)에 거부 규칙(`xdr.alert.[id]`)으로 등록(block)하고, 애매한 1회성 공격은 로깅(alert)만 수행하며, 정상 이벤트는 통과(record)시킵니다. (무작위 텍스트에 흔들리지 않는 구조적 판정 로직 사용)
- **다시 실행하는 방법**:
  - 로컬 환경: `.env.local`에 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`를 작성한 뒤 `npx vercel dev`로 실행합니다.
  - 배포 환경: GitHub 푸시 시 Vercel에서 자동 배포되며 `https://choi-bujang-secret-vault-neon.vercel.app`에서 확인할 수 있습니다.
  - XDR 실행: `npm run xdr:run -- web-injection` 명령으로 경보를 판정하고 `xdr/web-injection/result.json` 생성. `node xdr/web-injection/respond.mjs`로 ZTNA 모의 연동을 확인할 수 있습니다.

## 주의사항 및 취약점 안내

- **이전 공개 커밋·배포 이력은 지워지지 않았습니다**: 최신 코드와 정적 파일에서 자료를 제거하더라도, 과거의 공개 커밋 이력(Git history)이나 이전 Vercel 배포 버전 기록에는 과거 데이터가 남아 있을 수 있습니다.
