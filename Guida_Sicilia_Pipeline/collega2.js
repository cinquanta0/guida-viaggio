const fs = require('fs');
const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
let d = fs.readFileSync('dati.js', 'utf8');

/* pezzo di nome univoco -> file foto (evita problemi con gli apostrofi) */
const mappa = [
  ['Duomo di Ortigia', 'duomoortigia.jpg'],
  ['Tempio di Apollo', 'tempioapollo.jpg'],
  ['Palazzo Nicolaci', 'nicolaci.jpg'],
  ['Anfiteatro Romano', 'anfiteatro.jpg'],
  ['Villa Comunale', 'villacomunale.jpg'],
  ['Monti Sartorius', 'sartorius.jpg'],
  ['Le Chiazzette', 'chiazzette.jpg'],
  ['Isola di Capo Passero', 'capopassero.jpg'],
  ['Scogli di Ognina', 'ognina.jpg'],
  ['Tonnara e Palazzo di Villadorata', 'tonnara.jpg'],
  ['Duomo di San Giorgio', 'sangiorgioragusa.jpg']
];

let n = 0; const ko = [];
for (const [pezzo, file] of mappa) {
  if (!fs.existsSync(IMG + file)) { ko.push(pezzo + ' (foto non scaricata)'); continue; }
  const i = d.indexOf('n:"' + pezzo);
  if (i < 0) { ko.push(pezzo + ' (voce non trovata)'); continue; }
  const fine = d.indexOf('\n', i);
  const riga = d.substring(i, fine);
  if (/\bimg:/.test(riga)) { ko.push(pezzo + ' (ha gia una foto)'); continue; }
  const nuova = riga.replace(/(g:"[^"]*",)/, '$1 img:"' + file + '",');
  if (nuova === riga) { ko.push(pezzo + ' (inserimento fallito)'); continue; }
  d = d.substring(0, i) + nuova + d.substring(fine);
  n++;
}
fs.writeFileSync('dati.js', d);
console.log('foto collegate: ' + n + '/' + mappa.length);
if (ko.length) console.log('  non riuscite: ' + ko.join(', '));
