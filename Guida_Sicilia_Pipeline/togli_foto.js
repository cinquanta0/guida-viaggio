/* Toglie una foto dal sito: il file, le due misure, la voce nei crediti e
   il riferimento dentro dati.js. Serve dopo aver guardato le foto scaricate:
   il filtro sui titoli prende i soggetti sbagliati, ma non sa vedere che una
   foto e' mezza nera o che il soggetto e' il cane di qualcuno.

   Uso: node togli_foto.js nome-2.jpg [altro-3.jpg ...]  */

const fs = require('fs');
const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
const DATI = 'dati.js';

const daTogliere = process.argv.slice(2);
if (!daTogliere.length) { console.log('nessun file indicato'); process.exit(1); }

const crediti = JSON.parse(fs.readFileSync('credits.json', 'utf8'));
let testo = fs.readFileSync(DATI, 'utf8');
const primaPosti = require('./' + DATI).length;

for (const nome of daTogliere) {
  const piccola = nome.replace(/\.jpg$/, '-480.jpg');

  for (const f of [nome, piccola]) {
    if (fs.existsSync(IMG + f)) { fs.unlinkSync(IMG + f); console.log('  tolto il file ' + f); }
  }

  for (const [k, c] of Object.entries(crediti)) {
    if (c.file === nome) { delete crediti[k]; console.log('  tolto il credito ' + k); }
  }

  /* dentro dati.js il riferimento sta in piu:["a.jpg","b.jpg"].
     Va tolta anche UNA virgola, quella giusta: se si toglie sempre quella
     prima, un elemento in testa lascia piu:[,"b.jpg"], cioe' un buco che
     diventa undefined e fa esplodere build.js. Prima si prova la virgola
     che segue, poi quella che precede. */
  const prima = testo;
  const q = '"' + nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"';
  testo = testo.replace(new RegExp(q + ','), '');
  if (testo === prima) testo = testo.replace(new RegExp(',' + q), '');
  if (testo === prima) testo = testo.replace(new RegExp(q), '');
  /* se la lista e' rimasta vuota si toglie tutto il campo */
  testo = testo.replace(/, piu:\[\]/g, '');
  if (testo === prima) console.log('  (in dati.js non c' + '\u0027' + 'era)');
}

fs.writeFileSync('credits.json', JSON.stringify(crediti, null, 1));
fs.writeFileSync(DATI, testo, 'utf8');

delete require.cache[require.resolve('./' + DATI)];
const d = require('./' + DATI);
const campi = {};
d.forEach(p => Object.keys(p).forEach(k => { campi[k] = (campi[k] || 0) + 1; }));

console.log('\nposti: ' + primaPosti + ' -> ' + d.length + (primaPosti === d.length ? '  ok' : '  ATTENZIONE'));
console.log('gallerie rimaste: ' + d.filter(p => p.piu && p.piu.length).length);
console.log('foto nelle schede: ' + d.reduce((n, p) => n + (p.img ? 1 : 0) + ((p.piu || []).length), 0));
console.log('campi: ' + JSON.stringify(campi));
const vuote = d.filter(p => p.piu && !p.piu.length);
if (vuote.length) console.log('ATTENZIONE: gallerie vuote rimaste: ' + vuote.map(p => p.n).join(', '));
