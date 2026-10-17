/* Unisce le nuove tappe a quelle esistenti e sostituisce i tempi stimati
   con quelli reali calcolati da OSRM. Riscrive dati.js. */
const fs = require('fs');

const tempi = Object.assign({},
  JSON.parse(fs.readFileSync('tempi.json', 'utf8')),
  JSON.parse(fs.readFileSync('tempi2.json', 'utf8')),
  JSON.parse(fs.readFileSync('tempi3.json', 'utf8')));

const vecchi = require('./dati.js');
const nuovi = require('./nuovi.js');

/* zona scritta nella scheda -> tratta calcolata */
const perZona = {
  'Aci Catena': null,                    // partenza: si va a piedi
  'Acireale': 'acireale',
  'Sotto Acireale': 'santamarialascala',
  'Acireale nord': 'santatecla',
  'Frazioni di Acireale': 'capomulini',
  'Costa acese': 'capomulini',
  'Riserva della Timpa': 'timpa',
  'Aci Trezza': 'acitrezza',
  'Catania': 'catania',
  'Catania — Pescheria': 'catania',
  'Catania — Via Plebiscito': 'catania_plebiscito',
  'Gravina di Catania': 'gravina',
  'Taormina': 'taormina',
  'Giardini Naxos': 'giardininaxos',
  'Sopra Taormina': 'castelmola',
  'Motta Camastra': 'alcantara',
  'Messina': 'messina',
  'Etna sud': 'sapienza',
  'Etna sud, Nicolosi': 'sapienza',
  'Linguaglossa': 'provenzana',
  'Randazzo, Linguaglossa': 'randazzo',
  'Bronte': 'bronte',
  'Maniace, Bronte': 'maniace',
  'Ortigia, Siracusa': 'siracusa',
  'Siracusa': 'siracusa_neapolis',
  'Penisola della Maddalena': 'plemmirio',
  'Siracusa sud': 'fontanebianche',
  'Noto': 'noto',
  'Marzamemi': 'marzamemi',
  'Modica': 'modica',
  'Ragusa': 'ragusa',
  'Cefalù': 'cefalu',
  'Palermo': 'palermo',
  'Palermo, zona Ballarò': 'palermo',
  'Palermo, Mercato Ballarò': 'palermo',
  'Mondello, Palermo': 'mondello',
  'San Vito Lo Capo': 'sanvito',
  'Tra San Vito e Scopello': 'scopello',
  'Favignana': 'favignana',
  'Trapani': 'trapani',
  'Sopra Trapani': 'erice',
  'Verso Marsala': 'saline'
};

/* singole schede che hanno una tratta propria, diversa da quella della zona */
const perNome = {
  'La Plaia': 'catania_playa',
  'San Giovanni Li Cuti': 'catania_licuti',
  'Castello Ursino': 'catania_ursino',
  'Villa Bellini': 'catania_bellini',
  'Mazzarò': 'mazzaro',
  'Isola Bella': 'isolabella',
  'Arenella': 'arenella',
  'Spiaggia del Minareto': 'minareto',
  'Fontane Bianche': 'fontanebianche',
  'Teatro Greco e Neapolis': 'siracusa_neapolis'
};

function fascia(min) {
  if (min === 0) return 1;
  if (min <= 20) return 2;
  if (min <= 35) return 3;
  if (min <= 60) return 4;
  if (min <= 95) return 5;
  if (min <= 140) return 6;
  return 7;
}

const tutti = [];
const problemi = [];

for (const p of vecchi) {
  const k = perNome[p.n] || perZona[p.z];
  if (p.z === 'Aci Catena') { p.min = 0; p.b = 1; tutti.push(p); continue; }
  if (!k || !tempi[k]) { problemi.push(p.n + '  (zona: ' + p.z + ')'); tutti.push(p); continue; }
  p.k = k;
  p.min = tempi[k].min;
  p.km = tempi[k].km;
  p.b = fascia(p.min);
  tutti.push(p);
}

for (const p of nuovi) {
  if (!tempi[p.k]) { problemi.push(p.n + '  (chiave: ' + p.k + ')'); continue; }
  p.min = tempi[p.k].min;
  p.km = tempi[p.k].km;
  p.b = fascia(p.min);
  tutti.push(p);
}

/* riscrive dati.js */
let out = '/* Tutti i posti.\n'
  + '   min = minuti reali in auto da Aci Catena, calcolati con OSRM su percorso stradale.\n'
  + '   km  = distanza reale del percorso.  b = fascia di distanza.\n'
  + '   t = tipo, g = carattere, a = indirizzo, d = descrizione, img = foto */\nmodule.exports = [\n';
tutti.sort((a, b) => a.min - b.min || a.n.localeCompare(b.n));
for (const p of tutti) {
  const campi = ['b:' + p.b, 'n:' + JSON.stringify(p.n), 'z:' + JSON.stringify(p.z),
    'min:' + p.min];
  if (p.km != null) campi.push('km:' + p.km);
  if (p.piedi) campi.push('piedi:' + JSON.stringify(p.piedi));
  campi.push('t:' + JSON.stringify(p.t), 'g:' + JSON.stringify(p.g || ''));
  if (p.img) campi.push('img:' + JSON.stringify(p.img));
  if (p.a) campi.push('a:' + JSON.stringify(p.a));
  campi.push('d:' + JSON.stringify(p.d));
  out += '{' + campi.join(', ') + '},\n';
}
out = out.replace(/,\n$/, '\n') + '];\n';
fs.writeFileSync('dati.js', out);

const perFascia = {};
tutti.forEach(p => perFascia[p.b] = (perFascia[p.b] || 0) + 1);
console.log('posti totali: ' + tutti.length + '  (di cui ' + nuovi.length + ' nuovi)');
console.log('per fascia: ' + JSON.stringify(perFascia));
console.log(problemi.length ? 'SENZA TEMPO REALE:\n  ' + problemi.join('\n  ') : 'tutti con tempo reale');
