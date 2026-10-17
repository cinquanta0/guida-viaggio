// Verifica indipendente (sola lettura) delle 6 voci inserite da un
// sub-agente che ha ecceduto il proprio mandato (doveva solo verificare
// via WebSearch, non scrivere su dati.js). Ricontrolla comune reale e
// tempo di percorrenza con la stessa pipeline rigorosa usata altrove.
const https = require('https');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaGuidaViaggio/1.0 (controllo qualita non commerciale)';

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
function comuneNelDisplayName(x, target) {
  if (!x.display_name) return false;
  const escludi = new Set([normalizza(x.address && x.address.county), normalizza(x.address && x.address.state), normalizza(x.address && x.address.postcode), normalizza(x.address && x.address.country)]);
  return x.display_name.split(',').map(s => normalizza(s)).some(seg => seg === target && !escludi.has(seg));
}
const inSicilia = x => normalizza(x.address && x.address.state) === 'sicilia';
async function geoConComune(q, comune) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=it&q=' + encodeURIComponent(q);
  const target = normalizza(comune);
  for (let a = 0; a < 3; a++) {
    try {
      const j = JSON.parse(await get(url));
      if (!j.length) return { risultati: [] };
      const giusto = j.find(x => inSicilia(x) && (normalizza(comuneDi(x)) === target || comuneNelDisplayName(x, target)));
      return { risultati: j, scelto: giusto || null };
    } catch (e) { await sleep(6000); }
  }
  return { risultati: [] };
}
async function percorso(a, b) {
  const url = 'https://router.project-osrm.org/route/v1/driving/' + a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=false';
  for (let t = 0; t < 3; t++) {
    try { const j = JSON.parse(await get(url)); if (j.code === 'Ok') return { km: j.routes[0].distance / 1000, min: j.routes[0].duration / 60 }; }
    catch (e) { await sleep(5000); }
  }
  return null;
}

const daVerificare = [
  { n: "Orazio Cordai Gelateria", com: "Acireale", ind: "Corso Umberto 34, Acireale", stMin: 8, stKm: 3.5 },
  { n: "Arancino' Pasticceria Raciti", com: "Acireale", ind: "Piazza Agostino Pennisi 27, Acireale", stMin: 6, stKm: 3.1 },
  { n: "Pasticceria Crème Caramel", com: "Aci Catena", ind: "Via Vittorio Emanuele 7, Aci Catena", stMin: 2, stKm: 0.9 },
  { n: "Antica Trattoria Reitana", com: "Aci Catena", ind: "Via Reitana 53, Aci Catena", stMin: 6, stKm: 3.4 },
  { n: "Al Borgo di Sciacca", com: "Aci Catena", ind: "Via Gesualdo Bufalino 2, Aci Catena", stMin: 7, stKm: 3.5 },
  { n: "Pizzeria Cubisia", com: "Aci Catena", ind: "Via Vittorio Emanuele 302, Aci Catena", stMin: 2, stKm: 0.9 },
];

(async () => {
  const p0Res = await geoConComune('Aci Catena, Catania, Sicilia', 'Aci Catena');
  const p0 = p0Res.scelto || p0Res.risultati[0];
  const partenza = { lat: +p0.lat, lon: +p0.lon };
  await sleep(1500);

  for (const v of daVerificare) {
    const r = await geoConComune(v.ind, v.com);
    await sleep(1500);
    if (!r.scelto) {
      console.log('COMUNE NON CONFERMATO:', v.n, '(' + v.ind + ') -> nessun match per comune "' + v.com + '"');
      if (r.risultati.length) console.log('   candidati grezzi:', r.risultati.map(x => x.display_name).join(' | '));
      continue;
    }
    const g = r.scelto;
    const pr = await percorso(partenza, { lat: +g.lat, lon: +g.lon });
    await sleep(1500);
    if (!pr) { console.log('PERCORSO FALLITO:', v.n); continue; }
    const min = Math.round(pr.min), km = +pr.km.toFixed(1);
    const scartoMin = min - v.stMin;
    console.log((Math.abs(scartoMin) > 4 ? 'SCARTO!!' : '  ok    '), v.n.padEnd(35), 'comune confermato:', comuneDi(g) || '(via display_name)', ' | sito min:', v.stMin, 'km:', v.stKm, ' -> ricalcolato min:', min, 'km:', km);
  }
})();
