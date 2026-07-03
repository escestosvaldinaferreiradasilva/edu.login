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
  const campos=['bfStart','bfEnd','bfTurma','bfDisc','bfObs'];
  const ae=document.activeElement;
  const digitando = ae && campos.includes(ae.id);
  const temValor = campos.some(id=>{const el=document.getElementById(id); return el && el.value;});
  /* só recarrega a grade se o professor NÃO estiver preenchendo nada,
     assim a atualização nunca apaga uma reserva em andamento */
  if(!digitando && !temValor) renderSlots();
}, 60000);

/* ---------- Início ---------- */
/* Se já existe login salvo, entra direto no app (não volta pro "Bem-vindo"
   ao atualizar a página). Sem sessão, mostra a tela inicial normalmente.
   Importante: se a busca do usuário no banco falhar (sem internet, banco
   instável, etc.), isso NÃO pode jogar quem já está logado de volta pro
   login — nesse caso usamos os dados básicos já salvos localmente (sess). */
(async()=>{
  let sess=null;
  try{
    sess = await loadSession();
  }catch(e){
    console.error('Falha ao ler a sessão salva:', e);
  }
  if(sess){
    let u=null;
    try{
      u = await getUser(sess.login);
    }catch(e){
      console.error('Falha ao buscar dados do usuário (mantendo sessão local):', e);
    }
    enterApp(u || sess);
    return;
  }
  showScreen('#splash');
})();
