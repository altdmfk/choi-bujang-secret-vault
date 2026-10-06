import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return response.status(500).json({ error: 'DATABASE_CONFIG_MISSING' });
  }

  let body = request.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { email, password } = body || {};
  if (!email || !password) {
    return response.status(400).json({ error: 'EMAIL_AND_PASSWORD_REQUIRED' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseSecretKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return response.status(401).json({ error: error.message });
    }

    return response.status(200).json({
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (err) {
    return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}
