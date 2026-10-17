const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/app.js';
let j = fs.readFileSync(F, 'utf8');
const problemi = [];

/* Sul telefono il "click" sul suggerimento non arrivava mai: toccando fuori
   dal campo si chiude la tastiera, la pagina si ridimensiona e la tendina si
   sposta da sotto il dito prima che il click sia completato. Si intercetta
   il tocco appena inizia (touchstart / mousedown), non a fine click. */
const vecchio = `    var voci = boxSugg.getElementsByTagName("li");
    for (var z = 0; z < voci.length; z++) {
      voci[z].onclick = function () {
        var scelto = this.getAttribute("data-v");
        var eZona = this.getAttribute("data-z") === "1";
        campo.value = scelto;
        testo = scelto;
        chiudiSugg();
        aggiorna();
        if (campo.blur) campo.blur();
        vaiAiRisultati(eZona ? null : scelto);
      };
    }`;

const nuovo = `    var voci = boxSugg.getElementsByTagName("li");
    for (var z = 0; z < voci.length; z++) {
      voci[z].onmousedown = prendi;
      voci[z].ontouchstart = prendi;
      voci[z].onclick = prendi;
    }`;

if (j.includes(vecchio)) j = j.replace(vecchio, nuovo);
else problemi.push('handler dei suggerimenti non trovato');

/* la funzione condivisa, con guardia contro il doppio scatto */
const funzione = `
  /* Un tocco puo' generare piu' eventi (touchstart, poi mousedown, poi click):
     la guardia evita di eseguire la scelta tre volte. */
  var ultimaScelta = 0;
  function prendi(ev) {
    var ora = new Date().getTime();
    if (ora - ultimaScelta < 700) { if (ev && ev.preventDefault) ev.preventDefault(); return false; }
    ultimaScelta = ora;
    if (ev && ev.preventDefault) ev.preventDefault();
    var scelto = this.getAttribute("data-v");
    var eZona = this.getAttribute("data-z") === "1";
    campo.value = scelto;
    testo = scelto;
    chiudiSugg();
    aggiorna();
    if (campo.blur) campo.blur();
    /* il ritardo lascia richiudere la tastiera: senza, lo scorrimento
       viene annullato dal ridimensionamento della pagina */
    setTimeout(function () { vaiAiRisultati(eZona ? null : scelto); }, 120);
    return false;
  }
`;
if (!j.includes('function prendi')) {
  j = j.replace('  function mostraSugg(q) {', funzione + '\n  function mostraSugg(q) {');
} else problemi.push('funzione prendi gia presente');

/* anche l'invio deve aspettare che la tastiera si chiuda */
const vecchioInvio = `if (ev && ev.keyCode === 13) { chiudiSugg(); testo = campo.value || ''; aggiorna(); if (campo.blur) campo.blur(); vaiAiRisultati(null); return; }`;
const nuovoInvio = `if (ev && ev.keyCode === 13) { chiudiSugg(); testo = campo.value || ''; aggiorna(); if (campo.blur) campo.blur(); setTimeout(function () { vaiAiRisultati(null); }, 120); return; }`;
if (j.includes(vecchioInvio)) j = j.replace(vecchioInvio, nuovoInvio);
else problemi.push('gestione invio non trovata');

/* il chiuditore globale non deve rubare il tocco alla tendina */
const vecchioDoc = `  document.addEventListener('click', function (ev) {`;
const nuovoDoc = `  document.addEventListener('touchstart', function (ev) {
    var t = ev.target;
    while (t) { if (t.id === 'sugg' || t.id === 'cerca') return; t = t.parentNode; }
    chiudiSugg();
  });
  document.addEventListener('click', function (ev) {`;
if (j.includes(vecchioDoc) && !j.includes("addEventListener('touchstart'")) j = j.replace(vecchioDoc, nuovoDoc);
else problemi.push('chiuditore globale non aggiornato');

fs.writeFileSync(F, j);
console.log(problemi.length ? 'PROBLEMI: ' + problemi.join(' | ') : 'app.js aggiornato');
