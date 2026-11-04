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
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) return json({ error: 'Template service unavailable' }, 503);
  const response = await fetch(SUPABASE_URL + '/rest/v1/project_templates?template_key=eq.standard-web-project&active=eq.true&select=template_key,name,version,deploy_platform,route,tools,required_fields,validation_gates,operation_mode,isolation_policy', { headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey } });
  if (!response.ok) return json({ error: 'Template unavailable' }, 502);
  const rows = await response.json();
  if (!rows.length) return json({ error: 'Active template not found' }, 404);
  return json({ ok: true, template: rows[0] });
};
export const config: Config = { path: '/project-template' };
