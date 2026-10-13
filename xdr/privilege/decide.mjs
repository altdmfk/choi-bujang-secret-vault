const PATTERNS = [
  {
    name: "관리자 그룹 추가",
    condition: "원격 주소에서 일반 계정이 관리자 그룹(administrators)에 추가되거나 반복 편입",
    basis: "MITRE ATT&CK T1078(정상 계정 도용)"
  },
  {
    name: "처음 보는 관리자 명령",
    condition: "처음 보는 주소나 다른 계정의 권한으로 관리자 명령 실행",
    basis: "MITRE ATT&CK T1068(권한 상승 악용)"
  },
  {
    name: "업무 시간 밖 권한 사용",
    condition: "수업·업무 시간 밖에 관리자 그룹 추가 또는 관리자 명령 실행",
    basis: "MITRE ATT&CK T1068(권한 상승 악용), T1078(정상 계정 도용)"
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
  const group = String(alert?.data?.group || '').toLowerCase();
  const count = Number(alert?.data?.count || 1);
  const desc = String(alert?.rule?.description || '');

  const hasT1068 = mitre.includes('T1068');
  const hasT1078 = mitre.includes('T1078');
  const isAdminGroup = group === 'administrators';
  const isOffHours = desc.includes('수업 시간 밖') || desc.includes('업무처럼 보이지 않는 시각');

  let matchedName = PATTERNS[0].name;
  if (isOffHours) {
    matchedName = PATTERNS[2].name;
  } else if (hasT1068) {
    matchedName = PATTERNS[1].name;
  } else {
    matchedName = PATTERNS[0].name;
  }

  let confidence = 0.1;
  if (level >= 10 && (hasT1068 || hasT1078 || isAdminGroup || count >= 2)) {
    confidence = 0.9;
  } else if (level >= 5 && (hasT1068 || hasT1078)) {
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
