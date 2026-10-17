/* Inserisce in dati.js i locali col tag "Ci vanno i siciliani".

   Appende in fondo all'array: non riscrive le schede esistenti, quindi non
   puo' cancellare campi come e' successo una volta con `fo` delle spiagge.
   Il controllo prima/dopo sui campi c'e' lo stesso.

   Ogni descrizione finisce con la fonte, cosi' com'e' scritta in
   candidati_veri.js. Non e' un vezzo: il tag dice "ci vanno i siciliani",
   che e' un'affermazione forte, e il lettore ha diritto di sapere chi l'ha
   fatta e di non fidarsi.

   Uso: node aggiungi_veri.js     e SUBITO DOPO node build.js && node crediti.js  */

const fs = require('fs');
const DATI = 'dati.js';
const candidati = require('./candidati_veri.js');
const tempi = JSON.parse(fs.readFileSync('veri_verificati.json', 'utf8'));

function fascia(min) {
  if (min === 0) return 1;
  if (min <= 20) return 2;
  if (min <= 35) return 3;
  if (min <= 60) return 4;
  if (min <= 95) return 5;
  if (min <= 140) return 6;
  return 7;
}

function conta() {
  delete require.cache[require.resolve('./' + DATI)];
  const d = require('./' + DATI);
  const c = {};
  d.forEach(p => Object.keys(p).forEach(k => { c[k] = (c[k] || 0) + 1; }));
  return { n: d.length, campi: c };
}
const prima = conta();

/* i nomi gia' presenti, per non inserire due volte lo stesso locale */
delete require.cache[require.resolve('./' + DATI)];
const esistenti = new Set(require('./' + DATI).map(p => p.n.toLowerCase()));

let testo = fs.readFileSync(DATI, 'utf8');
/* l'ultima scheda del file puo' non avere la virgola: senza, l'array si spacca */
testo = testo.replace(/\}(\s*)\];\s*$/, '},$1];\n');
const chiusura = testo.lastIndexOf('];');
if (chiusura === -1) { console.log('non trovo la fine dell array'); process.exit(1); }

let righe = '', messi = 0;
const saltati = [];
for (const c of candidati) {
  /* escluso a mano dopo averlo guardato: non entra nemmeno se per qualche
     motivo si ritrova delle coordinate in veri_verificati.json */
  if (c.fuori) { saltati.push(c.n + ' — escluso: ' + c.fuori); continue; }
  const t = tempi[c.k];
  if (!t) { saltati.push(c.n + ' — non verificato su OSM'); continue; }
  if (esistenti.has(c.n.toLowerCase())) { saltati.push(c.n + ' — gia presente'); continue; }

  /* la fonte entra nel testo della scheda, non in un campo a parte:
     cosi' la legge chiunque, anche senza toccare i filtri */
  const d = c.d + ' Fonte: ' + c.fonte + '.';
  /* Vietati i tag e le entita' gia' scritte (&egrave;), che e() raddoppierebbe
     in &amp;egrave; facendo leggere la sigla al posto della lettera. Una &
     da sola invece va benissimo: e() la trasforma in &amp; e il browser
     rimette la e commerciale. Per questo "Casa & Putia" puo' entrare. */
  const velenoso = s => /[<>]/.test(s) || /&[a-zA-Z]+;/.test(s);
  if (velenoso(d) || velenoso(c.n)) { saltati.push(c.n + ' — contiene tag o entita HTML'); continue; }

  righe += '{b:' + fascia(t.min) + ', n:"' + c.n + '", z:"' + c.z + '", min:' + t.min
    + ', km:' + t.km + ', t:"' + c.t + '", g:"' + c.g + '"'
    + (c.a ? ', a:"' + c.a + '"' : '')
    + ', d:"' + d.replace(/"/g, '\\"') + '"},\n';
  messi++;
  console.log('  + ' + String(t.min + ' min').padStart(8) + '  ' + c.n.padEnd(32) + c.z);
}

testo = testo.slice(0, chiusura) + righe + testo.slice(chiusura);
fs.writeFileSync(DATI, testo, 'utf8');

const dopo = conta();
console.log('\nposti: ' + prima.n + ' -> ' + dopo.n + '  (aggiunti ' + messi + ')');
let guai = false;
for (const campo of Object.keys(prima.campi)) {
  const a = prima.campi[campo], b = dopo.campi[campo] || 0;
  if (b < a) { console.log('  ATTENZIONE: campo ' + campo + ' passato da ' + a + ' a ' + b); guai = true; }
}
if (saltati.length) { console.log('\nnon inseriti:'); saltati.forEach(s => console.log('  ' + s)); }
console.log('\n' + (guai ? 'QUALCOSA SI E PERSO' : 'nessun campo perso.'));
