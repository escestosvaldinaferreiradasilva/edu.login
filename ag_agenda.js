/* ============================================
   AGENDA — recursos, semana, turnos, horários e navegação
   Agenda Escolar — E.E.O.F.S
============================================ */

/* ===================================================================
   AGENDA
=================================================================== */
function renderChips(){
  const eq=$('#chipsEquip'), es=$('#chipsEspaco');
  eq.innerHTML='';es.innerHTML='';
  RESOURCES.forEach(r=>{
    const b=document.createElement('button');
    b.className='chip'+(state.resource===r.id?' active':'');
    b.style.setProperty('--rc',r.color);
    b.innerHTML=`<span class="ico" style="background:${r.color}">${ICONS[r.id]}</span><span class="nm">${r.name}</span>`;
    b.onclick=()=>{state.resource=r.id;renderChips();renderSlots();};
    const desc=DESCS[r.id]||'';
    b.addEventListener('mouseenter',()=>showTip(b,desc));
    b.addEventListener('mouseleave',hideTip);
    b.addEventListener('touchstart',()=>{ showTip(b,desc); clearTimeout(tipTO); tipTO=setTimeout(hideTip,2300); },{passive:true});
    (r.cat==='equip'?eq:es).appendChild(b);
  });
}
function renderWeek(){
  const ws=state.weekStart, we=addDays(ws,5);
  $('#weekRange').textContent = ws.getDate()+' '+MES[ws.getMonth()]+' – '+we.getDate()+' '+MES[we.getMonth()];
  const strip=$('#daysStrip');strip.innerHTML='';
  for(let i=0;i<6;i++){
    const d=addDays(ws,i), ds=ymd(d);
    const b=document.createElement('button');
    b.className='day-b'+(state.date===ds?' active':'')+(ds===todayStr?' is-today':'')+(ds<todayStr?' past':'');
    b.innerHTML=`<div class="dow">${DOW[d.getDay()]}</div><div class="dnum">${d.getDate()}</div>`;
    b.onclick=()=>{state.date=ds;renderWeek();renderSlots();};
    strip.appendChild(b);
  }
}
function renderTurnos(){
  document.querySelectorAll('#turnos button').forEach(b=>{
    b.classList.toggle('active', b.dataset.t===state.turno);
    b.onclick=()=>{state.turno=b.dataset.t;renderTurnos();renderSlots();};
  });
}
async function renderSlots(){
  const box=$('#bookArea');
  if(!box) return;
  if(!state.resource){
    box.innerHTML=`<div class="empty-hint"><span class="big">👆</span>Escolha um equipamento ou espaço acima para reservar um horário.</div>`;
    return;
  }
  const r=RMAP[state.resource], date=state.date;
  box.innerHTML=`<div class="empty-hint">Carregando…</div>`;
  const isPast = date<todayStr;
  const meLogin=state.user.login, isAdmin=state.user.role==='admin';
  const keys=await slist(`resv:${r.id}:${date}:`);
  const resvs=[];
  for(const k of keys){ const raw=await sget(k); if(raw){ const v=JSON.parse(raw); v._id=k.split(':')[3]; resvs.push(v); } }
  resvs.sort((a,b)=> a.start<b.start?-1:1);
  let html='';
  if(!isPast){
    html+=`<div class="book-form">
      <div class="bf-times">
        <div><label>Início</label><input type="time" id="bfStart"></div>
        <span class="bf-sep">→</span>
        <div><label>Fim</label><input type="time" id="bfEnd"></div>
      </div>
      <div class="bf-field"><label>Turma / finalidade</label><input id="bfTurma" placeholder="Ex.: 7º B — Ciências" autocomplete="off"></div>
      <div class="bf-field"><label>Observação (opcional)</label><input id="bfObs" placeholder="Ex.: levar cabo HDMI" autocomplete="off"></div>
      <button class="bf-btn" id="bfReservar">Reservar horário</button>
    </div>`;
  }else{
    html+=`<div class="empty-hint" style="padding:12px">Este dia já passou — apenas visualização.</div>`;
  }
  html+=`<div class="day-list-title">Reservas de ${esc(r.name)} neste dia</div>`;
  if(!resvs.length){
    html+=`<div class="empty-hint" style="padding:16px 10px">Nenhuma reserva neste dia.${isPast?'':' Seja o primeiro a reservar!'}</div>`;
  }else{
    html+=resvs.map(v=>{
      const mine = v.by ? (v.by===meLogin) : (v.teacher && state.user.name && v.teacher.toLowerCase()===state.user.name.toLowerCase());
      const canCancel=(mine||isAdmin)&&!isPast;
      return `<div class="rv-item ${mine?'mine':''}">
        <div class="rv-time">${v.start} – ${v.end}</div>
        <div class="rv-info">
          <div class="rv-who">${esc(v.teacher)}${mine?'<span class="tag-mine">VOCÊ</span>':''}</div>
          <div class="rv-sub">${esc(v.turma||v.obs||'Reservado')}</div>
        </div>
        ${canCancel?`<button class="rv-cancel" data-id="${v._id}">Cancelar</button>`:''}
      </div>`;
    }).join('');
  }
  box.innerHTML=html;
  if(!isPast){ const btn=$('#bfReservar'); if(btn) btn.onclick=()=>tryReserve(r,date); }
  box.querySelectorAll('.rv-cancel').forEach(b=>{ b.onclick=()=>cancelResv(r.id,date,b.getAttribute('data-id')); });
}


/* ---------- Navegação de semana ---------- */
$('#prevWeek').onclick=()=>{state.weekStart=addDays(state.weekStart,-7);ensureDateInWeek();renderWeek();renderSlots();};
$('#nextWeek').onclick=()=>{state.weekStart=addDays(state.weekStart,7);ensureDateInWeek();renderWeek();renderSlots();};
$('#todayBtn').onclick=()=>{state.weekStart=mondayOf(new Date());state.date=(new Date().getDay()===0)?ymd(addDays(state.weekStart,0)):todayStr;renderWeek();renderSlots();};
function ensureDateInWeek(){
  const ws=state.weekStart, d=parseYmd(state.date);
  if(d<ws||d>addDays(ws,5)) state.date=ymd(ws);
}
