import { ai, error, json, router, secrets } from '@appdeploy/sdk';

const SUPABASE_URL = 'https://wkfmdtfhvdeyhhxatfll.supabase.co';
const ADMIN_USERNAME = 'admin';
const ALLOWED_RESOURCES = new Set([
  'leads?select=id,name,company,email,need,status,source,created_at,updated_at&order=created_at.desc',
  'lead_events?select=id,lead_id,event_type,from_status,to_status,created_at&order=created_at.desc&limit=20',
  'chat_sessions?select=id,locale,source,created_at&order=created_at.desc&limit=20',
  'chat_messages?select=id,session_id,role,content,created_at&order=created_at.asc&limit=200',
  'lead_notifications?select=id,lead_id,channel,recipient,status,attempts,last_error,created_at,sent_at&order=created_at.desc&limit=20',
  'sales_prospects?select=id,company,contact_name,contact_role,source,status,next_action,next_action_at,storage_path,notes,created_at,updated_at&order=updated_at.desc'
]);

async function configuredSecrets(): Promise<{ pin: string; serviceKey: string }> {
  const pin = await secrets.readSecret('TECHPLOYX_ACCESS_PIN');
  const serviceKey = await secrets.readSecret('SUPABASE_SERVICE_ROLE_KEY');
  return { pin, serviceKey };
}

async function isAuthorized(token: string | undefined): Promise<{ serviceKey: string } | null> {
  if (!token) return null;
  try {
    const configured = await configuredSecrets();
    if (token !== configured.pin) return null;
    return { serviceKey: configured.serviceKey };
  } catch {
    return null;
  }
}

