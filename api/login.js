import { getSupabaseServerClient, parseRequestBody } from '../src/api-helpers.mjs';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return response.status(500).json({ error: 'DATABASE_CONFIG_MISSING' });
  }

  const { email, password } = parseRequestBody(request);
  if (!email || !password) {
    return response.status(400).json({ error: 'EMAIL_AND_PASSWORD_REQUIRED' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return response.status(401).json({ error: error.message });
    }

    const token = data.session.access_token;
    response.setHeader('Set-Cookie', `sb_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`);

    return response.status(200).json({
      access_token: token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (_err) {
    return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}
