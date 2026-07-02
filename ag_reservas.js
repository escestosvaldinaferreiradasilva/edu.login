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

/* ---------- Minhas reservas ---------- */
async function loadMine(){
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
    const mine = v.by ? (v.by===meLogin) : (v.teacher && v.teacher.toLowerCase()===state.user.name.toLowerCase());
    if(!mine) continue;
    out.push({rId:parts[1],date,id:parts[3],...v});
  }
  out.sort((a,b)=> a.date===b.date ? (a.start<b.start?-1:1) : (a.date<b.date?-1:1));
  return out;
}
async function refreshMineCount(){
  const c=$('#mineCount');
  if(!c) return;
  const list=await loadMine();
  if(list.length){c.style.display='inline';c.textContent=list.length;}else{c.style.display='none';}
}
async function renderMineInline(){
  const box=$('#mineInline'); if(!box) return;
  const list=await loadMine();
  if(!list.length){
    box.innerHTML='<div class="empty-hint" style="padding:20px 10px"><span class="big">🗓️</span>Você ainda não tem reservas futuras.<br><span style="font-size:12px">Reserve um horário acima e ele aparece aqui.</span></div>';
    return;
  }
  box.innerHTML='';
  list.forEach(it=>{
    const r=RMAP[it.rId];
    const row=document.createElement('div');row.className='mine-item';
    row.innerHTML=`
      <div class="ico" style="background:${r.color}">${ICONS[r.id]}</div>
      <div class="mi">
        <div class="t1">${r.name} · ${it.start} – ${it.end}</div>
        <div class="t2">${fmtLong(it.date)}${it.turma?' · '+esc(it.turma):''}</div>
      </div>
      <button>Cancelar</button>`;
    row.querySelector('button').onclick=async()=>{
      if(!confirm('Cancelar esta reserva?'))return;
      await sdel(`resv:${it.rId}:${it.date}:${it.id}`);
      toast('Reserva cancelada');
      renderSlots(); refreshMine();
    };
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
