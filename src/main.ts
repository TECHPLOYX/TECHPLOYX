import './styles.css';
import './chat.css';
import { api } from './platform-api';

const SUPABASE_URL = 'https://wkfmdtfhvdeyhhxatfll.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_PmvEZM1IX5ma4qYbNmGB5Q_DBJNUxOo';
const locale = document.body.dataset.locale === 'es' ? 'es' : 'en';
const copy = locale === 'es'
  ? { thinking: 'Pensando...', error: 'No pude responder ahora. Intenta nuevamente.', captured: 'Perfecto. Ya tengo tus datos para que TECHPLOYX pueda darte seguimiento desde aquí.', what: 'Quiero saber qué puede hacer TECHPLOYX por mi negocio.' }
  : { thinking: 'Thinking...', error: 'I could not respond right now. Please try again.', captured: 'Perfect. I have your details so TECHPLOYX can follow up from here.', what: 'I want to know what TECHPLOYX can do for my business.' };

type ChatRole = 'user' | 'assistant';
type ChatItem = { role: ChatRole; content: string };
type LeadCapture = { ready?: boolean; name?: string | null; company?: string | null; email?: string | null; phone?: string | null; preferredContact?: 'email' | 'phone' | null; need?: string | null };

const launcher = document.querySelector<HTMLButtonElement>('#chat-launcher');
const heroChat = document.querySelector<HTMLButtonElement>('#hero-chat-cta');
const heroWhat = document.querySelector<HTMLButtonElement>('#hero-what-cta');
const panel = document.querySelector<HTMLElement>('#chat-panel');
const closeButton = document.querySelector<HTMLButtonElement>('#chat-close');
const chatForm = document.querySelector<HTMLFormElement>('#chat-form');
const chatInput = document.querySelector<HTMLTextAreaElement>('#chat-input');
const chatMessages = document.querySelector<HTMLElement>('#chat-messages');
let chatSessionId = localStorage.getItem('techployx_chat_session');
let leadSaved = !!chatSessionId && localStorage.getItem('techployx_chat_lead_saved_' + chatSessionId) === '1';
let history: ChatItem[] = [];

function toggleChat(open: boolean): void {
  panel?.classList.toggle('hidden', !open);
  launcher?.setAttribute('aria-expanded', String(open));
  if (open) chatInput?.focus();
}
launcher?.addEventListener('click', () => toggleChat(panel?.classList.contains('hidden') ?? true));
heroChat?.addEventListener('click', () => toggleChat(true));
heroWhat?.addEventListener('click', () => { toggleChat(true); if (chatInput) { chatInput.value = copy.what; chatInput.focus(); } });
closeButton?.addEventListener('click', () => toggleChat(false));

async function ensureChatSession(): Promise<string> {
  if (chatSessionId) return chatSessionId;
  chatSessionId = crypto.randomUUID();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/chat_sessions`, { method:'POST', headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'}, body:JSON.stringify({id:chatSessionId,locale,source:'landing_ai'}) });
  if (!response.ok) { chatSessionId = null; throw new Error('Unable to create chat session'); }
  localStorage.setItem('techployx_chat_session', chatSessionId);
  return chatSessionId;
}

async function logChatMessage(sessionId:string, role:ChatRole, content:string):Promise<void>{
  try {
    const response=await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, { method:'POST', headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'}, body:JSON.stringify({session_id:sessionId,role,content}) });
    if(!response.ok) console.warn('Chat message log skipped',response.status);
  } catch(error) {
    console.warn('Chat message log unavailable',error);
  }
}

function addChatMessage(role:ChatRole|'system', content:string, pending=false):HTMLElement|null{
  if(!chatMessages) return null;
  const el=document.createElement('div'); el.className=`chat-message ${role}${pending?' pending':''}`; el.textContent=content; chatMessages.appendChild(el); chatMessages.scrollTop=chatMessages.scrollHeight; return el;
}

async function captureLead(sessionId:string,capture:LeadCapture):Promise<void>{
  if(leadSaved||!capture.ready||!capture.name||!capture.need||!capture.phone||!capture.email) return;
  const email=capture.email?.trim()||null; const phone=capture.phone?.trim()||null; if(!email||!phone) return;
  const response=await fetch(`${SUPABASE_URL}/rest/v1/leads`,{method:'POST',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({name:capture.name.trim(),company:capture.company?.trim()||null,email,phone,preferred_contact:capture.preferredContact||(email?'email':'phone'),need:capture.need.trim(),chat_session_id:sessionId,status:'new',source:'chat'})});
  if(!response.ok) throw new Error(`Lead capture failed with status ${response.status}`);
  leadSaved=true; localStorage.setItem('techployx_chat_lead_saved_' + sessionId,'1'); addChatMessage('system',copy.captured);
}

chatForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const message=chatInput?.value.trim()??'';
  if(!message)return;
  if(chatInput){chatInput.value='';chatInput.disabled=true;}
  const sendButton=chatForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  if(sendButton)sendButton.disabled=true;
  addChatMessage('user',message);
  const pending=addChatMessage('assistant',copy.thinking,true);
  try{
    const sessionId=await ensureChatSession().catch(error=>{console.warn('Chat session unavailable',error);return null;});
    if(sessionId) await logChatMessage(sessionId,'user',message);
    const response=await api.post('/api/chat',{message,locale,history:history.slice(-16)});
    const answer=String(response.data?.answer??'').trim();
    if(!answer)throw new Error('Empty agent response');
    pending?.remove();
    addChatMessage('assistant',answer);
    history=[...history,{role:'user',content:message},{role:'assistant',content:answer}].slice(-20);
    if(sessionId) await logChatMessage(sessionId,'assistant',answer);
    if(sessionId && !leadSaved){
      try{await captureLead(sessionId,(response.data?.leadCapture??{}) as LeadCapture);}
      catch(error){console.error('Lead capture unavailable',error);}
    }
  }catch(error){console.error(error);pending?.remove();addChatMessage('assistant',copy.error);}
  finally{if(chatInput)chatInput.disabled=false;if(sendButton)sendButton.disabled=false;chatInput?.focus();}
});