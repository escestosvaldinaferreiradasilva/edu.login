/* ============================================
   RESERVAS — reservar horário, minhas reservas e cancelamento
   Agenda Escolar — E.E.O.F.S
============================================ */

/* ---------- Reservar (horário livre) ---------- */
async function tryReserve(r,date){
  const start=$('#bfStart').value, end=$('#bfEnd').value;
  const turma=$('#bfTurma').value.trim(), obs=$('#bfObs').value.trim();
  if(!start||!end){ toast('Informe o início e o fim do horário.'); return; }
  if(end<=start){ toast('O horário final deve ser depois do inicial.'); return; }
  const btn=$('#bfReservar'); if(btn) btn.disabled=true;
  try{
    const keys=await slist(`resv:${r.id}:${date}:`);
    for(const k of keys){
      const raw=await sget(k); if(!raw) continue; const v=JSON.parse(raw);
      if(start < v.end && end > v.start){ toast(`Conflito com a reserva ${v.start}–${v.end} (${v.teacher}).`); return; }
    }
    const id='r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    await sset(`resv:${r.id}:${date}:${id}`, JSON.stringify({start,end,by:state.user.login,teacher:state.user.name,turma,obs,createdAt:Date.now()}));
    toast('Reserva confirmada ✓');
    await renderSlots(); refreshMine();
  } finally { const b2=$('#bfReservar'); if(b2) b2.disabled=false; }
}
async function cancelResv(rId,date,id){
  /* Trava: cada professor só exclui as próprias reservas.
     O professor A não mexe nas do B. O admin pode excluir qualquer uma. */
  const raw=await sget(`resv:${rId}:${date}:${id}`);
  if(raw){
    const v=JSON.parse(raw);
    const mine = v.by ? (v.by===state.user.login) : (v.teacher && state.user.name && v.teacher.toLowerCase()===state.user.name.toLowerCase());
    if(!mine && state.user.role!=='admin'){ toast('Você só pode cancelar as suas próprias reservas.'); return; }
  }
  if(!confirm('Cancelar esta reserva?'))return;
  await sdel(`resv:${rId}:${date}:${id}`);
  toast('Reserva cancelada');
  await renderSlots(); refreshMine();
}

/* ---------- (legado, não usado) ---------- */
function openBooking(slot){
  state.bookingSlot=slot;
  const r=RMAP[state.resource];
  $('#bookCtx').innerHTML=`<span class="rchip"><span class="ico-sm" style="background:${r.color}">${ICONS[r.id]}</span> ${r.name}</span> <span>${fmtLong(state.date)}</span>`;
  $('#turmaInput').value='';$('#obsInput').value='';
  $('#bookOverlay').classList.add('show');
  setTimeout(()=>$('#turmaInput').focus(),120);
}
async function confirmBooking(){
  const r=RMAP[state.resource], slot=state.bookingSlot, date=state.date;
  const key=keyFor(r.id,date,slot.id);
  const btn=$('#confirmBook'); btn.disabled=true; btn.textContent='Salvando…';
  const existing=await sget(key);
  if(existing){
    btn.disabled=false; btn.textContent='Confirmar reserva';
    $('#bookOverlay').classList.remove('show');
    toast('Esse horário acabou de ser reservado por outra pessoa.');
    renderSlots(); return;
  }
  const data={by:state.user.login, teacher:state.user.name, turma:$('#turmaInput').value.trim(), obs:$('#obsInput').value.trim(), createdAt:Date.now()};
  await sset(key,JSON.stringify(data));
  btn.disabled=false; btn.textContent='Confirmar reserva';
  $('#bookOverlay').classList.remove('show');
  toast('Reserva confirmada ✓');
  renderSlots(); refreshMine();
}
async function cancelReservation(rId,date,slotId){
  if(!confirm('Cancelar esta reserva?')) return;
  await sdel(keyFor(rId,date,slotId));
  toast('Reserva cancelada');
  renderSlots(); refreshMine();
}

/* ---------- Reservas (todas x minhas) ----------
   loadReservas(false) → TODAS as reservas futuras (todos os professores).
   loadReservas(true)  → apenas as reservas do usuário logado.
   O painel de baixo agora mostra TODAS, para que admin e professores
   enxerguem tudo que já está agendado. Cada item traz o campo `mine`
   (true se for do próprio usuário) para marcar "você" e liberar o cancelar. */
