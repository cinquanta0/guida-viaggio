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
  const url = 'https://router.project-osrm.org/route/v1/driving/' + a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=false';
  for (let t = 0; t < 3; t++) {
    try {
      const j = JSON.parse(await get(url));
      if (j.code === 'Ok') return { km: j.routes[0].distance / 1000, min: j.routes[0].duration / 60 };
    } catch (e) { await sleep(4000); }
  }
  return null;
}

const orig = require('./lotto_generici_vicini.json');
const lotto = require('./lotto_finale_manuale.json');

function trova(nome) {
  return orig.find(o => o.n === nome) ||
    orig.find(o => o.n.toLowerCase().includes(nome.toLowerCase().split(' ')[0].toLowerCase()));
}

(async () => {
  const ACI_CATENA = { lat: 37.612, lon: 15.166 };
  const out = [];
  const nonTrovati = [];
  for (const c of lotto) {
    const o = trova(c.origNome);
    if (!o) { nonTrovati.push(c.origNome); continue; }
    const p = await percorso(ACI_CATENA, { lat: o.lat, lon: o.lon });
    await sleep(1100);
    if (!p) { nonTrovati.push(c.origNome + ' (percorso fallito)'); continue; }
    out.push({
      nome: o.n, zona: c.zonaCorretta || o.z, tag: c.tag,
      indirizzo: o.a, min: Math.round(p.min), km: +p.km.toFixed(1)
    });
    console.log(String(Math.round(p.min) + ' min').padStart(8), o.n, '|', c.zonaCorretta || o.z, '|', c.tag);
  }
  fs.writeFileSync('lotto_finale_pronto.json', JSON.stringify(out, null, 1));
  console.log('\npronti:', out.length, '| non trovati:', nonTrovati.length);
  if (nonTrovati.length) nonTrovati.forEach(n => console.log('  -', n));
})();
