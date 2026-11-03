import type { Config, Context } from '@netlify/functions';

const SUPABASE_URL = 'https://wkfmdtfhvdeyhhxatfll.supabase.co';

function env(name: string): string {
  return Netlify.env.get(name) ?? '';
}

function cookieValue(req: Request, name: string): string {
  const header = req.headers.get('cookie') ?? '';
  const item = header.split(';').map(part => part.trim()).find(part => part.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const pin = env('TECHPLOYX_ACCESS_PIN');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!pin || !serviceKey || cookieValue(req, 'techployx_admin_session') !== pin) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const headers = { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey };
  const [projectsResponse, logsResponse] = await Promise.all([
    fetch(SUPABASE_URL + '/rest/v1/projects?select=code,name,status,priority,current_focus,next_action,blocked_reason,last_reviewed_at,updated_at&order=priority.asc', { headers }),
    fetch(SUPABASE_URL + '/rest/v1/continuity_logs?select=id,project_code,type,message,needs_human,created_at&order=created_at.desc&limit=50', { headers }),
  ]);

  if (!projectsResponse.ok || !logsResponse.ok) {
    return json({ error: 'Continuity data unavailable' }, 502);
  }

  return json({
    ok: true,
    projects: await projectsResponse.json(),
    logs: await logsResponse.json(),
  });
};

export const config: Config = { path: '/api/continuity' };
