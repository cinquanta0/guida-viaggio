/* Unisce le tappe mancanti a dati.js, con i tempi reali. */
const fs = require('fs');
const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';

const t = {};
for (const f of ['tempi.json', 'tempi2.json', 'tempi3.json', 'tempi4.json', 'tempi5.json', 'tempi6.json', 'tempi7.json']) {
  Object.assign(t, JSON.parse(fs.readFileSync(f, 'utf8')));
}

const esistenti = require('./dati.js');
const nuovi = require('./giarre_augusta.js');
const noti = new Set(esistenti.map(p => p.n));
const fascia = m => m === 0 ? 1 : m <= 20 ? 2 : m <= 35 ? 3 : m <= 60 ? 4 : m <= 95 ? 5 : m <= 140 ? 6 : 7;

let agg = 0; const saltati = [], senzaFoto = [];
for (const p of nuovi) {
  if (noti.has(p.n)) { saltati.push(p.n + ' (già presente)'); continue; }
  if (!t[p.k]) { saltati.push(p.n + ' (nessun tempo per "' + p.k + '")'); continue; }
  if (p.img && !fs.existsSync(IMG + p.img)) { senzaFoto.push(p.n); delete p.img; }
  p.min = t[p.k].min; p.km = t[p.k].km; p.b = fascia(p.min);
  esistenti.push(p); agg++;
}

esistenti.sort((a, b) => a.min - b.min || a.n.localeCompare(b.n));

let out = '/* Tutti i posti.\n'
  + '   min = minuti reali in auto da Aci Catena, calcolati con OSRM su percorso stradale.\n'
  + '   km  = distanza reale del percorso.  b = fascia di distanza.\n'
  + '   t = tipo, g = carattere, a = indirizzo, d = descrizione, img = foto */\nmodule.exports = [\n';
for (const p of esistenti) {
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

console.log('aggiunti: ' + agg + '/' + nuovi.length + '   totale posti: ' + esistenti.length);
if (senzaFoto.length) console.log('senza foto (non trovata libera): ' + senzaFoto.join(', '));
if (saltati.length) console.log('saltati: ' + saltati.join(', '));
