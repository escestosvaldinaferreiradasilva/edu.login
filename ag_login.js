/* ============================================
   CONTAS / LOGIN — telas, sessão, hash de senha
   Agenda Escolar — E.E.O.F.S
============================================ */

/* ===================================================================
   CONTAS / LOGIN
=================================================================== */
const SALT='eeofs::v1::';
const normLogin=s=>(s||'').toLowerCase().trim().replace(/\s+/g,'');
async function hashPass(login,pw){
  const msg=SALT+normLogin(login)+'::'+pw;
  try{
    if(window.crypto && crypto.subtle){
      const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(msg));
      return 'h1:'+[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
    }
  }catch(e){}
  let h=0x811c9dc5;
  for(let i=0;i<msg.length;i++){h^=msg.charCodeAt(i);h=Math.imul(h,0x01000193);}
  return 'h0:'+(h>>>0).toString(16);
}
async function getUser(login){const raw=await sget('user:'+normLogin(login));return raw?JSON.parse(raw):null;}
async function saveUser(u){await sset('user:'+normLogin(u.login),JSON.stringify(u));}
async function delUserRec(login){await sdel('user:'+normLogin(login));}
async function listUsers(){
  const keys=await slist('user:');const out=[];
  for(const k of keys){const raw=await sget(k);if(raw)out.push(JSON.parse(raw));}
  out.sort((a,b)=>(a.name||'').localeCompare(b.name||''));return out;
}
async function countAdmins(){const us=await listUsers();return us.filter(u=>u.role==='admin').length;}
async function loadSession(){const raw=await sget('session',false);return raw?JSON.parse(raw):null;}
async function setSession(s){await sset('session',JSON.stringify(s),false);}
async function clearSession(){await sdel('session',false);}

/* ---------- Telas ---------- */
function showScreen(id){
  ['#splash','#login','#welcome'].forEach(s=>$(s).classList.add('hidden'));
  $('#appWrap').style.display='none';
  if(id==='app'){ $('#appWrap').style.display=''; return; }
  $(id).classList.remove('hidden');
}

/* Entrar (botão da splash) */
async function onEnter(){
  const sess=await loadSession();
  if(sess){
    const u=await getUser(sess.login);
    if(u){ welcomeThenApp(u); return; }
  }
  await showLogin();
}

/* Tela de login (ou primeiro acesso) */
let loginMode='login';
async function showLogin(){
  const admins=await countAdmins();
  loginMode = admins>0 ? 'login' : 'setup';
  const f=$('#loginFields');
  $('#loginErr').classList.remove('show');
  if(loginMode==='setup'){
    $('#loginTitle').textContent='Primeiro acesso';
    $('#loginSub').textContent='Crie a conta do Administrador da escola';
    f.innerHTML=`
      <div class="field"><label>Seu nome</label><input id="inName" placeholder="Nome do administrador" autocomplete="off"></div>
      <div class="field"><label>Login (usuário)</label><input id="inLogin" placeholder="ex.: admin" autocomplete="off"></div>
      <div class="field"><label>Senha</label><div class="pw-wrap"><input id="inPass" type="password" placeholder="crie uma senha"><button type="button" class="pw-toggle" id="pwToggle">👁</button></div></div>
      <div class="field"><label>Confirmar senha</label><div class="pw-wrap"><input id="inPass2" type="password" placeholder="repita a senha"></div></div>`;
    $('#loginBtn').textContent='Criar administrador';
  }else{
    $('#loginTitle').textContent='Acessar a agenda';
    $('#loginSub').textContent='Entre com seu login e senha';
    f.innerHTML=`
      <div class="field"><label>Login (usuário)</label><input id="inLogin" placeholder="seu login" autocomplete="username"></div>
      <div class="field"><label>Senha</label><div class="pw-wrap"><input id="inPass" type="password" placeholder="sua senha" autocomplete="current-password"><button type="button" class="pw-toggle" id="pwToggle">👁</button></div></div>`;
    $('#loginBtn').textContent='Entrar';
  }
  const tgl=$('#pwToggle');
  if(tgl) tgl.onclick=()=>{
    const ps=f.querySelectorAll('input[type="password"],input[data-pw]');
    f.querySelectorAll('#inPass,#inPass2').forEach(i=>{ i.type = i.type==='password'?'text':'password'; });
    tgl.textContent = (f.querySelector('#inPass')||{}).type==='text' ? '🙈' : '👁';
  };
  f.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')submitLogin();}));
  showScreen('#login');
  setTimeout(()=>{const a=f.querySelector('input');if(a)a.focus();},150);
}
function loginError(msg){const e=$('#loginErr');e.textContent=msg;e.classList.add('show');}

async function submitLogin(){
  const btn=$('#loginBtn'); btn.disabled=true;
  try{
    if(loginMode==='setup'){
      const name=$('#inName').value.trim();
      const login=normLogin($('#inLogin').value);
      const pw=$('#inPass').value, pw2=$('#inPass2').value;
      if(!name){loginError('Informe seu nome.');return;}
      if(!login){loginError('Escolha um login.');return;}
      if(pw.length<4){loginError('A senha precisa ter ao menos 4 caracteres.');return;}
      if(pw!==pw2){loginError('As senhas não conferem.');return;}
      const u={login,name,role:'admin',pass:await hashPass(login,pw),createdAt:Date.now()};
      await saveUser(u);
      await setSession({login:u.login,name:u.name,role:u.role});
      toast('Administrador criado ✓');
      welcomeThenApp(u);
    }else{
      const login=normLogin($('#inLogin').value);
      const pw=$('#inPass').value;
      if(!login||!pw){loginError('Preencha login e senha.');return;}
      const u=await getUser(login);
      if(!u){loginError('Login ou senha incorretos.');return;}
      const h=await hashPass(login,pw);
      if(h!==u.pass){loginError('Login ou senha incorretos.');return;}
      await setSession({login:u.login,name:u.name,role:u.role});
      welcomeThenApp(u);
    }
  } finally { btn.disabled=false; }
}

/* Boas-vindas após login → app */
function welcomeThenApp(u){
  const first=(u.name||'').trim().split(/\s+/)[0]||'Professor(a)';
  $('#welcomeName').textContent=(u.role==='admin'?'':'')+ (u.name||first);
  showScreen('#welcome');
  setTimeout(()=>enterApp(u),2500);
}

/* Entra no sistema */
async function enterApp(u){
  state.user={login:u.login,name:u.name,role:u.role};
  $('#uAvatar').textContent=initials(u.name);
  $('#uName').textContent=u.name;
  $('#uRole').textContent=roleLabel(u.role);
  $('#adminBtn').style.display = u.role==='admin' ? '' : 'none';
  showScreen('app');
  renderChips(); renderWeek(); renderTurnos();
  await renderSlots();
  await refreshMine();
}
