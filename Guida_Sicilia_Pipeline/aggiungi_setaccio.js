/* Verifica e inserisce i candidati di candidati_setaccio.js (giro Chrome/Google
   Maps del 23 ago 2026 su tutte le zone entro 45 min, "Il Setaccio").

   Stesso metodo di aggiungi_maps.js: geocodifica l'indirizzo, controlla che il
   punto cada davvero nel comune dichiarato (non un paese omonimo altrove),
   calcola il tempo reale con OSRM, e appende a dati.js.

   Uso: node aggiungi_setaccio.js     poi build.js && crediti.js  */

const https = require('https');
const fs = require('fs');
const candidati = require('./candidati_setaccio.js');
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

const normalizza = s => String(s || '').toLowerCase()
  .replace(/[àáâã]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
  .replace(/[òóôõ]/g, 'o').replace(/[ùúûü]/g, 'u')
  .replace(/['’]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

const comuneDi = x => (x.address && (x.address.city || x.address.town || x.address.village)) || '';

async function geo(q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=' + encodeURIComponent(q);
  for (let a = 0; a < 3; a++) {
    try { const j = JSON.parse(await get(url)); return j.length ? j[0] : null; }
    catch (e) { await sleep(6000); }
  }
  return null;
}

async function geoConComune(q, comune) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=it&q=' + encodeURIComponent(q);
  const target = normalizza(comune);
  for (let a = 0; a < 3; a++) {
    try {
      const j = JSON.parse(await get(url));
      if (!j.length) return null;
      const giusto = j.find(x => normalizza(comuneDi(x)) === target);
      return giusto || j[0];
    } catch (e) { await sleep(6000); }
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

  let inseriti = 0;
  const scartati = [];
  for (const v of candidati) {
    if (esistenti.has(v.n.toLowerCase())) { console.log('già presente: ' + v.n); continue; }

    const g = await geoConComune(v.ind, v.com);
    await sleep(1500);
    if (!g) { scartati.push(v.n + ': indirizzo non geocodificato (' + v.ind + ')'); continue; }

    const comuneCercato = normalizza(v.com);
    if (comuneCercato && normalizza(comuneDi(g)) !== comuneCercato) {
      scartati.push(v.n + ': il comune vero e\' "' + (comuneDi(g) || '?') + '", non "' + v.com + '" — probabile omonimo. Risultato: ' + g.display_name);
      continue;
    }

    const pr = await percorso(partenza, { lat: +g.lat, lon: +g.lon });
    await sleep(1500);
    if (!pr) { scartati.push(v.n + ': percorso fallito'); continue; }

    const min = Math.round(pr.min);
    const riga = '{b:' + fascia(min) + ', n:"' + v.n.replace(/"/g, '\\"') + '", z:"' + v.z + '"'
      + ', min:' + min + ', km:' + (+pr.km.toFixed(1))
      + ', t:"' + v.t + '", g:"", a:"' + v.a.replace(/"/g, '\\"') + '"'
      + ', d:"' + v.d.replace(/"/g, '\\"') + '"},\n';

    testo = fs.readFileSync(DATI, 'utf8');
    testo = testo.replace(/\}(\s*)\];\s*$/, '},$1];\n');
    const chiusuraOra = testo.lastIndexOf('];');
    testo = testo.slice(0, chiusuraOra) + riga + testo.slice(chiusuraOra);
    fs.writeFileSync(DATI, testo, 'utf8');
    esistenti.add(v.n.toLowerCase());

    inseriti++;
    console.log('[' + inseriti + '/' + candidati.length + '] + ' + String(min + ' min').padStart(8) + '  ' + v.n.padEnd(40) + v.z);
  }

  const dopo = conta();
  console.log('\nposti: ' + prima.n + ' -> ' + dopo.n + '  (+' + inseriti + ')');
  let perso = false;
  for (const c of Object.keys(prima.campi)) {
    if ((dopo.campi[c] || 0) < prima.campi[c]) { console.log('  ATTENZIONE: campo ' + c + ' perso'); perso = true; }
  }
  console.log(perso ? 'QUALCOSA SI E PERSO' : 'nessun campo perso.');
  if (scartati.length) {
    console.log('\nscartati (' + scartati.length + '):');
    scartati.forEach(s => console.log('  ' + s));
    fs.writeFileSync('scartati_setaccio.json', JSON.stringify(scartati, null, 2));
  }
})();
