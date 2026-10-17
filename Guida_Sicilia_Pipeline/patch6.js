const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/app.js';
let j = fs.readFileSync(F, 'utf8');
const problemi = [];

/* ---- 1. porta il risultato sotto gli occhi dopo la ricerca ---- */
const funzioni = `
  /* Dopo una ricerca la pagina restava ferma in cima e sembrava non fosse
     successo niente. Ora scorre al primo risultato; se si e' scelto un posto
     preciso lo evidenzia, come fa il bottone "scegli tu per noi". */
  function primoVisibile() {
    for (var i = 0; i < posti.length; i++) if (posti[i].className === 'p') return posti[i];
    return null;
  }

  function vaiAiRisultati(nomePreciso) {
    var meta = null;
    if (nomePreciso) {
      for (var i = 0; i < posti.length; i++) {
        if (posti[i].className === 'p' && posti[i].getAttribute('data-n') === nomePreciso) { meta = posti[i]; break; }
      }
    }
    var evidenzia = !!meta;
    if (!meta) meta = primoVisibile();
    if (!meta) return;
    var padre = meta.parentNode.parentNode;
    if (padre && padre.setAttribute) padre.setAttribute('open', 'open');
    if (evidenzia) { meta.className = 'p evidenzia'; evidenziato = meta; }
    if (meta.scrollIntoView) meta.scrollIntoView();
  }
`;
if (!j.includes('function vaiAiRisultati')) {
  j = j.replace('  /* ---- suggerimenti sotto il campo di ricerca ---- */', funzioni + '\n  /* ---- suggerimenti sotto il campo di ricerca ---- */');
} else problemi.push('vaiAiRisultati gia presente');

/* ---- 2. il clic sul suggerimento porta al posto ---- */
const vecchioClic = `      voci[z].onclick = function () {
        campo.value = this.getAttribute("data-v");
        testo = campo.value;
        chiudiSugg();
        aggiorna();
      };`;
const nuovoClic = `      voci[z].onclick = function () {
        var scelto = this.getAttribute("data-v");
        var eZona = this.getAttribute("data-z") === "1";
        campo.value = scelto;
        testo = scelto;
        chiudiSugg();
        aggiorna();
        if (campo.blur) campo.blur();
        vaiAiRisultati(eZona ? null : scelto);
      };`;
if (j.includes(vecchioClic)) j = j.replace(vecchioClic, nuovoClic);
else problemi.push('handler del clic non trovato');

/* marca i suggerimenti che sono zone, cosi' il clic sa cosa fare */
const vecchioLi = `      html += "<li data-v=\\"" + nome.replace(/"/g, "&quot;") + "\\">"`;
const nuovoLi = `      html += "<li data-v=\\"" + nome.replace(/"/g, "&quot;") + "\\""
        + (sotto === "zona" ? " data-z=\\"1\\"" : "") + ">"`;
if (j.includes(vecchioLi)) j = j.replace(vecchioLi, nuovoLi);
else problemi.push('markup del suggerimento non trovato');

/* ---- 3. anche premendo invio ---- */
const vecchioInvio = `if (ev && ev.keyCode === 13) { chiudiSugg(); testo = campo.value || ''; aggiorna(); return; }`;
const nuovoInvio = `if (ev && ev.keyCode === 13) { chiudiSugg(); testo = campo.value || ''; aggiorna(); if (campo.blur) campo.blur(); vaiAiRisultati(null); return; }`;
if (j.includes(vecchioInvio)) j = j.replace(vecchioInvio, nuovoInvio);
else problemi.push('gestione invio non trovata');

/* ---- 4. bottone "torna su" flottante ---- */
const bottone = `
  /* Con oltre trecento voci risalire a mano e' lungo: un bottone che compare
     solo dopo che si e' scorso un po'. */
  var su = document.createElement('a');
  su.href = '#su';
  su.id = 'torna-su';
  su.innerHTML = '&#9650;';
  su.setAttribute('aria-label', 'Torna in cima');
  su.style.display = 'none';
  document.body.appendChild(su);
  su.onclick = function () {
    if (campo) { campo.focus(); }
  };
  var ultimo = 0;
  window.onscroll = function () {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if ((y > 900) !== (ultimo > 900)) su.style.display = y > 900 ? 'block' : 'none';
    ultimo = y;
  };
`;
if (!j.includes('torna-su')) j = j.replace('  aggiorna();\n})();', bottone + '\n  aggiorna();\n})();');
else problemi.push('bottone torna su gia presente');

fs.writeFileSync(F, j);
console.log(problemi.length ? 'PROBLEMI: ' + problemi.join(' | ') : 'app.js aggiornato');
