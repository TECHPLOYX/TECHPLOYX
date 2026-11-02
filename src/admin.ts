import './admin.css';
import { api } from './platform-api';


const AUTHORIZED_USERNAME = 'admin';
const SESSION_KEY = 'techployx_admin_session';
type Language = 'en' | 'es';
const LANGUAGE_KEY = 'techployx_admin_language';
let currentLanguage: Language = localStorage.getItem(LANGUAGE_KEY) === 'es' ? 'es' : 'en';
const COPY: Record<string, Record<Language, string>> = {
  operationsTitle: { en: 'Operations Command Center', es: 'Centro de Operaciones' },
  subhead: { en: 'Prospects, leads, next actions, AI conversations and operational status.', es: 'Prospectos, leads, próximas acciones, conversaciones de IA y estado operativo.' },
  signOut: { en: 'Sign out', es: 'Cerrar sesión' },
  secureAccess: { en: 'Secure access', es: 'Acceso seguro' },
  loginHint: { en: 'Enter your TECHPLOYX username and access PIN.', es: 'Escribe tu usuario TECHPLOYX y tu PIN de acceso.' },
  username: { en: 'Username', es: 'Usuario' },
  accessPin: { en: 'Access PIN', es: 'PIN de acceso' },
  signIn: { en: 'Sign in with password', es: 'Entrar con contraseña' },
  sales: { en: 'Sales', es: 'Ventas' },
  prospects: { en: 'Prospects', es: 'Prospectos' },
  pipeline: { en: 'Pipeline', es: 'Embudo' },
  leads: { en: 'Leads', es: 'Leads' },
  status: { en: 'Status', es: 'Estado' },
  all: { en: 'All', es: 'Todos' },
  enableAlerts: { en: 'Enable lead alerts', es: 'Activar alertas de leads' },
  refresh: { en: 'Refresh', es: 'Actualizar' },
  lead: { en: 'Lead', es: 'Lead' },
  company: { en: 'Company', es: 'Empresa' },
  need: { en: 'Need', es: 'Necesidad' },
  created: { en: 'Created', es: 'Creado' },
  statusHeader: { en: 'Status', es: 'Estado' },
  activity: { en: 'Activity', es: 'Actividad' },
  recentEvents: { en: 'Recent events', es: 'Eventos recientes' },
  notifications: { en: 'Notifications', es: 'Notificaciones' },
  deliveryQueue: { en: 'Delivery queue', es: 'Cola de entregas' },
  aiAssistant: { en: 'AI Assistant', es: 'Asistente de IA' },
  recentConversations: { en: 'Recent conversations', es: 'Conversaciones recientes' },
  newLeads: { en: 'New leads', es: 'Nuevos leads' },
  activePipeline: { en: 'Active pipeline', es: 'Embudo activo' },
  won: { en: 'Won', es: 'Ganados' },
  aiChats: { en: 'AI chats', es: 'Chats de IA' },
  notificationsPending: { en: 'Notifications pending', es: 'Notificaciones pendientes' },
  pending: { en: 'Pending', es: 'Pendientes' },
  sent: { en: 'Sent', es: 'Enviadas' },
  failed: { en: 'Failed', es: 'Fallidas' },
  sessions: { en: 'sessions', es: 'sesiones' },
  session: { en: 'session', es: 'sesión' },
  prospectsCount: { en: 'prospects', es: 'prospectos' }, analyticsLabel: { en: 'DATA OVERVIEW', es: 'RESUMEN DE DATOS' }, analyticsTitle: { en: 'Sales pipeline by status', es: 'Oportunidades por estado' }, realData: { en: 'Live records', es: 'Datos reales' }, displayMode: { en: 'Display', es: 'Visualización' }, cards: { en: 'Cards', es: 'Tarjetas' }, list: { en: 'List', es: 'Lista' },
  navOverview: { en: 'Overview', es: 'Resumen' }, navProspects: { en: 'Prospects', es: 'Prospectos' }, navLeads: { en: 'Leads', es: 'Clientes potenciales' }, navActivity: { en: 'Follow-up', es: 'Seguimiento' }, navNotifications: { en: 'Notifications', es: 'Notificaciones' }, navChats: { en: 'Conversations', es: 'Conversaciones' }, navDocuments: { en: 'Documents', es: 'Documentos' }, documentHint: { en: 'Folder references for each prospect. Secure file upload is not yet configured.', es: 'Referencias de carpetas por prospecto. La carga segura de archivos todavía no está configurada.' }
};
function t(key: string): string { return COPY[key]?.[currentLanguage] ?? key; }
function applyLanguage(): void {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(function(element){ element.textContent = t(element.dataset.i18n ?? ''); });
  const toggle = document.querySelector<HTMLButtonElement>('#language-toggle');
  if (toggle) { toggle.textContent = currentLanguage === 'en' ? 'ES' : 'EN'; toggle.setAttribute('aria-label', currentLanguage === 'en' ? 'Cambiar idioma' : 'Change language'); }
}
const STATUSES = ['new','researched','contacted','replied','meeting','proposal','pilot','won','lost','follow_up']; const ES_TEXT:Record<string,string>={"new":"Nuevo","researched":"Investigado","contacted":"Contactado","replied":"Respondido","meeting":"Reunión","proposal":"Propuesta","pilot":"Piloto","won":"Ganado","lost":"Perdido","follow_up":"Seguimiento","researching":"Investigando","contact_ready":"Listo para contactar","pending":"Pendiente","sent":"Enviada","failed":"Fallida","No leads in this view.":"No hay clientes potenciales en esta vista.","Saving status...":"Guardando estado...","Could not update status.":"No se pudo actualizar el estado."," lead":" oportunidad"," shown.":" mostradas."," entered the pipeline":" entró al embudo"," moved to ":" cambió a ","New opportunity captured":"Nueva oportunidad registrada","No activity yet.":"Sin actividad reciente.","No notifications queued.":"No hay notificaciones en cola.","No conversations yet":"Todavía no hay conversaciones.","No AI conversations yet.":"Todavía no hay conversaciones.","No prospects tracked yet.":"Aún no hay prospectos registrados.","No folders yet.":"Todavía no hay carpetas.","Contact not assigned":"Contacto sin asignar","No next action defined":"Sin próxima acción definida","Storage path not assigned":"Ruta de archivo sin asignar","NEXT ACTION":"PRÓXIMA ACCIÓN","FILES":"ARCHIVOS","Loading command center...":"Cargando el Centro de Operaciones...","Could not load command center data.":"No se pudieron cargar los datos.","This account is not authorized for the TECHPLOYX command center.":"Esta cuenta no tiene autorización para el Centro de Operaciones.","Enter your username and password.":"Escribe tu usuario y contraseña.","Signing in...":"Iniciando sesión...","Username or password is incorrect.":"El usuario o PIN no son correctos.","Browser notifications are not supported here.":"Este navegador no admite notificaciones.","Lead alerts were not enabled.":"No se activaron las alertas.","Lead alerts enabled":"Alertas activadas","Lead alerts enabled on this browser.":"Alertas activadas en este navegador.","Spanish":"Español","English":"Inglés","conversation":"conversación","Visitor":"Visitante","Assistant":"Asistente","messages":"mensajes","attempts":"intentos","Lead":"Oportunidad","Status for ":"Estado de "};function txt(en:string):string{return currentLanguage==='es'?(ES_TEXT[en]??en):en;}function statusLabel(v:string):string{return txt(v).replace('_',' ');}

