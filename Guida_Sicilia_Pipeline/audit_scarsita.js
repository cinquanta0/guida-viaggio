// Tabella zona x tipo-cibo per capire dove la copertura e' debole (non solo zero),
// per decidere dove vale la pena il controllo aggiuntivo via Chrome (Google Maps/Search).

const dati = require('./dati.js');

const TIPI = ['carne', 'pesce', 'pasta', 'pizza', 'dolci', 'street'];
const SOGLIA_DEBOLE = 2; // <= questo numero per un tipo = da ricontrollare

const zone = {};
dati.forEach(p => {
  if (!p.t) return;
  const tipiPosto = p.t.split(' ').filter(t => TIPI.includes(t));
  if (tipiPosto.length === 0) return;
  zone[p.z] = zone[p.z] || { min: p.min, conteggi: {} };
  zone[p.z].min = Math.min(zone[p.z].min ?? p.min, p.min);
  tipiPosto.forEach(t => { zone[p.z].conteggi[t] = (zone[p.z].conteggi[t] || 0) + 1; });
});

const righe = Object.entries(zone).map(([z, info]) => {
  const debole = TIPI.filter(t => (info.conteggi[t] || 0) <= SOGLIA_DEBOLE);
  return { zona: z, min: info.min, conteggi: info.conteggi, debole };
}).sort((a, b) => a.min - b.min);

console.log('Zona | min | ' + TIPI.join(' | ') + ' | DEBOLI');
righe.forEach(r => {
  const cifre = TIPI.map(t => (r.conteggi[t] || 0)).join(' | ');
  console.log(`${r.zona} | ${r.min} | ${cifre} | ${r.debole.join(',') || '-'}`);
});

require('fs').writeFileSync('audit_scarsita.json', JSON.stringify(righe, null, 2));
