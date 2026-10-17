/* Tira fuori le schede della sezione "Cosa vi mettono nel piatto" da build.js
   e le scrive come dati in cibo.js. Serve una volta sola: da qui in poi la
   sezione si modifica in cibo.js, non in mezzo all'HTML.

   Estrarle invece di ricopiarle a mano evita di introdurre errori di
   trascrizione in sedici descrizioni gia' scritte e gia' riviste. */

const fs = require('fs');
const testo = fs.readFileSync('build.js', 'utf8');

const riga = /<div class="p">(?:<img src="assets\/img\/([^"]+)" alt="([^"]*)">)?<div class="p-in"><h3>([^<]+)<\/h3><p class="p-d">([\s\S]*?)<\/p><\/div><\/div>/g;

/* la sezione del cibo, non tutte le altre schede scritte a mano */
const inizio = testo.indexOf('Cosa vi mettono nel piatto');
const fine = testo.indexOf('</details>', inizio);
const pezzo = testo.slice(inizio, fine);

const voci = [];
let m;
while ((m = riga.exec(pezzo)) !== null) {
  voci.push({ img: m[1] || '', alt: m[2] || '', n: m[3], d: m[4] });
}

const fuori = 'module.exports = [\n' + voci.map(v =>
  '  {\n' +
  '    n: ' + JSON.stringify(v.n) + ',\n' +
  (v.img ? '    img: ' + JSON.stringify(v.img) + ',\n' : '') +
  (v.alt ? '    alt: ' + JSON.stringify(v.alt) + ',\n' : '') +
  '    d: ' + JSON.stringify(v.d) + '\n' +
  '  }'
).join(',\n') + '\n];\n';

fs.writeFileSync('cibo_estratto.js', fuori, 'utf8');
console.log('estratte ' + voci.length + ' schede in cibo_estratto.js');
voci.forEach(v => console.log('  ' + (v.img || '(senza foto)').padEnd(20) + v.n));
