const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/app.js';
let j = fs.readFileSync(F, 'utf8');
const problemi = [];

/* BUG 1 — assegnare "elemento.ontouchstart = fn" registra davvero l'handler
   solo dove i touch event esistono. addEventListener lo registra sempre. */
const vecchio = `      voci[z].onmousedown = prendi;
      voci[z].ontouchstart = prendi;
      voci[z].onclick = prendi;`;
const nuovo = `      if (voci[z].addEventListener) {
        voci[z].addEventListener('touchstart', prendi, false);
        voci[z].addEventListener('mousedown', prendi, false);
        voci[z].addEventListener('click', prendi, false);
      } else {
        voci[z].onmousedown = prendi;
        voci[z].onclick = prendi;
      }`;
if (j.includes(vecchio)) j = j.replace(vecchio, nuovo);
else problemi.push('registrazione handler non trovata');

/* prendi() usava "this": con addEventListener conviene partire dall'evento */
const vecchioCorpo = `    if (ev && ev.preventDefault) ev.preventDefault();
    var scelto = this.getAttribute("data-v");
    var eZona = this.getAttribute("data-z") === "1";`;
const nuovoCorpo = `    if (ev && ev.preventDefault) ev.preventDefault();
    var li = this;
    if (!li || !li.getAttribute) {
      li = ev && (ev.currentTarget || ev.target);
      while (li && li.tagName !== 'LI') li = li.parentNode;
    }
    if (!li || !li.getAttribute) return false;
    var scelto = li.getAttribute("data-v");
    var eZona = li.getAttribute("data-z") === "1";`;
if (j.includes(vecchioCorpo)) j = j.replace(vecchioCorpo, nuovoCorpo);
else problemi.push('corpo di prendi non trovato');

/* BUG 2 — restava in coda il timer della digitazione (200 ms): scattava DOPO
   la scelta e chiamava aggiorna(), che spegneva l'evidenziazione appena messa. */
const vecchioGuardia = `    ultimaScelta = ora;`;
const nuovoGuardia = `    ultimaScelta = ora;
    if (attesa) { clearTimeout(attesa); attesa = null; }`;
if (j.includes(vecchioGuardia)) j = j.replace(vecchioGuardia, nuovoGuardia);
else problemi.push('punto per annullare il timer non trovato');

/* "attesa" era locale al blocco della ricerca: va portata fuori */
if (j.includes('    var attesa = null;')) {
  j = j.replace('    var attesa = null;', '');
  j = j.replace('  var ultimaScelta = 0;', '  var ultimaScelta = 0;\n  var attesa = null;');
} else problemi.push('variabile attesa non spostata');

/* finestra della guardia piu' corta: due tocchi voluti distano di piu' */
j = j.replace('if (ora - ultimaScelta < 700)', 'if (ora - ultimaScelta < 400)');

fs.writeFileSync(F, j);
console.log(problemi.length ? 'PROBLEMI: ' + problemi.join(' | ') : 'app.js corretto');