type Session = { access_token: string; refresh_token?: string; expires_at?: number };
type Lead = { id:string; name:string; company:string; email:string; need:string; status:string; source:string; created_at:string; updated_at:string };
type LeadEvent = { id:string; lead_id:string; event_type:'created'|'status_changed'; from_status:string|null; to_status:string|null; created_at:string };
type ChatSession = { id:string; locale:'en'|'es'; source:string; created_at:string };
type ChatMessage = { id:string; session_id:string; role:'user'|'assistant'; content:string; created_at:string };
type LeadNotification = { id:string; lead_id:string; channel:string; recipient:string; status:'pending'|'sent'|'failed'; attempts:number; last_error:string|null; created_at:string; sent_at:string|null };

type SalesProspect = { id:string; company:string; contact_name:string|null; contact_role:string|null; source:string; status:string; next_action:string|null; next_action_at:string|null; storage_path:string|null; notes:string|null; created_at:string; updated_at:string };


let currentLeads: Lead[] = [];

const loginPanel = document.querySelector<HTMLElement>('#login-panel');
const dashboard = document.querySelector<HTMLElement>('#dashboard');
const loginForm = document.querySelector<HTMLFormElement>('#login-form');
const loginUsername = document.querySelector<HTMLInputElement>('#login-username');
const loginPassword = document.querySelector<HTMLInputElement>('#login-password');
const loginStatus = document.querySelector<HTMLElement>('#login-status');
const dashboardStatus = document.querySelector<HTMLElement>('#dashboard-status');
const leadRows = document.querySelector<HTMLTableSectionElement>('#lead-rows');
const metrics = document.querySelector<HTMLElement>('#metrics');
const activityFeed = document.querySelector<HTMLElement>('#activity-feed');
const notificationFeed = document.querySelector<HTMLElement>('#notification-feed');
const mailTestButton = document.querySelector<HTMLButtonElement>('#mail-test-button');
const mailTestResult = document.querySelector<HTMLElement>('#mail-test-result');
mailTestButton?.addEventListener('click', async () => {
  if (!mailTestButton || !mailTestResult) return;
  const session = await validSession();
  if (!session) { mailTestResult.textContent = 'Admin session required'; return; }
  mailTestButton.disabled = true;
  mailTestResult.textContent = 'Testing...';
  try {
    const response = await api.post('/api/admin/mail-test', { token: session.access_token });
    const report = response.data as { ok?: boolean; upstream_status?: number; result?: { status?: string; error_code?: string; message_id?: string } };
    mailTestResult.textContent = report.ok ? 'SMTP accepted: ' + String(report.result?.message_id ?? 'yes') : 'Mail test failed: ' + String(report.result?.error_code ?? report.upstream_status ?? 'unknown');
  } catch {
    mailTestResult.textContent = 'Mail test request failed';
  } finally { mailTestButton.disabled = false; }
});
const batchPreviewButton = document.querySelector<HTMLButtonElement>('#batch-preview-button');
const batchPreviewResult = document.querySelector<HTMLElement>('#batch-preview-result');
batchPreviewButton?.addEventListener('click', async () => {
  if (!batchPreviewButton || !batchPreviewResult) return;
  const session = await validSession();
  if (!session) { batchPreviewResult.textContent = 'Admin session required'; return; }
  batchPreviewButton.disabled = true;
  batchPreviewResult.textContent = 'Preparing batch of 3...';
  try {
    const response = await api.post('/api/admin/notifications/batch-preview', { token: session.access_token, limit: 3 });
    const report = response.data as { ok?: boolean; count?: number; items?: Array<{ recipient?: string; status?: string }> };
    const recipients = (report.items ?? []).map(item => item.recipient ?? 'unknown').join(', ');
    batchPreviewResult.textContent = report.ok ? 'Batch ready: ' + String(report.count ?? 0) + ' pending (' + (recipients || 'none') + ')' : 'Batch preparation failed';
  } catch {
    batchPreviewResult.textContent = 'Batch preparation failed';
  } finally { batchPreviewButton.disabled = false; }
});

