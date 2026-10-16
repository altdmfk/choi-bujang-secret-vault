const PATTERNS = [
  {
    name: "Single IP High Volume Failures",
    condition: "짧은 시간 안에 같은 출발지 주소에서 로그인 실패가 비정상적으로 많이 연속 발생",
    basis: "MITRE ATT&CK T1110 (Brute Force): 단일 출발지에서 짧은 시간 내 다수의 인증 실패가 발생하는 무차별 대입 형태"
  },
  {
    name: "Password Spraying",
    condition: "한 출발지 주소가 짧은 시간에 여러 계정에 걸쳐 같은 비밀번호를 반복적으로 대입 시도",
    basis: "MITRE ATT&CK T1110.003 (Password Spraying): 한 주소에서 여러 계정에 공통 비밀번호를 대입해 계정 잠금을 피하는 형태"
  }
];

const THRESHOLD_BLOCK = 0.85;
const THRESHOLD_ALERT = 0.5;

export function decide(alert) {
  if (!alert || typeof alert !== 'object') {
    return { action: 'record', confidence: 0, reason: '잘못된 경보 형식' };
  }

  const level = Number(alert?.rule?.level || 0);

  let confidence = 0.1;
  let reason = '정상 로그';

  if (level >= 10) {
    confidence = 0.9;
    reason = PATTERNS[0].name;
  } else if (level >= 5) {
    confidence = 0.5;
    reason = '단발성 실패 (패턴 확인 필요)';
  } else {
    confidence = 0.1;
    reason = '정상 로그';
  }

  let action = 'record';
  if (confidence >= THRESHOLD_BLOCK) {
    action = 'block';
  } else if (confidence >= THRESHOLD_ALERT) {
    action = 'alert';
  }

  return { action, confidence, reason };
}
