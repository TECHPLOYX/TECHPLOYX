import type { Config, Context } from '@netlify/functions';

const SUPABASE_URL = 'https://wkfmdtfhvdeyhhxatfll.supabase.co';

function env(name: string): string { return Netlify.env.get(name) ?? ''; }
function headers(serviceKey: string): HeadersInit {
  return { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json' };
}

export default async (req: Request, _context: Context): Promise<Response> => {
  const manualRun = req.method === 'POST';
  const accessPin = env('TECHPLOYX_ACCESS_PIN');
  if (manualRun && (!accessPin || req.headers.get('x-techployx-access-pin') !== accessPin.trim())) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) return Response.json({ ok: false, error: 'Missing service configuration' }, { status: 503 });

  const apiHeaders = headers(serviceKey);
  const projectsResponse = await fetch(
    SUPABASE_URL + '/rest/v1/projects?select=code,name,status,priority,last_reviewed_at,updated_at&status=neq.completed',
    { headers: apiHeaders },
  );
  if (!projectsResponse.ok) return Response.json({ ok: false, error: 'Projects unavailable' }, { status: 502 });

  const projects = await projectsResponse.json() as Array<{
    code: string; name: string; status: string; priority: number;
    last_reviewed_at: string | null; updated_at: string;
  }>;
  const now = Date.now();
  const stages = [
    { hours: 72, type: 'block', message: 'Critical: no continuity progress in the last 72 hours; immediate human review required.', needsHuman: true },
    { hours: 48, type: 'decision_needed', message: 'Priority: no continuity progress in the last 48 hours; coordinator escalation required.', needsHuman: true },
    { hours: 24, type: 'review', message: 'Preventive review: no continuity progress in the last 24 hours; coordinator review required.', needsHuman: true },
  ] as const;

  let logged = 0;
  const alerts: Array<{ project_code: string; level: string }> = [];

  for (const project of projects) {
    const reviewedAt = project.last_reviewed_at ? Date.parse(project.last_reviewed_at) : Date.parse(project.updated_at);
    if (!Number.isFinite(reviewedAt)) continue;
    const elapsedHours = (now - reviewedAt) / (60 * 60 * 1000);
    const stage = stages.find(item => elapsedHours >= item.hours);
    if (!stage) continue;

    const since = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const recentResponse = await fetch(
      SUPABASE_URL + '/rest/v1/continuity_logs?select=id&project_code=eq.' + encodeURIComponent(project.code) +
      '&type=eq.' + stage.type + '&message=like.' + encodeURIComponent('*' + stage.message + '*') +
      '&created_at=gte.' + encodeURIComponent(since) + '&limit=1',
      { headers: apiHeaders },
    );
    if (!recentResponse.ok || (await recentResponse.json()).length > 0) continue;

    const insertResponse = await fetch(SUPABASE_URL + '/rest/v1/continuity_logs', {
      method: 'POST',
      headers: { ...apiHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        project_code: project.code,
        type: stage.type,
        message: stage.message,
        needs_human: stage.needsHuman,
      }),
    });
    if (insertResponse.ok) {
      logged++;
      alerts.push({ project_code: project.code, level: stage.type });
    }
  }

  return Response.json({ ok: true, checked: projects.length, alerts: alerts.length, logged, alerts_detail: alerts });
};

export const config: Config = {
  schedule: '0 14 * * *',
};
