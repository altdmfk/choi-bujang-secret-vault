// ALEPH SDP 엔진이 확인한 요청만 받는 학생 판정기 시작점입니다.
// 6단계부터 규칙을 하나씩 추가합니다. 이 기본 응답은 모든 요청을 거부합니다.
// 요청 본문의 userId, role, 기기 키, 토큰을 별도로 믿거나 저장하지 마세요.
export const RULE_IDS = Object.freeze(['starter.deny']);

const xdrBlocks = new Map();

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

  try {
    const ip = request?.signals?.source;
    if (ip && xdrBlocks.has(ip)) {
      const rule = xdrBlocks.get(ip);
      if (Date.now() < rule.expiresAt) {
        return {
          schema: 'aleph.decision.v1',
          requestId: safeRequestId,
          decision: 'deny',
          reasonCode: 'starter_not_ready', // 미승인 사유(운영 코드)로 안전 폴백
          ruleIds: [`xdr.alert.${rule.alertId}`] // 거부 규칙에 만료 시각과 근거 번호
        };
      } else {
        xdrBlocks.delete(ip);
      }
    }
  } catch (_err) {
    // 에러 발생 시 원래 로직으로
  }

  return {
    schema: 'aleph.decision.v1',
    requestId: safeRequestId,
    decision: 'deny',
    reasonCode: 'starter_not_ready',
    ruleIds: [RULE_IDS[0]],
  };
}
