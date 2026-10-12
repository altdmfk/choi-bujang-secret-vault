// ALEPH SDP 엔진이 확인한 요청만 받는 학생 판정기 시작점입니다.
// 6단계부터 규칙을 하나씩 추가합니다. 이 기본 응답은 모든 요청을 거부합니다.
// 요청 본문의 userId, role, 기기 키, 토큰을 별도로 믿거나 저장하지 마세요.
export const RULE_IDS = Object.freeze(['device_registered']);

const xdrBlocks = new Map();
const deviceBindings = new Map();

export function addXdrBlock(ip, alertId) {
  if (ip) {
    xdrBlocks.set(ip, {
      alertId,
      expiresAt: Date.now() + 3600 * 1000 // 1시간 만료 시각
    });
  }
}

export async function decide(request) {
  const safeRequestId = request?.requestId || 'unknown-request-id';

  // 1. 기존 XDR 블록 규칙 보존
  try {
    const ip = request?.signals?.source;
    if (ip && xdrBlocks.has(ip)) {
      const rule = xdrBlocks.get(ip);
      if (Date.now() < rule.expiresAt) {
        return {
          schema: 'aleph.decision.v1',
          requestId: safeRequestId,
          decision: 'deny',
          reasonCode: 'starter_not_ready',
          ruleIds: [`xdr.alert.${rule.alertId}`]
        };
      } else {
        xdrBlocks.delete(ip);
      }
    }
  } catch (_err) {
    // 에러 발생 시 원래 로직으로
  }

  // 2. 엔진이 확인한 기기 등록 상태 검증 (미등록 또는 확인 실패 시 거부)
  if (!request?.deviceRegistered || !request?.deviceId || !request?.subjectId) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'device_not_registered',
      ruleIds: ['device_registered'],
    };
  }

  // 3. 기기-사용자 묶음(바인딩) 검증 (다른 사용자 기기 접근 시 거부)
  const bindingKey = `${request.classId || ''}:${request.projectId || ''}:${request.deviceId}`;
  if (deviceBindings.has(bindingKey)) {
    if (deviceBindings.get(bindingKey) !== request.subjectId) {
      return {
        schema: 'aleph.decision.v1',
        requestId: safeRequestId,
        decision: 'deny',
        reasonCode: 'device_not_registered',
        ruleIds: ['device_registered'],
      };
    }
  } else {
    deviceBindings.set(bindingKey, request.subjectId);
  }

  // 4. 등록 기기 및 사용자 묶음 확인 시 자료실 읽기 허용
  const isNotesRead = request.service === 'notes' && request.method === 'GET';
  if (isNotesRead) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'allow',
      reasonCode: 'approved',
      ruleIds: ['device_registered'],
    };
  }

  // 5. 기타 요청 기본 거부
  return {
    schema: 'aleph.decision.v1',
    requestId: safeRequestId,
    decision: 'deny',
    reasonCode: 'starter_not_ready',
    ruleIds: ['device_registered'],
  };
}
