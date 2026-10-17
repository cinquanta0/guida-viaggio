/* crediti.js — sostituisce il segnaposto <!--CREDITI--> lasciato da build.js
   con l'elenco delle licenze fotografiche letto da credits.json.

   VA ESEGUITO SEMPRE SUBITO DOPO `node build.js`, altrimenti il sito va
   online col commento HTML al posto dell'elenco delle licenze.

   Uso:  node build.js && node crediti.js
   Con --check non scrive niente, dice solo se il segnaposto e' ancora li'. */

const fs = require('fs');
const path = require('path');

const SITO = path.join(__dirname, '..', 'Guida_Sicilia_Sito');
const HTML = SITO + '/index.html';
const IMG = SITO + '/assets/img';
const SEGNAPOSTO = '<!--CREDITI-->';

const soloControllo = process.argv.indexOf('--check') !== -1;

const crediti = JSON.parse(fs.readFileSync(path.join(__dirname, 'credits.json'), 'utf8'));
let html = fs.readFileSync(HTML, 'utf8');

if (html.indexOf(SEGNAPOSTO) === -1) {
  console.log('Segnaposto ' + SEGNAPOSTO + ' non trovato: i crediti sono gia' + '\u0027' + ' a posto.');
  const gia = (html.match(/commons\.wikimedia\.org\/wiki\/File:/g) || []).length;
  console.log('voci gia' + '\u0027' + ' presenti nell' + '\u0027' + 'HTML: ' + gia);
  process.exit(0);
}

if (soloControllo) {
  console.log('ATTENZIONE: il segnaposto e' + '\u0027' + ' ancora nell' + '\u0027' + 'HTML, i crediti mancano.');
  process.exit(1);
}

const suDisco = new Set(fs.readdirSync(IMG));
const righe = [];
const senzaFile = [];
let inutilizzate = 0;

for (const chiave of Object.keys(crediti)) {
  const c = crediti[chiave];
  const usata = html.indexOf('assets/img/' + c.file) !== -1;
  if (!usata) { inutilizzate++; continue; }
  if (!suDisco.has(c.file)) { senzaFile.push(c.file); continue; }
  /* Una manciata di file su Commons non ha un autore indicato: in quel caso
     si salta il trattino, non si stampa un "&mdash;" seguito dal vuoto. */
  const autore = c.author ? ' &mdash; ' + esc(c.author) : '';
  righe.push(
    '        <li><a href="' + c.source + '">' + esc(c.title) + '</a>' +
    autore + ' &middot; ' + esc(c.license) + '</li>'
  );
}

html = html.replace(SEGNAPOSTO, righe.join('\n'));
fs.writeFileSync(HTML, html, 'utf8');

console.log('crediti inseriti: ' + righe.length);
console.log('voci in credits.json non usate nel sito: ' + inutilizzate);
console.log('usate ma senza file su disco: ' + (senzaFile.join(', ') || 'nessuna'));

/* Le foto referenziate nell'HTML che non hanno una voce di credito sono un
   problema di licenza, non un dettaglio: vanno segnalate forte. */
const riferite = [...new Set((html.match(/assets\/img\/[A-Za-z0-9_.-]+/g) || []))]
  .map(s => s.replace('assets/img/', ''))
  .filter(f => !/-480\./.test(f));
const conCredito = new Set(Object.values(crediti).map(c => c.file));
const scoperte = riferite.filter(f => !conCredito.has(f));
if (scoperte.length) {
  console.log('!! FOTO SENZA CREDITO NEL SITO: ' + scoperte.join(', '));
  process.exitCode = 1;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
