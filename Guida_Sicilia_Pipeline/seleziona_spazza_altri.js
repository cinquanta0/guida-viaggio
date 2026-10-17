/* Sceglie da spazza_altri_risultati.json (390 candidati, mare/vedere/spesa)
   chi entra davvero in guida. Stesso principio di seleziona_spazza_cibo.js,
   ma con un tetto piu' basso per mare/vedere: una spiaggia o un monumento
   sono spesso una destinazione sola, non "una scelta fra tante trattorie"
   (principio gia' confermato dall'audit iniziale su queste due categorie).
   Spesa invece si comporta come il cibo: un negozio in piu' e' una scelta
   vera, quindi stesso tetto.

   Uso: node seleziona_spazza_altri.js  */

const fs = require('fs');
const dati = require('./spazza_altri_risultati.json');
const P = require('./dati.js');

const zoneMap = {};
P.forEach(p => { const base = p.z.split(/[—,]/)[0].trim(); (zoneMap[base] = zoneMap[base] || []).push(p); });
function minZona(z) { return zoneMap[z] ? Math.min(...zoneMap[z].map(p => p.min)) : 999; }

function tetto(tipo, zona, primoRecensioni) {
  const min = minZona(zona);
  if (tipo === 'spesa') {
    if (min <= 20) return 3;
    if (min <= 60) return 2;
    if (min <= 150) return primoRecensioni >= 300 ? 2 : 1;
    return 1;
  }
  /* mare / vedere: una destinazione sola nella maggior parte dei casi */
  if (min <= 60) return 2;
  return 1;
}

const gruppi = {};
for (const d of dati) { const k = d.zona + '||' + d.tipo; (gruppi[k] = gruppi[k] || []).push(d); }

const usateCoord = [];
function giaUsato(lat, lon) { return usateCoord.some(c => Math.abs(c.lat - lat) < 0.0001 && Math.abs(c.lon - lon) < 0.0001); }

const scelti = [];
for (const k of Object.keys(gruppi)) {
  const [zona, tipo] = k.split('||');
  const lista = gruppi[k]; // gia' ordinati per recensioni decrescenti da spazza_altri.js
  const quanti = tetto(tipo, zona, (lista[0] && lista[0].recensioni) || 0);
  let presi = 0;
  for (const cand of lista) {
    if (presi >= quanti) break;
    if (giaUsato(cand.lat, cand.lon)) continue;
    usateCoord.push({ lat: cand.lat, lon: cand.lon });
    scelti.push(cand); presi++;
  }
}

console.log('candidati totali: ' + dati.length + '  ->  scelti: ' + scelti.length);

const GENERE = { mare: 'Spiaggia', vedere: 'Da vedere', spesa: 'Negozio' };
function chiaveDa(nome) { return nome.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) + Math.random().toString(36).slice(2, 6); }

const righe = scelti.map(c => ({
  k: chiaveDa(c.nome), n: c.nome, com: c.zona, z: c.zona, lat: c.lat, lon: c.lon,
  a: (c.indirizzo || '').split(',').slice(0, 2).join(',').trim(), t: c.tipo,
  voto: String(c.voto).replace('.', ','), rec: c.recensioni,
  d: (GENERE[c.tipo] || 'Posto') + ' a ' + c.zona + '. Da Google Maps: ' + String(c.voto).replace('.', ',') + ' su ' + c.recensioni + ' recensioni.'
}));

fs.writeFileSync('candidati_spazza_altri.js',
  '/* Generato da seleziona_spazza_altri.js dal giro sistematico mare/vedere/spesa. */\nmodule.exports = ' + JSON.stringify(righe, null, 1) + ';\n', 'utf8');

const perZona = {};
righe.forEach(r => { (perZona[r.z] = perZona[r.z] || []).push(r); });
Object.keys(perZona).sort((a, b) => minZona(a) - minZona(b)).forEach(z => {
  console.log('\n' + z + '  (' + minZona(z) + ' min)');
  perZona[z].forEach(r => console.log('  ' + r.t.padEnd(8) + r.voto + '/' + r.rec + '  ' + r.n));
});
