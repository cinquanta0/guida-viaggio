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

function normalizza(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['‘’`]/g, '').replace(/[^a-z0-9]/g, '');
}

const orig = require('./lotto_taormina_catania.json');
const lotto = require('./lotto_taormina_catania_tag.json');

function trova(nome) {
  const n = normalizza(nome);
  let o = orig.find(x => normalizza(x.n) === n);
  if (o) return o;
  o = orig.find(x => normalizza(x.n).includes(n) || n.includes(normalizza(x.n)));
  if (o) return o;
  const primaParola = nome.split(' ')[0];
  return orig.find(x => x.n.toLowerCase().includes(primaParola.toLowerCase()));
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
    out.push({ nome: o.n, zona: o.z, tag: c.tag, indirizzo: o.a, min: Math.round(p.min), km: +p.km.toFixed(1) });
    console.log(String(Math.round(p.min) + ' min').padStart(8), o.n, '|', o.z, '|', c.tag);
  }
  fs.writeFileSync('lotto_taormina_catania_pronto.json', JSON.stringify(out, null, 1));
  console.log('\npronti:', out.length, '| non trovati:', nonTrovati.length);
  nonTrovati.forEach(n => console.log('  -', n));
})();
