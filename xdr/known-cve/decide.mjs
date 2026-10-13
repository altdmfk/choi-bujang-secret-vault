const PATTERNS = [
  {
    name: "요청 머리글 원격 조회 구문",
    condition: "요청 머리글 안의 원격 조회 구문(jndi 형태)",
    basis: "CVE-2021-44228 형태 요청, MITRE ATT&CK T1190 (외부 공개 앱 악용)"
  },
  {
    name: "요청 인자 원격 조회 구문",
    condition: "요청 인자 안의 원격 조회 구문(jndi 형태)",
    basis: "CVE-2021-44228 형태 요청, MITRE ATT&CK T1190 (외부 공개 앱 악용)"
  },
  {
    name: "알려진 취약점 점검 도구 흔적",
    condition: "알려진 취약점 점검 도구의 흔적과 원격 조회 구문(jndi 형태)",
    basis: "CVE-2021-44228 형태 요청, MITRE ATT&CK T1190 (외부 공개 앱 악용)"
  }
];

const THRESHOLD_BLOCK = 0.85;
const THRESHOLD_ALERT = 0.5;

export function decide(alert) {
  if (!alert || typeof alert !== 'object') {
    return { action: 'record', confidence: 0, reason: '잘못된 경보 형식' };
  }

  const mitre = Array.isArray(alert?.rule?.mitre) ? alert.rule.mitre : [];
  const level = Number(alert?.rule?.level || 0);
  const url = String(alert?.data?.url || '').toLowerCase();
  const useragent = String(alert?.data?.useragent || '').toLowerCase();

  const hasHeaderLookup = useragent.includes('jndi:');
  const hasUrlLookup = url.includes('jndi:');
  const hasProbeSignal = url.includes('probe=') || url.includes('/tools/');
  const isT1190 = mitre.includes('T1190');

  let matchedName = PATTERNS[1].name;
  if (hasProbeSignal) {
    matchedName = PATTERNS[2].name;
  } else if (hasHeaderLookup || (useragent && !url)) {
    matchedName = PATTERNS[0].name;
  } else {
    matchedName = PATTERNS[1].name;
  }

  let confidence = 0.1;
  if (hasHeaderLookup || hasUrlLookup || (isT1190 && level >= 10)) {
    confidence = 0.9;
  } else if (isT1190 || level >= 5) {
    confidence = 0.6;
  }

  let action = 'record';
  if (confidence >= THRESHOLD_BLOCK) {
    action = 'block';
  } else if (confidence >= THRESHOLD_ALERT) {
    action = 'alert';
  }

  const reason = action === 'record' ? '알려진 공격 없음 (정상)' : matchedName;

  return { action, confidence, reason };
}
