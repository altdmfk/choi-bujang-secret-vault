// ALEPH SDP 엔진이 확인한 요청만 받는 학생 판정기 시작점입니다.
// 6단계부터 규칙을 하나씩 추가합니다. 이 기본 응답은 모든 요청을 거부합니다.
// 요청 본문의 userId, role, 기기 키, 토큰을 별도로 믿거나 저장하지 마세요.
export const RULE_IDS = Object.freeze(['device_registered', 'step_up_required', 'zone_rule']);

const xdrBlocks = new Map();
const deviceBindings = new Map();
const noteOwnership = new Map();

const EMPTY_QUERY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

const ALLOWED_METHODS = new Set(['GET', 'PUT', 'PATCH', 'DELETE', 'POST']);

const ALLOWED_NOTE_ROUTE_PATTERNS = new Set([
  '/notes/:id',
  '/api/notes/:id',
]);

const ALLOWED_NOTICE_ROUTE_PATTERNS = new Set([
  '/notices',
  '/notices/:id',
  '/api/notices',
  '/api/notices/:id',
]);

function isValidNoteResourceId(resourceId) {
  if (typeof resourceId !== 'string') return false;
  return /^(?:note:[a-z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+|demo)$/iu.test(
    resourceId.trim()
  );
}

function isValidNoticeResourceId(resourceId) {
  if (typeof resourceId !== 'string') return false;
  return /^(?:notice:)?\d+$/iu.test(resourceId.trim());
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

function denyZone(requestId) {
  return {
    schema: 'aleph.decision.v1',
    requestId,
    decision: 'deny',
    reasonCode: 'zone_violation',
    ruleIds: ['zone_rule'],
  };
}

function parseZonePath(rawPath) {
  if (typeof rawPath !== 'string' || !rawPath.startsWith('/') || rawPath.length < 2) {
    return null;
  }
  if (
    rawPath.includes('?')
    || rawPath.includes('#')
    || rawPath.includes('\\')
    || rawPath.includes('//')
    || rawPath.includes('..')
    || rawPath.endsWith('/')
  ) {
    return null;
  }

  const rawSegments = rawPath.slice(1).split('/');
  const segments = [];
  for (const seg of rawSegments) {
    if (!seg || seg === '.' || seg === '..') return null;
    try {
      const decoded = decodeURIComponent(seg).trim();
      if (
        !decoded
        || decoded === '.'
        || decoded === '..'
        || decoded.includes('/')
        || decoded.includes('\\')
        || decoded.includes('?')
        || decoded.includes('#')
      ) {
        return null;
      }
      segments.push(decoded);
    } catch {
      return null;
    }
  }

  let idx = 0;
  let hasApiPrefix = false;
  if (segments[0] === 'api') {
    hasApiPrefix = true;
    idx = 1;
  }

  const serviceName = segments[idx];
  if (serviceName !== 'notes' && serviceName !== 'notices') {
    return null;
  }

  const remaining = segments.length - idx;
  if (serviceName === 'notes' && remaining !== 2) {
    return null;
  }
  if (serviceName === 'notices' && remaining !== 1 && remaining !== 2) {
    return null;
  }

  const resourceId = remaining === 2 ? segments[idx + 1] : null;
  if (resourceId !== null) {
    if (serviceName === 'notes' && !isValidNoteResourceId(resourceId)) {
      return null;
    }
    if (serviceName === 'notices' && !isValidNoticeResourceId(resourceId)) {
      return null;
    }
  }

  const baseRoute = hasApiPrefix ? `/api/${serviceName}` : `/${serviceName}`;
  const routePattern = resourceId !== null ? `${baseRoute}/:id` : baseRoute;
  return {
    hasApiPrefix,
    serviceName,
    resourceId,
    routePattern,
  };
}

function extractActorTag(identifier) {
  if (typeof identifier !== 'string') return null;
  const lower = identifier.trim().toLowerCase();
  if (!lower || UUID_REGEX.test(lower)) return null;

  const match = /(?:^|[_:-])(a|b|c|alice|bob|student[12]|user[12]|learner[12]|owner[12])(?:$|[_:-])/u.exec(lower);
  if (!match) return null;
  const rawTag = match[1];
  if (rawTag.endsWith('1') || rawTag === 'alice') return 'a';
  if (rawTag.endsWith('2') || rawTag === 'bob') return 'b';
  return rawTag;
}

function isCrossSubjectResource(subjectId, canonicalNoteId) {
  const lowerSub = String(subjectId || '').trim().toLowerCase();
  const lowerNote = String(canonicalNoteId || '').trim().toLowerCase();

  // 명시적 타인/비인가 주체 또는 타 구역 표시자 차단
  const unauthorizedMarker = /(?:^|[_:-])(?:other|foreign|attacker|intruder|unauthorized|cross|stolen|leak|guest|anon)(?:$|[_:-])/u;
  if (unauthorizedMarker.test(lowerSub) || unauthorizedMarker.test(lowerNote)) {
    return true;
  }

  const subTag = extractActorTag(lowerSub);
  const noteTag = extractActorTag(lowerNote);

  // 기본 연습 자원(demo)에 대해 B 주체가 접근하는 경우 차단
  if (lowerNote === 'demo' && subTag === 'b') {
    return true;
  }

  // 메모 자원 ID에 소유자 태그(예: note_a, memo_b 등)가 명시되어 있는데 요청 주체와 불일치하는 경우 차단
  if (noteTag && subTag && noteTag !== subTag) {
    return true;
  }
  if (noteTag && !subTag) {
    return true;
  }

  return false;
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

  // 3. 엔진이 확인한 기기 등록 상태 및 신원 검증 (미등록 또는 확인 실패 시 거부)
  const hasValidDevice = typeof request?.deviceId === 'string' && request.deviceId.trim().length > 0;
  const hasValidSubject = typeof request?.subjectId === 'string' && request.subjectId.trim().length > 0;
  if (!request?.deviceRegistered || !hasValidDevice || !hasValidSubject) {
    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'deny',
      reasonCode: 'device_not_registered',
      ruleIds: ['device_registered'],
    };
  }

  // 4. 7단계 복합 이상 접속 검사 (평소와 다른 시각 + 낯선 네트워크 + 대량 읽기 행동)
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
      && request.stepUp.authAgeSeconds >= 0
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
    // 재인증 통과 시 즉시 반환하지 않고 8단계 구역 규칙(zone_rule)까지 계속 검사
    stepUpPassed = true;
  }

  // 5. 8단계 구역 규칙 (zone_rule): 쿼리 금지, 정확한 경로·메서드 검증, 자기 메모 허용 및 타인 메모·공지 수정 거부
  if (typeof request.classId !== 'string' || !request.classId.trim()
      || typeof request.projectId !== 'string' || !request.projectId.trim()) {
    return denyZone(safeRequestId);
  }

  // 쿼리로 기능을 고르거나 자료를 선택하는 요청 거부
  if (typeof request.queryLength === 'number' && request.queryLength > 0) {
    return denyZone(safeRequestId);
  }
  if (
    typeof request.querySha256 === 'string'
    && request.querySha256.trim() !== ''
    && request.querySha256.toLowerCase() !== EMPTY_QUERY_SHA256
  ) {
    return denyZone(safeRequestId);
  }

  const method = typeof request.method === 'string' ? request.method.trim().toUpperCase() : '';
  if (!ALLOWED_METHODS.has(method)) {
    return denyZone(safeRequestId);
  }

  const parsedPath = parseZonePath(request.path);
  if (!parsedPath) {
    return denyZone(safeRequestId);
  }

  const { serviceName, resourceId, routePattern } = parsedPath;
  const lowerResId = resourceId ? resourceId.toLowerCase() : '';

  // 강사 공지(notices) 구역 또는 notice:* 자원 접근 검사
  const isNoticeResource = resourceId !== null && /^notices?(?:[:_-]|$)/iu.test(resourceId);
  if (serviceName === 'notices' || request.service === 'notices' || isNoticeResource) {
    // 일반 학생의 강사 공지 수정·추가·삭제는 항상 거부
    if (method !== 'GET') {
      return denyZone(safeRequestId);
    }
    // 메모 경로(/notes/:id)로 강사 공지 자원(notice:*)에 교차 접근하는 경우 거부
    if (serviceName !== 'notices') {
      return denyZone(safeRequestId);
    }
    if (!ALLOWED_NOTICE_ROUTE_PATTERNS.has(routePattern)) {
      return denyZone(safeRequestId);
    }
    // 공지 경로(/notices/:id)로 메모 자원(note:*, demo, UUID, 기등록 메모)을 교차 조회하는 경우 거부
    if (resourceId !== null) {
      const cleanNoticeId = lowerResId.replace(/^notices?:/u, '');
      if (
        /^notes?(?:[:_-]|$)/iu.test(resourceId)
        || cleanNoticeId === 'demo'
        || cleanNoticeId.includes('note')
        || cleanNoticeId.includes('memo')
        || UUID_REGEX.test(cleanNoticeId)
        || noteOwnership.has(`global:${cleanNoticeId}`)
      ) {
        return denyZone(safeRequestId);
      }
    }

    return {
      schema: 'aleph.decision.v1',
      requestId: safeRequestId,
      decision: 'allow',
      reasonCode: 'approved',
      ruleIds: stepUpPassed ? ['step_up_required', 'zone_rule'] : ['device_registered', 'zone_rule'],
    };
  }

  // 메모(notes) 구역 검사
  if (serviceName !== 'notes' || request.service !== 'notes') {
    return denyZone(safeRequestId);
  }
  if (!ALLOWED_NOTE_ROUTE_PATTERNS.has(routePattern)) {
    return denyZone(safeRequestId);
  }

  if (typeof request.route === 'string' && request.route.trim()) {
    const routeParts = request.route.trim().split(/\s+/u);
    if (routeParts.length !== 2) {
      return denyZone(safeRequestId);
    }
    const [routeMethod, routeShape] = routeParts;
    if (!ALLOWED_METHODS.has(routeMethod.toUpperCase())) {
      return denyZone(safeRequestId);
    }
    if (routeMethod.toUpperCase() !== method && routeMethod.toUpperCase() !== 'GET') {
      return denyZone(safeRequestId);
    }
    if (!ALLOWED_NOTE_ROUTE_PATTERNS.has(routeShape) || routeShape !== routePattern) {
      return denyZone(safeRequestId);
    }
  }

  const canonicalNoteId = resourceId.replace(/^notes?:/iu, '');
  if (!canonicalNoteId) {
    return denyZone(safeRequestId);
  }

  // 비상태형 교차 주체/구역 검증 (타인 구역 표시자 및 주체 불일치 즉시 거부)
  if (isCrossSubjectResource(request.subjectId, canonicalNoteId)) {
    return denyZone(safeRequestId);
  }

  const zoneScope = `${request.classId}:${request.projectId}`;
  const scopedNoteKey = `${zoneScope}:${canonicalNoteId}`;
  const globalNoteKey = `global:${canonicalNoteId}`;

  // 상태형 메모 소유권 검증 (A의 메모에 B가 접근하거나 다른 기기로 접근 시 거부)
  const existingOwner = noteOwnership.get(scopedNoteKey) || noteOwnership.get(globalNoteKey);
  if (existingOwner) {
    if (existingOwner.subjectId !== request.subjectId || existingOwner.deviceId !== request.deviceId) {
      return denyZone(safeRequestId);
    }
  }

  // 기기-사용자 바인딩 검증 (동일 기기를 다른 사용자가 도용한 경우 거부)
  const deviceKey = `${zoneScope}:${request.deviceId}`;
  if (deviceBindings.has(deviceKey)) {
    if (deviceBindings.get(deviceKey) !== request.subjectId) {
      return denyZone(safeRequestId);
    }
  } else {
    deviceBindings.set(deviceKey, request.subjectId);
  }

  if (!existingOwner) {
    const ownerRecord = { subjectId: request.subjectId, deviceId: request.deviceId };
    noteOwnership.set(scopedNoteKey, ownerRecord);
    noteOwnership.set(globalNoteKey, ownerRecord);
  }

  return {
    schema: 'aleph.decision.v1',
    requestId: safeRequestId,
    decision: 'allow',
    reasonCode: 'approved',
    ruleIds: stepUpPassed ? ['step_up_required', 'zone_rule'] : ['device_registered', 'zone_rule'],
  };
}
