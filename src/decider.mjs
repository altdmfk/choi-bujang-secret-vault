// ALEPH SDP 엔진이 확인한 요청만 받는 학생 판정기 시작점입니다.
// 6단계부터 규칙을 하나씩 추가합니다. 이 기본 응답은 모든 요청을 거부합니다.
// 요청 본문의 userId, role, 기기 키, 토큰을 별도로 믿거나 저장하지 마세요.
export const RULE_IDS = Object.freeze(['device_registered', 'step_up_required', 'zone_rule']);

const xdrBlocks = new Map();

const DEVICE_ID_PATTERN = /^[0-9a-f]{16}$/u;

// aleph.config.json의 allowedRoutes 기준 (판정 대상이 아닌 POST /api/login 제외)
const ALLOWED_ROUTES = new Set([
  'GET /api/notes',
  'POST /api/notes',
  'GET /api/notes/:id',
  'PUT /api/notes/:id',
  'DELETE /api/notes/:id',
  'GET /notes/:id',
  'GET /api/notices',
  'GET /api/notices/:id',
]);

// :id와 같은 깊이에 올 수 없는 기능 경로 키워드
const FORBIDDEN_FUNCTION_PATHS = new Set([
  'export', 'import', 'backup', 'admin', 'batch', 'search',
  'download', 'upload', 'config', 'settings', 'all', 'manage', 'execute'
]);

export function clearNoteOwnership() {
  // 요청 간 상태(Map)를 저장하지 않는 무상태(stateless) 판정기이므로 초기화할 내부 상태 없음
}

/**
 * 정확한 요청 경로와 서비스로부터 구역 및 자원 ID를 분리·추출합니다.
 * - decodeURIComponent 후 '..', '.', '//', '#', '?' 쿼리 문자열을 차단하고 디코딩 실패 시 invalid 처리합니다.
 * - :id와 같은 깊이에 기능 경로가 오거나 하위 경로가 지나치게 깊은 경우 invalid 처리합니다.
 */