const notificationSummary = document.querySelector<HTMLElement>('#notification-summary');
const chatSessionsEl = document.querySelector<HTMLElement>('#chat-sessions');
const chatCount = document.querySelector<HTMLElement>('#chat-count');

const prospectCards = document.querySelector<HTMLElement>('#prospect-cards');
const prospectCount = document.querySelector<HTMLElement>('#prospect-count');

const statusFilter = document.querySelector<HTMLSelectElement>('#status-filter');
const enableAlertsButton = document.querySelector<HTMLButtonElement>('#enable-alerts');
const refreshButton = document.querySelector<HTMLButtonElement>('#refresh');
let newestLeadCreatedAt = localStorage.getItem('techployx_newest_lead_at');
let alertsEnabled = localStorage.getItem('techployx_lead_alerts') === 'enabled';
let alertPollHandle: number | null = null;
const signOutButton = document.querySelector<HTMLButtonElement>('#sign-out');
const languageToggle = document.querySelector<HTMLButtonElement>('#language-toggle');

function refreshStatusOptions():void{const old=statusFilter?.value??'all';if(statusFilter){statusFilter.innerHTML='<option value="all">'+t('all')+'</option>'+STATUSES.map(s=>'<option value="'+s+'">'+statusLabel(s)+'</option>').join('');statusFilter.value=old;}}refreshStatusOptions();

