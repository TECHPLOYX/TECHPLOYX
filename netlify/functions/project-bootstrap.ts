import type { Config, Context } from '@netlify/functions';

const SUPABASE_URL = 'https://wkfmdtfhvdeyhhxatfll.supabase.co';

function env(name: string): string { return Netlify.env.get(name) ?? ''; }
function cookieValue(req: Request, name: string): string {
  const item = (req.headers.get('cookie') ?? '').split(';').map(part => part.trim()).find(part => part.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}
function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const pin = env('TECHPLOYX_ACCESS_PIN'), serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!pin || !serviceKey || cookieValue(req, 'techployx_admin_session') !== pin) return json({ error: 'Unauthorized' }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const code = String(body.code ?? '').trim().toUpperCase();
  const name = String(body.name ?? '').trim();
  const objective = String(body.objective ?? '').trim();
  const nextAction = String(body.next_action ?? '').trim();
  const operationMode = String(body.operation_mode ?? 'centralized').trim();
  const clientScope = String(body.client_scope ?? 'TECHPLOYX').trim();

  if (!/^[A-Z0-9_-]{2,40}$/.test(code) || !name || !objective || !nextAction) {
    return json({ error: 'Required fields: code, name, objective, next_action' }, 400);
  }
  if (!['centralized', 'standalone'].includes(operationMode)) return json({ error: 'Invalid operation_mode' }, 400);
  if (operationMode === 'standalone' && clientScope === 'TECHPLOYX') return json({ error: 'Standalone projects require an isolated client_scope' }, 400);

  const project = {
    code, name, status: 'active', priority: Number(body.priority ?? 3),
    current_focus: objective, next_action: nextAction, blocked_reason: null,
    last_reviewed_at: null, deploy_platform: 'Netlify',
    deploy_route: 'GitHub -> Netlify -> Supabase -> Zoho -> S3',
    database_service: 'Supabase', storage_service: 'Amazon S3', email_service: 'Zoho',
    migration_status: 'standard_route', template_key: 'standard-web-project',
    operation_mode: operationMode, client_scope: clientScope,
  };
  const response = await fetch(SUPABASE_URL + '/rest/v1/projects', {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(project),
  });
  if (!response.ok) return json({ error: 'Project registration failed' }, 502);
  return json({ ok: true, project: (await response.json())[0], next: 'Validate repository, secrets, healthcheck, backend, notifications, backup and recovery before deployment.' }, 201);
};

export const config: Config = { path: '/project-bootstrap' };
