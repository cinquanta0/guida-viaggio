// Ricalcola il tempo reale da Aci Catena per ogni posto del campione,
// e confronta con quello scritto nel sito. Stesso metodo (Nominatim + OSRM)
// gia' usato nella pipeline, qui solo in lettura: non tocca dati.js.
const fs = require('fs');
const campione = require('./campione_qualita.json');

const UA = 'SiciliaGuidaViaggio/1.0 (controllo qualita non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function get(url) {
  return new Promise((res, rej) => {
    const req = require('https').get(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'it' } }, r => {
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
      if (j.code === 'Ok') return Math.round(j.routes[0].duration / 60);
    } catch (e) { await sleep(5000); }
  }
  return null;
}

(async () => {
  const p0 = await geo('Aci Catena, Catania, Sicilia');
  const partenza = { lat: +p0.lat, lon: +p0.lon };
  await sleep(1200);

  const risultati = [];
  for (const p of campione) {
    const q = p.a ? (p.a + ', ' + p.z + ', Sicilia') : (p.n + ', ' + p.z + ', Sicilia');
    const g = await geo(q);
    await sleep(1200);
    if (!g) {
      risultati.push({ ...p, ricalcolato: null, scarto: null, nota: 'indirizzo non geocodificato' });
      console.log('NO-GEO  ', p.n);
      continue;
    }
    const min = await percorso(partenza, { lat: +g.lat, lon: +g.lon });
    await sleep(1200);
    if (min == null) {
      risultati.push({ ...p, ricalcolato: null, scarto: null, nota: 'percorso OSRM fallito' });
      console.log('NO-ROUTE', p.n);
      continue;
    }
    const scarto = min - p.min;
    risultati.push({ ...p, ricalcolato: min, scarto });
    console.log((Math.abs(scarto) > 4 ? 'SCARTO!!' : '  ok    '), p.n.padEnd(45), 'sito:', String(p.min).padStart(4), ' ricalcolato:', String(min).padStart(4), ' scarto:', scarto);
  }

  fs.writeFileSync('campione_tempi_risultato.json', JSON.stringify(risultati, null, 2));
  console.log('\nFatto.');
})();
