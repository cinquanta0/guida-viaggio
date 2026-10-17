/* Calcola i tempi reali in auto da Aci Catena a ogni destinazione.
   Geocoding: Nominatim (OpenStreetMap). Percorsi: OSRM.
   Entrambi gratuiti e senza chiave; rispetto 1 richiesta al secondo. */
const https = require('https');
const fs = require('fs');

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

async function geocodifica(q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q='
    + encodeURIComponent(q);
  for (let a = 0; a < 3; a++) {
    try {
      const j = JSON.parse(await get(url));
      if (j.length) return { lat: +j[0].lat, lon: +j[0].lon, nome: j[0].display_name };
      return null;
    } catch (e) { await sleep(4000); }
  }
  return null;
}

async function percorso(a, b) {
  const url = 'https://router.project-osrm.org/route/v1/driving/'
    + a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=false';
  for (let t = 0; t < 3; t++) {
    try {
      const j = JSON.parse(await get(url));
      if (j.code === 'Ok') {
        return { km: j.routes[0].distance / 1000, min: j.routes[0].duration / 60 };
      }
    } catch (e) { await sleep(4000); }
  }
  return null;
}

const mete = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

(async () => {
  const partenza = await geocodifica('Aci Catena, Catania, Sicilia');
  console.log('PARTENZA: ' + partenza.nome.split(',').slice(0, 2).join(',')
    + '  [' + partenza.lat.toFixed(4) + ', ' + partenza.lon.toFixed(4) + ']\n');
  await sleep(1200);

  const out = {};
  const chiavi = Object.keys(mete);
  for (let i = 0; i < chiavi.length; i++) {
    const k = chiavi[i];
    const g = await geocodifica(mete[k]);
    await sleep(1200);
    if (!g) { console.log(pad(k) + 'NON TROVATO  <- ' + mete[k]); continue; }
    const p = await percorso(partenza, g);
    await sleep(1200);
    if (!p) { console.log(pad(k) + 'percorso fallito'); continue; }
    out[k] = { km: +p.km.toFixed(1), min: Math.round(p.min), lat: g.lat, lon: g.lon };
    console.log(pad(k) + String(Math.round(p.min)).padStart(4) + ' min' +
      String(p.km.toFixed(0)).padStart(6) + ' km   ' + g.nome.split(',').slice(0, 2).join(','));
  }
  fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
  console.log('\ncalcolate ' + Object.keys(out).length + '/' + chiavi.length + ' tratte');
})();

function pad(s) { return (s + '                              ').slice(0, 30); }
