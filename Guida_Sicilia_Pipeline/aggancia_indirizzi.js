/* Aggancia per indirizzo i locali che Overpass non ha saputo confermare.

   Overpass oggi ha risposto "0 esercizi" per una dozzina di comuni di fila:
   non e' credibile, e' il servizio che mi sta limitando dopo tutte le query
   di oggi. Quindi per questi uso l'altra strada gia' usata per Vico Astemio
   e I Banchi: geocodifico l'INDIRIZZO che la fonte dichiara.

   E' piu' debole di trovare il POI, e va detto: non prova che il locale
   esista, prova che esiste quella via. Ma l'indirizzo viene da Cronache di
   Gusto, che lo pubblica con nome e telefono, e il punto sulla mappa
   corrisponde a quello che la scheda scrive. Se la via non si trova, il
   locale non entra.

   Uso: node aggancia_indirizzi.js  */

const https = require('https');
const fs = require('fs');
const candidati = require('./candidati_veri.js');

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* chiave -> come cercare l'indirizzo, quando il campo `a` da solo non basta */
const DA_INDIRIZZO = {
  terramia:        'Solicchiata, Castiglione di Sicilia, Catania',
  albagatto:       'Via Regis, Milazzo, Messina',
  terrehimera:     'Contrada Villaurea, Termini Imerese, Palermo',
  diegolina:       'Via Marsala, Guarrato, Trapani',
  forneriamessina: 'San Martino delle Scale, Monreale, Palermo',
  alritrovo:       'Viale Cristoforo Colombo, San Vito Lo Capo, Trapani'
};

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
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q='
    + encodeURIComponent(q);
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

(async () => {
  const p0 = await geo('Aci Catena, Catania, Sicilia');
  const partenza = { lat: +p0.lat, lon: +p0.lon };
  await sleep(1500);

  const out = JSON.parse(fs.readFileSync('veri_verificati.json', 'utf8'));
  const fuori = [];

  for (const [k, q] of Object.entries(DA_INDIRIZZO)) {
    if (out[k]) { console.log(k + ': gia a posto'); continue; }
    const c = candidati.find(x => x.k === k);
    const g = await geo(q);
    await sleep(1500);
    if (!g) { fuori.push(c ? c.n : k); console.log((c ? c.n : k) + ': indirizzo non trovato'); continue; }

    const pos = { lat: +g.lat, lon: +g.lon };
    const pr = await percorso(partenza, pos);
    await sleep(1500);
    if (!pr) { fuori.push(c ? c.n : k); continue; }

    out[k] = {
      km: +pr.km.toFixed(1), min: Math.round(pr.min), lat: pos.lat, lon: pos.lon,
      come: 'indirizzo dichiarato dalla fonte: ' + g.display_name.split(',').slice(0, 3).join(',')
    };
    console.log((c ? c.n : k).padEnd(26) + String(Math.round(pr.min)).padStart(4) + ' min '
      + pr.km.toFixed(0).padStart(5) + ' km   ' + g.display_name.split(',').slice(0, 2).join(','));
  }

  fs.writeFileSync('veri_verificati.json', JSON.stringify(out, null, 1));
  console.log('\nverificati in tutto: ' + Object.keys(out).length);
  if (fuori.length) { console.log('restano fuori: ' + fuori.join(', ')); }
})();
