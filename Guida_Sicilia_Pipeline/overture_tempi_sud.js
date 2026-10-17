/* Calcola min/km reali da Aci Catena per ogni candidato Overture, con OSRM
   (le coordinate le abbiamo gia' da Overture, niente geocoding Nominatim).
   Stessa etichetta/rispetto rate-limit di tempi.js: 1 richiesta al secondo. */
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

async function percorso(a, b) {
  const url = 'https://router.project-osrm.org/route/v1/driving/'
    + a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=false';
  for (let t = 0; t < 3; t++) {
    try {
      const j = JSON.parse(await get(url));
      if (j.code === 'Ok') return { km: j.routes[0].distance / 1000, min: j.routes[0].duration / 60 };
    } catch (e) { await sleep(4000); }
  }
  return null;
}

(async () => {
  const ACI_CATENA = { lat: 37.612, lon: 15.166 }; // gia' usato in questa pipeline in sessioni precedenti

  const cand = JSON.parse(fs.readFileSync('candidati_overture_sud.json', 'utf8'));
  console.log('da processare:', cand.length);

  let ok = 0, falliti = 0, oltreSoglia = 0;
  for (let i = 0; i < cand.length; i++) {
    const c = cand[i];
    if (!c.lat || !c.lon) { falliti++; continue; }
    const p = await percorso(ACI_CATENA, { lat: c.lat, lon: c.lon });
    await sleep(1100);
    if (!p) { falliti++; continue; }
    c.min = Math.round(p.min);
    c.km = +p.km.toFixed(1);
    if (c.min > 75) oltreSoglia++; else ok++;
    if (i % 100 === 0) console.log(i + '/' + cand.length + '...  ok:' + ok + ' falliti:' + falliti + ' oltre75min:' + oltreSoglia);
  }

  fs.writeFileSync('candidati_overture_sud.json', JSON.stringify(cand, null, 1), 'utf8');
  console.log('\nFATTO. ok:', ok, 'falliti:', falliti, 'oltre 75 min (verranno scartati dopo):', oltreSoglia);
})();
