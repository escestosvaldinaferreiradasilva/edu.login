/* ============================================
   NÚCLEO — armazenamento (Claude/localStorage), datas, estado e helpers de UI
   Agenda Escolar — E.E.O.F.S
============================================ */

/* ---------- Armazenamento ----------
   Ordem de prioridade:
   1) SUPABASE (se configurado em ag_config.js) — banco central: todos veem as mesmas reservas.
      · usuários  → tabela public.usuarios
      · reservas  → tabela public.reservas
      · sessão    → sessionStorage do navegador (some ao fechar a aba; nunca vai ao banco)
   2) window.storage (pré-visualização dentro do Claude)
   3) memória temporária                                                     */
const hasStore = (typeof window!=='undefined' && window.storage);
const mem = {};

/* Cliente Supabase (só é criado se ag_config.js estiver preenchido) */
const sb = (function(){
  try{
    if(typeof SUPABASE_URL!=='undefined' && /^https?:\/\//.test(SUPABASE_URL)
       && typeof SUPABASE_ANON_KEY!=='undefined' && SUPABASE_ANON_KEY.length>20
       && typeof supabase!=='undefined'){
      return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }catch(e){ console.error('Supabase não iniciado:', e); }
  return null;
})();

/* Traduz a chave interna do app para tabela/colunas do banco */
function parseKey(k){
  if(k.indexOf('user:')===0) return {t:'user', login:k.slice(5)};
  const p=k.split(':');
  if((p[0]==='slot'||p[0]==='resv') && p.length>=4)
    return {t:'resv', tipo:p[0], recurso:p[1], data:p[2], item:p.slice(3).join(':')};
  return {t:'outro'};
}
function dbErr(op,error){ if(error){ console.error('[Supabase '+op+']', error.message||error); toastDb(); } return !error; }
let _dbToastAt=0;
function toastDb(){ const now=Date.now(); if(now-_dbToastAt>8000){ _dbToastAt=now; try{ toast('Falha de conexão com o banco. Verifique a internet.'); }catch(e){} } }

function pfx(k,shared){ return 'eeofs:'+(shared?'s':'p')+':'+k; }
function basePfx(shared){ return 'eeofs:'+(shared?'s':'p')+':'; }

async function sget(k,shared=true){
  /* sessão: sempre no sessionStorage local (nunca vai ao Supabase) */
  if(k==='session'){
    try{ return sessionStorage.getItem('eeofs:session'); }catch(e){ return mem['session']||null; }
  }
  if(sb && shared){
    const info=parseKey(k);
    if(info.t==='user'){
      const {data,error}=await sb.from('usuarios').select('dados').eq('login',info.login).maybeSingle();
      dbErr('ler usuário',error);
      return data ? JSON.stringify(data.dados) : null;
    }
    if(info.t==='resv'){
      const {data,error}=await sb.from('reservas').select('dados').eq('chave',k).maybeSingle();
      dbErr('ler reserva',error);
      return data ? JSON.stringify(data.dados) : null;
    }
  }
  if(hasStore){ try{ const r=await window.storage.get(k,shared); return r?r.value:null; }catch(e){ return null; } }
  const kk=pfx(k,shared);
  return (kk in mem)? mem[kk] : null;
}

async function sset(k,v,shared=true){
  /* sessão: sempre no sessionStorage local (nunca vai ao Supabase) */
  if(k==='session'){
    try{ sessionStorage.setItem('eeofs:session',v); }catch(e){ mem['session']=v; }
    return {key:k,value:v};
  }
  if(sb && shared){
    const info=parseKey(k);
    if(info.t==='user'){
      const u=JSON.parse(v);
      const {error}=await sb.from('usuarios').upsert({login:info.login, nome:u.name||'', papel:u.role||'prof', dados:u});
      return dbErr('salvar usuário',error) ? {key:k,value:v} : null;
    }
    if(info.t==='resv'){
      const d=JSON.parse(v);
      const {error}=await sb.from('reservas').upsert({chave:k, tipo:info.tipo, recurso:info.recurso, data:info.data, item:info.item, dados:d});
      return dbErr('salvar reserva',error) ? {key:k,value:v} : null;
    }
  }
  if(hasStore){ try{ return await window.storage.set(k,v,shared); }catch(e){ return null; } }
  const kk=pfx(k,shared);
  mem[kk]=v;
  return {key:k,value:v};
}

async function sdel(k,shared=true){
  /* sessão: limpa do sessionStorage local */
  if(k==='session'){
    try{ sessionStorage.removeItem('eeofs:session'); }catch(e){ delete mem['session']; }
    return;
  }
  if(sb && shared){
    const info=parseKey(k);
    if(info.t==='user'){ const {error}=await sb.from('usuarios').delete().eq('login',info.login); dbErr('remover usuário',error); return; }
    if(info.t==='resv'){ const {error}=await sb.from('reservas').delete().eq('chave',k); dbErr('remover reserva',error); return; }
  }
  if(hasStore){ try{ await window.storage.delete(k,shared); }catch(e){} return; }
  const kk=pfx(k,shared);
  delete mem[kk];
}

async function slist(prefix,shared=true){
  if(sb && shared){
    if(prefix==='user:' || prefix==='user'){
      const {data,error}=await sb.from('usuarios').select('login');
      dbErr('listar usuários',error);
      return (data||[]).map(r=>'user:'+r.login);
    }
    const p=prefix.split(':');
    if(p[0]==='slot' || p[0]==='resv'){
      let q=sb.from('reservas').select('chave').eq('tipo',p[0]);
      if(p[1]) q=q.eq('recurso',p[1]);
      if(p[2]) q=q.eq('data',p[2]);
      const {data,error}=await q;
      dbErr('listar reservas',error);
      return (data||[]).map(r=>r.chave);
    }
    return [];
  }
  if(hasStore){ try{ const r=await window.storage.list(prefix,shared); return r?(r.keys||[]):[]; }catch(e){ return []; } }
  const base=basePfx(shared), full=pfx(prefix,shared), out=[];
  for(const key of Object.keys(mem)){ if(key.indexOf(full)===0) out.push(key.slice(base.length)); }
  return out;
}

/* ---------- Datas ---------- */
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function mondayOf(d){const x=new Date(d);const off=(x.getDay()+6)%7;x.setDate(x.getDate()-off);x.setHours(0,0,0,0);return x;}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function parseYmd(s){const[y,m,da]=s.split('-').map(Number);return new Date(y,m-1,da);}
function fmtLong(s){const d=parseYmd(s);return DOW[d.getDay()]+', '+d.getDate()+' '+MES[d.getMonth()];}

/* ---------- Estado ---------- */
const todayStr = ymd(new Date());
let state = {
  user:null,
  resource:null,
  weekStart: mondayOf(new Date()),
  date: (new Date().getDay()===0) ? ymd(addDays(mondayOf(new Date()),0)) : todayStr,
  turno: (new Date().getHours()<12?'manha':(new Date().getHours()<18?'tarde':'noite')),
  bookingSlot:null,
};

/* ---------- Helpers UI ---------- */
const $=s=>document.querySelector(s);
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._to);t._to=setTimeout(()=>t.classList.remove('show'),2600);}
function keyFor(rId,date,slotId){return `slot:${rId}:${date}:${slotId}`;}

