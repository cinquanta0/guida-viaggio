/* Verifica e inserisce i candidati di candidati_spesa.js.

   Per ognuno: geocodifica l'indirizzo, controlla che il punto cada davvero
   nel comune dichiarato (non un paese omonimo altrove, come la Praiola o
   Ricci Braceria), calcola il tempo reale con OSRM, e appende a dati.js.

   Niente tag "siciliani": questi vengono dal voto di Google Maps, non da
   una guida gastronomica. La provenienza e il voto restano scritti nella
   descrizione di ogni candidato.

   Uso: node aggiungi_maps.js     poi build.js && crediti.js  */

const https = require('https');
const fs = require('fs');
const candidati = require('./candidati_spesa.js');
const DATI = 'dati.js';

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

async function geo(q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=' + encodeURIComponent(q);
  for (let a = 0; a < 3; a++) {
    try { const j = JSON.parse(await get(url)); return j.length ? j[0] : null; }
    catch (e) { await sleep(6000); }
  }
  return null;
}

async function percorso(a, b) {
  const url = 'https://router.project-osrm.org/route/v1/driving/'
    + a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=false';
  for (let t = 0; t < 3; t++) {
    try {
      const j = JSON.parse(await get(url));
      if (j.code === 'Ok') return { km: j.routes[0].distance / 1000, min: j.routes[0].duration / 60 };
    } catch (e) { await sleep(5000); }
  }
  return null;
}

function fascia(min) {
  if (min === 0) return 1;
  if (min <= 20) return 2;
  if (min <= 35) return 3;
  if (min <= 60) return 4;
  if (min <= 95) return 5;
  if (min <= 140) return 6;
  return 7;
}

function conta() {
  delete require.cache[require.resolve('./' + DATI)];
  const d = require('./' + DATI);
  const c = {};
  d.forEach(p => Object.keys(p).forEach(k => { c[k] = (c[k] || 0) + 1; }));
  return { n: d.length, campi: c };
}

(async () => {
  const p0 = await geo('Aci Catena, Catania, Sicilia');
  const partenza = { lat: +p0.lat, lon: +p0.lon };
  await sleep(1500);

  const prima = conta();
  delete require.cache[require.resolve('./' + DATI)];
  const esistenti = new Set(require('./' + DATI).map(p => p.n.toLowerCase()));

  let testo = fs.readFileSync(DATI, 'utf8');
  testo = testo.replace(/\}(\s*)\];\s*$/, '},$1];\n');
  const chiusura = testo.lastIndexOf('];');
  if (chiusura === -1) { console.log('non trovo la fine dell array'); process.exit(1); }

  let righe = '';
  const scartati = [];
  for (const v of candidati) {
    if (esistenti.has(v.n.toLowerCase())) { console.log('già presente: ' + v.n); continue; }

    const g = await geo(v.ind);
    await sleep(1500);
    if (!g) { scartati.push(v.n + ': indirizzo non geocodificato'); continue; }

    /* il punto deve cadere entro ~6 km dal centro del comune dichiarato,
       altrimenti e' un omonimo altrove */
    /* NON forzare la provincia: Taormina e' in provincia di Messina, non
       Catania, e "Taormina, Catania, Sicilia" trovava "Largo Taormina" a
       Catania — una via, non il paese — mandando fuori strada il controllo
       di distanza. */
    const centro = await geo(v.com + ', Sicilia, Italia');
    await sleep(1500);
    if (centro) {
      const R = 6371, toRad = x => x * Math.PI / 180;
      const dLat = toRad(+centro.lat - +g.lat), dLon = toRad(+centro.lon - +g.lon);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(+g.lat)) * Math.cos(toRad(+centro.lat)) * Math.sin(dLon / 2) ** 2;
      const dist = 2 * R * Math.asin(Math.sqrt(h));
      if (dist > 6) { scartati.push(v.n + ': trovato a ' + dist.toFixed(1) + ' km dal centro di ' + v.com + ', probabile omonimo'); continue; }
    }

    const pr = await percorso(partenza, { lat: +g.lat, lon: +g.lon });
    await sleep(1500);
    if (!pr) { scartati.push(v.n + ': percorso fallito'); continue; }

    const min = Math.round(pr.min);
    righe += '{b:' + fascia(min) + ', n:"' + v.n + '", z:"' + v.z + '"'
      + ', min:' + min + ', km:' + (+pr.km.toFixed(1))
      + ', t:"' + v.t + '", g:"", a:"' + v.a + '"'
      + ', d:"' + v.d.replace(/"/g, '\\"') + '"},\n';
    console.log('  + ' + String(min + ' min').padStart(8) + '  ' + v.n.padEnd(38) + v.z);
  }

  if (!righe) { console.log('\nniente da aggiungere'); return; }
  testo = testo.slice(0, chiusura) + righe + testo.slice(chiusura);
  fs.writeFileSync(DATI, testo, 'utf8');

  const dopo = conta();
  console.log('\nposti: ' + prima.n + ' -> ' + dopo.n);
  let perso = false;
  for (const c of Object.keys(prima.campi)) {
    if ((dopo.campi[c] || 0) < prima.campi[c]) { console.log('  ATTENZIONE: campo ' + c + ' perso'); perso = true; }
  }
  console.log(perso ? 'QUALCOSA SI E PERSO' : 'nessun campo perso.');
  if (scartati.length) { console.log('\nscartati:'); scartati.forEach(s => console.log('  ' + s)); }
})();
