// ALEPH SDP 엔진이 확인한 요청만 받는 학생 판정기 시작점입니다.
// 6단계부터 규칙을 하나씩 추가합니다. 이 기본 응답은 모든 요청을 거부합니다.
// 요청 본문의 userId, role, 기기 키, 토큰을 별도로 믿거나 저장하지 마세요.
export const RULE_IDS = Object.freeze(['device_registered', 'step_up_required', 'zone_rule']);

const xdrBlocks = new Map();
const deviceBindings = new Map();
const noteOwnership = new Map();

// :id와 같은 깊이에 올 수 없는 기능 경로 키워드
const FORBIDDEN_FUNCTION_PATHS = new Set([
  'export', 'import', 'backup', 'admin', 'batch', 'search',
  'download', 'upload', 'config', 'settings', 'all', 'manage', 'execute'
]);

export function clearNoteOwnership() {
  noteOwnership.clear();
}

/**
 * 정확한 요청 경로와 서비스로부터 구역 및 자원 ID를 분리·추출합니다.
 * - 쿼리 스트링으로 기능을 분기하지 않으며 순수 경로에서 자료 ID만 추출합니다.
 * - :id와 같은 깊이에 기능 경로가 오거나 하위 경로가 지나치게 깊은 경우 invalid 처리합니다.
 */
export function parseResourcePath(rawPath, service) {
  if (typeof rawPath !== 'string') return null;

  const cleanPath = rawPath.split('?')[0].replace(/\/+$/u, '') || '/';
  const parts = cleanPath.split('/').filter(Boolean);

  if (parts.length === 0) return null;

  const offset = parts[0] === 'api' ? 1 : 0;
  if (parts.length <= offset) return null;

  const serviceName = parts[offset];
  let resourceId = null;

  if (parts.length === offset + 2) {
    resourceId = parts[offset + 1];
  } else if (parts.length > offset + 2) {
    return { invalid: true, reason: 'too_deep' };
  }

  // 엔진이 검증한 service 항목이 제공된 경우 서비스명과 일치해야 함
  if (service && typeof service === 'string' && service !== serviceName) {
    return null;
  }

  return { serviceName, resourceId };
}

/**
 * 엔진이 검증해 넘긴 가상 접속 정보의 출처 및 유효성을 검사합니다.
 * - 지역·시각·네트워크·행동이 없거나 출처가 불명확하면 임의의 정상값으로 채우지 않습니다.
 * - 위조된 클라이언트 헤더(request.geo, request.device, request.role 등)를 신뢰 정보로 승격하지 않습니다.
 */
