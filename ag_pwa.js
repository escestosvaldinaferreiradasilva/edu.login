/* ============================================
   PWA — manifesto gerado em tempo de execução
   Agenda Escolar — E.E.O.F.S
============================================ */

/* cria o manifesto em tempo de execução (para instalar como app quando hospedado) */
(function(){try{
  var icon=new URL(document.querySelector('link[rel="apple-touch-icon"]').getAttribute('href'),location.href).href;
  var m={name:"Agenda E.E.O.F.S",short_name:"Agenda",start_url:".",display:"standalone",orientation:"portrait",background_color:"#1c6f30",theme_color:"#1c6f30",icons:[{src:icon,sizes:"192x192",type:"image/png",purpose:"any"},{src:icon,sizes:"512x512",type:"image/png",purpose:"any"}]};
  var blob=new Blob([JSON.stringify(m)],{type:"application/manifest+json"});
  var l=document.createElement('link');l.rel="manifest";l.href=URL.createObjectURL(blob);document.head.appendChild(l);
}catch(e){}})();
