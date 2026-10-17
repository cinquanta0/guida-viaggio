// Campione casuale di 35 posti, proporzionale per fascia di distanza,
// con un limite di 2 per zona per garantire varieta' geografica.
const fs = require('fs');
delete require.cache[require.resolve('./dati.js')];
const dati = require('./dati.js');

const TOTALE = 35;
const perFascia = {};
dati.forEach(p => { (perFascia[p.b] = perFascia[p.b] || []).push(p); });

const fasce = Object.keys(perFascia).sort((a, b) => a - b);
const quote = {};
let assegnati = 0;
fasce.forEach(f => {
  const q = Math.max(1, Math.round((perFascia[f].length / dati.length) * TOTALE));
  quote[f] = q;
  assegnati += q;
});
// aggiusta per arrivare esattamente a 35 (togli/aggiungi dalla fascia piu' popolosa)
const fasciaGrande = fasce.reduce((a, b) => perFascia[a].length > perFascia[b].length ? a : b);
quote[fasciaGrande] += (TOTALE - assegnati);

function mescola(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const campione = [];
fasce.forEach(f => {
  const candidati = mescola(perFascia[f]);
  const contaZona = {};
  let presi = 0;
  for (const p of candidati) {
    if (presi >= quote[f]) break;
    contaZona[p.z] = (contaZona[p.z] || 0) + 1;
    if (contaZona[p.z] > 2) continue; // max 2 per zona
    campione.push(p);
    presi++;
  }
  // se non si e' raggiunta la quota per il limite di zona, riempi senza il limite
  if (presi < quote[f]) {
    for (const p of candidati) {
      if (presi >= quote[f]) break;
      if (campione.includes(p)) continue;
      campione.push(p);
      presi++;
    }
  }
});

console.log('Quote per fascia:', quote, '-> totale', Object.values(quote).reduce((a,b)=>a+b,0));
console.log('\nCampione (' + campione.length + '):');
campione.forEach((p, i) => console.log((i+1) + '.', 'b' + p.b, '|', p.n, '|', p.z, '|', p.min + 'min', '|', p.a || '(no indirizzo)'));

fs.writeFileSync('campione_qualita.json', JSON.stringify(campione, null, 2));
