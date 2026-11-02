import type { Config, Context } from '@netlify/functions';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';

const SUPABASE_URL = 'https://wkfmdtfhvdeyhhxatfll.supabase.co';
const ADMIN_USERNAME = 'admin';
const ALLOWED_RESOURCES = new Set([
  'leads?select=id,name,company,email,need,status,source,created_at,updated_at&order=created_at.desc',
  'lead_events?select=id,lead_id,event_type,from_status,to_status,created_at&order=created_at.desc&limit=20',
  'chat_sessions?select=id,locale,source,created_at&order=created_at.desc&limit=20',
  'chat_messages?select=id,session_id,role,content,created_at&order=created_at.asc&limit=200',
  'lead_notifications?select=id,lead_id,channel,recipient,status,attempts,last_error,created_at,sent_at&order=created_at.desc&limit=20',
  'sales_prospects?select=id,company,contact_name,contact_role,source,status,next_action,next_action_at,storage_path,notes,created_at,updated_at&order=updated_at.desc',
]);

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(data, { status, headers });
}
function fail(message: string, status: number): Response {
  return json({ error: message }, status);
}
function env(name: string): string {
  return Netlify.env.get(name) ?? '';
}
function configuredSecrets(): { pin: string; serviceKey: string } | null {
  const pin = env('TECHPLOYX_ACCESS_PIN');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  return pin && serviceKey ? { pin, serviceKey } : null;
}
function cookieValue(req: Request, name: string): string {
  const header = req.headers.get('cookie') ?? '';
  const item = header.split(';').map(part => part.trim()).find(part => part.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}
function authorize(token: unknown, req?: Request): { serviceKey: string } | null {
  const configured = configuredSecrets();
  if (!configured) return null;
  const candidate = typeof token === 'string' ? token.trim() : '';
  const cookiePin = req ? cookieValue(req, 'techployx_admin_session') : '';
  if (candidate === configured.pin.trim() || (candidate === 'cookie' && cookiePin === configured.pin.trim())) return { serviceKey: configured.serviceKey };
  return null;
}
async function bodyOf(req: Request): Promise<Record<string, unknown>> {
  try { return await req.json() as Record<string, unknown>; }
  catch { return {}; }
}
async function supabaseRequest(path: string, serviceKey: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error('Supabase request failed: ' + response.status);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function createZohoTransporter(mailUser: string, mailPassword: string): Promise<nodemailer.Transporter> {
  const candidates = [
    { host: 'smtp.zoho.com', port: 465, secure: true },
    { host: 'smtppro.zoho.com', port: 465, secure: true },
    { host: 'smtp.zoho.com', port: 587, secure: false },
  ];
  let lastError: unknown = null;
  for (const candidate of candidates) {
    const transporter = nodemailer.createTransport({
      ...candidate,
      auth: { user: mailUser, pass: mailPassword.trim() },
    });
    try {
      await transporter.verify();
      return transporter;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('Zoho SMTP unavailable');
}

const SYSTEM_PROMPT = `AGENTE COMERCIAL TECHPLOYX. Eres un asistente comercial digital de TECHPLOYX, no afirmes ser humano. Conversa de manera natural, cálida, precisa y muy breve. PRIORIDAD ABSOLUTA: responde exactamente a lo que preguntó el cliente, usando el contexto de la conversación y sin cambiar de tema. Para preguntas de una palabra como "cómo", "como", "cuánto", "por qué" o "y eso", interpreta la referencia a la última necesidad mencionada. Si dijo "quiero mejorar el CRM" y pregunta "cómo", explica concretamente que se pueden centralizar contactos, organizar oportunidades y automatizar recordatorios y seguimiento; no des una presentación genérica de TECHPLOYX. Si pregunta "qué sabes tú", responde a lo que puedes ayudar como agente digital sin exagerar. Si solo saluda, saluda y pregunta de forma neutra en qué ayudar, sin mencionar servicios. Por defecto 1-2 frases completas (hasta unas 55 palabras); cierra siempre cada frase, nunca dejes oraciones incompletas. No ofrezcas largas explicaciones ni frases de publicidad. No repitas el nombre de TECHPLOYX innecesariamente. CLASIFICACIÓN COMERCIAL: si solo pregunta para informarse, responde sin pedir datos. Si describe una necesidad empresarial, resuelve primero y ofrece un siguiente paso; pide solo UN dato de contacto por turno cuando sea natural, empezando por nombre y apellido; después teléfono de EE.UU. de diez dígitos y correo electrónico según los datos ya proporcionados. Si pregunta precios, implementación o expresa intención clara de contratar, pide datos con naturalidad sin omitir la respuesta comercial; jamás solicites los tres datos en una misma pregunta, no insistas si no quiere, nunca repitas lo que ya dio. No pidas código de país ni selección de canal. Servicios: CRM, captación de clientes potenciales, seguimiento comercial, automatización de procesos e integraciones. No inventes precios, plazos, garantías, funciones activas ni correos enviados. Habla en el idioma del visitante, español o inglés.`;

async function chatResponse(payload: Record<string, unknown>): Promise<Response> {
  const message = typeof payload.message === 'string' ? payload.message.trim().slice(0, 1800) : '';
  if (!message) return fail('Message is required', 400);
  const model = env('TECHPLOYX_AI_MODEL');
  if (!model) return fail('AI model is not configured', 503);
  const history = Array.isArray(payload.history)
    ? payload.history.slice(-10).filter((item: any) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
        .map((item: any) => ({ role: item.role as 'user' | 'assistant', content: item.content.slice(0, 1000) }))
    : [];
  try {
    const client = new OpenAI();
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message },
      ],
      max_tokens: 480,
    });
    const answer = completion.choices[0]?.message?.content?.trim() || '';
    if (!answer) return fail('Assistant temporarily unavailable', 503);

    const transcript = [...history, { role: 'user' as const, content: message }]
      .map(item => item.role + ': ' + item.content).join('\n');

    let leadCapture: Record<string, unknown> = { ready: false, name: null, phone: null, email: null, need: null, company: null };
    if (transcript.length > 25) {
      try {
        const extraction = await client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: 'Extract only explicitly provided prospect contact information and business need. Never invent missing data. Return strict JSON with keys ready,name,phone,email,need,company. ready=true only if full first and last name, US phone of 10 digits, valid email, and a specific business need were explicitly provided.' },
            { role: 'user', content: transcript },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 190,
        });
        const raw = extraction.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(raw) as any;
        const phone = typeof parsed.phone === 'string' ? parsed.phone.replace(/\D/g, '') : '';
        const valid = parsed.ready === true && typeof parsed.name === 'string' && parsed.name.trim().split(/\s+/).length >= 2 &&
          /^(1)?\d{10}$/.test(phone) && typeof parsed.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.email) &&
          typeof parsed.need === 'string' && parsed.need.trim().length > 2;
        if (valid) leadCapture = parsed;
      } catch (error) {
        console.warn('Lead extraction skipped', error);
      }
    }
    return json({ answer, leadCapture });
  } catch (error) {
    console.error('Chat generation unavailable', error);
    return fail('Assistant temporarily unavailable', 503);
  }
}

