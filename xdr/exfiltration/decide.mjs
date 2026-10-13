const PATTERNS = [
  {
    name: "처음 보는 목적지로 대용량 전송",
    condition: "처음 보는 목적지로 짧은 시간 내 다수 파일 또는 대용량 데이터가 반복·일괄 전송",
    basis: "MITRE ATT&CK T1041(명령 통로로 유출)"
  },
  {
    name: "업무 시간 밖 압축 파일 반출",
    condition: "수업·업무 시간 밖이나 다른 프로토콜·처음 보는 주소로 압축 파일·자료 반출",
    basis: "MITRE ATT&CK T1048(다른 프로토콜로 유출)"
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
  const bytes = Number(alert?.data?.bytes || 0);
  const files = Number(alert?.data?.files || 0);
  const count = Number(alert?.data?.count || 1);
  const desc = String(alert?.rule?.description || '');

  const hasT1041 = mitre.includes('T1041');
  const hasT1048 = mitre.includes('T1048');
  const isArchiveOrOffHours = desc.includes('압축') || desc.includes('시간 밖');

  let matchedName = PATTERNS[0].name;
  if (isArchiveOrOffHours || (hasT1048 && files < 60)) {
    matchedName = PATTERNS[1].name;
  } else {
    matchedName = PATTERNS[0].name;
  }

  let confidence = 0.1;
  if (level >= 10 && (hasT1041 || hasT1048 || bytes >= 50000000 || files >= 60 || count >= 8)) {
    confidence = 0.9;
  } else if (level >= 5 && (hasT1041 || hasT1048)) {
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
