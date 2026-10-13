// 9단계에서 학생이 채우는 탐지 함수입니다. 이 기본값은 어떤 접속도 회수하지 않습니다.
// 반 엔진이 검증한 사건만 전달해야 하며, 브라우저가 보낸 사용자 번호는 받지 않습니다.

// 계약(docs/DETECT_EVENTS.md)에 있는 세 값만 읽습니다: at, method, identity.sub.
// 메모 내용·토큰·실명 등 그 밖의 필드는 복사하지 않으므로 저장하거나 출력할 수 없습니다.
function readEvent(event) {
  if (event === null || typeof event !== 'object') return null;
  const { at, method } = event;
  const sub = event.identity && typeof event.identity === 'object' ? event.identity.sub : undefined;
  if (typeof at !== 'string' || Number.isNaN(Date.parse(at))) return null;
  if (typeof method !== 'string' || method === '') return null;
  if (typeof sub !== 'string' || sub === '') return null;
  return { atMs: Date.parse(at), method: method.toUpperCase(), sub };
}

// 읽을 수 없는 사건은 건너뜁니다. 오류 메시지에도 사건 값을 넣지 않습니다.
function readEvents(events) {
  return events.map(readEvent).filter(Boolean);
}

const WINDOW_MS = 10 * 60 * 1000;
const BURST_LIMIT = 120; // 정확히 120건은 대상이 아니고, 넘어야 합니다.

export function detect(events) {
  if (!Array.isArray(events)) throw new TypeError('invalid_detection_events');
  const bySub = new Map();
  for (const event of readEvents(events)) {
    if (event.method !== 'GET') continue;
    if (!bySub.has(event.sub)) bySub.set(event.sub, []);
    bySub.get(event.sub).push(event.atMs);
  }
  // 사용자별로 따로 세어 다른 사용자의 사건을 합산하지 않습니다.
  for (const [sub, times] of bySub) {
    times.sort((a, b) => a - b);
    let start = 0;
    for (let end = 0; end < times.length; end += 1) {
      while (times[end] - times[start] >= WINDOW_MS) start += 1; // 10분 밖은 같은 묶음이 아닙니다.
      if (end - start + 1 > BURST_LIMIT) {
        return { action: 'propose_revocation', reasonCode: 'burst_read', subject: sub };
      }
    }
  }
  return { action: 'observe' };
}
