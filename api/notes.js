import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
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

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return response.status(500).json({ error: 'DATABASE_CONFIG_MISSING' });
  }

  const authorization = request.headers.authorization;
  if (!authorization) {
    return response.status(401).json({ error: 'UNAUTHORIZED' });
  }

  let verifiedUser = null;
  try {
    const verifyLogin = await getVerifier(supabaseSecretKey);
    verifiedUser = await verifyLogin(authorization);
  } catch (_err) {
    return response.status(401).json({ error: 'UNAUTHORIZED' });
  }

  if (!verifiedUser || !verifiedUser.userId) {
    return response.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const currentUserId = verifiedUser.userId;
  const supabase = createClient(supabaseUrl, supabaseSecretKey);
  const method = request.method;
  const id = request.query?.id;

  // 1. 목록 조회: GET /api/notes (본인 소유 메모만 조회)
  if (method === 'GET' && !id) {
    try {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('id, title, content, owner_id')
        .eq('owner_id', currentUserId)
        .order('id', { ascending: true });

      if (error) {
        return response.status(500).json({ error: 'DATABASE_QUERY_FAILED' });
      }

      const formatted = (notes || []).map(note => ({
        id: String(note.id),
        title: note.title,
        body: note.content,
      }));

      return response.status(200).json(formatted);
    } catch (_err) {
      return response.status(500).json({ error: 'SERVER_ERROR' });
    }
  }

  // 2. 단건 조회: GET /api/notes/:id (본인 소유 확인, 타인 메모는 403 거부)
  if (method === 'GET' && id) {
    try {
      const { data: note, error } = await supabase
        .from('notes')
        .select('id, title, content, owner_id')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return response.status(500).json({ error: 'DATABASE_QUERY_FAILED' });
      }
      if (!note) {
        return response.status(404).json({ error: 'NOTE_NOT_FOUND' });
      }
      if (note.owner_id !== currentUserId) {
        return response.status(403).json({ error: 'FORBIDDEN' });
      }

      return response.status(200).json({
        id: String(note.id),
        title: note.title,
        body: note.content,
      });
    } catch (_err) {
      return response.status(500).json({ error: 'SERVER_ERROR' });
    }
  }

  // 3. 메모 추가: POST /api/notes -> {id, title, body} (본인 ID로만 저장)
  if (method === 'POST') {
    let bodyData = request.body;
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch { bodyData = {}; }
    }
    const { title, body } = bodyData || {};
    const noteId = bodyData?.id || randomUUID();

    if (!title || typeof title !== 'string') {
      return response.status(400).json({ error: 'INVALID_TITLE' });
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          id: noteId,
          title: title,
          content: body || '',
          owner_id: currentUserId,
        })
        .select('id, title, content')
        .single();

      if (error) {
        return response.status(500).json({ error: 'DATABASE_INSERT_FAILED', details: error.message });
      }

      return response.status(201).json({
        id: String(data.id),
        title: data.title,
        body: data.content,
      });
    } catch (_err) {
      return response.status(500).json({ error: 'SERVER_ERROR' });
    }
  }

  // 4. 메모 수정: PUT /api/notes/:id (기존 행과 새 행 소유자 모두 본인이어야 함, 소유자 변경 거부)
  if (method === 'PUT') {
    if (!id) return response.status(400).json({ error: 'NOTE_ID_REQUIRED' });

    let bodyData = request.body;
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch { bodyData = {}; }
    }
    const { title, body } = bodyData || {};

    // 본문에서 owner_id를 조작하려 하거나 본인이 아닌 다른 ID로 바꾸려는 경우 거부
    if (bodyData?.owner_id !== undefined && bodyData.owner_id !== currentUserId) {
      return response.status(403).json({ error: 'FORBIDDEN' });
    }

    try {
      // 1) 기존 행 조회하여 소유자 확인
      const { data: existing, error: fetchErr } = await supabase
        .from('notes')
        .select('id, owner_id')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) {
        return response.status(500).json({ error: 'DATABASE_QUERY_FAILED' });
      }
      if (!existing) {
        return response.status(404).json({ error: 'NOTE_NOT_FOUND' });
      }
      if (existing.owner_id !== currentUserId) {
        return response.status(403).json({ error: 'FORBIDDEN' });
      }

      // 2) 수정 payload 구성 (owner_id는 항상 본인 ID 유지)
      const updatePayload = {
        owner_id: currentUserId,
      };
      if (title !== undefined) updatePayload.title = title;
      if (body !== undefined) updatePayload.content = body;

      const { data, error } = await supabase
        .from('notes')
        .update(updatePayload)
        .eq('id', id)
        .eq('owner_id', currentUserId)
        .select('id, title, content')
        .maybeSingle();

      if (error) {
        return response.status(500).json({ error: 'DATABASE_UPDATE_FAILED' });
      }
      if (!data) {
        return response.status(404).json({ error: 'NOTE_NOT_FOUND' });
      }

      return response.status(200).json({
        id: String(data.id),
        title: data.title,
        body: data.content,
      });
    } catch (_err) {
      return response.status(500).json({ error: 'SERVER_ERROR' });
    }
  }

  // 5. 메모 삭제: DELETE /api/notes/:id (본인 소유 행만 삭제 허용)
  if (method === 'DELETE') {
    if (!id) return response.status(400).json({ error: 'NOTE_ID_REQUIRED' });

    try {
      // 1) 기존 행 소유자 확인
      const { data: existing, error: fetchErr } = await supabase
        .from('notes')
        .select('id, owner_id')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) {
        return response.status(500).json({ error: 'DATABASE_QUERY_FAILED' });
      }
      if (!existing) {
        return response.status(404).json({ error: 'NOTE_NOT_FOUND' });
      }
      if (existing.owner_id !== currentUserId) {
        return response.status(403).json({ error: 'FORBIDDEN' });
      }

      // 2) 본인 소유 메모 삭제
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('owner_id', currentUserId);

      if (error) {
        return response.status(500).json({ error: 'DATABASE_DELETE_FAILED' });
      }

      return response.status(200).json({ success: true, deletedId: id });
    } catch (_err) {
      return response.status(500).json({ error: 'SERVER_ERROR' });
    }
  }

  return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
}
