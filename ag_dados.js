/* ============================================
   DADOS BASE — recursos, ícones, descrições, turnos/horários
   Agenda Escolar — E.E.O.F.S
============================================ */

/* ---------- Dados base ---------- */
const RESOURCES = [
  {id:'datashow',   name:'Data show',                cat:'equip',  color:'#2563eb', icon:'📽️'},
  {id:'caixasom',   name:'Caixa de som',             cat:'equip',  color:'#db2777', icon:'🔊'},
  {id:'televisao',  name:'Televisão',                cat:'equip',  color:'#7c3aed', icon:'📺'},
  {id:'notebook',   name:'Notebook',                 cat:'equip',  color:'#0891b2', icon:'💻'},
  {id:'labinfo',    name:'Lab. de informática',      cat:'espaco', color:'#4d7c0f', icon:'🖥️'},
  {id:'biblioteca', name:'Biblioteca',               cat:'espaco', color:'#b45309', icon:'📚'},
  {id:'quadra',     name:'Quadra esportiva',         cat:'espaco', color:'#dc2626', icon:'🏀'},
  {id:'auditorio',  name:'Auditório',                cat:'espaco', color:'#0f766e', icon:'🎭'},
  {id:'multimidia', name:'Sala multimídia',          cat:'espaco', color:'#6d28d9', icon:'🎬'},
];
const RMAP = Object.fromEntries(RESOURCES.map(r=>[r.id,r]));

/* Ícones profissionais (SVG de linha) */
const SVG=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONS={
  datashow:  SVG('<rect x="2" y="7" width="18" height="10" rx="2"/><circle cx="8" cy="12" r="2.5"/><path d="M14 12h2.5"/><path d="M5 17v2M16 17v2"/>'),
  caixasom:  SVG('<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="14" r="3.5"/><circle cx="12" cy="6" r="1"/>'),
  televisao: SVG('<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M17 2l-5 5-5-5"/>'),
  notebook:  SVG('<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 20h20"/>'),
  labinfo:   SVG('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>'),
  biblioteca:SVG('<path d="M12 7v14"/><path d="M3 5h5a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3z"/><path d="M21 5h-5a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21z"/>'),
  quadra:    SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3v18"/><path d="M5.6 5.6C9 9 15 15 18.4 18.4"/><path d="M18.4 5.6C15 9 9 15 5.6 18.4"/>'),
  auditorio: SVG('<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/><path d="M8 21h8"/>'),
  multimidia:SVG('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16"/><path d="M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4"/>'),
};

/* Descrições (prévia ao passar o mouse/dedo) */
const DESCS={
  datashow:  'Projetor para exibir slides, vídeos e imagens na tela ou parede.',
  caixasom:  'Amplificação de áudio para apresentações, músicas e eventos.',
  televisao: 'TV para vídeos, aulas e apresentações em sala.',
  notebook:  'Notebook para aulas, pesquisas e apresentações.',
  labinfo:   'Sala com computadores para aulas práticas e pesquisa.',
  biblioteca:'Espaço de leitura, estudo e pesquisa, com acervo de livros.',
  quadra:    'Quadra para educação física, jogos e atividades esportivas.',
  auditorio: 'Espaço amplo para palestras, eventos e apresentações.',
  multimidia:'Sala equipada para vídeos, projeções e atividades audiovisuais.',
};

const SLOTS = {
  manha:[
    {id:'m1',aula:'1º',hrs:'07:00 – 07:50'},{id:'m2',aula:'2º',hrs:'07:50 – 08:40'},
    {id:'m3',aula:'3º',hrs:'08:40 – 09:30'},{id:'m4',aula:'4º',hrs:'09:50 – 10:40'},
    {id:'m5',aula:'5º',hrs:'10:40 – 11:30'},{id:'m6',aula:'6º',hrs:'11:30 – 12:20'},
  ],
  tarde:[
    {id:'t1',aula:'1º',hrs:'13:00 – 13:50'},{id:'t2',aula:'2º',hrs:'13:50 – 14:40'},
    {id:'t3',aula:'3º',hrs:'14:40 – 15:30'},{id:'t4',aula:'4º',hrs:'15:50 – 16:40'},
    {id:'t5',aula:'5º',hrs:'16:40 – 17:30'},{id:'t6',aula:'6º',hrs:'17:30 – 18:20'},
  ],
  noite:[
    {id:'n1',aula:'1º',hrs:'19:00 – 19:50'},{id:'n2',aula:'2º',hrs:'19:50 – 20:40'},
    {id:'n3',aula:'3º',hrs:'20:40 – 21:30'},{id:'n4',aula:'4º',hrs:'21:30 – 22:20'},
  ],
};
const ALLSLOTS = Object.fromEntries([...SLOTS.manha,...SLOTS.tarde,...SLOTS.noite].map(s=>[s.id,s]));

/* ---------- Turnos (nomes e horário padrão de cada turno) ---------- */
const TURNO_LABEL = { manha:'Matutino', tarde:'Vespertino', noite:'Noturno' };
const TURNO_HORAS = {
  manha:{ini:'07:00', fim:'12:20'},
  tarde:{ini:'13:00', fim:'18:20'},
  noite:{ini:'19:00', fim:'22:20'},
};

/* ---------- Turmas (lista para escolher no formulário) ---------- */
const TURMAS = [
  'Fundamental — 6º ano',
  'Fundamental — 7º ano',
  'Fundamental — 8º ano',
  'Fundamental — 9º ano',
  'Médio — 1ª série',
  'Médio — 2ª série',
  'Médio — 3ª série',
  'EJA — Etapas 1 e 2',
  'EJA — Etapas 3 e 4',
  'EJA — Etapas 5 e 6',
  'EJA — Etapas 7 e 8',
  'EJA Médio — 1ª e 2ª etapas',
  'EJA Médio — 2ª e 3ª etapas',
];
const DOW = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
