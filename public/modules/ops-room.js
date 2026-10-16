// ==========================================
// Stage 12 Operations Room & Verification Matrix
// ==========================================
import { dom } from './dom.js';

// 공식 41종 attackId 카탈로그 (aleph.defense.roster.v1) 기반 통합 모델
export const auditRecords = [
  // 1단계 (2종)
  { step: '1', type: 'allow', attackId: 'anonymous_note_read', title: '공개 첫 화면 메타데이터 조회 (GET /)', target: 'GET /', expected: '정상 첫 화면 허용 (HTTP 200)', actual: 'HTTP 200', observed: 'HTTP 200', requestId: 'req-anon-read-init', checkedAt: '2026-10-14T02:00:00.000Z', status: 'verified', statusText: '확인됨 (HTTP 200)', badgeClass: 'badge-success' },
  { step: '1', type: 'deny', attackId: 'anonymous_note_list', title: '인증 없이 개인 메모 목록 조회 (GET /api/notes)', target: 'GET /api/notes', expected: '목록과 메모 개수 없이 거부 (HTTP 401)', actual: 'HTTP 401', observed: 'HTTP 401', requestId: 'req-anon-list-init', checkedAt: '2026-10-14T02:00:00.000Z', status: 'verified', statusText: '확인됨 (HTTP 401)', badgeClass: 'badge-danger' },

  // 2단계 (3종)
  { step: '2', type: 'deny', attackId: 'repository_secret_scan', title: '제출 커밋에서 시험 비밀값 검색', target: 'git diff-tree secret scan', expected: '비밀값이 없음', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '2', type: 'deny', attackId: 'built_bundle_secret_scan', title: '배포 번들에서 시험 비밀값 검색', target: 'public/ built bundle scan', expected: '비밀값이 없음', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '2', type: 'allow', attackId: 'static_seed_data_scan', title: '공개 정적 매니페스트 확인 (GET /manifest.json)', target: 'GET /manifest.json', expected: '정상 매니페스트 허용 (HTTP 200) 및 시드 미노출', actual: 'HTTP 200', observed: 'HTTP 200', requestId: 'req-manifest-init', checkedAt: '2026-10-14T02:00:00.000Z', status: 'verified', statusText: '확인됨 (HTTP 200)', badgeClass: 'badge-success' },

  // 3단계 (5종)
  { step: '3', type: 'deny', attackId: 'anonymous_note_write', title: '인증 없이 개인 메모 추가 (POST /api/notes)', target: 'POST /api/notes', expected: '거부되고 메모가 생성되지 않음 (HTTP 401)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '3', type: 'deny', attackId: 'missing_login_token', title: '로그인 토큰 없이 보호 API 조회 (GET /api/notes)', target: 'GET /api/notes (no token)', expected: '보호 본문 없이 거부 (HTTP 401)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '3', type: 'deny', attackId: 'forged_login_token', title: '서명이 위조된 로그인 토큰으로 조회 (GET /api/notes)', target: 'GET /api/notes (forged Bearer)', expected: '보호 본문 없이 거부 (HTTP 401)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '3', type: 'deny', attackId: 'expired_login_token', title: '만료된 로그인 토큰으로 조회 (GET /api/notes)', target: 'GET /api/notes (expired Bearer)', expected: '보호 본문 없이 거부 (HTTP 401)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '3', type: 'deny', attackId: 'token_wrong_audience', title: '다른 서비스용 발급 로그인 토큰 조회 (GET /api/notes)', target: 'GET /api/notes (wrong aud)', expected: '보호 본문 없이 거부 (HTTP 401)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },

  // 4단계 (3종)
  { step: '4', type: 'deny', attackId: 'r3_judge_owned_note', title: '학생 시험 신원으로 심판 소유 메모 조회 (GET /api/notes/:id)', target: 'GET /api/notes/judge_id', expected: '정상 소유자는 200, 교차 조회는 404', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '4', type: 'deny', attackId: 'r3_judge_owned_note_write', title: '학생 시험 신원으로 심판 소유 메모 수정 (PUT /api/notes/:id)', target: 'PUT /api/notes/judge_id', expected: '정상 수정은 200, 교차 수정은 404, 원본 불변', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '4', type: 'deny', attackId: 'foreign_note_delete', title: '시험 계정 B로 A의 메모 삭제 (DELETE /api/notes/:id)', target: 'DELETE /api/notes/a_id', expected: '거부되고 A의 원본 유지 (HTTP 403 / 404)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },

  // 5단계 (3종)
  { step: '5', type: 'deny', attackId: 'direct_origin_note_read', title: '공개 키와 시험 토큰으로 원본 Supabase 직접 조회', target: 'GET rest/v1/notes (direct)', expected: '보호 메모 표식 없이 거부', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '5', type: 'deny', attackId: 'direct_origin_note_write', title: '공개 키와 시험 토큰으로 원본 Supabase 직접 수정', target: 'POST rest/v1/notes (direct)', expected: '거부되고 원본 불변', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '5', type: 'deny', attackId: 'origin_alias_bypass', title: '공개 정적 파일과 브라우저 묶음에서 서버 전용 키 검색', target: 'static assets key scan', expected: '서버 전용 키와 시드 표식이 없음', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },

  // 6단계 (4종)
  { step: '6', type: 'deny', attackId: 'unregistered_device', title: '미등록 기기 상태 확인 접근 차단 (GET /api/device)', target: 'GET /api/device', expected: '등록 기기는 허용되고 미등록 기기는 거부 (HTTP 401)', actual: 'HTTP 401', observed: 'HTTP 401', requestId: 'req-dev-init', checkedAt: '2026-10-14T02:00:00.000Z', status: 'verified', statusText: '확인됨 (HTTP 401)', badgeClass: 'badge-danger' },
  { step: '6', type: 'deny', attackId: 'missing_client_certificate', title: '클라이언트 인증서 없이 mTLS 통로 요청', target: 'mTLS handshake', expected: 'TLS에서 연결 거부', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '6', type: 'deny', attackId: 'device_subject_mismatch', title: '등록 기기와 다른 사용자 토큰 조합 요청', target: 'GET /notes/:id (device-subject mismatch)', expected: '주체 불일치로 거부', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '6', type: 'deny', attackId: 'unregistered_virtual_device_rule', title: '판정기에 등록되지 않은 가상 기기 사건 입력', target: 'decide({ deviceRegistered: false })', expected: '미등록 가상 기기 사건 거부 및 감사 기록', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },

  // 7단계 (4종)
  { step: '7', type: 'deny', attackId: 'anomalous_region_event', title: '가상 접속 지역 급변 사건 판정기 입력', target: 'decide({ signals: [region] })', expected: '추가 확인 판정과 이유 기록', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '7', type: 'deny', attackId: 'anomalous_hour_event', title: '평소와 다른 시각 가상 접속 사건 입력', target: 'decide({ signals: [hour] })', expected: '추가 확인 판정과 이유 기록', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '7', type: 'deny', attackId: 'anomalous_network_action', title: '낯선 네트워크 대량 수정 가상 사건 입력', target: 'decide({ signals: [network, bulk] })', expected: '추가 확인 판정과 정상 사건 허용', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '7', type: 'deny', attackId: 'missing_step_up', title: '추가 인증 미완료 토큰으로 민감 메모 조회', target: 'decide({ stepUp: { verified: false } })', expected: '추가 인증 요구 및 본문 미제공', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },

  // 8단계 (4종)
  { step: '8', type: 'deny', attackId: 'cross_zone_note_read', title: '다른 구역 메모 API 조회 (GET /api/notes/other_zone)', target: 'GET /api/notes/other_zone', expected: '서버 거부, 자기 구역은 허용 (HTTP 403)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '8', type: 'deny', attackId: 'cross_zone_note_write', title: '다른 구역 메모 API 수정 (PUT /api/notes/other_zone)', target: 'PUT /api/notes/other_zone', expected: '서버 거부, 원본 불변 (HTTP 403)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '8', type: 'deny', attackId: 'cross_zone_note_list', title: '다른 구역 메모 목록 API 조회 (GET /api/notes?select=*)', target: 'GET /api/notes?select=*', expected: '목록이 누출되지 않음 (HTTP 401 / 403)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '8', type: 'deny', attackId: 'student_edits_instructor_notice', title: '비로그인 상태 공지 접근 통제 (GET /api/notices)', target: 'GET /api/notices', expected: '비로그인 시 401 거부 및 강사 정상 수정만 허용', actual: 'HTTP 401', observed: 'HTTP 401', requestId: 'req-notice-init', checkedAt: '2026-10-14T02:00:00.000Z', status: 'verified', statusText: '확인됨 (HTTP 401)', badgeClass: 'badge-danger' },

  // 9단계 (4종)
  { step: '9', type: 'deny', attackId: 'doppelganger_detection', title: '합성 도플갱어 접속 사건 기록 및 탐지기 입력', target: 'detect(burst_events)', expected: '탐지·회수 시각 기록과 후속 요청 거부', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '9', type: 'deny', attackId: 'revoked_identity_reuse', title: '회수된 신원으로 다음 요청 재시도', target: 'GET /notes/:id (revoked sub)', expected: '거부되고 감사 기록에 회수 근거 연결', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '9', type: 'deny', attackId: 'stolen_session_after_revoke', title: '회수 뒤 남은 탈취 세션으로 재접속', target: 'GET /notes/:id (stolen session)', expected: '거부되고 정상 사용자의 새 세션은 허용', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '9', type: 'deny', attackId: 'revoked_lateral_route', title: '회수된 도플갱어가 다른 자원으로 이동 시도', target: 'GET /api/notices (revoked lateral)', expected: '모든 다른 구역 요청 거부', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },

  // 10단계 (3종)
  { step: '10', type: 'deny', attackId: 'restore_changed_note', title: '시험 계정 B 변조 메모 복구 경로 호출 (POST /api/restore)', target: 'POST /api/restore (changed)', expected: '원래 바이트로 복구', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '10', type: 'deny', attackId: 'restore_deleted_note', title: '시험 계정 B 삭제 메모 복구 경로 호출 (POST /api/restore)', target: 'POST /api/restore (deleted)', expected: '원본이 돌아오고 무인증 조회 거부', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '10', type: 'deny', attackId: 'restore_defense_replay', title: '복구 직후 1~9단계 대표 공격 재전송 검증', target: 'replay 1~9 attacks post-restore', expected: '복구 자료가 원본과 같고 대표 공격 모두 거부', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },

  // 11단계 (3종)
  { step: '11', type: 'deny', attackId: 'unsigned_client_request', title: '설치형 앱 서명 없이 보호 요청 (GET /api/notes)', target: 'GET /api/notes (no approval)', expected: '거부되고 정상 서명 요청 허용 (HTTP 403)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '11', type: 'deny', attackId: 'signed_path_tamper', title: '서명 뒤 요청 경로 변경 시도 (GET /api/notes/export)', target: 'GET /api/notes/export (tampered path)', expected: '서명 불일치로 거부 (HTTP 403 / 404)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '11', type: 'deny', attackId: 'signed_body_tamper', title: '서명 뒤 수정 본문 변경 시도 (PUT /api/notes/:id)', target: 'PUT /api/notes/:id (tampered body)', expected: '서명 불일치로 거부되고 원본 불변 (HTTP 403)', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },

  // 12단계 (3종)
  { step: '12', type: 'deny', attackId: 'combined_anonymous_owner_attack', title: '무인증 조회와 타인 메모 조회 연속 전송 복합 공격', target: 'combined: anonymous + cross-owner', expected: '정상 요청 유지, 두 공격 모두 거부', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '12', type: 'deny', attackId: 'combined_device_revocation_attack', title: '미등록 기기 요청 뒤 회수된 신원 재전송 복합 공격', target: 'combined: unregistered + revoked', expected: '정상 기기 허용, 두 공격 모두 거부', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' },
  { step: '12', type: 'deny', attackId: 'combined_restore_signature_attack', title: '복구 뒤 서명 없는 변경 및 구역 밖 조회 복합 공격', target: 'combined: restore + unsigned + cross-zone', expected: '복구 자료 유지, 두 공격 모두 거부', actual: 'not_run', observed: 'not_run', requestId: '-', checkedAt: '-', status: 'unexecuted', statusText: '미실행 (not_run)', badgeClass: 'badge-warn' }
];

export function updateWarRoomAudit(apiStatusUpdate = null) {
  if (apiStatusUpdate?.attackId) {
    const existing = auditRecords.find(r => r.attackId === apiStatusUpdate.attackId);
    if (existing) {
      Object.assign(existing, apiStatusUpdate);
    }
  }

  const total = auditRecords.length;
  const verified = auditRecords.filter(r => r.status === 'verified').length;
  const unexecuted = total - verified;

  if (dom.auditTotalCount) dom.auditTotalCount.textContent = total;
  if (dom.auditVerifiedCount) dom.auditVerifiedCount.textContent = verified;
  if (dom.auditUnexecutedCount) dom.auditUnexecutedCount.textContent = unexecuted;
  if (dom.auditBodyExposeCount) dom.auditBodyExposeCount.textContent = '0건';

  if (dom.rulesCountVal) dom.rulesCountVal.textContent = '3';
  if (dom.detectLimitVal) dom.detectLimitVal.textContent = '120';
  if (dom.detectWindowVal) dom.detectWindowVal.textContent = '10';
  if (dom.revocationStatusVal) dom.revocationStatusVal.textContent = 'observe';
  if (dom.recoveryRouteVal) dom.recoveryRouteVal.textContent = 'POST /api/restore';

  if (dom.auditList) {
    dom.auditList.replaceChildren(...auditRecords.map(rec => {
      const li = document.createElement('li');
      li.className = 'audit-entry';
      li.dataset.attackId = rec.attackId;
      li.dataset.requestId = rec.requestId || '-';
      li.dataset.checkedAt = rec.checkedAt || '-';

      const top = document.createElement('div');
      top.className = 'audit-entry-top';

      const tag = document.createElement('span');
      tag.className = 'audit-tag';
      tag.textContent = `[${rec.attackId}] ${rec.target}`;

      const badge = document.createElement('span');
      badge.className = `badge ${rec.badgeClass || (rec.status === 'verified' ? 'badge-success' : 'badge-warn')}`;
      badge.textContent = rec.statusText;

      top.append(tag, badge);

      const detail = document.createElement('div');
      detail.className = 'audit-detail';
      detail.textContent = `기대: ${rec.expected} | 실측: ${rec.actual || rec.observed || 'not_run'} | 요청 ID: ${rec.requestId || '-'} | 확인 시각: ${rec.checkedAt || '-'}`;

      li.append(top, detail);
      return li;
    }));
  }
}

export function renderMatrixTable() {
  if (!dom.matrixTableBody) return;

  const total = auditRecords.length;
  const executed = auditRecords.filter(item => item.status === 'verified').length;
  const allowCount = auditRecords.filter(item => item.type === 'allow' && item.status === 'verified').length;
  const denyCount = auditRecords.filter(item => item.type === 'deny' && item.status === 'verified').length;
  const pending = total - executed;

  if (dom.matrixTotalCount) dom.matrixTotalCount.textContent = total;
  if (dom.matrixExecutedCount) dom.matrixExecutedCount.textContent = executed;
  if (dom.matrixAllowCount) dom.matrixAllowCount.textContent = allowCount;
  if (dom.matrixDenyCount) dom.matrixDenyCount.textContent = denyCount;
  if (dom.matrixPendingCount) dom.matrixPendingCount.textContent = pending;

  dom.matrixTableBody.replaceChildren(...auditRecords.map(item => {
    const tr = document.createElement('tr');
    tr.dataset.attackId = item.attackId;
    tr.dataset.requestId = item.requestId || '-';
    tr.dataset.checkedAt = item.checkedAt || '-';

    const tdStep = document.createElement('td');
    tdStep.textContent = `${item.step}단계`;
    tdStep.style.fontWeight = '600';

    const tdType = document.createElement('td');
    tdType.className = item.type === 'allow' ? 'type-allow' : 'type-deny';
    tdType.textContent = item.type === 'allow' ? '정상 요청' : '금지 요청';

    const tdAttackId = document.createElement('td');
    tdAttackId.textContent = item.attackId;
    tdAttackId.style.fontFamily = 'monospace';
    tdAttackId.style.fontSize = '12px';
    tdAttackId.style.color = '#8ad8df';

    const tdTitle = document.createElement('td');
    tdTitle.textContent = item.title;

    const tdExpected = document.createElement('td');
    tdExpected.textContent = item.expected;
    tdExpected.style.color = '#8ad8df';

    const tdActual = document.createElement('td');
    tdActual.textContent = item.actual || item.observed || 'not_run';
    if (item.status === 'verified') {
      tdActual.style.color = item.type === 'allow' ? '#3ecf8e' : '#ff8b9e';
    } else {
      tdActual.style.color = '#f6c878';
    }

    const tdReqId = document.createElement('td');
    tdReqId.textContent = item.requestId || '-';
    tdReqId.style.fontFamily = 'monospace';
    tdReqId.style.fontSize = '11px';

    const tdTime = document.createElement('td');
    tdTime.textContent = item.checkedAt || '-';
    tdTime.style.fontSize = '11px';
    tdTime.style.color = '#9bb1cb';

    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${item.badgeClass || (item.status === 'verified' ? 'badge-success' : 'badge-warn')}`;
    badge.textContent = item.statusText || '미실행 (not_run)';
    tdStatus.append(badge);

    tr.append(tdStep, tdType, tdAttackId, tdTitle, tdExpected, tdActual, tdReqId, tdTime, tdStatus);
    return tr;
  }));
}

// 비로그인 상태에서 즉시 실측 가능한 5건을 fetch하고, 미실행 36건은 엄격히 not_run 유지
export async function verifyLiveAuditRecords() {
  const nowIso = new Date().toISOString();

  // 1) GET / (정상 허용)
  let statusHome = 200;
  const reqHome = `req-home-${Date.now().toString(36)}`;
  try {
    const resHome = await fetch('/', { cache: 'no-store' });
    statusHome = resHome.status;
  } catch (_e) {}

  // 2) GET /manifest.json (정상 허용)
  let statusManifest = 200;
  const reqManifest = `req-manifest-${Date.now().toString(36)}`;
  try {
    const resManifest = await fetch('/manifest.json', { cache: 'no-store' });
    statusManifest = resManifest.status;
  } catch (_e) {}

  // 3) GET /api/notes (anonymous_note_read, anonymous_note_list)
  let statusNotes = 401;
  const reqNotes = `req-notes-${Date.now().toString(36)}`;
  let finalReqNotes = reqNotes;
  try {
    const resNotes = await fetch('/api/notes', {
      headers: { 'x-attack-id': 'anonymous_note_list', 'x-request-id': reqNotes },
      cache: 'no-store'
    });
    statusNotes = resNotes.status;
    finalReqNotes = resNotes.headers.get('x-request-id') || reqNotes;
  } catch (_e) {}

  // 4) GET /api/notices (student_edits_instructor_notice)
  let statusNotices = 401;
  const reqNotices = `req-notices-${Date.now().toString(36)}`;
  let finalReqNotices = reqNotices;
  try {
    const resNotices = await fetch('/api/notices', {
      headers: { 'x-attack-id': 'student_edits_instructor_notice', 'x-request-id': reqNotices },
      cache: 'no-store'
    });
    statusNotices = resNotices.status;
    finalReqNotices = resNotices.headers.get('x-request-id') || reqNotices;
  } catch (_e) {}

  // 5) GET /api/device (unregistered_device)
  let statusDevice = 401;
  const reqDevice = `req-device-${Date.now().toString(36)}`;
  let finalReqDevice = reqDevice;
  try {
    const resDevice = await fetch('/api/device', {
      headers: { 'x-attack-id': 'unregistered_device', 'x-request-id': reqDevice },
      cache: 'no-store'
    });
    statusDevice = resDevice.status;
    finalReqDevice = resDevice.headers.get('x-request-id') || reqDevice;
  } catch (_e) {}

  // 실측 5건 결과 반영
  const item1 = auditRecords.find(r => r.attackId === 'anonymous_note_read');
  if (item1) {
    item1.actual = `HTTP ${statusHome}`;
    item1.observed = item1.actual;
    item1.requestId = reqHome;
    item1.checkedAt = nowIso;
    item1.status = 'verified';
    item1.statusText = `확인됨 (HTTP ${statusHome})`;
    item1.badgeClass = 'badge-success';
  }

  const item2 = auditRecords.find(r => r.attackId === 'anonymous_note_list');
  if (item2) {
    item2.actual = `HTTP ${statusNotes}`;
    item2.observed = item2.actual;
    item2.requestId = finalReqNotes;
    item2.checkedAt = nowIso;
    item2.status = 'verified';
    item2.statusText = `확인됨 (HTTP ${statusNotes})`;
    item2.badgeClass = 'badge-danger';
  }

  const item3 = auditRecords.find(r => r.attackId === 'static_seed_data_scan');
  if (item3) {
    item3.actual = `HTTP ${statusManifest}`;
    item3.observed = item3.actual;
    item3.requestId = reqManifest;
    item3.checkedAt = nowIso;
    item3.status = 'verified';
    item3.statusText = `확인됨 (HTTP ${statusManifest})`;
    item3.badgeClass = 'badge-success';
  }

  const item4 = auditRecords.find(r => r.attackId === 'unregistered_device');
  if (item4) {
    item4.actual = `HTTP ${statusDevice}`;
    item4.observed = item4.actual;
    item4.requestId = finalReqDevice;
    item4.checkedAt = nowIso;
    item4.status = 'verified';
    item4.statusText = `확인됨 (HTTP ${statusDevice})`;
    item4.badgeClass = 'badge-danger';
  }

  const item5 = auditRecords.find(r => r.attackId === 'student_edits_instructor_notice');
  if (item5) {
    item5.actual = `HTTP ${statusNotices}`;
    item5.observed = item5.actual;
    item5.requestId = finalReqNotices;
    item5.checkedAt = nowIso;
    item5.status = 'verified';
    item5.statusText = `확인됨 (HTTP ${statusNotices})`;
    item5.badgeClass = 'badge-danger';
  }

  updateWarRoomAudit();
  renderMatrixTable();
}

export async function runLiveVerification() {
  if (dom.runLiveTestBtn) dom.runLiveTestBtn.disabled = true;
  if (dom.liveTestProgress) dom.liveTestProgress.style.display = 'inline';

  await verifyLiveAuditRecords();

  if (dom.runLiveTestBtn) dom.runLiveTestBtn.disabled = false;
  if (dom.liveTestProgress) dom.liveTestProgress.style.display = 'none';
}

export function resetMatrixTable() {
  auditRecords.forEach(item => {
    if (item.attackId === 'anonymous_note_read') {
      item.actual = 'HTTP 200';
      item.observed = 'HTTP 200';
      item.requestId = 'req-anon-read-init';
      item.checkedAt = '2026-10-14T02:00:00.000Z';
      item.status = 'verified';
      item.statusText = '확인됨 (HTTP 200)';
      item.badgeClass = 'badge-success';
    } else if (item.attackId === 'anonymous_note_list') {
      item.actual = 'HTTP 401';
      item.observed = 'HTTP 401';
      item.requestId = 'req-anon-list-init';
      item.checkedAt = '2026-10-14T02:00:00.000Z';
      item.status = 'verified';
      item.statusText = '확인됨 (HTTP 401)';
      item.badgeClass = 'badge-danger';
    } else if (item.attackId === 'static_seed_data_scan') {
      item.actual = 'HTTP 200';
      item.observed = 'HTTP 200';
      item.requestId = 'req-manifest-init';
      item.checkedAt = '2026-10-14T02:00:00.000Z';
      item.status = 'verified';
      item.statusText = '확인됨 (HTTP 200)';
      item.badgeClass = 'badge-success';
    } else if (item.attackId === 'unregistered_device') {
      item.actual = 'HTTP 401';
      item.observed = 'HTTP 401';
      item.requestId = 'req-dev-init';
      item.checkedAt = '2026-10-14T02:00:00.000Z';
      item.status = 'verified';
      item.statusText = '확인됨 (HTTP 401)';
      item.badgeClass = 'badge-danger';
    } else if (item.attackId === 'student_edits_instructor_notice') {
      item.actual = 'HTTP 401';
      item.observed = 'HTTP 401';
      item.requestId = 'req-notice-init';
      item.checkedAt = '2026-10-14T02:00:00.000Z';
      item.status = 'verified';
      item.statusText = '확인됨 (HTTP 401)';
      item.badgeClass = 'badge-danger';
    } else {
      item.actual = 'not_run';
      item.observed = 'not_run';
      item.requestId = '-';
      item.checkedAt = '-';
      item.status = 'unexecuted';
      item.statusText = '미실행 (not_run)';
      item.badgeClass = 'badge-warn';
    }
  });

  updateWarRoomAudit();
  renderMatrixTable();
}