async function loadReservas(onlyMine=false){
  purgeDiasPassados();                         // limpeza silenciosa dos dias já passados
  const meLogin=state.user.login;
  const keys=await slist('resv:');
  const out=[];
  for(const k of keys){
    const parts=k.split(':');
    if(parts.length<4) continue;
    const date=parts[2];
    if(date<todayStr) continue;
    const raw=await sget(k);
    if(!raw) continue;
    const v=JSON.parse(raw);
    if(reservaExpirou(date,v.end)) continue;    // já terminou → some da lista
    const mine = v.by ? (v.by===meLogin) : (v.teacher && state.user.name && v.teacher.toLowerCase()===state.user.name.toLowerCase());
    if(onlyMine && !mine) continue;
    out.push({rId:parts[1],date,id:parts[3],mine,...v});
  }
  out.sort((a,b)=> a.date===b.date ? (a.start<b.start?-1:1) : (a.date<b.date?-1:1));
  return out;
}
/* mantido por compatibilidade (usado pelo modal antigo) */
async function loadMine(){ return loadReservas(true); }
async function refreshMineCount(){
  const c=$('#mineCount');
  if(!c) return;
  const list=await loadReservas(false); // conta TODAS as reservas futuras
  if(list.length){c.style.display='inline';c.textContent=list.length;}else{c.style.display='none';}
}
async function renderMineInline(){
  const box=$('#mineInline'); if(!box) return;
  const isAdmin = state.user.role==='admin';
  const list=await loadReservas(false); // TODAS as reservas futuras (todos veem tudo)
  if(!list.length){
    box.innerHTML='<div class="empty-hint" style="padding:20px 10px"><span class="big">🗓️</span>Nenhuma reserva futura ainda.<br><span style="font-size:12px">Reserve um horário acima e ele aparece aqui.</span></div>';
    return;
  }
  box.innerHTML='';
  list.forEach(it=>{
    const r=RMAP[it.rId];
    const who = esc(it.teacher||'') + (it.mine?' (você)':'');
    const canCancel = it.mine || isAdmin; // dono exclui a sua; admin exclui qualquer uma
    const row=document.createElement('div');row.className='mine-item'+(it.mine?' is-mine':'');
    row.innerHTML=`
      <div class="ico" style="background:${r.color}">${ICONS[r.id]}</div>
      <div class="mi">
        <div class="t1">${r.name} · ${it.start} – ${it.end}</div>
        <div class="t2">${fmtLong(it.date)} · ${who}${it.turma?' · '+esc(it.turma):''}</div>
      </div>
      ${canCancel?'<button>Cancelar</button>':''}`;
    const btn=row.querySelector('button');
    if(btn) btn.onclick=()=>cancelResv(it.rId,it.date,it.id); // guard interno garante que A não mexe no B
    box.appendChild(row);
  });
}
async function refreshMine(){ await refreshMineCount(); await renderMineInline(); }
async function openMine(){
  const box=$('#mineList'); box.innerHTML='<div class="empty-hint">Carregando…</div>';
  $('#mineOverlay').classList.add('show');
  const list=await loadMine();
  if(!list.length){ box.innerHTML='<div class="empty-hint"><span class="big">🗓️</span>Você não tem reservas futuras.</div>'; return; }
  box.innerHTML='';
  list.forEach(it=>{
    const r=RMAP[it.rId], s=ALLSLOTS[it.slotId];
    const row=document.createElement('div');row.className='mine-item';
    row.innerHTML=`
      <div class="ico" style="background:${r.color}">${ICONS[r.id]}</div>
      <div class="mi">
        <div class="t1">${r.name} · ${s?s.aula+' horário':''}</div>
        <div class="t2">${fmtLong(it.date)} · ${s?s.hrs:''}${it.turma?' · '+esc(it.turma):''}</div>
      </div>
      <button>Cancelar</button>`;
    row.querySelector('button').onclick=async()=>{
      if(!confirm('Cancelar esta reserva?'))return;
      await sdel(keyFor(it.rId,it.date,it.slotId));
      openMine(); renderSlots(); refreshMineCount();
    };
    box.appendChild(row);
  });
}
