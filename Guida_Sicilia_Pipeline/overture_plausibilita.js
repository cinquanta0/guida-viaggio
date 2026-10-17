/* Controllo di plausibilita' gia' usato piu' volte in questo progetto
   (bug Portopalo/Siracusa, Militello, Taormina/Catania provincia...):
   per ogni zona, la mediana dei tempi PRE-ESISTENTI (non da Overture) e'
   il tempo "atteso"; un nuovo posto Overture che se ne scosta troppo e'
   quasi sempre una zona assegnata male, non un caso limite vero. */
const fs = require('fs');
const src = fs.readFileSync('dati.js', 'utf8');
const arr = eval(src.replace('module.exports', 'var POSTI') + ';POSTI');

function mediana(a) { const s = a.slice().sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

const perZonaVecchi = {};
arr.forEach(p => {
  if (!(p.d || '').includes('OpenStreetMap')) (perZonaVecchi[p.z] = perZonaVecchi[p.z] || []).push(p.min);
});

const sospetti = [];
arr.forEach(p => {
  if (!(p.d || '').includes('OpenStreetMap')) return;
  const base = perZonaVecchi[p.z];
  if (!base || base.length < 2) return; // zona tutta nuova, niente da confrontare
  const med = mediana(base);
  const scarto = Math.abs(p.min - med);
  if (scarto > 22) sospetti.push({ nome: p.n, zona: p.z, min: p.min, medianaZona: med, scarto });
});

sospetti.sort((a, b) => b.scarto - a.scarto);
console.log('sospetti trovati:', sospetti.length);
sospetti.forEach(s => console.log(' ', s.nome, '|', s.zona, '| suo:', s.min, 'min | mediana zona:', s.medianaZona, 'min | scarto:', s.scarto));