async function supabaseRequest(path: string, serviceKey: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) throw new Error('Supabase request failed');
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const handler = router({
  'POST /api/admin/mail-test': [async ({ body }) => {
    const payload = (body ?? {}) as { token?: unknown };
    const auth = await isAuthorized(typeof payload.token === 'string' ? payload.token : undefined);
    if (!auth) return error('Unauthorized', 401);
    try {
      const response = await fetch(SUPABASE_URL + '/functions/v1/techployx-mail-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + auth.serviceKey, 'apikey': auth.serviceKey },
        body: JSON.stringify({ action: 'send_test' }),
        signal: AbortSignal.timeout(30000)
      });
      const raw = await response.text();
      let result: Record<string, unknown>;
      try { result = JSON.parse(raw) as Record<string, unknown>; }
      catch { result = { error: 'upstream_non_json', http_status: response.status }; }
      return json({ ok: response.ok, upstream_status: response.status, result });
    } catch (cause) {
      return json({ ok: false, upstream_status: 0, result: { error: 'upstream_unreachable', type: cause instanceof Error ? cause.name : 'unknown' } });
    }
  }],
  'GET /api/_healthcheck': [async () => {
    try {
      const configured = await configuredSecrets();
      const zohoPassword = await secrets.readSecret('ZOHO_MAIL_APP_PASSWORD');
      const [leads, messages, notifications] = await Promise.all([
        supabaseRequest('leads?select=id&limit=1', configured.serviceKey),
        supabaseRequest('chat_messages?select=id&limit=1', configured.serviceKey),
        supabaseRequest('lead_notifications?select=id,status&limit=1', configured.serviceKey)
      ]);
      console.log('TECHPLOYX verification', {
        leadStorage: Array.isArray(leads),
        chatMessageStorage: Array.isArray(messages),
        notificationQueue: Array.isArray(notifications),
        zohoConfigured: Boolean(zohoPassword)
      });
    } catch (verificationError) {
      console.warn('TECHPLOYX verification unavailable', verificationError);
    }
    return json({ message: 'Success' });
  }],
  'POST /api/chat': [async ({ body }) => {
    const payload=(body??{}) as {message?:unknown;locale?:unknown;history?:unknown};
    const message=typeof payload.message==='string'?payload.message.trim().slice(0,1800):'';
    if(!message)return error('Message is required',400);
    const history=Array.isArray(payload.history)?payload.history.slice(-10).filter((item:unknown):item is {role:'user'|'assistant';content:string}=>typeof item==='object'&&item!==null&&((item as {role?:unknown}).role==='user'||(item as {role?:unknown}).role==='assistant')&&typeof (item as {content?:unknown}).content==='string').map(item=>({role:item.role,content:item.content.slice(0,1000)})):[];
    try{
      const result=await ai.generate({system:"AGENTE COMERCIAL TECHPLOYX. Eres un asistente comercial digital de TECHPLOYX, no afirmes ser humano. Conversa de manera natural, cálida, precisa y muy breve. PRIORIDAD ABSOLUTA: responde exactamente a lo que preguntó el cliente, usando el contexto de la conversación y sin cambiar de tema. Para preguntas de una palabra como \"cómo\", \"como\", \"cuánto\", \"por qué\" o \"y eso\", interpreta la referencia a la última necesidad mencionada. Si dijo \"quiero mejorar el CRM\" y pregunta \"cómo\", explica concretamente que se pueden centralizar contactos, organizar oportunidades y automatizar recordatorios y seguimiento; no des una presentación genérica de TECHPLOYX. Si pregunta \"qué sabes tú\", responde a lo que puedes ayudar como agente digital sin exagerar. Si solo saluda, saluda y pregunta de forma neutra en qué ayudar, sin mencionar servicios. Por defecto 1-2 frases completas (hasta unas 55 palabras); cierra siempre cada frase, nunca dejes oraciones incompletas. No ofrezcas largas explicaciones ni frases de publicidad. No repitas el nombre de TECHPLOYX innecesariamente. CLASIFICACIÓN COMERCIAL: si solo pregunta para informarse, responde sin pedir datos. Si describe una necesidad empresarial, resuelve primero y ofrece un siguiente paso; pide solo UN dato de contacto por turno cuando sea natural, empezando por nombre y apellido; después teléfono de EE.UU. de diez dígitos y correo electrónico según los datos ya proporcionados. Si pregunta precios, implementación o expresa intención clara de contratar, pide datos con naturalidad sin omitir la respuesta comercial; jamás solicites los tres datos en una misma pregunta, no insistas si no quiere, nunca repitas lo que ya dio. No pidas código de país ni selección de canal. Servicios: CRM, captación de clientes potenciales, seguimiento comercial, automatización de procesos e integraciones. No inventes precios, plazos, garantías, funciones activas ni correos enviados. Habla en el idioma del visitante, español o inglés.",messages:[...history,{role:'user',content:message}],maxTokens:480,thinkingMode:'FAST'});
      let leadCapture={ready:false,name:null as string|null,phone:null as string|null,email:null as string|null,need:null as string|null,company:null as string|null};
      const transcript=[...history,{role:'user' as const,content:message}].map(item=>item.role+': '+item.content).join('\n');
      if(transcript.length>25){
        try{
          const extraction=await ai.generate({system:'Extract only explicitly provided prospect contact information and business need from the conversation. Never invent or guess missing contact information. Only set ready=true when full first and last name, US phone of 10 digits, valid email, and a specific business need were provided. Respond as JSON.',prompt:transcript,schema:{type:'object',properties:{ready:{type:'boolean'},name:{type:['string','null']},phone:{type:['string','null']},email:{type:['string','null']},need:{type:['string','null']},company:{type:['string','null']}},required:['ready','name','phone','email','need','company'],additionalProperties:false},maxTokens:190,thinkingMode:'NONE'});
          const parsed=JSON.parse(extraction.text) as typeof leadCapture;
          if(parsed&&typeof parsed==='object'&&parsed.ready===true&&typeof parsed.name==='string'&&typeof parsed.phone==='string'&&typeof parsed.email==='string'&&typeof parsed.need==='string'&&parsed.name.trim().split(/\s+/).length>=2&&/^(1)?\d{10}$/.test(parsed.phone.replace(/\D/g,''))&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.email))leadCapture=parsed;
        }catch(err){console.warn('Lead extraction skipped',err);}
      }
      return json({answer:result.text.trim(),leadCapture});
    }catch(err){console.error('Chat generation unavailable',err);return error('Assistant temporarily unavailable',503);}
  }],

  'POST /api/admin/login': [async ({ body }) => {
    const payload = (body ?? {}) as { username?: unknown; password?: unknown };
    if (payload.username !== ADMIN_USERNAME || typeof payload.password !== 'string') return error('Invalid credentials', 401);
    const authorized = await isAuthorized(payload.password);
    if (!authorized) return error('Invalid credentials', 401);
    return json({ session: { access_token: payload.password, expires_at: Date.now() + 8 * 60 * 60 * 1000 } });
  }],
  'POST /api/admin/data': [async ({ body }) => {
    const payload = (body ?? {}) as { resource?: unknown; token?: unknown };
    const resource = typeof payload.resource === 'string' ? payload.resource : undefined;
    const authorized = await isAuthorized(typeof payload.token === 'string' ? payload.token : undefined);
    if (!authorized || !resource || !ALLOWED_RESOURCES.has(resource)) return error('Unauthorized', 401);
    try {
      return json(await supabaseRequest(resource, authorized.serviceKey));
    } catch {
      return error('Unable to load protected data', 502);
    }
  }],
  'PUT /api/admin/lead/:id': [async ({ params, body }) => {
    const payload = (body ?? {}) as { status?: unknown; token?: unknown };
    const authorized = await isAuthorized(typeof payload.token === 'string' ? payload.token : undefined);
    if (!authorized || typeof params.id !== 'string' || typeof payload.status !== 'string') return error('Unauthorized', 401);
    try {
      await supabaseRequest('leads?id=eq.' + encodeURIComponent(params.id), authorized.serviceKey, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: payload.status })
      });
      return json({ ok: true });
    } catch {
      return error('Unable to update status', 502);
    }
  }]
});