export function validateConnectionContext(request) {
  const signals = request?.signals;
  const isEngineVerified = Boolean(
    signals && typeof signals === 'object' && signals.source === 'judge_fixture'
  );

  // 출처가 엔진 검증(judge_fixture)이 아닌 경우 임의의 정상값('local', 'usual' 등)으로 채우지 않고 불신뢰 처리
  if (!isEngineVerified) {
    return {
      trusted: false,
      source: typeof signals?.source === 'string' ? signals.source : 'none',
      region: null,
      network: null,
      hour: null,
      recentEvents: Array.isArray(request?.recentEvents) ? request.recentEvents : [],
    };
  }

  // 엔진 검증 출처인 경우 전달된 신호 값을 담되, 누락된 필드를 임의의 정상값으로 채우지 않음
  return {
    trusted: true,
    source: signals.source,
    region: typeof signals.region === 'string' ? signals.region : null,
    network: typeof signals.network === 'string' ? signals.network : null,
    hour: Number.isInteger(signals.hour) ? signals.hour : null,
    recentEvents: Array.isArray(request?.recentEvents) ? request.recentEvents : [],
  };
}

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

  // 2. 가상 접속 정보 입력 검사 (출처 구분 및 위조 헤더 승격 방지)
  const context = validateConnectionContext(request);

  // 3. 엔진이 확인한 기기 등록 상태 검증 (미등록 또는 확인 실패 시 거부)
  if (!request?.deviceRegistered || !request?.deviceId || !request?.subjectId) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'device_not_registered',
      ruleIds: ['device_registered'],
    };
  }

  // 4. 기기-사용자 묶음(바인딩) 검증 (다른 사용자 기기 접근 시 거부)
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

  // 5. 7단계 복합 이상 접속 검사 (평소와 다른 시각 + 낯선 네트워크 + 대량 읽기 행동)
  // 지역(region) 하나만으로 영구 차단하지 않으며, 복합 이상 접속 시 추가 확인(step_up) 요청
  const isUnusualNetwork = context.network === 'unusual';
  const isUnusualHour = context.hour !== null && (context.hour < 9 || context.hour > 18);
  const hasBurstReads = Array.isArray(context.recentEvents) && context.recentEvents.some(
    (e) => e && (e.count >= 10 || e.kind === 'risk_signal')
  );

  const isCompositeAnomaly = context.trusted && isUnusualNetwork && isUnusualHour && hasBurstReads;

  if (isCompositeAnomaly) {
    // 추가 본인 확인(stepUp)을 완료했는지 확인
    const isStepUpVerified = Boolean(
      request.stepUp?.verified
      && typeof request.stepUp?.authAgeSeconds === 'number'
      && request.stepUp.authAgeSeconds <= 900
    );

    if (isStepUpVerified) {
      // 재인증 통과 시 허용
      return {
        schema: 'aleph.decision.v1',
        requestId: safeRequestId,
        decision: 'allow',
        reasonCode: 'approved',
        ruleIds: ['step_up_required'],
      };
    }

    // 재인증 미완료 시 추가 확인 요구 (영구 차단 대신 step_up 반환)
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'step_up',
      reasonCode: 'step_up_required',
      ruleIds: ['step_up_required'],
    };
  }

  // 6. 8단계 구역 규칙 검사 (자기 메모 읽기·수정 허용, 타인 메모 및 강사 공지 수정 거부)
  const parsed = parseResourcePath(request?.path, request?.service);

  // 알 수 없는 경로나 규정 깊이를 벗어난 경로인 경우 거부
  if (!parsed || parsed.invalid) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  const { serviceName, resourceId } = parsed;

  // 허용되지 않은 알 수 없는 서비스 구역 거부
  if (serviceName !== 'notes' && serviceName !== 'notices') {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // :id와 같은 깊이에 export 같은 기능 경로가 온 경우 거부
  if (resourceId && FORBIDDEN_FUNCTION_PATHS.has(resourceId.toLowerCase())) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // A. 강사 공지 구역 ('notices')
  if (serviceName === 'notices') {
    // 공지 읽기(GET)는 모든 확인된 사용자에게 허용
    if (request.method === 'GET') {
      return {
        schema: 'aleph.decision.v1',
        requestId: safeRequestId,
        decision: 'allow',
        reasonCode: 'approved',
        ruleIds: ['zone_rule'],
      };
    }

    // 일반 학생의 강사 공지 수정(POST, PUT, DELETE, PATCH 등)은 거부
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // B. 메모 구역 ('notes')
  if (serviceName === 'notes') {
    // 목록 조회(GET) 또는 신규 생성(POST)
    if (!resourceId) {
      if (request.method === 'GET' || request.method === 'POST') {
        return {
          schema: 'aleph.decision.v1',
          requestId: safeRequestId,
          decision: 'allow',
          reasonCode: 'approved',
          ruleIds: ['zone_rule'],
        };
      }
      return {
        schema: 'aleph.decision.v1',
        requestId: safeRequestId,
        decision: 'deny',
        reasonCode: 'zone_violation',
        ruleIds: ['zone_rule'],
      };
    }

    // 단건 메모에 대한 허용 메서드: GET(읽기), PUT/POST/PATCH/DELETE(수정/삭제)
    const allowedMethods = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'];
    if (!allowedMethods.includes(request.method)) {
      return {
        schema: 'aleph.decision.v1',
        requestId: safeRequestId,
        decision: 'deny',
        reasonCode: 'zone_violation',
        ruleIds: ['zone_rule'],
      };
    }

    // 메모 소유권 검증 (자기 메모 읽기·수정 허용, 타인 메모 거부)
    const noteKey = `${request.classId || ''}:${request.projectId || ''}:${resourceId}`;
    if (noteOwnership.has(noteKey)) {
      const owner = noteOwnership.get(noteKey);
      if (owner !== request.subjectId) {
        // B 사용자가 A 사용자의 메모에 접근 시 거부
        return {
          schema: 'aleph.decision.v1',
          requestId: safeRequestId,
          decision: 'deny',
          reasonCode: 'zone_violation',
          ruleIds: ['zone_rule'],
        };
      }
    } else {
      // 최초 생성/접근한 사용자를 해당 메모의 소유자로 바인딩
      noteOwnership.set(noteKey, request.subjectId);
    }

    // A 자기 메모의 읽기 및 수정 정상 허용
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'allow',
      reasonCode: 'approved',
      ruleIds: ['zone_rule'],
    };
  }

  // 7. 기타 요청 기본 거부
  return {
    schema: 'aleph.decision.v1',
    requestId: safeRequestId,
    decision: 'deny',
    reasonCode: 'starter_not_ready',
    ruleIds: ['zone_rule'],
  };
}
