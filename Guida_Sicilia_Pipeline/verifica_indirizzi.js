/* Controlla che l'indirizzo scritto in ogni scheda corrisponda al punto in
   cui la scheda manda davvero.

   Serve perche' mi ci sono trovato dentro: per Arrhais avevo scritto
   "Contrada San Nicola" e per l'Oasi "via Marconi 45", ma gli indirizzi veri
   erano altri, e me ne sono accorto solo perche' una fonte successiva li
   riportava per esteso. L'indirizzo e' un dato che il lettore usa per
   arrivarci: se e' sbagliato, e' peggio di assente.

   Metodo: reverse geocoding delle coordinate su Nominatim, e confronto della
   VIA (non del numero civico, che spesso su OSM non c'e'). Non e' una prova:
   un locale puo' stare all'angolo fra due strade, e il punto puo' cadere sul
   marciapiede di fronte. Serve a tirare fuori i casi da guardare a mano.

   Uso: node verifica_indirizzi.js  */

const https = require('https');
const fs = require('fs');
const candidati = require('./candidati_veri.js');
const tempi = JSON.parse(fs.readFileSync('veri_verificati.json', 'utf8'));

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function get(url) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'it' } }, r => {
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      let s = ''; r.on('data', d => s += d); r.on('end', () => res(s));
    });
    req.setTimeout(45000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

/* via normalizzata: senza numero, senza abbreviazioni, senza accenti */
function via(s) {
  return String(s || '').toLowerCase()
    .replace(/[àáâ]/g, 'a').replace(/[èé]/g, 'e').replace(/[ìí]/g, 'i')
    .replace(/[òó]/g, 'o').replace(/[ùú]/g, 'u')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\b(via|viale|corso|piazza|vico|contrada|c da|localita|frazione|strada|provinciale|sp)\b/g, ' ')
    .replace(/\b(san|santa|s)\b/g, 'san')
    .replace(/\s+/g, ' ').trim();
}

function somiglia(a, b) {
  const x = via(a), y = via(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.85;
  const px = x.split(' ').filter(w => w.length > 2);
  const py = y.split(' ').filter(w => w.length > 2);
  if (!px.length || !py.length) return 0;
  const comuni = px.filter(w => py.indexOf(w) >= 0).length;
  return comuni / Math.min(px.length, py.length);
}

(async () => {
  const buoni = [], dubbi = [], senza = [];

  for (const c of candidati) {
    if (c.fuori) continue;
    const t = tempi[c.k];
    if (!t) continue;
    if (!c.a) { senza.push(c.n + ' (nessun indirizzo scritto)'); continue; }

    const url = 'https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat='
      + t.lat + '&lon=' + t.lon;
    let j = null;
    for (let a = 0; a < 3 && !j; a++) {
      try { j = JSON.parse(await get(url)); } catch (e) { await sleep(5000); }
    }
    await sleep(1300);
    if (!j || !j.address) { dubbi.push([c.n, c.a, '(reverse fallito)', 0]); continue; }

    const reale = j.address.road || j.address.pedestrian || j.address.neighbourhood
      || j.address.hamlet || j.address.suburb || '';
    const s = somiglia(c.a, reale);
    if (s >= 0.6) buoni.push(c.n);
    else dubbi.push([c.n, c.a, reale || '(nessuna via)', s]);
  }

  console.log('indirizzi coerenti col punto: ' + buoni.length);
  console.log('\nDA GUARDARE A MANO (' + dubbi.length + '):');
  for (const [n, mio, reale, s] of dubbi) {
    console.log('  ' + n);
    console.log('      scritto da me : ' + mio);
    console.log('      li  c e       : ' + reale + '   [' + s.toFixed(2) + ']');
  }
  if (senza.length) { console.log('\nsenza indirizzo:'); senza.forEach(x => console.log('  ' + x)); }
})();
