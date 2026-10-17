/* Seleziona dai candidati di cerca_casa.js, con piu' scelta del solito
   perche' sono le zone di casa: fino a 3 per Acireale (che ha piu' storia
   gastronomica), 2 per le altre. Stessa logica di dedupe per coordinate
   di seleziona_bulk.js.

   Uso: node seleziona_casa.js  */
const fs = require('fs');
const dati = JSON.parse(fs.readFileSync('places_cache/riepilogo_casa.json', 'utf8'));

const QUANTI = { 'Acireale': 3 };
const DEFAULT = 2;

const gruppi = {};
for (const d of dati) { const k = d.zona + '||' + d.tipo; (gruppi[k] = gruppi[k] || []).push(d); }

const usateCoord = [];
function giaUsato(lat, lon) { return usateCoord.some(c => Math.abs(c.lat - lat) < 0.0001 && Math.abs(c.lon - lon) < 0.0001); }

const scelti = [];
for (const k of Object.keys(gruppi)) {
  const [zona] = k.split('||');
  const quanti = QUANTI[zona] || DEFAULT;
  let presi = 0;
  for (const cand of gruppi[k]) {
    if (presi >= quanti) break;
    if (giaUsato(cand.lat, cand.lon)) continue;
    usateCoord.push({ lat: cand.lat, lon: cand.lon });
    scelti.push(cand); presi++;
  }
}
console.log('totali: ' + dati.length + '  ->  scelti: ' + scelti.length);

const GENERE = { carne: 'Carne alla griglia', pesce: 'Cucina di pesce', pasta: 'Trattoria', pizza: 'Pizzeria', dolci: 'Pasticceria', street: 'Street food' };
function chiaveDa(nome) { return nome.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) + Math.random().toString(36).slice(2, 5); }

const righe = scelti.map(c => ({
  k: chiaveDa(c.nome), n: c.nome, com: c.zona, z: c.zona, lat: c.lat, lon: c.lon,
  a: (c.indirizzo || '').split(',').slice(0, 2).join(',').trim(), t: c.tipo,
  voto: String(c.voto).replace('.', ','), rec: c.recensioni,
  d: (GENERE[c.tipo] || 'Locale') + ' a ' + c.zona + '. Da Google Maps: ' + String(c.voto).replace('.', ',') + ' su ' + c.recensioni + ' recensioni.'
}));

fs.writeFileSync('candidati_casa.js',
  '/* Generato da seleziona_casa.js — arricchimento mirato carne/pesce\n   per le zone vicino ad Aci Catena. */\nmodule.exports = ' + JSON.stringify(righe, null, 1) + ';\n', 'utf8');
righe.forEach(r => console.log('  ' + r.z.padEnd(20) + r.t.padEnd(8) + r.n));
