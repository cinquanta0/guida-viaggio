const fs = require('fs');
const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
let d = fs.readFileSync('dati.js', 'utf8');

/* 1. collega le due foto trovate tramite categoria */
const mappa = [
  ['Castello Normanno di Patern', 'paterno.jpg'],
  ["Cantine dell'Etna", 'cantineetna.jpg']
];
let n = 0; const ko = [];
for (const [pezzo, file] of mappa) {
  if (!fs.existsSync(IMG + file)) { ko.push(pezzo + ' (foto assente)'); continue; }
  const i = d.indexOf('n:"' + pezzo);
  if (i < 0) { ko.push(pezzo + ' (voce non trovata)'); continue; }
  const fine = d.indexOf('\n', i);
  const riga = d.substring(i, fine);
  if (/\bimg:/.test(riga)) { ko.push(pezzo + ' (ha gia foto)'); continue; }
  const nuova = riga.replace(/(g:"[^"]*",)/, '$1 img:"' + file + '",');
  if (nuova === riga) { ko.push(pezzo + ' (inserimento fallito)'); continue; }
  d = d.substring(0, i) + nuova + d.substring(fine); n++;
}

/* 2. una tappa in piu' a Pachino */
const t = {};
for (const f of ['tempi.json', 'tempi2.json', 'tempi3.json', 'tempi4.json', 'tempi5.json', 'tempi6.json']) {
  Object.assign(t, JSON.parse(fs.readFileSync(f, 'utf8')));
}
const nuova = {
  b: 6, n: 'Grotta Calafarina', z: 'Pachino', min: t.pachino.min, km: t.pachino.km,
  t: 'vedere', g: 'nascosto', img: 'calafarina.jpg',
  d: 'Grotta naturale nella campagna di Pachino, verso il mare, abitata fin dalla preistoria: '
    + 'ci sono stati trovati reperti del Paleolitico e del Neolitico. Non e\u2019 attrezzata e non e\u2019 segnalata, '
    + 'ma e\u2019 una delle poche cose da vedere in zona oltre alle spiagge.'
};
if (d.indexOf('n:"Grotta Calafarina"') < 0 && fs.existsSync(IMG + nuova.img)) {
  const posti = require('./dati.js');
  fs.writeFileSync('dati.js', d);
  delete require.cache[require.resolve('./dati.js')];
  const tutti = require('./dati.js');
  tutti.push(nuova);
  tutti.sort((a, b) => a.min - b.min || a.n.localeCompare(b.n));
  let out = '/* Tutti i posti.\n'
    + '   min = minuti reali in auto da Aci Catena (OSRM, percorso stradale).  km = distanza reale.\n'
    + '   b = fascia di distanza.  t = tipo.  g = caratteristiche.  fo = fondo della spiaggia.\n'
    + '   a = indirizzo.  d = descrizione.  img = foto */\nmodule.exports = [\n';
  for (const p of tutti) {
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
  console.log('aggiunta la Grotta Calafarina a Pachino');
} else {
  fs.writeFileSync('dati.js', d);
}
console.log('foto collegate: ' + n + '/' + mappa.length + (ko.length ? '  (' + ko.join(', ') + ')' : ''));
