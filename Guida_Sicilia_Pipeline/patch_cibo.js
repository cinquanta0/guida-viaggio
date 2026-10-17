/* Sostituisce in build.js il blocco di HTML scritto a mano della sezione
   "Cosa vi mettono nel piatto" con una generazione da cibo.js.
   Si esegue una volta sola: dopo, la sezione vive in cibo.js. */

const fs = require('fs');
let b = fs.readFileSync('build.js', 'utf8');
const problemi = [];

/* 1. carica i dati del cibo accanto a quelli dei posti */
if (!b.includes("require('./cibo.js')")) {
  b = b.replace("const posti = require('./dati.js');",
    "const posti = require('./dati.js');\nconst cibo = require('./cibo.js');");
  if (!b.includes("require('./cibo.js')")) problemi.push('non trovato il require di dati.js');
}

/* 2. il generatore della sezione */
const generatore = `
/* La sezione del cibo: prima era HTML scritto a mano dentro il template,
   ora esce da cibo.js come tutto il resto del sito.
   I prezzi sono fasce indicative e sono etichettate come tali: accanto a
   tempi calcolati sul percorso reale, un numero stimato senza avviso
   sembrerebbe altrettanto certo, e non lo e'. */
const sezioneCibo = cibo.map(v => {
  let s = '      <div class="p">';
  if (v.img) {
    const piccola = v.img.replace(/\\.jpg$/, '-480.jpg');
    s += '<img src="assets/img/' + v.img + '"'
      + ' srcset="assets/img/' + piccola + ' 480w, assets/img/' + v.img + ' 900w"'
      + ' sizes="(max-width: 700px) 100vw, 672px"'
      + ' alt="' + (v.alt || v.n) + '" loading="lazy" decoding="async">';
  }
  s += '<div class="p-in"><h3>' + v.n + '</h3>';
  if (v.zona) s += '<p class="p-zona">' + v.zona + '</p>';
  s += '<p class="p-d">' + v.d + '</p>';
  if (v.p) s += '<p class="p-prezzo"><span>' + v.p + '</span> indicativo</p>';
  s += '</div></div>';
  return s;
}).join('\\n');
`;

if (!b.includes('const sezioneCibo')) {
  b = b.replace('/* elenco per i suggerimenti della ricerca', generatore + '\n/* elenco per i suggerimenti della ricerca');
  if (!b.includes('const sezioneCibo')) problemi.push('non trovato il punto dove inserire il generatore');
}

/* 3. via il blocco scritto a mano, dentro il segnaposto */
const inizio = b.indexOf('      <div class="p"><img src="assets/img/arancini.jpg"');
const chiusura = b.indexOf('\n    </div>\n  </details>', inizio);
if (inizio === -1 || chiusura === -1) {
  problemi.push('non trovato il blocco delle schede del cibo');
} else if (!b.includes('${sezioneCibo}')) {
  const avviso = '      <p class="avviso-prezzi">I prezzi sono <b>fasce indicative</b>, per farvi un&rsquo;idea di quanto tirare fuori: '
    + 'non sono prezzi verificati come lo sono i tempi in auto. Tra una friggitoria di quartiere e un lido di Taormina cambia tutto.</p>\n';
  b = b.slice(0, inizio) + avviso + '${sezioneCibo}' + b.slice(chiusura);
}

/* 4. il contatore nella testata della fascia */
b = b.replace('<span class="f-c"><b>16</b> voci</span>', '<span class="f-c"><b>${cibo.length}</b> voci</span>');
if (b.includes('<b>16</b> voci')) problemi.push('contatore non aggiornato');

fs.writeFileSync('build.js', b, 'utf8');
console.log(problemi.length ? 'PROBLEMI: ' + problemi.join(' | ') : 'build.js aggiornato');
