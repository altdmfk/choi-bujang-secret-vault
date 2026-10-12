import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createLoginVerifier } from '../src/verify-login.mjs';

let loginVerifier = null;

async function getVerifier(supabaseSecretKey) {
  if (!loginVerifier) {
    const configPath = resolve(process.cwd(), 'aleph.config.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    loginVerifier = createLoginVerifier({
      config,
      supabaseSecretKey,
    });
  }
  return loginVerifier;
}

const INSTRUCTOR_NOTICES = [
  {
    id: '1',
    resourceId: 'notice:1',
    title: '[강사 공지] 8단계 구역 분리 지침',
    body: '자료실 메모(notes)와 강사 공지(notices)는 분리된 구역 및 자원 ID로 통제됩니다.',
    author: 'instructor',
    category: 'notice',
  },
  {
    id: '2',
    resourceId: 'notice:2',
    title: '[수업 공지] 시스템 보안 실습 주의사항',
    body: '실습 중 인가되지 않은 타인 메모나 시스템 자원에 접근을 시도하지 마세요.',
    author: 'instructor',
    category: 'notice',
  },
];

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  const authorization = request.headers.authorization;
  if (!authorization) {
    return response.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';
  try {
    const verifyLogin = await getVerifier(supabaseSecretKey);
    const verifiedUser = await verifyLogin(authorization);
    if (!verifiedUser || !verifiedUser.userId) {
      return response.status(401).json({ error: 'UNAUTHORIZED' });
    }
  } catch (_err) {
    return response.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const method = request.method;
  const id = request.query?.id;

  // 구역 검증: 메모 구역 자원 ID로 직접 접근 시도 시 교차 접근 차단
  if (id && (String(id).startsWith('note:') || String(id).startsWith('note-'))) {
    return response.status(403).json({ error: 'CROSS_ZONE_ACCESS_DENIED' });
  }

  // 기능 경로 차단 (:id 자리에 export 등 기능 경로 접근 방지)
  if (id && ['export', 'import', 'backup', 'admin'].includes(String(id).toLowerCase())) {
    return response.status(400).json({ error: 'INVALID_RESOURCE_ID' });
  }

  if (method === 'GET') {
    if (id) {
      const notice = INSTRUCTOR_NOTICES.find(n => n.id === String(id) || n.resourceId === String(id));
      if (!notice) {
        return response.status(404).json({ error: 'NOTICE_NOT_FOUND' });
      }
      return response.status(200).json(notice);
    }
    return response.status(200).json(INSTRUCTOR_NOTICES);
  }

  // 공지사항 수정/추가/삭제 시도 시:
  // 클라이언트 요청 본문(body.role)이나 헤더의 role을 믿지 않고,
  // 검증된 사용자가 학생이므로 강사 권한 부재로 403 거부
  return response.status(403).json({ error: 'INSTRUCTOR_ROLE_REQUIRED' });
}
