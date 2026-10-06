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

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return response.status(500).json({ error: 'DATABASE_CONFIG_MISSING' });
  }

  const authorization = request.headers.authorization;
  if (!authorization) {
    return response.status(401).json({ error: 'UNAUTHORIZED' });
  }

  try {
    const verifyLogin = await getVerifier(supabaseSecretKey);
    const verified = await verifyLogin(authorization);

    if (!verified || !verified.userId) {
      return response.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);
    const { data: notes, error } = await supabase
      .from('notes')
      .select('title, content')
      .order('id', { ascending: true });

    if (error) {
      return response.status(500).json({ error: 'DATABASE_QUERY_FAILED' });
    }

    return response.status(200).json({ notes: notes || [] });
  } catch (_err) {
    return response.status(500).json({ error: 'SERVER_ERROR' });
  }
}