function getSession(): Session | null {
  const cookie = document.cookie.split('; ').find(function(item){ return item.startsWith(SESSION_KEY + '='); });
  const raw = localStorage.getItem(SESSION_KEY) ?? (cookie ? decodeURIComponent(cookie.slice(SESSION_KEY.length + 1)) : null);
  if (!raw) return null;
  try { return JSON.parse(raw) as Session; } catch { return null; }
}
function saveSession(session: Session): void {
  const raw = JSON.stringify(session);
  localStorage.setItem(SESSION_KEY, raw);
  document.cookie = SESSION_KEY + '=; Max-Age=0; Path=/; SameSite=Lax; Secure';
}
function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = SESSION_KEY + '=; Max-Age=0; Path=/; SameSite=Lax; Secure';
}
async function recoverSession(): Promise<Session | null> {
  try { const result = await api.get<{ session?: Session }>('/api/admin/session'); const session = result.data.session; if (session?.access_token) { saveSession(session); return session; } }
  catch { /* no reusable server session */ }
  return null;
}

async function validSession(): Promise<Session | null> { const session = getSession(); if (!session) return null; if (session.expires_at && session.expires_at <= Date.now()) { clearSession(); return null; } return session; }

async function signInWithPassword(username:string, password:string): Promise<Session> {
  if (username !== AUTHORIZED_USERNAME) throw new Error('unauthorized');
  const result = await api.post('/api/admin/login', { username, password });
  const payload = result.data as { session?: Session };
  if (!payload.session?.access_token) throw new Error('unauthorized');
  saveSession(payload.session);
  return payload.session;
}
async function fetchJson<T>(session:Session, path:string): Promise<T> {
  const result = await api.post('/api/admin/data', { resource:path, token:session.access_token });
  return result.data as T;
}
async function fetchLeads(session:Session): Promise<Lead[]> { return fetchJson(session, 'leads?select=id,name,company,email,need,status,source,created_at,updated_at&order=created_at.desc'); }
function rememberNewestLead(leads:Lead[]): void {
  if (!leads.length) return;
  const latest=leads[0].created_at;
  if (!newestLeadCreatedAt || new Date(latest).getTime() > new Date(newestLeadCreatedAt).getTime()) {
    newestLeadCreatedAt=latest;
    localStorage.setItem('techployx_newest_lead_at',latest);
  }
}
async function pollForNewLeads(session:Session): Promise<void> {
  if (!alertsEnabled || document.visibilityState === 'hidden') return;
  try {
    const leads=await fetchLeads(session);
    if (!leads.length) return;
    const latest=leads[0];
    if (newestLeadCreatedAt && new Date(latest.created_at).getTime() > new Date(newestLeadCreatedAt).getTime() && Notification.permission === 'granted') {
      new Notification('New TECHPLOYX lead',{ body: latest.company + ' • ' + latest.name });
    }
    rememberNewestLead(leads);
  } catch (error) { console.warn('Lead alert poll unavailable',error); }
}
function startLeadAlertPolling(session:Session): void {
  if (alertPollHandle !== null) window.clearInterval(alertPollHandle);
  if (!alertsEnabled) return;
  alertPollHandle=window.setInterval(function(){ void pollForNewLeads(session); },60000);
}
async function fetchEvents(session:Session): Promise<LeadEvent[]> { return fetchJson(session, 'lead_events?select=id,lead_id,event_type,from_status,to_status,created_at&order=created_at.desc&limit=20'); }
async function fetchChatSessions(session:Session): Promise<ChatSession[]> { return fetchJson(session, 'chat_sessions?select=id,locale,source,created_at&order=created_at.desc&limit=20'); }
async function fetchChatMessages(session:Session): Promise<ChatMessage[]> { return fetchJson(session, 'chat_messages?select=id,session_id,role,content,created_at&order=created_at.asc&limit=200'); }
async function fetchNotifications(session:Session): Promise<LeadNotification[]> { return fetchJson(session, 'lead_notifications?select=id,lead_id,channel,recipient,status,attempts,last_error,created_at,sent_at&order=created_at.desc&limit=20'); }

async function fetchProspects(session:Session): Promise<SalesProspect[]> { return fetchJson(session, 'sales_prospects?select=id,company,contact_name,contact_role,source,status,next_action,next_action_at,storage_path,notes,created_at,updated_at&order=updated_at.desc'); }

