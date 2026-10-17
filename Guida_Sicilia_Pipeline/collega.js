const fs = require('fs');
let d = fs.readFileSync('dati.js', 'utf8');

/* nome esatto della voce -> file foto */
const mappa = {
  'Santa Tecla': 'santatecla.jpg',
  'Santa Maria La Scala': 'santamarialascala.jpg',
  'Capo Mulini e Stazzo': 'capomulini.jpg',
  'La Plaia': 'laplaia.jpg',
  'San Giovanni Li Cuti': 'licuti.jpg',
  'Mazzarò': 'mazzaro.jpg',
  'Giardini Naxos': 'giardininaxos.jpg',
  "Gole dell'Alcantara": 'alcantara.jpg',
  'Cala Rossa e Solarium Forte Vigliena': 'ortigia_lungomare.jpg',
  'Fontane Bianche': 'fontanebianche.jpg',
  'Arenella': 'arenella.jpg',
  'Mondello': 'mondello.jpg',
  'Riserva dello Zingaro': 'zingaro.jpg',
  'Isole Egadi — Cala Rossa': 'egadi.jpg',
  'Fonte Aretusa': 'aretusa.jpg',
  'Teatro Greco e Neapolis': 'teatro_siracusa.jpg',
  'Mercato di Ortigia': 'mercatoortigia.jpg',
  'Castello di Nelson': 'nelson.jpg',
  'Quattro Canti e Cattedrale': 'palermo_cattedrale.jpg',
  'Saline di Trapani': 'trapani.jpg'
};

const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
let fatti = 0, saltati = [];

for (const [nome, file] of Object.entries(mappa)) {
  if (!fs.existsSync(IMG + file)) { saltati.push(nome + ' (foto assente)'); continue; }

  // trova la riga della voce e infila img: subito dopo g:"..."
  const cerca = 'n:"' + nome + '"';
  const i = d.indexOf(cerca);
  if (i < 0) { saltati.push(nome + ' (voce non trovata)'); continue; }
  const fine = d.indexOf('\n', i);
  let riga = d.substring(i, fine);
  if (/\bimg:/.test(riga)) { saltati.push(nome + ' (ha gia una foto)'); continue; }

  const nuova = riga.replace(/(g:"[^"]*",\s*)/, '$1img:"' + file + '", ');
  if (nuova === riga) { saltati.push(nome + ' (non ho trovato dove inserire)'); continue; }
  d = d.substring(0, i) + nuova + d.substring(fine);
  fatti++;
}

fs.writeFileSync('dati.js', d);
console.log('foto collegate: ' + fatti + '/' + Object.keys(mappa).length);
if (saltati.length) console.log('saltate:\n  ' + saltati.join('\n  '));
