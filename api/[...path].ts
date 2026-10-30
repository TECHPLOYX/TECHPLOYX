const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wkfmdtfhvdeyhhxatfll.supabase.co';
const ADMIN_USERNAME = 'admin';

const ALLOWED_RESOURCES = new Set([
  'leads?select=id,name,company,email,need,status,source,created_at,updated_at&order=created_at.desc',
  'lead_events?select=id,lead_id,event_type,from_status,to_status,created_at&order=created_at.desc&limit=20',
  'chat_sessions?select=id,locale,source,created_at&order=created_at.desc&limit=20',
  'chat_messages?select=id,session_id,role,content,created_at&order=created_at.asc&limit=200',
  'lead_notifications?select=id,lead_id,channel,recipient,status,attempts,last_error,created_at,sent_at&order=created_at.desc&limit=20',
  'sales_prospects?select=id,company,contact_name,contact_role,source,status,next_action,next_action_at,storage_path,notes,created_at,updated_at&order=updated_at.desc'
]);

function send(res: any, status: number, body: unknown): void {
  res.status(status).json(body);
}

async function supabaseRequest(path: string, serviceKey: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error('Supabase request failed');
  return text ? JSON.parse(text) : null;
}

function authorized(token: unknown): boolean {
  return typeof token === 'string' && token.length > 0 && token === process.env.TECHPLOYX_ACCESS_PIN;
}

export default async function handler(req: any, res: any): Promise<void> {
  const path = String(req.url || '').split('?')[0];
  const body = req.body || {};

  if (req.method === 'GET' && path === '/api/_healthcheck') {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const checks = { supabaseConfigured: Boolean(serviceKey), zohoConfigured: Boolean(process.env.ZOHO_MAIL_APP_PASSWORD) };
    if (serviceKey) {
      try {
        await Promise.all([
          supabaseRequest('leads?select=id&limit=1', serviceKey),
          supabaseRequest('chat_messages?select=id&limit=1', serviceKey),
          supabaseRequest('lead_notifications?select=id,status&limit=1', serviceKey)
        ]);
        Object.assign(checks, { database: true });
      } catch {
        Object.assign(checks, { database: false });
      }
    }
    return send(res, 200, { message: 'Success', checks });
  }

  if (req.method === 'POST' && path === '/api/chat') {
    return send(res, 503, { error: 'Chat adapter not configured in Vercel staging' });
  }

  if (req.method === 'POST' && path === '/api/admin/login') {
    if (body.username !== ADMIN_USERNAME || !authorized(body.password)) return send(res, 401, { error: 'Invalid credentials' });
    return send(res, 200, { session: { access_token: body.password, expires_at: Date.now() + 8 * 60 * 60 * 1000 } });
  }

  const token = body.token;
  if (path === '/api/admin/data' && req.method === 'POST') {
    if (!authorized(token) || typeof body.resource !== 'string' || !ALLOWED_RESOURCES.has(body.resource)) return send(res, 401, { error: 'Unauthorized' });
    try { return send(res, 200, await supabaseRequest(body.resource, process.env.SUPABASE_SERVICE_ROLE_KEY as string)); }
    catch { return send(res, 502, { error: 'Unable to load protected data' }); }
  }

  if (path.startsWith('/api/admin/lead/') && req.method === 'PUT') {
    if (!authorized(token)) return send(res, 401, { error: 'Unauthorized' });
    const id = path.slice('/api/admin/lead/'.length);
    try {
      await supabaseRequest('leads?id=eq.' + encodeURIComponent(id), process.env.SUPABASE_SERVICE_ROLE_KEY as string, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: body.status })
      });
      return send(res, 200, { ok: true });
    } catch { return send(res, 502, { error: 'Unable to update status' }); }
  }

  if (path === '/api/admin/mail-test' && req.method === 'POST') {
    if (!authorized(token)) return send(res, 401, { error: 'Unauthorized' });
    return send(res, 409, { ok: false, result: { error: 'mail_test_disabled_in_staging' } });
  }

  return send(res, 404, { error: 'Not found' });
}