async function updateStatus(session:Session, leadId:string, status:string): Promise<void> {
  await api.put('/api/admin/lead/' + encodeURIComponent(leadId), { status, token:session.access_token });
}

function renderMetrics(leads:Lead[], sessions:ChatSession[], notifications:LeadNotification[]): void {
  if (!metrics) return;
  const values:[string,number][] = [
    [t('newLeads'), leads.filter(function(x){ return x.status === 'new'; }).length],
    [t('activePipeline'), leads.filter(function(x){ return x.status !== 'won' && x.status !== 'lost'; }).length],
    [t('won'), leads.filter(function(x){ return x.status === 'won'; }).length],
    [t('aiChats'), sessions.length],
    [t('notificationsPending'), notifications.filter(function(x){ return x.status === 'pending'; }).length]
  ];
  metrics.innerHTML = values.map(function(item,i){ return '<div class="metric metric-tone-' + i + '"><span>' + item[0] + '</span><strong>' + item[1] + '</strong><div class="metric-accent"></div></div>'; }).join('');
  const chart=document.querySelector<HTMLElement>('#pipeline-chart'); if(chart){const counts=STATUSES.map(function(s){return {label:statusLabel(s),count:leads.filter(function(l){return l.status===s;}).length};}).filter(function(s){return s.count>0;});const max=Math.max(1,...counts.map(function(s){return s.count;})); chart.innerHTML=counts.length?counts.map(function(s,i){return '<div class="chart-row"><span>'+escapeHtml(s.label)+'</span><div class="chart-track"><div class="chart-fill tone-'+(i%5)+'" style="width:'+Math.max(5,Math.round(100*s.count/max))+'%"></div></div><strong>'+s.count+'</strong></div>';}).join(''):'<p class="empty">'+(currentLanguage==='es'?'Sin oportunidades registradas todavía.':'No recorded opportunities yet.')+'</p>'; }
}

