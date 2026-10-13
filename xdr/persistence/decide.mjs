const PATTERNS = [
  {
    name: "서명 없는 새 서비스 등록",
    condition: "임시 폴더 실행 파일을 가리키거나 반복 등록되는 서명 없는 서비스 생성·변경",
    basis: "MITRE ATT&CK T1543(시스템 프로세스 생성·변경)"
  },
  {
    name: "낯선 예약 작업",
    condition: "임시 폴더 실행 파일을 가리키거나 수업 시간 밖에 실행되는 낯선 예약 작업 등록",
    basis: "MITRE ATT&CK T1053(예약 작업)"
  },
  {
    name: "시작 폴더 변경",
    condition: "시작 폴더(Startup)에 평소 목록에 없는 프로그램 추가·변경",
    basis: "MITRE ATT&CK T1543(시스템 프로세스 생성·변경), T1053(예약 작업)"
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
  const rawPath = String(alert?.data?.path || '').toLowerCase();
  const count = Number(alert?.data?.count || 1);
  const desc = String(alert?.rule?.description || '');

  const hasT1543 = mitre.includes('T1543');
  const hasT1053 = mitre.includes('T1053');
  const isStartup = rawPath.includes('\\startup\\') || (hasT1543 && hasT1053) || desc.includes('시작 폴더') || desc.includes('시작 프로그램') || desc.includes('시작 항목');
  const isTempOrStartup = rawPath.includes('\\appdata\\local\\temp\\') || rawPath.includes('\\startup\\');

  let matchedName = PATTERNS[0].name;
  if (isStartup) {
    matchedName = PATTERNS[2].name;
  } else if (hasT1053) {
    matchedName = PATTERNS[1].name;
  } else {
    matchedName = PATTERNS[0].name;
  }

  let confidence = 0.1;
  if (level >= 10 && (hasT1543 || hasT1053 || isTempOrStartup || count >= 3)) {
    confidence = 0.9;
  } else if (level >= 5 && (hasT1543 || hasT1053)) {
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
