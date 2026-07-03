/* ============================================
   APP — eventos globais e inicialização
   Agenda Escolar — E.E.O.F.S
============================================ */

/* ---------- Eventos ---------- */
$('#enterBtn').onclick=onEnter;
$('#loginBtn').onclick=submitLogin;
$('#loginBack').onclick=()=>showScreen('#splash');
$('#logoutBtn').onclick=async()=>{ await clearSession(); location.reload(); };
$('#adminBtn').onclick=openAdmin;
$('#closeAdmin').onclick=()=>$('#adminOverlay').classList.remove('show');
$('#formSave').onclick=saveForm;
$('#formCancel').onclick=resetForm;
document.querySelectorAll('#fRole button').forEach(b=>b.onclick=()=>setFormRole(b.dataset.r));
$('#closeMine').onclick=()=>$('#mineOverlay').classList.remove('show');
$('#cancelBook').onclick=()=>$('#bookOverlay').classList.remove('show');
$('#confirmBook').onclick=confirmBooking;
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show');}));

/* ---------- Sumiço automático ----------
   A cada minuto atualiza as listas: reservas cujo horário de término já
   passou desaparecem sozinhas, sem ninguém precisar recarregar a página.
   Não recarrega a grade enquanto o professor está digitando uma reserva,
   para não apagar o que ele escreveu. */
setInterval(()=>{
  if(!state.user) return;
  refreshMine();
  const ae=document.activeElement;
  const digitando = ae && ['bfStart','bfEnd','bfTurma','bfObs'].includes(ae.id);
  if(!digitando) renderSlots();
}, 60000);

/* ---------- Início ---------- */
/* A splash já aparece por padrão; o usuário toca em "Entrar". */