function renderLeads(leads:Lead[], session:Session): void {
  if (!leadRows) return;
  if (!leads.length) { leadRows.innerHTML = '<tr><td colspan="5" class="empty">'+txt('No leads in this view.')+'</td></tr>'; return; }
  leadRows.innerHTML = leads.map(function(lead){    const options = STATUSES.map(function(status){ return '<option value="' + status + '"' + (status === lead.status ? ' selected' : '') + '>' + statusLabel(status) + '</option>'; }).join('');
    return '<tr><td><div class="lead-name">' + escapeHtml(lead.name) + '</div><div class="lead-email">' + escapeHtml(lead.email) + '</div></td><td>' + escapeHtml(lead.company) + '</td><td class="need">' + escapeHtml(lead.need) + '</td><td>' + new Date(lead.created_at).toLocaleString() + '</td><td><select data-lead-id="' + lead.id + '" aria-label="Status for ' + escapeHtml(lead.name) + '">' + options + '</select></td></tr>';
  }).join('');
  leadRows.querySelectorAll<HTMLSelectElement>('select[data-lead-id]').forEach(function(select){
    select.addEventListener('change', async function(){
      const leadId = select.dataset.leadId; if (!leadId) return; select.disabled = true;
      if (dashboardStatus) dashboardStatus.textContent = txt('Saving status...');
      try { await updateStatus(session, leadId, select.value); await loadDashboard(session); } catch { if (dashboardStatus) dashboardStatus.textContent = txt('Could not update status.'); } finally { select.disabled = false; }
    });
  });
}
function renderFilteredLeads(session:Session): void { const filter = statusFilter?.value ?? 'all'; const visible = filter === 'all' ? currentLeads : currentLeads.filter(function(x){ return x.status === filter; }); renderLeads(visible,session); if (dashboardStatus) dashboardStatus.textContent = String(visible.length) + (currentLanguage==='es'?' oportunidades mostradas.':(' lead'+(visible.length===1?'':'s')+' shown.')); }
function renderEvents(events:LeadEvent[], leads:Lead[]): void {
  if (!activityFeed) return; const names = new Map(leads.map(function(x){ return [x.id,x.name]; }));
  activityFeed.innerHTML = events.length ? events.map(function(event){
    const leadName = names.get(event.lead_id) ?? txt('Lead'); const changed = event.event_type === 'status_changed';
    const title = changed ? leadName + ' '+(currentLanguage==='es'?'cambió a':'moved to')+' ' + statusLabel(String(event.to_status ?? '')) : leadName + (currentLanguage==='es'?' entró al embudo':' entered the pipeline');
    const meta = changed && event.from_status ? statusLabel(event.from_status) + ' → ' + statusLabel(String(event.to_status ?? '')) : txt('New opportunity captured');
    return '<div class="event"><div class="event-icon">' + (changed ? '↻' : '+') + '</div><div><div class="event-title">' + escapeHtml(title) + '</div><div class="event-meta">' + escapeHtml(meta) + '</div><div class="event-time">' + new Date(event.created_at).toLocaleString() + '</div></div></div>';
  }).join('') : '<p class="empty compact">'+txt('No activity yet.')+'</p>';
}
function renderNotifications(items:LeadNotification[], leads:Lead[]): void {
  if (!notificationFeed || !notificationSummary) return;
  const names = new Map(leads.map(function(x){ return [x.id,x.name]; }));
  const isInternalSmokeTest = function(item:LeadNotification): boolean {
    return /smoke test/i.test(names.get(item.lead_id) ?? '');
  };
  const operational = items.filter(function(item){ return !isInternalSmokeTest(item); });
  const smokeTests = items.filter(isInternalSmokeTest);
  const pending = operational.filter(function(x){ return x.status === 'pending'; }).length;
  const sent = operational.filter(function(x){ return x.status === 'sent'; }).length;
  const failed = operational.filter(function(x){ return x.status === 'failed'; }).length;
  notificationSummary.innerHTML = '<div><strong>' + pending + '</strong><span>' + t('pending') + '</span></div><div><strong>' + sent + '</strong><span>' + t('sent') + '</span></div><div><strong>' + failed + '</strong><span>' + t('failed') + '</span></div>';
  const operationalFeed = operational.slice(0,8).map(function(item){ return '<div class="event"><div class="event-icon status-' + item.status + '">' + (item.status === 'sent' ? '✓' : item.status === 'failed' ? '!' : '•') + '</div><div><div class="event-title">' + escapeHtml(names.get(item.lead_id) ?? 'Lead') + ' • ' + escapeHtml(statusLabel(item.status)) + '</div><div class="event-meta">' + escapeHtml(item.recipient) + ' • '+txt('attempts')+' ' + item.attempts + '</div><div class="event-time">' + new Date(item.created_at).toLocaleString() + '</div></div></div>'; }).join('');
  const smokeNote = smokeTests.length ? '<p class="empty compact">' + smokeTests.length + ' internal smoke-test record(s) kept as QA history; not part of the operational queue.</p>' : '';
  notificationFeed.innerHTML = operationalFeed || smokeNote ? operationalFeed + smokeNote : '<p class="empty compact">'+txt('No notifications queued.')+'</p>';
}
let conversationPage=0;function renderChats(sessions:ChatSession[], messages:ChatMessage[]): void {const pager=document.querySelector<HTMLElement>('#chat-pages');if(pager&&chatSessionsEl&&chatCount){conversationPage=Math.min(conversationPage,Math.max(0,sessions.length-1));chatCount.textContent=sessions.length+' '+t('sessions');const s=sessions[conversationPage];if(!s){chatSessionsEl.innerHTML='<p class="empty">'+txt('No conversations yet')+'</p>';pager.innerHTML='';return;}const lines=messages.filter(m=>m.session_id===s.id);chatSessionsEl.innerHTML='<article class="chat-card"><header><strong>'+(conversationPage+1)+' / '+sessions.length+'</strong><small>'+new Date(s.created_at).toLocaleString()+'</small></header><div class="chat-preview">'+lines.map(m=>'<div class="chat-line '+m.role+'"><span>'+(m.role==='user'?txt('Visitor'):txt('Assistant'))+'</span><p>'+escapeHtml(m.content)+'</p></div>').join('')+'</div></article>';const first=Math.max(0,Math.min(conversationPage-2,sessions.length-5));pager.innerHTML='<button type="button" data-page="'+Math.max(0,conversationPage-1)+'" '+(conversationPage===0?'disabled':'')+'>‹</button>'+Array.from({length:Math.min(5,sessions.length)},(_,i)=>first+i).map(i=>'<button type="button" data-page="'+i+'" class="'+(i===conversationPage?'current':'')+'">'+(i+1)+'</button>').join('')+'<button type="button" data-page="'+Math.min(sessions.length-1,conversationPage+1)+'" '+(conversationPage===sessions.length-1?'disabled':'')+'>›</button>';pager.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.addEventListener('click',()=>{conversationPage=Number(b.dataset.page)||0;renderChats(sessions,messages);}));return;}
  if (!chatSessionsEl || !chatCount) return; chatCount.textContent = String(sessions.length) + ' ' + (sessions.length === 1 ? t('session') : t('sessions'));
  if (!sessions.length) { chatSessionsEl.innerHTML = '<p class="empty">No AI conversations yet.</p>'; return; }
  const bySession = new Map<string,ChatMessage[]>(); messages.forEach(function(message){ const list = bySession.get(message.session_id) ?? []; list.push(message); bySession.set(message.session_id,list); });
  chatSessionsEl.innerHTML = sessions.map(function(session){
    const sessionMessages = bySession.get(session.id) ?? [];
    const preview = sessionMessages.slice(-4).map(function(message){ return '<div class="chat-line ' + message.role + '"><span>' + (message.role === 'user' ? 'Visitor' : 'Assistant') + '</span><p>' + escapeHtml(message.content) + '</p></div>'; }).join('');
    return '<article class="chat-card"><header><div><strong>' + (session.locale === 'es' ? txt('Spanish') : txt('English')) + ' conversation</strong><small>' + new Date(session.created_at).toLocaleString() + '</small></div><span>' + sessionMessages.length + ' messages</span></header><div class="chat-preview">' + (preview || '<p class="empty compact">No messages stored.</p>') + '</div></article>';
  }).join('');
}

