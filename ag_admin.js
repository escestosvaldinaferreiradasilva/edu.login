/* ============================================
   PAINEL DE PROFESSORES — cadastro/edição/remoção de usuários (admin)
   Agenda Escolar — E.E.O.F.S
============================================ */

/* ===================================================================
   PAINEL DE PROFESSORES (admin)
=================================================================== */
let editingLogin=null, formRole='professor';
function setFormRole(r){
  formRole=r;
  document.querySelectorAll('#fRole button').forEach(b=>b.classList.toggle('on',b.dataset.r===r));
}
function resetForm(){
  editingLogin=null;
  $('#formTitle').textContent='Novo professor';
  $('#fName').value='';$('#fLogin').value='';$('#fPass').value='';
  $('#fLogin').disabled=false;
  $('#fPassLbl').textContent='Senha';
  $('#fPass').placeholder='senha de acesso';
  $('#formCancel').style.display='none';
  $('#formSave').textContent='Salvar professor';
  setFormRole('professor');
}
async function openAdmin(){
  resetForm();
  $('#adminOverlay').classList.add('show');
  await renderUserList();
}
async function renderUserList(){
  const box=$('#userList'); box.innerHTML='<div class="empty-hint">Carregando…</div>';
  const us=await listUsers();
  if(!us.length){ box.innerHTML='<div class="empty-hint">Nenhuma conta ainda.</div>'; return; }
  box.innerHTML='';
  us.forEach(u=>{
    const color = u.role==='admin' ? '#1c6f30' : '#2e9d44';
    const row=document.createElement('div');row.className='ulist-item';
    row.innerHTML=`
      <div class="ava" style="background:${color}">${initials(u.name)}</div>
      <div class="ui">
        <div class="n">${esc(u.name)} <span class="badge ${u.role==='admin'?'adm':'prof'}">${u.role==='admin'?'Admin':'Prof'}</span></div>
        <div class="l">login: ${esc(u.login)}</div>
      </div>
      <div class="acts">
        <button class="edit" title="Editar">✏️</button>
        <button class="del" title="Excluir">🗑️</button>
      </div>`;
    row.querySelector('.edit').onclick=()=>startEdit(u);
    row.querySelector('.del').onclick=()=>removeUser(u);
    box.appendChild(row);
  });
}
function startEdit(u){
  editingLogin=u.login;
  $('#formTitle').textContent='Editar conta';
  $('#fName').value=u.name;
  $('#fLogin').value=u.login;
  $('#fLogin').disabled=true;
  $('#fPass').value='';
  $('#fPassLbl').textContent='Nova senha (opcional)';
  $('#fPass').placeholder='deixe em branco p/ manter';
  $('#formCancel').style.display='';
  $('#formSave').textContent='Salvar alterações';
  setFormRole(u.role);
  $('#adminOverlay').scrollTo?.(0,0);
}
async function saveForm(){
  const name=$('#fName').value.trim();
  const login=normLogin($('#fLogin').value);
  const pw=$('#fPass').value;
  if(!name){toast('Informe o nome.');return;}
  if(!login){toast('Informe o login.');return;}
  const btn=$('#formSave');btn.disabled=true;
  try{
    if(editingLogin){
      const u=await getUser(editingLogin); if(!u){toast('Conta não encontrada.');return;}
      // impedir remover o último admin ao rebaixar
      if(u.role==='admin' && formRole!=='admin' && (await countAdmins())<=1){
        toast('Deve existir pelo menos 1 administrador.');return;
      }
      u.name=name; u.role=formRole;
      if(pw){ if(pw.length<4){toast('Senha muito curta (mín. 4).');return;} u.pass=await hashPass(u.login,pw); }
      await saveUser(u);
      if(state.user.login===u.login){ state.user.name=u.name; state.user.role=u.role; $('#uName').textContent=u.name; $('#uRole').textContent=roleLabel(u.role); $('#uAvatar').textContent=initials(u.name); $('#adminBtn').style.display=u.role==='admin'?'':'none'; await setSession(state.user); }
      toast('Conta atualizada ✓');
    }else{
      if(await getUser(login)){toast('Já existe uma conta com esse login.');return;}
      if(pw.length<4){toast('A senha precisa ter ao menos 4 caracteres.');return;}
      const u={login,name,role:formRole,pass:await hashPass(login,pw),createdAt:Date.now()};
      await saveUser(u);
      toast('Conta criada ✓');
    }
    resetForm();
    await renderUserList();
  } finally { btn.disabled=false; }
}
async function removeUser(u){
  if(u.login===state.user.login){toast('Você não pode excluir a própria conta.');return;}
  if(u.role==='admin' && (await countAdmins())<=1){toast('Deve existir pelo menos 1 administrador.');return;}
  if(!confirm(`Excluir a conta de ${u.name}?`))return;
  await delUserRec(u.login);
  toast('Conta excluída');
  await renderUserList();
}