/* Tooltip de descrição (mouse e toque) */
let tipEl=null, tipTO=null;
function ensureTip(){ if(!tipEl){ tipEl=document.createElement('div'); tipEl.className='tip'; document.body.appendChild(tipEl); } return tipEl; }
function showTip(anchor,text){
  if(!text) return;
  const t=ensureTip(); t.textContent=text; t.classList.remove('below');
  t.style.left='-9999px'; t.style.top='0px'; t.classList.add('show');
  const r=anchor.getBoundingClientRect(), tw=t.offsetWidth, th=t.offsetHeight;
  let left=Math.max(8, Math.min(r.left + r.width/2 - tw/2, window.innerWidth-tw-8));
  let top=r.top - th - 10;
  if(top<8){ top=r.bottom+10; t.classList.add('below'); }
  t.style.setProperty('--ax', Math.max(12,Math.min(r.left + r.width/2 - left, tw-12))+'px');
  t.style.left=left+'px'; t.style.top=top+'px';
  clearTimeout(tipTO);
}
function hideTip(){ if(tipEl) tipEl.classList.remove('show'); clearTimeout(tipTO); }
window.addEventListener('scroll',hideTip,{passive:true});
function esc(s){return (s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function initials(name){const p=(name||'').trim().split(/\s+/);return ((p[0]||'·')[0]+(p.length>1?p[p.length-1][0]:'')).toUpperCase();}
const roleLabel=r=> r==='admin'?'Administrador':'Professor';