function renderProspects(items:SalesProspect[]): void {
  const folderList = document.querySelector<HTMLElement>('#documents-list');
  if (folderList) folderList.innerHTML = items.map(function(item){ const folder = item.storage_path || 'TECHPLOYX/Comercial/Prospectos/' + item.company.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '/'; return '<div class="folder-row"><strong>' + escapeHtml(item.company) + '</strong><code>' + escapeHtml(folder) + '</code></div>'; }).join('') || '<p>'+txt('No folders yet.')+'</p>';
  if (!prospectCards || !prospectCount) return;
  prospectCount.textContent = String(items.length) + ' ' + t('prospectsCount');
  if (!items.length) {
    prospectCards.innerHTML = '<p class="empty">'+txt('No prospects tracked yet.')+'</p>';
    return;
  }
  const prospectMode=document.querySelector<HTMLSelectElement>('#prospect-view')?.value || 'cards'; prospectCards.classList.toggle('prospect-list',prospectMode==='list');
  prospectCards.innerHTML = items.map(function(item){
    const contact = item.contact_name ? escapeHtml(item.contact_name) + (item.contact_role ? ' • ' + escapeHtml(item.contact_role) : '') : txt('Contact not assigned');
    const action = item.next_action ? escapeHtml(item.next_action) : txt('No next action defined');
    const path = item.storage_path ? escapeHtml(item.storage_path) : txt('Storage path not assigned');
    return '<article class="prospect-card"><div class="prospect-top"><div><strong>' + escapeHtml(item.company) + '</strong><span>' + contact + '</span></div><span class="prospect-status">' + escapeHtml(statusLabel(item.status)) + '</span></div><div class="prospect-field"><small>'+txt('NEXT ACTION')+'<p>' + action + '</p></div><div class="prospect-field"><small>'+txt('FILES')+'<code>' + path + '</code></div></article>';
  }).join('');
}

