/* Sceglie da spazza_cibo_risultati.json (2033 candidati) chi entra
   davvero in guida. Stesso principio usato ad Acireale: mai tutti,
   il numero scende con la distanza da casa.

   Quanti per zona+tipo, in base a quanto e' lontana la zona:
   - fino a 20 min: 3
   - 21-60 min: 2
   - 61-150 min: 2 se il primo candidato ha almeno 300 recensioni
     (segnale forte), altrimenti 1
   - oltre 150 min: 1

   Dedup globale per coordinate (non per nome: due locali possono
   chiamarsi quasi uguale), cosi' lo stesso posto non entra due volte
   se e' uscito in ricerche di zone vicine fra loro.

   Scrive candidati_spazza_cibo.js, pronto per l'inserimento diretto
   (coordinate gia' di Google, nessun secondo geocoding).

   Uso: node seleziona_spazza_cibo.js  */

const fs = require('fs');
const dati = require('./spazza_cibo_risultati.json');
const P = require('./dati.js');

/* il tempo minimo della zona, per decidere il tetto */
const zoneMap = {};
P.forEach(p => { const base = p.z.split(/[—,]/)[0].trim(); (zoneMap[base] = zoneMap[base] || []).push(p); });
function minZona(z) { return zoneMap[z] ? Math.min(...zoneMap[z].map(p => p.min)) : 999; }

function tetto(zona, primoRecensioni) {
  const min = minZona(zona);
  if (min <= 20) return 3;
  if (min <= 60) return 2;
  if (min <= 150) return primoRecensioni >= 300 ? 2 : 1;
  return 1;
}

/* Nomi che segnalano un negozio o un locale non adatto, anche se il tipo
   Google non lo marca come tale. "Valpesce, Mercato Del Pesce" e' passato
   il primo filtro perche' Google lo tagga come seafood_restaurant, ma nel
   nome dice chiaramente cos'e'. */
const NOME_ESCLUSO = /mercato del pesce|pescheria(?!.*(ristorante|trattoria))|ittica|ortofrutta|grossista|all'ingrosso| srl$| s\.?a\.?s\.?/i;
const datiPuliti = dati.filter(d => !NOME_ESCLUSO.test(d.nome));
console.log('tolti per nome sospetto: ' + (dati.length - datiPuliti.length));

const gruppi = {};
for (const d of datiPuliti) { const k = d.zona + '||' + d.tipo; (gruppi[k] = gruppi[k] || []).push(d); }

const usateCoord = [];
function giaUsato(lat, lon) { return usateCoord.some(c => Math.abs(c.lat - lat) < 0.0001 && Math.abs(c.lon - lon) < 0.0001); }

const scelti = [];
for (const k of Object.keys(gruppi)) {
  const [zona] = k.split('||');
  const lista = gruppi[k]; // gia' ordinati per recensioni decrescenti da spazza_cibo.js
  const quanti = tetto(zona, (lista[0] && lista[0].recensioni) || 0);
  let presi = 0;
  for (const cand of lista) {
    if (presi >= quanti) break;
    if (giaUsato(cand.lat, cand.lon)) continue;
    usateCoord.push({ lat: cand.lat, lon: cand.lon });
    scelti.push(cand); presi++;
  }
}

console.log('candidati totali: ' + dati.length + '  ->  scelti: ' + scelti.length);

const GENERE = { carne: 'Carne alla griglia', pesce: 'Cucina di pesce', pasta: 'Trattoria', pizza: 'Pizzeria', dolci: 'Pasticceria', street: 'Street food' };
function chiaveDa(nome) { return nome.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) + Math.random().toString(36).slice(2, 6); }

const righe = scelti.map(c => ({
  k: chiaveDa(c.nome), n: c.nome, com: c.zona, z: c.zona, lat: c.lat, lon: c.lon,
  a: (c.indirizzo || '').split(',').slice(0, 2).join(',').trim(), t: c.tipo,
  voto: String(c.voto).replace('.', ','), rec: c.recensioni,
  d: (GENERE[c.tipo] || 'Locale') + ' a ' + c.zona + '. Da Google Maps: ' + String(c.voto).replace('.', ',') + ' su ' + c.recensioni + ' recensioni.'
}));

fs.writeFileSync('candidati_spazza_cibo.js',
  '/* Generato da seleziona_spazza_cibo.js dal giro sistematico su 92 zone. */\nmodule.exports = ' + JSON.stringify(righe, null, 1) + ';\n', 'utf8');

/* riepilogo per zona, per rivedere prima di inserire */
const perZona = {};
righe.forEach(r => { (perZona[r.z] = perZona[r.z] || []).push(r); });
Object.keys(perZona).sort((a, b) => minZona(a) - minZona(b)).forEach(z => {
  console.log('\n' + z + '  (' + minZona(z) + ' min)');
  perZona[z].forEach(r => console.log('  ' + r.t.padEnd(8) + r.voto + '/' + r.rec + '  ' + r.n));
});