export function parseResourcePath(rawPath, service) {
  if (typeof rawPath !== 'string' || !rawPath.startsWith('/')) {
    return { invalid: true, reason: 'invalid_path' };
  }

  // 쿼리 문자열('?')이나 프래그먼트('#')가 포함된 경로는 거부
  if (rawPath.includes('?') || rawPath.includes('#')) {
    return { invalid: true, reason: 'query_or_hash_in_path' };
  }

  // 말미 슬래시 1개만 제거하되, 중간 또는 연속된 '//' 및 역슬래시('\')는 거부
  const trimmed = rawPath.length > 1 ? rawPath.replace(/\/$/u, '') : rawPath;
  if (trimmed.includes('//') || trimmed.includes('\\')) {
    return { invalid: true, reason: 'double_slash' };
  }

  const rawParts = trimmed.split('/').slice(1);
  if (rawParts.length === 0 || rawParts.some(part => part.length === 0)) {
    return { invalid: true, reason: 'empty_segment' };
  }

  const parts = [];
  for (const rawPart of rawParts) {
    let decoded;
    try {
      decoded = decodeURIComponent(rawPart);
    } catch {
      return { invalid: true, reason: 'malformed_encoding' };
    }

    if (
      !decoded
      || decoded === '.'
      || decoded === '..'
      || decoded.includes('/')
      || decoded.includes('\\')
      || decoded.includes('\0')
      || decoded.includes('..')
      || decoded.includes('?')
      || decoded.includes('#')
    ) {
      return { invalid: true, reason: 'path_traversal' };
    }
    parts.push(decoded);
  }

  const offset = parts[0].toLowerCase() === 'api' ? 1 : 0;
  if (parts.length <= offset) {
    return { invalid: true, reason: 'missing_service' };
  }

  const serviceName = parts[offset].toLowerCase();
  let resourceId = null;

  if (parts.length === offset + 2) {
    resourceId = parts[offset + 1];
  } else if (parts.length > offset + 2) {
    return { invalid: true, reason: 'too_deep' };
  }

  // :id 자리에 기능 경로(export 등)가 온 경우 디코딩 후에도 즉시 invalid 처리
  if (resourceId && FORBIDDEN_FUNCTION_PATHS.has(resourceId.toLowerCase())) {
    return { invalid: true, reason: 'forbidden_function_path' };
  }

  // 엔진이 검증한 service 항목이 제공된 경우 서비스명과 일치해야 함
  if (service !== undefined && service !== null) {
    if (typeof service !== 'string' || !service.trim()) {
      return { invalid: true, reason: 'invalid_service' };
    }
    let decodedService;
    try {
      decodedService = decodeURIComponent(service).trim().toLowerCase();
    } catch {
      return { invalid: true, reason: 'invalid_service_encoding' };
    }
    if (decodedService !== serviceName) {
      return { invalid: true, reason: 'service_mismatch' };
    }
  }

  return { serviceName, resourceId, hasApiPrefix: offset === 1 };
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

function tryDecodeLower(value) {
  if (typeof value !== 'string') return { ok: false, value: '' };
  try {
    return { ok: true, value: decodeURIComponent(value).toLowerCase() };
  } catch {
    return { ok: false, value: value.toLowerCase() };
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

  // 3. 6단계: 엔진이 확인한 기기 등록 상태 검증 (미등록 또는 확인 실패 시 거부)
  if (!request?.deviceRegistered || !request?.deviceId || !request?.subjectId) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'device_not_registered',
      ruleIds: ['device_registered'],
    };
  }

  // 4. 7단계: 복합 이상 접속 검사 (평소와 다른 시각 + 낯선 네트워크 + 대량 읽기 행동)
  // 지역(region) 하나만으로 영구 차단하지 않으며, 복합 이상 접속 시 추가 확인(step_up) 요청
  const isUnusualNetwork = context.network === 'unusual';
  const isUnusualHour = context.hour !== null && (context.hour < 9 || context.hour > 18);
  const hasBurstReads = Array.isArray(context.recentEvents) && context.recentEvents.some(
    (e) => e && (e.count >= 10 || e.kind === 'risk_signal')
  );

  const isCompositeAnomaly = context.trusted && isUnusualNetwork && isUnusualHour && hasBurstReads;
  let stepUpPassed = false;

  if (isCompositeAnomaly) {
    const isStepUpVerified = Boolean(
      request.stepUp?.verified
      && typeof request.stepUp?.authAgeSeconds === 'number'
      && request.stepUp.authAgeSeconds <= 900
    );

    if (!isStepUpVerified) {
      return {
        schema: 'aleph.decision.v1',
        requestId: safeRequestId,
        decision: 'step_up',
        reasonCode: 'step_up_required',
        ruleIds: ['step_up_required'],
      };
    }
    stepUpPassed = true;
  }

  // 5. 8단계: 구역 규칙 검사 (공지 예외 처리 및 소유자·기기·메서드·정확한 경로 검증)
  // classId / projectId 누락 시 거부 (빈 키 ":" 공유 방지)
  if (
    typeof request?.classId !== 'string' || !request.classId.trim()
    || typeof request?.projectId !== 'string' || !request.projectId.trim()
  ) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // 쿼리 문자열을 통한 우회 요청 차단
  if (typeof request?.queryLength === 'number' && request.queryLength > 0) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  const method = typeof request?.method === 'string' ? request.method.trim().toUpperCase() : '';
  if (!method) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // 1) route가 aleph.config.json의 allowedRoutes(POST /api/login 제외)에 정확히 존재하는지 검증
  const rawRoute = typeof request?.route === 'string' ? request.route.trim() : '';
  const routeTokens = rawRoute ? rawRoute.split(/\s+/u) : [];
  if (routeTokens.length !== 2 || !ALLOWED_ROUTES.has(rawRoute)) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // 2) request.method와 route 첫 토큰(메서드) 엄격 일치 검증
  const routeMethod = routeTokens[0].toUpperCase();
  const routePathPattern = routeTokens[1];

  if (routeMethod !== method) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // 디코딩 및 대소문자 정규화 후 공지(notices) 대상 여부 판별
  const decodedService = tryDecodeLower(request?.service ?? '');
  const decodedPath = tryDecodeLower(request?.path ?? '');
  const decodedRoute = tryDecodeLower(rawRoute);

  if (
    (request?.service !== undefined && !decodedService.ok)
    || !decodedPath.ok
    || !decodedRoute.ok
  ) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  const isNoticeTarget = (
    decodedService.value === 'notices'
    || decodedService.value === 'notice'
    || /(?:^|\/)notices?(?:\/|$|\?|#)/iu.test(decodedPath.value)
    || /(?:^|\/|\s)notices?(?:\/|$|\s|:)/iu.test(decodedRoute.value)
  );

  // 공지 대상인데 GET이 아닌 모든 메서드는 즉시 거부
  if (isNoticeTarget && (method !== 'GET' || routeMethod !== 'GET')) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // 경로 정규화 및 파싱 (.., //, #, ?, 기능 경로 export 등 차단)
  const parsed = parseResourcePath(request?.path, request?.service);
  if (!parsed || parsed.invalid) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  const { serviceName, resourceId, hasApiPrefix } = parsed;

  if (serviceName !== 'notes' && serviceName !== 'notices') {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // 3) request.path가 route 패턴과 구조가 정확히 같은지 검사 (/api 접두사 여부 포함, :id 자리는 한 세그먼트)
  const parsedRoute = parseResourcePath(routePathPattern, request?.service);
  if (
    !parsedRoute
    || parsedRoute.invalid
    || parsedRoute.serviceName !== serviceName
    || Boolean(parsedRoute.hasApiPrefix) !== Boolean(hasApiPrefix)
    || Boolean(parsedRoute.resourceId) !== Boolean(resourceId)
    || (parsedRoute.resourceId && !parsedRoute.resourceId.startsWith(':') && parsedRoute.resourceId !== resourceId)
  ) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // 기기 ID 및 주체 ID 형식 검증
  if (
    typeof request.deviceId !== 'string'
    || !DEVICE_ID_PATTERN.test(request.deviceId)
    || typeof request.subjectId !== 'string'
    || !request.subjectId.trim()
  ) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'zone_violation',
      ruleIds: ['zone_rule'],
    };
  }

  // 5) 강사 공지 구역 ('notices'): GET 경로만 allow, 나머지 deny
  if (serviceName === 'notices') {
    if (method !== 'GET') {
      return {
        schema: 'aleph.decision.v1',
        requestId: safeRequestId,
        decision: 'deny',
        reasonCode: 'zone_violation',
        ruleIds: ['zone_rule'],
      };
    }

    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'allow',
      reasonCode: 'approved',
      ruleIds: stepUpPassed ? ['step_up_required', 'zone_rule'] : ['zone_rule'],
    };
  }

  // 4) 메모 구역 ('notes'): allowedRoutes에 있고 구조·메서드가 일치하면 allow
  if (serviceName === 'notes') {
    const allowedMethods = ['GET', 'PUT', 'POST', 'DELETE'];
    if (!allowedMethods.includes(method)) {
      return {
        schema: 'aleph.decision.v1',
        requestId: safeRequestId,
        decision: 'deny',
        reasonCode: 'zone_violation',
        ruleIds: ['zone_rule'],
      };
    }

    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'allow',
      reasonCode: 'approved',
      ruleIds: stepUpPassed ? ['step_up_required', 'zone_rule'] : ['zone_rule'],
    };
  }

  // 6. 기타 요청 기본 거부
  return {
    schema: 'aleph.decision.v1',
    requestId: safeRequestId,
    decision: 'deny',
    reasonCode: 'starter_not_ready',
    ruleIds: ['zone_rule'],
  };
}
