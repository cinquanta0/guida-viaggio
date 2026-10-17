/* Dai 339 candidati trovati da cerca_bulk.js, sceglie chi entra davvero
   in guida: non "tutti quelli sopra soglia", che sarebbe Google copiato,
   ma il migliore per ogni buco, con un secondo se la zona vale una sosta
   vera (non solo un passaggio).

   Regole:
   - un solo candidato per coppia zona+tipo di base; due per le zone dove
     ci si ferma davvero (Noto, Ragusa Ibla, Cefalu', Modica, San Vito Lo
     Capo, Palazzolo Acreide, Agrigento) — sono le stesse gia' scelte a
     mano nei giri precedenti per lo stesso motivo
   - MAI lo stesso locale due volte: capita che un posto a cavallo fra
     Ragusa e Ragusa Ibla esca in entrambe le ricerche. Si tiene per la
     PRIMA zona in cui compare, si scarta l'eventuale doppione dedotto
     dalle coordinate (arrotondate a ~11 metri, non dal nome — due
     locali diversi possono chiamarsi quasi uguale)
   - niente locale gia' presente in dati.js (il filtro di cerca_bulk.js
     l'ha gia' tolto, ma un secondo controllo qui non fa male)

   Scrive candidati_bulk.js, pronto per aggiungi_bulk.js.

   Uso: node seleziona_bulk.js  */

const fs = require('fs');
const dati = JSON.parse(fs.readFileSync('places_cache/riepilogo_completo.json', 'utf8'));

const ZONE_DA_DUE = new Set([
  'Noto', 'Ragusa Ibla', 'Cefalù', 'Modica', 'San Vito Lo Capo',
  'Palazzolo Acreide', 'Agrigento'
]);

/* raggruppa per zona+tipo, mantenendo l'ordine (gia' per recensioni
   decrescenti, lo fa cerca_bulk.js) */
const gruppi = {};
for (const d of dati) {
  const k = d.zona + '||' + d.tipo;
  (gruppi[k] = gruppi[k] || []).push(d);
}

const usateCoord = []; // [{lat,lon}]
function giaUsato(lat, lon) {
  return usateCoord.some(c => Math.abs(c.lat - lat) < 0.0001 && Math.abs(c.lon - lon) < 0.0001);
}

const scelti = [];
for (const k of Object.keys(gruppi)) {
  const [zona] = k.split('||');
  const quanti = ZONE_DA_DUE.has(zona) ? 2 : 1;
  let presi = 0;
  for (const cand of gruppi[k]) {
    if (presi >= quanti) break;
    if (giaUsato(cand.lat, cand.lon)) continue;
    usateCoord.push({ lat: cand.lat, lon: cand.lon });
    scelti.push(cand);
    presi++;
  }
}

console.log('candidati totali: ' + dati.length + '  ->  scelti: ' + scelti.length);

/* descrizione in stile omogeneo con le schede Maps gia' in guida:
   genere del locale dal tipo cercato + voto/recensioni per esteso */
const GENERE = {
  carne: 'Carne alla griglia', pesce: 'Cucina di pesce', pasta: 'Trattoria',
  pizza: 'Pizzeria', dolci: 'Pasticceria', street: 'Street food'
};

function chiaveDa(nome) {
  return nome.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) + Math.random().toString(36).slice(2, 5);
}

const righe = scelti.map(c => {
  const com = c.zona; // per queste zone il nome scritto e il comune coincidono
  return {
    k: chiaveDa(c.nome), n: c.nome, com, z: c.zona,
    lat: c.lat, lon: c.lon, a: (c.indirizzo || '').split(',').slice(0, 2).join(',').trim(),
    t: c.tipo, voto: String(c.voto).replace('.', ','), rec: c.recensioni,
    d: (GENERE[c.tipo] || 'Locale') + ' a ' + c.zona + '. Da Google Maps: '
      + String(c.voto).replace('.', ',') + ' su ' + c.recensioni + ' recensioni.'
  };
});

fs.writeFileSync('candidati_bulk.js',
  '/* Generato da seleziona_bulk.js dai risultati di cerca_bulk.js.\n'
  + '   ' + righe.length + ' locali, un candidato per buco (due per le zone dove\n'
  + '   si sosta piu\' a lungo). Coordinate DIRETTE da Google, non serve\n'
  + '   geocodificarle di nuovo: aggiungi_bulk.js le usa cosi\' come sono. */\n'
  + 'module.exports = ' + JSON.stringify(righe, null, 1) + ';\n', 'utf8');

console.log('scritto candidati_bulk.js\n');
righe.forEach(r => console.log('  ' + r.z.padEnd(22) + r.t.padEnd(8) + r.n));
