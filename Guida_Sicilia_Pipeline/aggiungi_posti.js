/* Aggiunge posti dove mangiare nelle zone che ne erano scoperte.

   Tempi e chilometri NON sono stimati: vengono da tempi_nuove.json, cioe'
   da Nominatim + OSRM come tutti gli altri, e le coordinate sono state
   controllate contro il centro del paese giusto (una geocodifica dava
   "Via Marina, Barriera" ma cadeva davvero ad Aci Trezza).

   Sulla provenienza: questi posti NON erano nel PDF di partenza, li ho
   cercati sulla stampa gastronomica. Ogni scheda lo dice, perche' il lettore
   deve sapere che quel giudizio non ha lo stesso peso del resto.

   Uso: node aggiungi_posti.js */

const fs = require('fs');
const DATI = 'dati.js';

const t1 = JSON.parse(fs.readFileSync('tempi_nuove.json', 'utf8'));
const t2 = JSON.parse(fs.readFileSync('tempi_nuove2.json', 'utf8'));
const tempi = Object.assign({}, t1, t2);

/* la fascia si ricava dai minuti, con gli stessi confini di build.js */
function fascia(min) {
  if (min === 0) return 1;
  if (min <= 20) return 2;
  if (min <= 35) return 3;
  if (min <= 60) return 4;
  if (min <= 95) return 5;
  if (min <= 140) return 6;
  return 7;
}

const nuovi = [
  {
    k: 'nespolo', n: 'Trattoria Il Nespolo', z: 'Aci Trezza',
    t: 'pesce', g: '', a: 'Aci Trezza, lungo la via provinciale',
    d: 'Trattoria di pesce nel borgo dei faraglioni, cucina semplice sul pescato. Ad Aci Trezza il pesce arriva dalla barca, ed è il motivo per fermarsi qui invece che a Catania. Segnalata dalla stampa gastronomica, non era nel documento di partenza.'
  },
  {
    k: 'colapesce', n: 'A putìa di Colapesce', z: 'Aci Trezza',
    t: 'pesce street', g: '', a: 'Via Marina 13',
    d: 'Piatti di pesce e specialità siciliane da banco, arancini compresi. Piccola e informale, sul lungomare. Segnalata dalla stampa gastronomica, non era nel documento di partenza.'
  },
  {
    k: 'caffesicilia', n: 'Caffè Sicilia', z: 'Noto',
    t: 'dolci', g: 'top', a: 'Corso Vittorio Emanuele 125',
    d: 'Pasticceria storica di Noto, oltre 120 anni di attività. Corrado Assenza è fra i pasticceri più premiati d’Italia e la granita di mandorla è la sua firma. Proprio perché è famoso, ad agosto c’è fila: andateci presto la mattina. Dalla stampa gastronomica, non dal documento di partenza.'
  },
  {
    k: 'caffecostanzo', n: 'Caffè Costanzo', z: 'Noto',
    t: 'dolci', g: '', a: 'Via Silvio Spaventa 7/9',
    d: 'L’altra pasticceria di Noto, con i tavolini davanti alla cattedrale. Granite al limone, caffè e mandarino, e i dolci di mandorla. Alternativa se davanti al Caffè Sicilia trovate la coda. Dalla stampa gastronomica, non dal documento di partenza.'
  },
  {
    k: 'labettola', n: 'La Bettola', z: 'Ragusa Ibla',
    t: 'street', g: 'eco', a: 'Ragusa Ibla',
    d: 'Tavola calda con scacce e focacce fatte a mano con farine locali, più arancine. Informale, si mangia in piedi o al volo: è il modo giusto di provare la scaccia ragusana senza sedersi al ristorante. Dalla stampa gastronomica, non dal documento di partenza.'
  },
  {
    k: 'giummarra', n: 'Panificio Giummarra', z: 'Ragusa',
    t: 'street', g: 'eco', a: 'Ragusa',
    d: 'Forno noto per la scaccia campagnola. Si compra a peso e si mangia camminando. Dalla stampa gastronomica, non dal documento di partenza.'
  }
];

/* prima e dopo, per accorgersi se qualcosa si perde */
function conta() {
  delete require.cache[require.resolve('./' + DATI)];
  const d = require('./' + DATI);
  const c = {};
  d.forEach(p => Object.keys(p).forEach(k => { c[k] = (c[k] || 0) + 1; }));
  return { n: d.length, campi: c };
}
const prima = conta();

let testo = fs.readFileSync(DATI, 'utf8');
/* L'ultima scheda del file puo' non avere la virgola finale. Senza,
   inserendo dopo di lei l'array si spacca: e' successo al primo tentativo. */
testo = testo.replace(/\}(\s*)\];\s*$/, '},$1];\n');
const chiusura = testo.lastIndexOf('];');
if (chiusura === -1) { console.log('non trovo la fine dell array'); process.exit(1); }

let righe = '';
const saltati = [];
for (const v of nuovi) {
  const tt = tempi[v.k];
  if (!tt) { saltati.push(v.n + ' (nessun tempo calcolato)'); continue; }
  righe += '{b:' + fascia(tt.min) + ', n:"' + v.n + '", z:"' + v.z + '", min:' + tt.min
    + ', km:' + tt.km + ', t:"' + v.t + '", g:"' + v.g + '"'
    + (v.a ? ', a:"' + v.a + '"' : '')
    + ', d:"' + v.d.replace(/"/g, '\\"') + '"},\n';
  console.log('  + ' + String(tt.min + ' min').padStart(8) + '  ' + v.n.padEnd(26) + v.z);
}

testo = testo.slice(0, chiusura) + righe + testo.slice(chiusura);
fs.writeFileSync(DATI, testo, 'utf8');

const dopo = conta();
console.log('\nposti: ' + prima.n + ' -> ' + dopo.n);
let guai = false;
for (const campo of Object.keys(prima.campi)) {
  const a = prima.campi[campo], b = dopo.campi[campo] || 0;
  if (b < a) { console.log('  ATTENZIONE: campo ' + campo + ' passato da ' + a + ' a ' + b); guai = true; }
}
if (saltati.length) console.log('saltati: ' + saltati.join(', '));
console.log(guai ? 'QUALCOSA SI E PERSO' : 'nessun campo perso.');
