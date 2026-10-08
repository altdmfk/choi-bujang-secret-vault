const PATTERNS = [
  {
    name: "SQL 주입",
    condition: "요청 인자 안의 SQL 구문",
    basis: "MITRE ATT&CK T1190 (외부 공개 앱 악용)"
  },
  {
    name: "스크립트 주입",
    condition: "요청 인자 안의 스크립트 태그",
    basis: "MITRE ATT&CK T1190 (외부 공개 앱 악용)"
  },
  {
    name: "경로 탐색",
    condition: "경로 거슬러 올라가기(../) 반복",
    basis: "MITRE ATT&CK T1190 (외부 공개 앱 악용)"
  }
];

const THRESHOLD_BLOCK = 0.85;
const THRESHOLD_ALERT = 0.5;

export function decide(alert) {
  if (!alert || typeof alert !== 'object') {
    return { action: 'record', confidence: 0, reason: '잘못된 경보 형식' };
  }

  // 공식 구조화 데이터만 참조 (텍스트 설명문 파싱 절대 금지)
  const mitre = alert?.rule?.mitre || [];
  const url = (alert?.data?.url || "").toLowerCase();
  const count = parseInt(alert?.data?.count || "1", 10);
  
  let matchedName = "기타 의심 패턴";
  let confidence = 0.1; // 기본 정상 이벤트

  // T1190(외부 공개 앱 악용) 속성이 있는 경우 웹 주입 공격으로 간주
  if (mitre.includes("T1190")) {
    // 1. 요청 인자(URL) 내부의 명확한 영문 시그니처만 검사
    if (url.includes("sql") || url.includes("select") || url.includes("union") || url.includes("%27") || url.includes("'")) {
      matchedName = PATTERNS[0].name;
    } else if (url.includes("script") || url.includes("<script>") || url.includes("%3cscript")) {
      matchedName = PATTERNS[1].name;
    } else if (url.includes("../") || url.includes("%2e%2e%2f")) {
      matchedName = PATTERNS[2].name;
    }

    // 2. 임의의 임계값이 아닌 '반복 여부(count)' 데이터 구조를 기반으로 확신도 산정
    if (count > 1) {
      confidence = 0.9; // 반복되는 명확한 공격
    } else {
      confidence = 0.6; // 1회성 의심/애매한 공격
    }
  }
  
  let action = 'record';
  if (confidence >= THRESHOLD_BLOCK) {
    action = 'block';
  } else if (confidence >= THRESHOLD_ALERT) {
    action = 'alert';
  }

  let reason = matchedName;
  if (action === 'record') {
    reason = '알려진 공격 없음 (정상)';
  }

  return { action, confidence, reason };
}
