const fs = require('fs');
const problemi = [];

/* ---------- 1. il generatore: due testi di ricerca separati ---------- */
const B = 'build.js';
let b = fs.readFileSync(B, 'utf8');

const vecchioCerca = `    const cerca = senzaAccenti(p.n + " " + p.z + " " + (p.a || "") + " " + p.t + " "
      + (p.fo || "") + " " + p.d).replace(/[^a-z0-9 ]/g, " ").replace(/[ ]+/g, " ");`;
const nuovoCerca = `    /* "identita" = nome, zona e indirizzo. "tutto" aggiunge anche la descrizione.
       Servono separati: cercando una citta si deve pescare solo chi ci sta davvero,
       non chi la nomina di sfuggita nella descrizione. */
    const pulisci = s => senzaAccenti(s).replace(/[^a-z0-9 ]/g, " ").replace(/[ ]+/g, " ");
    const identita = pulisci(p.n + " " + p.z + " " + (p.a || ""));
    const cerca = pulisci(p.n + " " + p.z + " " + (p.a || "") + " " + p.t + " "
      + (p.fo || "") + " " + p.d);`;
if (b.includes(vecchioCerca)) b = b.replace(vecchioCerca, nuovoCerca);
else problemi.push('blocco cerca del build non trovato');

const vecchioAttr = `' data-fo="' + (p.fo || '') + '" data-n="' + e(p.n) + '" data-s="' + e(cerca) + '">\\n';`;
const nuovoAttr = `' data-fo="' + (p.fo || '') + '" data-n="' + e(p.n) + '"'
      + ' data-i="' + e(identita) + '" data-s="' + e(cerca) + '">\\n';`;
if (b.includes(vecchioAttr)) b = b.replace(vecchioAttr, nuovoAttr);
else problemi.push('attributi della scheda non trovati');

/* elenco delle zone, serve al JS per capire se stai cercando una localita' */
const vecchioSugg = `const SUGG = JSON.stringify(suggerimenti);`;
const nuovoSugg = `const SUGG = JSON.stringify(suggerimenti);
const ZONE = JSON.stringify(Object.keys(perZona).map(z => z.toLowerCase()
  .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
  .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/[ ]+/g, ' ').trim()));`;
if (b.includes(vecchioSugg)) b = b.replace(vecchioSugg, nuovoSugg);
else problemi.push('SUGG non trovato');

if (!b.includes('window.ZONE')) {
  b = b.replace('<script>window.SUGG=${SUGG};</script>', '<script>window.SUGG=${SUGG};window.ZONE=${ZONE};</script>');
}
fs.writeFileSync(B, b);

/* ---------- 2. il JS della pagina ---------- */
const A = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/app.js';
let j = fs.readFileSync(A, 'utf8');

const vecchioFiltro = `      if (ok && parole.length) {
        var testoScheda = semplifica(p.getAttribute('data-s') || p.getAttribute('data-n') || '');
        for (j = 0; j < parole.length; j++) {
          if (testoScheda.indexOf(parole[j]) < 0) { ok = false; break; }
        }
      }`;
const nuovoFiltro = `      if (ok && parole.length) {
        var testoScheda = semplifica(
          (soloIdentita ? p.getAttribute('data-i') : p.getAttribute('data-s'))
          || p.getAttribute('data-n') || '');
        for (j = 0; j < parole.length; j++) {
          if (testoScheda.indexOf(parole[j]) < 0) { ok = false; break; }
        }
      }`;
if (j.includes(vecchioFiltro)) j = j.replace(vecchioFiltro, nuovoFiltro);
else problemi.push('filtro di ricerca non trovato');

const vecchioParole = `    var parole = testo ? semplifica(testo).split(' ').filter(Boolean) : [];`;
const nuovoParole = `    var parole = testo ? semplifica(testo).split(' ').filter(Boolean) : [];
    /* Se stai cercando il nome di una localita', mostro solo i posti che ci
       stanno davvero: senza questo, cercando "Siracusa" usciva l'Anfiteatro di
       Catania, perche' la sua descrizione dice "il secondo dopo Siracusa". */
    var soloIdentita = false;
    if (parole.length) {
      var q = semplifica(testo).trim();
      var zone = window.ZONE || [];
      for (var zz = 0; zz < zone.length; zz++) {
        if (zone[zz].indexOf(q) >= 0) { soloIdentita = true; break; }
      }
    }`;
if (j.includes(vecchioParole)) j = j.replace(vecchioParole, nuovoParole);
else problemi.push('inizio di aggiorna non trovato');

fs.writeFileSync(A, j);
console.log(problemi.length ? 'PROBLEMI: ' + problemi.join(' | ') : 'build.js e app.js aggiornati');
