/* Aggiunge il campo "piu" (le foto successive) alle schede che hanno una
   galleria, leggendo gallerie_fatte.json prodotto da scarica_gallerie.js.

   NON riscrive dati.js rigenerando gli oggetti: fa una sostituzione
   testuale sulla riga, subito dopo il campo img. E' apposta. Una volta uno
   script che riserializzava dati.js ha perso il campo "fo" e ha rotto in
   produzione il filtro delle spiagge senza che nessun test se ne accorgesse.
   Toccando solo il testo, i campi che non c'entrano non possono sparire.

   Uso: node applica_gallerie.js [--prova] */

const fs = require('fs');

const DATI = 'dati.js';
const prova = process.argv.indexOf('--prova') !== -1;

const fatte = JSON.parse(fs.readFileSync('gallerie_fatte.json', 'utf8'));
let testo = fs.readFileSync(DATI, 'utf8');

const primaPosti = require('./' + DATI).length;
const primaCampi = contaCampi();

let aggiunte = 0, gia = 0, nonTrovate = [];

/* La foto principale non sta in gallerie_fatte.json: quando si scaricano
   solo le foto aggiuntive (da: 2) l'elenco contiene solo quelle. Il nome
   della principale si legge da credits.json, che e' il registro di quale
   file corrisponde a quale chiave. */
const crediti = JSON.parse(fs.readFileSync('credits.json', 'utf8'));

for (const [chiave, file] of Object.entries(fatte)) {
  if (!file || !file.length) continue;

  const principale = (crediti[chiave] && crediti[chiave].file) || (chiave + '.jpg');
  const extra = file.filter(f => f !== principale);
  if (!extra.length) continue;

  /* la riga della scheda si riconosce dal nome del file della foto */
  const ago = 'img:"' + principale + '"';
  const dove = testo.indexOf(ago);
  if (dove === -1) { nonTrovate.push(chiave + ' (' + principale + ')'); continue; }

  const fineRiga = testo.indexOf('\n', dove);
  const riga = testo.slice(dove, fineRiga);
  if (riga.indexOf('piu:[') !== -1) { gia++; continue; }

  const sostituzione = ago + ', piu:[' + extra.map(f => '"' + f + '"').join(',') + ']';
  testo = testo.slice(0, dove) + sostituzione + testo.slice(dove + ago.length);
  aggiunte++;
}

if (!prova) fs.writeFileSync(DATI, testo, 'utf8');

/* Il controllo che conta: nessun posto perso, nessun campo perso. */
delete require.cache[require.resolve('./' + DATI)];
const dopo = prova ? null : require('./' + DATI);

console.log('gallerie aggiunte: ' + aggiunte + (gia ? ", gia' presenti: " + gia : ''));
if (nonTrovate.length) console.log('NON AGGANCIATE: ' + nonTrovate.join(', '));

if (!prova) {
  const dopoCampi = contaCampi();
  console.log('\nposti: ' + primaPosti + ' -> ' + dopo.length + (primaPosti === dopo.length ? '  ok' : '  ATTENZIONE'));
  let guai = primaPosti !== dopo.length;
  for (const campo of Object.keys(primaCampi)) {
    const a = primaCampi[campo], b = dopoCampi[campo] || 0;
    /* quello che conta e' che nessun campo CALI: "piu" cresce apposta */
    const segno = b < a ? 'ATTENZIONE: PERSI ' + (a - b) : (b > a ? 'cresciuto di ' + (b - a) : 'ok');
    if (b < a) guai = true;
    console.log('  ' + campo.padEnd(6) + a + ' -> ' + b + '   ' + segno);
  }
  console.log('  piu   ' + (primaCampi.piu || 0) + ' -> ' + (dopoCampi.piu || 0));
  if (guai) { console.log("\nQUALCOSA SI E PERSO: non pubblicare."); process.exit(1); }
  console.log('\nnessun campo perso.');
}

function contaCampi() {
  delete require.cache[require.resolve('./' + DATI)];
  const d = require('./' + DATI);
  const c = {};
  d.forEach(p => Object.keys(p).forEach(k => { c[k] = (c[k] || 0) + 1; }));
  return c;
}
