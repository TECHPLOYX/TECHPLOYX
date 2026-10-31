type Context = { event: any; callback: (error: any, response?: any) => void };

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wkfmdtfhvdeyhhxatfll.supabase.co';
const ALLOWED_RESOURCES = new Set([
  'leads?select=id,name,company,email,need,status,source,created_at,updated_at&order=created_at.desc',
  'lead_events?select=id,lead_id,event_type,from_status,to_status,created_at&order=created_at.desc&limit=20',
  'chat_sessions?select=id,locale,source,created_at&order=created_at.desc&limit=20',
  'chat_messages?select=id,session_id,role,content,created_at&order=created_at.asc&limit=200',
  'lead_notifications?select=id,lead_id,channel,recipient,status,attempts,last_error,created_at,sent_at&order=created_at.desc&limit=20',
  'sales_prospects?select=id,company,contact_name,contact_role,source,status,next_action,next_action_at,storage_path,notes,created_at,updated_at&order=updated_at.desc'
]);

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

async function db(path: string, init: RequestInit = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...init,
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  const text = await response.text();
  if (!response.ok) throw new Error('Supabase request failed');
  return text ? JSON.parse(text) : null;
}

function authorized(token: unknown) {
  return typeof token === 'string' && token.length > 0 && token === process.env.TECHPLOYX_ACCESS_PIN;
}

export const handler = async (event: any) => {
  const path = event.path.replace(/^\/.netlify\/functions\/api/, '') || '/';
  const body = event.body ? JSON.parse(event.body) : {};
  const method = event.httpMethod;

  if (method === 'GET' && path === '/_healthcheck') {
    const checks: Record<string, boolean> = {
      supabaseConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      zohoConfigured: Boolean(process.env.ZOHO_MAIL_APP_PASSWORD)
    };
    try { await db('leads?select=id&limit=1'); checks.database = true; } catch { checks.database = false; }
    return json(200, { message: 'Success', checks });
  }

  if (method === 'POST' && path === '/chat') {
    return json(503, { error: 'Chat adapter not configured in staging' });
  }

  if (method === 'POST' && path === '/admin/login') {
    if (body.username !== 'admin' || !authorized(body.password)) return json(401, { error: 'Invalid credentials' });
    return json(200, { session: { access_token: body.password, expires_at: Date.now() + 8 * 60 * 60 * 1000 } });
  }

  if (method === 'POST' && path === '/admin/data') {
    if (!authorized(body.token) || typeof body.resource !== 'string' || !ALLOWED_RESOURCES.has(body.resource)) return json(401, { error: 'Unauthorized' });
    try { return json(200, await db(body.resource)); } catch { return json(502, { error: 'Unable to load protected data' }); }
  }

  if (method === 'PUT' && path.startsWith('/admin/lead/')) {
    if (!authorized(body.token)) return json(401, { error: 'Unauthorized' });
    try {
      await db('leads?id=eq.' + encodeURIComponent(path.slice('/admin/lead/'.length)), {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: body.status })
      });
      return json(200, { ok: true });
    } catch { return json(502, { error: 'Unable to update status' }); }
  }

  if (method === 'POST' && path === '/admin/mail-test') {
    if (!authorized(body.token)) return json(401, { error: 'Unauthorized' });
    return json(409, { ok: false, result: { error: 'mail_test_disabled_in_staging' } });
  }

  return json(404, { error: 'Not found' });
};
