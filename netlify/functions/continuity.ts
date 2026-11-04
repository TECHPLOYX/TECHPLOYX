import type { Config, Context } from '@netlify/functions';

const SUPABASE_URL = 'https://wkfmdtfhvdeyhhxatfll.supabase.co';
function env(name: string): string { return Netlify.env.get(name) ?? ''; }
function cookieValue(req: Request, name: string): string {
  const item = (req.headers.get('cookie') ?? '').split(';').map(part => part.trim()).find(part => part.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}
function json(data: unknown, status = 200): Response { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const pin = env('TECHPLOYX_ACCESS_PIN'), serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!pin || !serviceKey || cookieValue(req, 'techployx_admin_session') !== pin) return json({ error: 'Unauthorized' }, 401);
  const headers = { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey };
  const [projectsResponse, logsResponse, agentsResponse, gatesResponse] = await Promise.all([
    fetch(SUPABASE_URL + '/rest/v1/projects?select=code,name,status,priority,current_focus,next_action,blocked_reason,last_reviewed_at,updated_at,deploy_platform,deploy_route,database_service,storage_service,email_service,migration_status&order=priority.asc', { headers }),
    fetch(SUPABASE_URL + '/rest/v1/continuity_logs?select=id,project_code,type,message,needs_human,created_at&order=created_at.desc&limit=50', { headers }),
    fetch(SUPABASE_URL + '/rest/v1/agents?select=name,role,status,project_scope&order=name.asc', { headers }),
    fetch(SUPABASE_URL + '/rest/v1/project_gate_status?select=project_code,gate_key,status,evidence,checked_at&order=project_code.asc,gate_key.asc', { headers }),
  ]);
  if (!projectsResponse.ok || !logsResponse.ok || !agentsResponse.ok || !gatesResponse.ok) return json({ error: 'Continuity data unavailable' }, 502);
  return json({ ok: true, projects: await projectsResponse.json(), logs: await logsResponse.json(), agents: await agentsResponse.json(), gates: await gatesResponse.json() });
};
export const config: Config = { path: '/continuity-data' };
