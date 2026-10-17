const fs = require('fs');
const DATI = 'dati.js';

function fascia(min) {
  if (min === 0) return 1;
  if (min <= 20) return 2;
  if (min <= 35) return 3;
  if (min <= 60) return 4;
  if (min <= 95) return 5;
  if (min <= 140) return 6;
  return 7;
}

const lotto = require('./lotto_taormina_catania_pronto.json');
let testo = fs.readFileSync(DATI, 'utf8');
const prima = eval(testo.replace('module.exports', 'var P') + ';P');
const nomiEsistenti = new Set(prima.map(p => p.n.toLowerCase()));

let righe = '', inseriti = 0;
lotto.forEach(c => {
  if (nomiEsistenti.has(c.nome.toLowerCase())) { console.log('SALTATO (gia presente):', c.nome); return; }
  const indirizzo = c.indirizzo ? String(c.indirizzo).replace(/"/g, '\\"').trim() : '';
  const desc = 'Verificato a mano su Google Maps/WebSearch (menu letto direttamente), zona ' + c.zona + '.';
  righe += '{b:' + fascia(c.min) + ', n:"' + c.nome.replace(/"/g, '\\"') + '", z:"' + c.zona.replace(/"/g, '\\"') + '"'
    + ', min:' + c.min + ', km:' + c.km
    + ', t:"' + c.tag + '", g:""'
    + (indirizzo ? ', a:"' + indirizzo + '"' : '')
    + ', d:"' + desc.replace(/"/g, '\\"') + '"},\n';
  inseriti++;
});

const chiusura = testo.lastIndexOf('];');
testo = testo.slice(0, chiusura) + righe + testo.slice(chiusura);
fs.writeFileSync(DATI, testo, 'utf8');

const dopo = eval(fs.readFileSync(DATI, 'utf8').replace('module.exports', 'var P') + ';P');
console.log('\ninseriti:', inseriti, '/', lotto.length);
console.log('posti:', prima.length, '->', dopo.length);
