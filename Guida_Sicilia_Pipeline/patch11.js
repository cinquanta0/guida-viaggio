const fs = require('fs');
const A = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/app.js';
let j = fs.readFileSync(A, 'utf8');
const problemi = [];

/* Le foto entrano in dissolvenza quando finiscono di caricare.
   Senza questo compaiono di scatto e la lista "salta" mentre scorri. */
const codice = `
  /* Dissolvenza delle foto: si parte trasparenti e si accende al caricamento.
     Se una foto e' gia' in cache, "complete" e' vero e si accende subito.
     Se il JavaScript non gira, le foto restano semplicemente visibili. */
  var foto = document.querySelectorAll('.fascia .p > img');
  for (var f = 0; f < foto.length; f++) {
    (function (im) {
      if (im.complete) { im.className = 'caricata'; return; }
      im.className = 'attesa';
      im.onload = function () { im.className = 'caricata'; };
      im.onerror = function () { im.className = 'caricata'; };
    })(foto[f]);
  }
`;
if (!j.includes("querySelectorAll('.fascia .p > img')")) {
  j = j.replace('  aggiorna();\n})();', codice + '\n  aggiorna();\n})();');
} else problemi.push('dissolvenza foto gia presente');

/* Il battito sul posto trovato deve poter ripartire a ogni ricerca:
   se la classe resta, l'animazione non si ripete. */
const vecchio = `    if (evidenzia) { meta.className = 'p evidenzia'; evidenziato = meta; }`;
const nuovo = `    if (evidenzia) {
      meta.className = 'p';
      /* forza il ricalcolo, altrimenti il battito non riparte se il posto era gia' evidenziato */
      void meta.offsetWidth;
      meta.className = 'p evidenzia';
      evidenziato = meta;
    }`;
if (j.includes(vecchio)) j = j.replace(vecchio, nuovo);
else problemi.push('blocco evidenziazione non trovato');

fs.writeFileSync(A, j);
console.log(problemi.length ? 'PROBLEMI: ' + problemi.join(' | ') : 'app.js aggiornato');