export default async (req: Request, context: Context): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname;
  const payload = req.method === 'GET' ? {} : await bodyOf(req);

  if (path === '/api/_healthcheck' && req.method === 'GET') {
    const configured = configuredSecrets();
    if (!configured) return json({ ok: false, configured: false }, 503);
    try {
      const [leads, messages, notifications] = await Promise.all([
        supabaseRequest('leads?select=id&limit=1', configured.serviceKey),
        supabaseRequest('chat_messages?select=id&limit=1', configured.serviceKey),
        supabaseRequest('lead_notifications?select=id,status&limit=1', configured.serviceKey),
      ]);
      let mailTransport = false;
      const mailPassword = env('ZOHO_MAIL_APP_PASSWORD');
      if (mailPassword) {
        try {
          const mailUser = env('ZOHO_MAIL_USER') || 'hello@techployx.com';
          await createZohoTransporter(mailUser, mailPassword);
          mailTransport = true;
        } catch {
          mailTransport = false;
        }
      }
      return json({ ok: true, configured: true, leadStorage: Array.isArray(leads), chatMessageStorage: Array.isArray(messages), notificationQueue: Array.isArray(notifications), mailTransport });
    } catch {
      return json({ ok: false, configured: true }, 502);
    }
  }

  if (path === '/api/chat' && req.method === 'POST') return chatResponse(payload);

  if (path === '/api/admin/login' && req.method === 'POST') {
    if (payload.username !== ADMIN_USERNAME || typeof payload.password !== 'string') return fail('Invalid credentials', 401);
    const auth = authorize(payload.password, req);
    if (!auth) return fail('Invalid credentials', 401);
    return json({ session: { access_token: 'cookie', expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000 } }, 200, {
      'Set-Cookie': 'techployx_admin_session=' + encodeURIComponent(payload.password) + '; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax',
    });
  }

  if (path === '/api/admin/session' && req.method === 'GET') {
    const auth = authorize('cookie', req);
    if (!auth) return fail('Unauthorized', 401);
    return json({ session: { access_token: 'cookie', expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000 } });
  }

  if (path === '/api/admin/data' && req.method === 'POST') {
    const resource = typeof payload.resource === 'string' ? payload.resource : '';
    const auth = authorize(payload.token, req);
    if (!auth || !ALLOWED_RESOURCES.has(resource)) return fail('Unauthorized', 401);
    try { return json(await supabaseRequest(resource, auth.serviceKey)); }
    catch { return fail('Unable to load protected data', 502); }
  }

  if (path === '/api/admin/notifications/batch-preview' && req.method === 'POST') {
    const auth = authorize(payload.token, req);
    const requestedLimit = Number(payload.limit ?? 3);
    const allowedLimits = new Set([3, 4, 10, 15]);
    if (!auth || !allowedLimits.has(requestedLimit)) return fail('Unauthorized or invalid batch size', 401);
    try {
      const items = await supabaseRequest(
        'lead_notifications?select=id,lead_id,channel,recipient,status,attempts,last_error,created_at,sent_at&status=eq.pending&order=created_at.asc&limit=' + requestedLimit,
        auth.serviceKey,
      );
      const batch = Array.isArray(items) ? items : [];
      return json({ ok: true, batch_size: requestedLimit, count: batch.length, items: batch });
    } catch {
      return fail('Unable to prepare notification batch', 502);
    }
  }

  if (path === '/api/admin/mail-test' && req.method === 'POST') {
    const auth = authorize(payload.token, req);
    if (!auth) return fail('Unauthorized', 401);
    const mailUser = env('ZOHO_MAIL_USER') || 'hello@techployx.com';
    const mailPassword = env('ZOHO_MAIL_APP_PASSWORD');
    if (!mailPassword) return json({ ok: false, upstream_status: 0, result: { error_code: 'ZOHO_MAIL_APP_PASSWORD_NOT_CONFIGURED' } });
    try {
      const transporter = await createZohoTransporter(mailUser, mailPassword);
      const info = await transporter.sendMail({
        from: mailUser,
        to: mailUser,
        subject: 'TECHPLOYX controlled mail test',
        text: 'Controlled delivery test. No production notification was released.',
      });
      return json({ ok: true, upstream_status: 250, result: { status: 'sent', message_id: info.messageId ?? null } });
    } catch (cause) {
      console.error('Zoho direct mail test failed', cause);
      return json({ ok: false, upstream_status: 502, result: { error_code: 'ZOHO_SMTP_FAILED' } });
    }
  }

  const leadMatch = path.match(/^\/api\/admin\/lead\/([^/]+)$/);
  if (leadMatch && req.method === 'PUT') {
    const auth = authorize(payload.token, req);
    if (!auth || typeof payload.status !== 'string') return fail('Unauthorized', 401);
    try {
      await supabaseRequest('leads?id=eq.' + encodeURIComponent(leadMatch[1]), auth.serviceKey, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: payload.status }),
      });
      return json({ ok: true });
    } catch {
      return fail('Unable to update status', 502);
    }
  }

  return fail('Not found', 404);
};

export const config: Config = {
  path: '/api/*',
};
