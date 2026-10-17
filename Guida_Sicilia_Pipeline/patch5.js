const fs = require('fs');
const righe = fs.readFileSync('build.js', 'utf8').split('\n');

const da = righe.findIndex(r => r.indexOf('const contaZona') === 0);
const a = righe.findIndex(r => r.indexOf("Object.keys(contaZona).sort().forEach") === 0);
if (da < 0 || a < 0) { console.log('ANCORAGGI NON TROVATI'); process.exit(1); }

const nuovo = [
  "const perZona = {};",
  "posti.forEach(p => { (perZona[p.z] = perZona[p.z] || []).push(p.min); });",
  "/* per una zona mostro il tempo mediano, non il minimo: e' piu' rappresentativo",
  "   della zona nel suo insieme che non il posto piu' vicino in assoluto */",
  "const mediana = v => { const o = v.slice().sort((x, y) => x - y); return o[Math.floor(o.length / 2)]; };",
  "const suggerimenti = [];",
  "Object.keys(perZona).sort().forEach(z =>",
  "  suggerimenti.push([z, 'zona', perZona[z].length, tempo(mediana(perZona[z]))]));"
];

righe.splice(da, a - da + 1, ...nuovo);
fs.writeFileSync('build.js', righe.join('\n'));
console.log('build.js: mediana attiva');
