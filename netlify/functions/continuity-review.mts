import type { Config, Context } from '@netlify/functions';

const SUPABASE_URL = 'https://wkfmdtfhvdeyhhxatfll.supabase.co';

function env(name: string): string {
  return Netlify.env.get(name) ?? '';
}

function headers(serviceKey: string): HeadersInit {
  return { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json' };
}

export default async (_req: Request, _context: Context): Promise<Response> => {
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
  const staleAfterMs = 72 * 60 * 60 * 1000;
  const stale = projects.filter(project => {
    const reviewedAt = project.last_reviewed_at ? Date.parse(project.last_reviewed_at) : Date.parse(project.updated_at);
    return Number.isFinite(reviewedAt) && now - reviewedAt >= staleAfterMs;
  });

  let logged = 0;
  for (const project of stale) {
    const since = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const recentResponse = await fetch(
      SUPABASE_URL + '/rest/v1/continuity_logs?select=id&project_code=eq.' + encodeURIComponent(project.code) +
      '&type=eq.block&message=like.' + encodeURIComponent('*No continuity review in the last 72 hours*') +
      '&created_at=gte.' + encodeURIComponent(since) + '&limit=1',
      { headers: apiHeaders },
    );
    if (!recentResponse.ok || (await recentResponse.json()).length > 0) continue;

    const insertResponse = await fetch(SUPABASE_URL + '/rest/v1/continuity_logs', {
      method: 'POST',
      headers: { ...apiHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        project_code: project.code,
        type: 'block',
        message: 'No continuity review in the last 72 hours; coordinator requires a human review.',
        needs_human: true,
      }),
    });
    if (insertResponse.ok) logged++;
  }

  return Response.json({ ok: true, checked: projects.length, stale: stale.length, logged });
};

export const config: Config = {
  schedule: '0 14 * * *',
};
