/* Mette il campo img sulle cinque schede per cui abbiamo scaricato la foto.

   NON ricostruisce dati.js: cerca la singola scheda per nome e infila
   img:"..." subito prima di d:. Gli script che riscrivevano tutto il file
   sono quelli che una volta hanno fatto sparire il campo `fo` delle spiagge
   rompendo il filtro del fondo in produzione, e non voglio ripetere il giro.

   Uso: node aggancia_foto_vie.js    e poi node build.js && node crediti.js  */

const fs = require('fs');
const DATI = 'dati.js';

/* nome esatto della scheda -> file della foto */
const FOTO = {
  'Via Etnea': 'viaetnea.jpg',
  'Corso Umberto I': 'corsoumberto.jpg',
  'Corso Ruggero e lungomare': 'corsoruggero.jpg',
  'Corso Vittorio Emanuele': 'corsovittoriotp.jpg',
  'Macchia di Giarre': 'macchiagiarre.jpg'
};

const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';

function conta() {
  delete require.cache[require.resolve('./' + DATI)];
  const d = require('./' + DATI);
  const c = {};
  d.forEach(p => Object.keys(p).forEach(k => { c[k] = (c[k] || 0) + 1; }));
  return { n: d.length, campi: c };
}
const prima = conta();

let testo = fs.readFileSync(DATI, 'utf8');
let messi = 0;
const guai = [];

for (const [nome, file] of Object.entries(FOTO)) {
  /* le due misure devono esistere davvero su disco, altrimenti la scheda
     resterebbe con un img rotto */
  for (const f of [file, file.replace(/\.jpg$/, '-480.jpg')]) {
    if (!fs.existsSync(IMG + f)) { guai.push(nome + ': manca il file ' + f); }
  }

  /* la scheda giusta: n:"<nome>" seguito, nello stesso oggetto, da d: */
  const re = new RegExp('(\\{b:\\d+, n:"' + nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '",[^}]*?)(, d:")');
  const m = testo.match(re);
  if (!m) { guai.push(nome + ': scheda non trovata'); continue; }
  if (/img:/.test(m[1])) { guai.push(nome + ': ha gia una foto, non la tocco'); continue; }

  testo = testo.replace(re, '$1, img:"' + file + '"$2');
  messi++;
  console.log('  foto  ' + nome.padEnd(30) + file);
}

fs.writeFileSync(DATI, testo, 'utf8');

const dopo = conta();
console.log('\nschede: ' + prima.n + ' -> ' + dopo.n + ', foto agganciate: ' + messi);
console.log('campo img: ' + (prima.campi.img || 0) + ' -> ' + (dopo.campi.img || 0));
let perso = false;
for (const campo of Object.keys(prima.campi)) {
  const a = prima.campi[campo], b = dopo.campi[campo] || 0;
  if (b < a) { console.log('  ATTENZIONE: campo ' + campo + ' passato da ' + a + ' a ' + b); perso = true; }
}
if (guai.length) { console.log('\nda guardare:'); guai.forEach(g => console.log('  ' + g)); }
console.log(perso ? '\nQUALCOSA SI E PERSO' : '\nnessun campo perso.');
