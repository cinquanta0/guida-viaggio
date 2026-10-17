/* 1. rimette il tipo di fondo, cancellato per sbaglio da unisci.js
   2. aggiunge le spiagge che mancavano
   3. riscrive dati.js conservando TUTTI i campi */
const fs = require('fs');
const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';

const t = {};
for (const f of fs.readdirSync('.').filter(x => /^tempi\d*\.json$/.test(x))) {
  Object.assign(t, JSON.parse(fs.readFileSync(f, 'utf8')));
}
const fascia = m => m === 0 ? 1 : m <= 20 ? 2 : m <= 35 ? 3 : m <= 60 ? 4 : m <= 95 ? 5 : m <= 140 ? 6 : 7;
const posti = require('./dati.js');

/* --- spiagge nuove --- */
const nuove = [
  { k: 'gelsomineto', n: 'Spiaggia del Gelsomineto', z: 'Avola', t: 'mare', g: 'nascosto top', fo: 'sabbia',
    d: 'Cala di sabbia chiara chiusa tra due promontori, si scende da un sentiero e non c\u2019\u00e8 niente intorno: nessun lido, nessun bar. Per molti la pi\u00f9 bella della costa tra Siracusa e Avola.' },
  { k: 'lidoavola', n: 'Lido di Avola', z: 'Avola', t: 'mare', g: '', fo: 'sabbia',
    d: 'La spiaggia della citt\u00e0, sabbiosa e attrezzata, con la pineta alle spalle. Comoda se siete gi\u00e0 ad Avola per la mandorla o il barocco.' },
  { k: 'letojanni', n: 'Letojanni', z: 'Letojanni', t: 'mare', g: 'eco', fo: 'ciottoli',
    d: 'Spiaggia lunga di ciottoli con lidi e lungomare, cinque minuti oltre Taormina. Si mangia e si parcheggia a met\u00e0 di quello che costa l\u00e0 sopra. A fine agosto c\u2019\u00e8 anche la Sagra del Pesce.' },
  { k: 'santateresa', n: 'Santa Teresa di Riva e Sant\u2019Alessio', z: 'Santa Teresa di Riva', t: 'mare', g: 'nascosto', fo: 'ciottoli',
    d: 'Il tratto di costa tra Taormina e Messina, ignorato da tutti: spiagge di ciottoli lunghe e libere, con il capo di Sant\u2019Alessio e il suo castello a picco sul mare. Da qui si sale a Savoca in dieci minuti.' },
  { k: 'simeto', n: 'Oasi del Simeto', z: 'Catania sud', t: 'mare vedere', g: 'nascosto gratis', fo: 'sabbia',
    d: 'Riserva alla foce del Simeto, subito dopo la Plaia: dune, pantani e uccelli migratori, con chilometri di sabbia quasi deserta. \u00c8 la spiaggia libera pi\u00f9 vicina a Catania dove non trovate nessuno.' },
  { k: 'pozzallo', n: 'Spiaggia di Pozzallo', z: 'Pozzallo', t: 'mare', g: 'eco', fo: 'sabbia',
    d: 'Sabbia fine e fondale basso, bandiera blu, con la torre Cabrera sul lungomare. A fine agosto c\u2019\u00e8 la Sagra del Pesce.' }
];

const noti = new Set(posti.map(p => p.n));
let agg = 0;
for (const p of nuove) {
  if (noti.has(p.n)) continue;
  if (!t[p.k]) { console.log('nessun tempo per ' + p.n); continue; }
  if (p.img && !fs.existsSync(IMG + p.img)) delete p.img;
  p.min = t[p.k].min; p.km = t[p.k].km; p.b = fascia(p.min);
  posti.push(p); agg++;
}

/* --- rimette il fondo su tutte le spiagge --- */
const fondo = {
  sabbia: ['La Plaia', 'Fondachello', 'Giardini Naxos', 'Fontane Bianche', 'Arenella',
    'San Vito Lo Capo', 'Mondello', 'Lido di Noto', 'Spiaggia della Spinazza',
    'Spiaggia di San Lorenzo', 'Granelli', 'Morghella', 'Spiaggia di Carratois',
    'Santa Maria del Focallo', 'Donnalucata', 'Marina di Ragusa', 'Sampieri e la Fornace Penna',
    'San Leone', 'Agnone Bagni', 'Mortelle', 'Cefalù', 'Isola delle Correnti',
    'Riserva di Vendicari e Calamosche', 'Marina di Marza e i Faraglioni di Ciriga',
    'Tindari e i Laghetti di Marinello', 'Portopalo di Capo Passero'],
  ciottoli: ['Isola Bella', 'Mazzarò', 'La Praiola', 'Torre Faro e Capo Peloro',
    'Spiaggia del Mulino', 'Riserva dello Zingaro', 'Marina di Cottone e riserva del Fiumefreddo',
    "Gole dell'Alcantara", 'Cava Grande del Cassibile'],
  scogli: ['Santa Maria La Scala', 'Santa Tecla', 'Capo Mulini e Stazzo', 'Pozzillo',
    'Aci Trezza — Faraglioni dei Ciclopi', 'Scogliera di Aci Castello', 'San Giovanni Li Cuti',
    'Scogli di Ognina', 'Cala Rossa e Solarium Forte Vigliena', 'Plemmirio',
    'Spiaggia del Minareto', 'Isole Egadi — Cala Rossa', 'Brucoli',
    'Penisola Magnisi (Thapsos)', 'Isola di Capo Passero e il Forte', 'Isola Lachea e giro in barca',
    'Punta Izzo', 'Faro di Capo Santa Croce', 'Scala dei Turchi', 'Torre Archirafi']
};

let conFondo = 0; const senza = [];
for (const p of posti) {
  if (!/mare/.test(p.t)) continue;
  if (p.fo) { conFondo++; continue; }
  let trovato = null;
  for (const f of Object.keys(fondo)) if (fondo[f].indexOf(p.n) >= 0) trovato = f;
  if (trovato) { p.fo = trovato; conFondo++; } else senza.push(p.n);
}

posti.sort((a, b) => a.min - b.min || a.n.localeCompare(b.n));

let out = '/* Tutti i posti.\n'
  + '   min = minuti reali in auto da Aci Catena (OSRM, percorso stradale).  km = distanza reale.\n'
  + '   b = fascia di distanza.  t = tipo.  g = caratteristiche.  fo = fondo della spiaggia.\n'
  + '   a = indirizzo.  d = descrizione.  img = foto */\nmodule.exports = [\n';
for (const p of posti) {
  const c = ['b:' + p.b, 'n:' + JSON.stringify(p.n), 'z:' + JSON.stringify(p.z), 'min:' + p.min];
  if (p.km != null) c.push('km:' + p.km);
  if (p.piedi) c.push('piedi:' + JSON.stringify(p.piedi));
  c.push('t:' + JSON.stringify(p.t), 'g:' + JSON.stringify(p.g || ''));
  if (p.fo) c.push('fo:' + JSON.stringify(p.fo));
  if (p.img) c.push('img:' + JSON.stringify(p.img));
  if (p.a) c.push('a:' + JSON.stringify(p.a));
  c.push('d:' + JSON.stringify(p.d));
  out += '{' + c.join(', ') + '},\n';
}
fs.writeFileSync('dati.js', out.replace(/,\n$/, '\n') + '];\n');

console.log('spiagge aggiunte: ' + agg + '   totale posti: ' + posti.length);
console.log('spiagge con fondo: ' + conFondo);
console.log('voci di mare senza fondo: ' + (senza.join(', ') || 'nessuna'));
