import type { Config, Context } from '@netlify/functions';

const SUPABASE_URL = 'https://wkfmdtfhvdeyhhxatfll.supabase.co';
function env(name: string): string { return Netlify.env.get(name) ?? ''; }
function cookieValue(req: Request, name: string): string {
  const item = (req.headers.get('cookie') ?? '').split(';').map(part => part.trim()).find(part => part.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}
function json(data: unknown, status = 200): Response { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const pin = env('TECHPLOYX_ACCESS_PIN'), serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!pin || !serviceKey || cookieValue(req, 'techployx_admin_session') !== pin) return json({ error: 'Unauthorized' }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const projectCode = String(body.project_code ?? '').trim().toUpperCase();
  const gateKey = String(body.gate_key ?? '').trim();
  const status = String(body.status ?? '').trim();
  const evidence = String(body.evidence ?? '').trim();
  if (!projectCode || !gateKey || !['pending','verified','blocked'].includes(status)) return json({ error: 'project_code, gate_key and valid status are required' }, 400);
  if ((status === 'verified' || status === 'blocked') && !evidence) return json({ error: 'Evidence is required for verified or blocked status' }, 400);

  const headers = { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  const response = await fetch(SUPABASE_URL + '/rest/v1/project_gate_status?on_conflict=project_code,gate_key', {
    method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ project_code: projectCode, gate_key: gateKey, status, evidence: evidence || null, checked_at: status === 'pending' ? null : new Date().toISOString(), updated_at: new Date().toISOString() }),
  });
  const responseText = await response.text();
  console.log(JSON.stringify({ projectCode, gateKey, status, supabaseStatus: response.status, supabaseResponse: responseText.slice(0, 500) }));
  if (!response.ok) return json({ error: 'Gate update failed', detail: 'Supabase status ' + response.status }, 502);
  const rows = responseText ? JSON.parse(responseText) : [];
  if (!rows.length) return json({ error: 'Gate not found' }, 404);
  await fetch(SUPABASE_URL + '/rest/v1/continuity_logs', { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify({ project_code: projectCode, type: 'gate_update', message: 'Puerta ' + gateKey + ' actualizada a ' + status + (evidence ? ': ' + evidence : ''), needs_human: status !== 'verified' }) });
  return json({ ok: true, gate: rows[0] });
};
export const config: Config = { path: '/project-gate-update' };
