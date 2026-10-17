const fs = require('fs');
let b = fs.readFileSync('build.js', 'utf8');
const problemi = [];

/* i suggerimenti devono portare anche il tempo da Aci Catena.
   Per una zona uso il posto piu' vicino di quella zona. */
const vecchio = `const contaZona = {};
posti.forEach(p => { contaZona[p.z] = (contaZona[p.z] || 0) + 1; });
const suggerimenti = [];
Object.keys(contaZona).sort().forEach(z => suggerimenti.push([z, 'zona', contaZona[z]]));
posti.slice().sort((a, b) => a.n.localeCompare(b.n)).forEach(p => suggerimenti.push([p.n, p.z, 0]));`;

const nuovo = `const contaZona = {}, minZona = {};
posti.forEach(p => {
  contaZona[p.z] = (contaZona[p.z] || 0) + 1;
  if (minZona[p.z] == null || p.min < minZona[p.z]) minZona[p.z] = p.min;
});
const suggerimenti = [];
Object.keys(contaZona).sort().forEach(z => suggerimenti.push([z, 'zona', contaZona[z], tempo(minZona[z])]));
posti.slice().sort((a, b) => a.n.localeCompare(b.n)).forEach(p => suggerimenti.push([p.n, p.z, 0, tempo(p.min)]));`;

if (b.includes(vecchio)) b = b.replace(vecchio, nuovo);
else problemi.push('non trovato il blocco dei suggerimenti');

fs.writeFileSync('build.js', b);
console.log(problemi.length ? 'PROBLEMI: ' + problemi.join(' | ') : 'build.js aggiornato');
