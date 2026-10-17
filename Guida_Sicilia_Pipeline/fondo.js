/* Assegna a ogni spiaggia il tipo di fondo, aggiunge "gratis" e "prenotare"
   dove noto, e unisce le tappe di extra.js. Riscrive dati.js. */
const fs = require('fs');
const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';

const t = {};
for (const f of ['tempi.json', 'tempi2.json', 'tempi3.json', 'tempi4.json', 'tempi5.json', 'tempi6.json']) {
  Object.assign(t, JSON.parse(fs.readFileSync(f, 'utf8')));
}

const posti = require('./dati.js');
const extra = require('./extra.js');
const fascia = m => m === 0 ? 1 : m <= 20 ? 2 : m <= 35 ? 3 : m <= 60 ? 4 : m <= 95 ? 5 : m <= 140 ? 6 : 7;

/* --- unisce le tappe nuove --- */
const noti = new Set(posti.map(p => p.n));
let agg = 0;
for (const p of extra) {
  if (noti.has(p.n)) continue;
  if (!t[p.k]) { console.log('nessun tempo per ' + p.n); continue; }
  if (p.img && !fs.existsSync(IMG + p.img)) delete p.img;
  p.min = t[p.k].min; p.km = t[p.k].km; p.b = fascia(p.min);
  posti.push(p); agg++;
}

/* --- tipo di fondo, per nome della spiaggia --- */
const fondo = {
  sabbia: ['La Plaia', 'Fondachello', 'Giardini Naxos', 'Fontane Bianche', 'Arenella',
    'San Vito Lo Capo', 'Mondello', 'Lido di Noto', 'Spiaggia della Spinazza',
    'Spiaggia di San Lorenzo', 'Granelli', 'Morghella', 'Spiaggia di Carratois',
    'Santa Maria del Focallo', 'Donnalucata', 'Marina di Ragusa', 'Sampieri e la Fornace Penna',
    'San Leone', 'Agnone Bagni', 'Mortelle', 'Cefalù', 'Isola delle Correnti',
    'Riserva di Vendicari e Calamosche', 'Marina di Marza e i Faraglioni di Ciriga'],
  ciottoli: ['Isola Bella', 'Mazzarò', 'La Praiola', 'Torre Faro e Capo Peloro',
    'Spiaggia del Mulino', 'Riserva dello Zingaro', 'Marina di Cottone e riserva del Fiumefreddo'],
  scogli: ['Santa Maria La Scala', 'Santa Tecla', 'Capo Mulini e Stazzo', 'Pozzillo',
    'Aci Trezza — Faraglioni dei Ciclopi', 'Scogliera di Aci Castello', 'San Giovanni Li Cuti',
    'Scogli di Ognina', 'Cala Rossa e Solarium Forte Vigliena', 'Plemmirio',
    'Spiaggia del Minareto', 'Isole Egadi — Cala Rossa', 'Brucoli',
    'Penisola Magnisi (Thapsos)', 'Isola di Capo Passero e il Forte', 'Isola Lachea e giro in barca']
};

/* --- gratis e prenotare, dove e' certo --- */
const gratis = ['Villa Bellini', 'Anfiteatro Romano', 'Tempio di Apollo', 'Monti Sartorius',
  'Villa Comunale', 'Saline di Priolo', 'Rifugio Sapienza e crateri Silvestri',
  'Cala Rossa e Solarium Forte Vigliena', 'Nicolosi e i Monti Rossi'];
const prenotare = ['Era Ora Ortigia', 'La Pentolaccia', 'Fùnnaco PizzaLab', 'IL LOCALE Cefalù',
  'Sardina PastaBar', 'Cantine dell\'Etna', 'Cantine del Nero d’Avola',
  'Castiglione di Sicilia', 'Monastero dei Benedettini'];

const aggiungiTag = (p, tag) => {
  const g = (p.g || '').split(' ').filter(Boolean);
  if (g.indexOf(tag) < 0) g.push(tag);
  p.g = g.join(' ');
};

let conFondo = 0; const senzaFondo = [];
for (const p of posti) {
  if (/mare/.test(p.t)) {
    let trovato = null;
    for (const f of Object.keys(fondo)) if (fondo[f].indexOf(p.n) >= 0) trovato = f;
    if (trovato) { p.fo = trovato; conFondo++; }
    else senzaFondo.push(p.n);
  }
  if (gratis.indexOf(p.n) >= 0) aggiungiTag(p, 'gratis');
  if (prenotare.indexOf(p.n) >= 0) aggiungiTag(p, 'prenotare');
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

console.log('tappe aggiunte: ' + agg + '   totale: ' + posti.length);
console.log('spiagge con fondo indicato: ' + conFondo);
if (senzaFondo.length) console.log('voci di mare senza fondo (controllare): ' + senzaFondo.join(', '));
console.log('gratis: ' + posti.filter(p => / gratis|^gratis/.test(' ' + p.g)).length
  + '   prenotare: ' + posti.filter(p => /prenotare/.test(p.g || '')).length);