function escapeHtml(value:string): string { return value.replace(/[&<>"']/g, function(char){ return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' } as Record<string,string>)[char] ?? char; }); }

async function loadDashboard(session:Session): Promise<void> {
  if (dashboardStatus) dashboardStatus.textContent = txt('Loading command center...');
  try {
const data = await Promise.all([fetchLeads(session),fetchEvents(session),fetchChatSessions(session),fetchChatMessages(session),fetchNotifications(session),fetchProspects(session)]);
    const leads=data[0] as Lead[]; const events=data[1] as LeadEvent[]; const chatSessions=data[2] as ChatSession[]; const chatMessages=data[3] as ChatMessage[]; const notifications=data[4] as LeadNotification[]; const prospects=data[5] as SalesProspect[];
    currentLeads=leads; rememberNewestLead(leads); loginPanel?.classList.add('hidden'); dashboard?.classList.remove('hidden'); signOutButton?.classList.remove('hidden');
    renderMetrics(leads,chatSessions,notifications); renderProspects(prospects); renderFilteredLeads(session); renderEvents(events,leads); renderNotifications(notifications,leads); renderChats(chatSessions,chatMessages); applyLanguage();
  } catch (error) {
    if (error instanceof Error && error.message === 'unauthorized') { clearSession(); dashboard?.classList.add('hidden'); signOutButton?.classList.add('hidden'); loginPanel?.classList.remove('hidden'); if (loginStatus) loginStatus.textContent=txt('This account is not authorized for the TECHPLOYX command center.'); return; }
    if (dashboardStatus) dashboardStatus.textContent=txt('Could not load command center data.');
  }
}

function showAdminView(view:string):void { const names=['overview','prospects','leads','activity','notifications','chats','documents']; if(!names.includes(view))view='overview'; document.querySelectorAll<HTMLElement>('[data-section]').forEach(function(el){ el.classList.toggle('hidden',el.dataset.section!==view); }); document.querySelector<HTMLElement>('#documents-view')?.classList.toggle('hidden',view!=='documents'); document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(function(btn){ btn.classList.toggle('active',btn.dataset.view===view); }); }
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(function(btn){btn.addEventListener('click',function(){showAdminView(btn.dataset.view||'overview');});});
showAdminView('overview');
document.querySelector<HTMLSelectElement>('#prospect-view')?.addEventListener('change',function(){ const cards=document.querySelector<HTMLElement>('#prospect-cards'); if(cards)cards.classList.toggle('prospect-list',this.value==='list'); localStorage.setItem('techployx_prospect_view',this.value); });
const savedProspectView=localStorage.getItem('techployx_prospect_view');const prospectView=document.querySelector<HTMLSelectElement>('#prospect-view');if(prospectView&&savedProspectView==='list')prospectView.value='list';

loginForm?.addEventListener('submit', async function(event){
  event.preventDefault();
  const username=loginUsername?.value.trim().toLowerCase() ?? '';
  const password=loginPassword?.value ?? '';
  if (!username || !password) { if (loginStatus) loginStatus.textContent=txt('Enter your username and password.'); return; }
  if (loginStatus) loginStatus.textContent=txt('Signing in...');
  try {
    const session=await signInWithPassword(username,password);
    if (loginPassword) loginPassword.value='';
    await loadDashboard(session);
  } catch {
    if (loginStatus) loginStatus.textContent=txt('Username or password is incorrect.');
  }
});
enableAlertsButton?.addEventListener('click', async function(){
  if (!('Notification' in window)) { if (dashboardStatus) dashboardStatus.textContent=txt('Browser notifications are not supported here.'); return; }
  const permission=await Notification.requestPermission();
  if (permission !== 'granted') { if (dashboardStatus) dashboardStatus.textContent=txt('Lead alerts were not enabled.'); return; }
  alertsEnabled=true;
  localStorage.setItem('techployx_lead_alerts','enabled');
  enableAlertsButton.textContent=txt('Lead alerts enabled');
  enableAlertsButton.disabled=true;
  const session=await validSession();
  if (session) { startLeadAlertPolling(session); await pollForNewLeads(session); }
  if (dashboardStatus) dashboardStatus.textContent=txt('Lead alerts enabled on this browser.');
});
statusFilter?.addEventListener('change', async function(){ const session=await validSession(); if (session) renderFilteredLeads(session); });
refreshButton?.addEventListener('click', async function(){ const session=await validSession(); if (session) await loadDashboard(session); });
languageToggle?.addEventListener('click', function(){ currentLanguage = currentLanguage === 'en' ? 'es' : 'en'; localStorage.setItem(LANGUAGE_KEY, currentLanguage); applyLanguage();refreshStatusOptions(); const session = getSession(); if (session) void loadDashboard(session); });
signOutButton?.addEventListener('click', function(){ clearSession(); location.reload(); });
applyLanguage();
void (async function(){ const session=(await validSession()) ?? (await recoverSession()); if (session) { await loadDashboard(session); if (alertsEnabled && Notification.permission === 'granted') { if (enableAlertsButton) { enableAlertsButton.textContent=txt('Lead alerts enabled'); enableAlertsButton.disabled=true; } startLeadAlertPolling(session); } } })();