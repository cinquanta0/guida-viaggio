/* Verifica che i candidati di candidati_veri.js esistano davvero, e calcola
   i tempi da Aci Catena con lo stesso metodo di tutti gli altri posti.

   Perche' la verifica: un nome letto su una guida non prova che il locale
   esista ancora, ne' dove sia. Qui ogni candidato deve comparire su
   OpenStreetMap come esercizio di ristorazione, altrimenti non entra.

   Tre passaggi, dal piu' preciso al piu' debole:
     1. Overpass: cerco i POI di ristorazione entro 6 km dal centro del comune
        e confronto i nomi. Se trovo l'insegna, ho le coordinate del locale.
     2. Nominatim sul nome + comune, se Overpass non basta.
     3. Se non lo trova nessuno dei due -> SCARTATO, e lo dico.
   Poi OSRM per il percorso reale in auto da Aci Catena.

   Uso: node verifica_veri.js            (scrive veri_verificati.json)  */

const https = require('https');
const fs = require('fs');
const candidati = require('./candidati_veri.js');

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function get(url, host) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'it' } }, r => {
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      let s = ''; r.on('data', d => s += d); r.on('end', () => res(s));
    });
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

/* confronto fra insegne: via accenti, apostrofi, articoli e punteggiatura.
   "L'Osteria di Cantine Nicosia" e "Osteria Cantine Nicosia" sono lo stesso posto. */
function normalizza(s) {
  return String(s || '').toLowerCase()
    .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
    .replace(/[’'`]/g, ' ').replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(il|lo|la|l|i|gli|le|di|da|del|della|dei|e|ed|al|alla|ristorante|trattoria|osteria|pasticceria|antica|antico)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function somiglia(a, b) {
  const x = normalizza(a), y = normalizza(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.9;
  const px = x.split(' '), py = y.split(' ');
  const comuni = px.filter(w => w.length > 2 && py.indexOf(w) >= 0).length;
  const denom = Math.min(px.length, py.length) || 1;
  return comuni / denom;
}

async function geocodifica(q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=it&q='
    + encodeURIComponent(q);
  for (let a = 0; a < 3; a++) {
    try {
      const j = JSON.parse(await get(url));
      if (j.length) return j;
      return null;
    } catch (e) { await sleep(5000); }
  }
  return null;
}

/* tutti i POI dove si mangia intorno a un punto */
async function overpassIntorno(lat, lon, raggio) {
  const q = '[out:json][timeout:60];('
    + 'node(around:' + raggio + ',' + lat + ',' + lon + ')["amenity"~"restaurant|cafe|fast_food|bar|pub|ice_cream"];'
    + 'way(around:' + raggio + ',' + lat + ',' + lon + ')["amenity"~"restaurant|cafe|fast_food|bar|pub|ice_cream"];'
    + 'node(around:' + raggio + ',' + lat + ',' + lon + ')["shop"~"bakery|pastry|butcher|confectionery"];'
    + 'way(around:' + raggio + ',' + lat + ',' + lon + ')["shop"~"bakery|pastry|butcher|confectionery"];'
    + ');out center tags;';
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q);
  for (let a = 0; a < 3; a++) {
    try {
      const j = JSON.parse(await get(url));
      return j.elements || [];
    } catch (e) { await sleep(8000); }
  }
  return [];
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

const pad = (s, n) => (s + '                                        ').slice(0, n || 32);

(async () => {
  const p0 = await geocodifica('Aci Catena, Catania, Sicilia');
  const partenza = { lat: +p0[0].lat, lon: +p0[0].lon };
  console.log('PARTENZA Aci Catena [' + partenza.lat.toFixed(4) + ', ' + partenza.lon.toFixed(4) + ']\n');
  await sleep(1200);

  /* il centro di ogni comune, una volta sola: i comuni si ripetono */
  const centri = {};
  const comuni = [...new Set(candidati.map(c => c.com))];
  for (const com of comuni) {
    const g = await geocodifica(com + ', Sicilia, Italia');
    await sleep(1200);
    if (g) centri[com] = { lat: +g[0].lat, lon: +g[0].lon, nome: g[0].display_name };
    console.log(pad('centro ' + com, 34) + (g ? 'ok' : 'NON TROVATO'));
  }
  console.log('');

  /* i POI di ristorazione di ogni comune, una chiamata Overpass per comune */
  const poi = {};
  for (const com of comuni) {
    if (!centri[com]) continue;
    poi[com] = await overpassIntorno(centri[com].lat, centri[com].lon, 7000);
    console.log(pad('POI ' + com, 34) + poi[com].length + ' esercizi su OSM');
    await sleep(2500);
  }
  console.log('');

  const out = {}, scartati = [], deboli = [];
  for (const c of candidati) {
    const lista = poi[c.com] || [];
    let best = null, punti = 0;
    for (const el of lista) {
      const nome = (el.tags && (el.tags.name || el.tags['name:it'])) || '';
      const s = somiglia(c.n, nome);
      if (s > punti) { punti = s; best = el; }
    }

    let pos = null, come = '';
    if (best && punti >= 0.6) {
      pos = { lat: best.lat || (best.center && best.center.lat), lon: best.lon || (best.center && best.center.lon) };
      come = 'OSM: ' + (best.tags.name || '?');
    } else {
      /* secondo tentativo: Nominatim sul nome del locale */
      const g = await geocodifica(c.n + ', ' + c.com + ', Sicilia');
      await sleep(1200);
      if (g) {
        const hit = g.find(x => somiglia(c.n, x.display_name.split(',')[0]) >= 0.6);
        if (hit) { pos = { lat: +hit.lat, lon: +hit.lon }; come = 'Nominatim: ' + hit.display_name.split(',')[0]; }
      }
    }

    if (!pos) {
      scartati.push(c.n + ' (' + c.com + ')');
      console.log(pad(c.n, 34) + 'SCARTATO — non risulta su OpenStreetMap');
      continue;
    }
    if (punti < 0.9 && come.startsWith('OSM')) deboli.push(c.n + ' -> ' + come);

    const pr = await percorso(partenza, pos);
    await sleep(1300);
    if (!pr) { scartati.push(c.n + ' (percorso fallito)'); console.log(pad(c.n, 34) + 'percorso fallito'); continue; }

    out[c.k] = {
      km: +pr.km.toFixed(1), min: Math.round(pr.min),
      lat: pos.lat, lon: pos.lon, come: come
    };
    console.log(pad(c.n, 34) + String(Math.round(pr.min)).padStart(4) + ' min ' +
      String(pr.km.toFixed(0)).padStart(5) + ' km   ' + come);
  }

  fs.writeFileSync('veri_verificati.json', JSON.stringify(out, null, 1));
  console.log('\nverificati ' + Object.keys(out).length + '/' + candidati.length);
  if (deboli.length) { console.log('\nnomi da controllare a mano (corrispondenza parziale):'); deboli.forEach(d => console.log('  ' + d)); }
  if (scartati.length) { console.log('\nSCARTATI:'); scartati.forEach(s => console.log('  ' + s)); }
})();
