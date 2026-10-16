// 9단계에서 학생이 채우는 탐지 함수입니다. 이 기본값은 어떤 접속도 회수하지 않습니다.
// 반 엔진이 검증한 사건만 전달해야 하며, 브라우저가 보낸 사용자 번호는 받지 않습니다.

// 계약(docs/DETECT_EVENTS.md)에 있는 세 값만 읽습니다: at, method, identity.sub.
// 메모 내용·토큰·실명 등 그 밖의 필드는 복사하지 않으므로 저장하거나 출력할 수 없습니다.

const WINDOW_MS = 10 * 60 * 1000;
const BURST_LIMIT = 120; // 정확히 120건은 대상이 아니고, 넘어야 합니다.

/**
 * 단일 가상 사건을 안전하게 파싱합니다.
 * docs/DETECT_EVENTS.md 계약의 세 값(at, method, identity.sub)만 읽으며,
 * 메모 내용·토큰·실명 등 그 외 필드는 접근하지 않습니다.
 */
function readEvent(event) {
  if (event === null || typeof event !== 'object') return null;
  const { at, method } = event;
  const sub = event.identity && typeof event.identity === 'object' ? event.identity.sub : undefined;
  if (typeof at !== 'string' || Number.isNaN(Date.parse(at))) return null;
  if (typeof method !== 'string' || method === '') return null;
  if (typeof sub !== 'string' || sub === '') return null;
  return { atMs: Date.parse(at), method: method.toUpperCase(), sub };
}

/**
 * 읽을 수 없는 사건은 건너뜁니다. 오류 메시지에도 사건 값을 넣지 않습니다.
 */
function readEvents(events) {
  return events.map(readEvent).filter(Boolean);
}

/**
 * 사용자별 GET 사건 타임스탬프를 그룹화합니다.
 * 다른 사용자의 사건을 합산하지 않고 주체별로 독립 격리합니다.
 */
function groupGetEventsBySubject(parsedEvents) {
  const bySub = new Map();
  for (const event of parsedEvents) {
    if (event.method !== 'GET') continue;
    if (!bySub.has(event.sub)) bySub.set(event.sub, []);
    bySub.get(event.sub).push(event.atMs);
  }
  return bySub;
}

/**
 * 슬라이딩 윈도우 알고리즘으로 임의의 10분 구간 내 폭주 조회 여부를 판별합니다.
 */
function hasBurstReadWindow(timestamps, windowMs, limit) {
  timestamps.sort((a, b) => a - b);
  let start = 0;
  for (let end = 0; end < timestamps.length; end += 1) {
    while (timestamps[end] - timestamps[start] >= windowMs) {
      start += 1; // 10분 밖은 같은 묶음이 아닙니다.
    }
    if (end - start + 1 > limit) {
      return true;
    }
  }
  return false;
}

export function detect(events) {
  if (!Array.isArray(events)) throw new TypeError('invalid_detection_events');

  const parsedEvents = readEvents(events);
  const bySub = groupGetEventsBySubject(parsedEvents);

  for (const [sub, times] of bySub) {
    if (hasBurstReadWindow(times, WINDOW_MS, BURST_LIMIT)) {
      return { action: 'propose_revocation', reasonCode: 'burst_read', subject: sub };
    }
  }

  return { action: 'observe' };
}
