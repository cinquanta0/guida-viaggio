/* Secondo giro per i candidati che il primo passaggio non ha risolto.

   Il primo giro aveva due difetti, e li correggo qui:

   1. Il confronto fra insegne accettava l'inclusione fra stringhe senza
      guardare la lunghezza: normalizza("Pasticceria G") vale "g", e
      "agricolab".includes("g") e' vero, quindi Agricolab e Angio' si erano
      presi le coordinate di una pasticceria a caso. Ora l'inclusione conta
      solo se la stringa piu' corta ha almeno 5 caratteri.

   2. "4 Archi" non trovava "Quattro Archi": i numeri vanno normalizzati in
      cifre prima di confrontare.

   E c'e' un difetto non mio: Overpass ha risposto 0 esercizi per Riposto,
   Taormina e Sinagra, che di locali ne hanno eccome. Erano timeout, non
   assenze. Qui ci riprovo con un raggio piu' largo e una pausa piu' lunga,
   e comunque stampo i 5 nomi piu' vicini per ogni candidato, cosi' la
   corrispondenza si puo' controllare a occhio invece che fidarsi.

   Uso: node recupera_veri.js          (aggiorna veri_verificati.json)  */

const https = require('https');
const fs = require('fs');
const candidati = require('./candidati_veri.js');

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* solo i candidati ancora senza coordinate, piu' i due sbagliati */
const gia = JSON.parse(fs.readFileSync('veri_verificati.json', 'utf8'));
/* Al primo passaggio qui c'erano agricolab e angio, da rifare perche' il
   confronto fra insegne li aveva agganciati al locale sbagliato. Ora sono
   stati esclusi apposta da scarta_dubbi.js e non vanno ripescati: la lista
   e' vuota, e lo script lavora solo sui candidati ancora senza coordinate. */
const DA_RIFARE = [];
DA_RIFARE.forEach(k => delete gia[k]);
/* Un candidato con `fuori` e' stato escluso dopo averlo guardato: non va
   ripescato. Senza questo controllo tornavano dentro a ogni giro, perche'
   non avere coordinate li faceva sembrare semplicemente "non ancora fatti". */
const restanti = candidati.filter(c => !gia[c.k] && !c.fuori);

function get(url) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'it' } }, r => {
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      let s = ''; r.on('data', d => s += d); r.on('end', () => res(s));
    });
    req.setTimeout(90000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

const NUM = { quattro: '4', tre: '3', due: '2', cinque: '5', sei: '6', sette: '7', otto: '8', dieci: '10' };

function normalizza(s) {
  let t = String(s || '').toLowerCase()
    .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
    .replace(/[’'`]/g, ' ').replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(il|lo|la|l|i|gli|le|di|da|del|della|dei|e|ed|al|alla|ristorante|trattoria|osteria|pasticceria|antica|antico|bar|caffe)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
  for (const p of Object.keys(NUM)) t = t.replace(new RegExp('\\b' + p + '\\b', 'g'), NUM[p]);
  return t;
}

function somiglia(a, b) {
  const x = normalizza(a), y = normalizza(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  /* l'inclusione vale solo fra stringhe di sostanza: "g" dentro "angiolucci"
     non dice niente. Cinque caratteri e' la soglia che ha retto le prove. */
  const corta = x.length < y.length ? x : y;
  if (corta.length >= 5 && (x.includes(y) || y.includes(x))) return 0.9;
  const px = x.split(' '), py = y.split(' ');
  const comuni = px.filter(w => w.length > 2 && py.indexOf(w) >= 0).length;
  return comuni / (Math.min(px.length, py.length) || 1);
}

async function geocodifica(q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=it&q='
    + encodeURIComponent(q);
  for (let a = 0; a < 3; a++) {
    try { const j = JSON.parse(await get(url)); return j.length ? j : null; }
    catch (e) { await sleep(6000); }
  }
  return null;
}

async function overpassIntorno(lat, lon, raggio) {
  const q = '[out:json][timeout:120];('
    + 'nwr(around:' + raggio + ',' + lat + ',' + lon + ')["amenity"~"restaurant|cafe|fast_food|bar|pub|ice_cream"];'
    + 'nwr(around:' + raggio + ',' + lat + ',' + lon + ')["shop"~"bakery|pastry|butcher|confectionery|deli"];'
    + ');out center tags;';
  for (let a = 0; a < 4; a++) {
    try {
      const j = JSON.parse(await get('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q)));
      if (j.elements && j.elements.length) return j.elements;
      await sleep(12000);
    } catch (e) { await sleep(12000); }
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
    } catch (e) { await sleep(5000); }
  }
  return null;
}

(async () => {
  const p0 = await geocodifica('Aci Catena, Catania, Sicilia');
  const partenza = { lat: +p0[0].lat, lon: +p0[0].lon };
  await sleep(1500);

  const out = Object.assign({}, gia);
  const ancora = [];

  for (const c of restanti) {
    const g = await geocodifica(c.com + ', Sicilia, Italia');
    await sleep(1500);
    if (!g) { ancora.push(c.n + ' (comune non geocodificato)'); continue; }
    const centro = { lat: +g[0].lat, lon: +g[0].lon };

    const lista = await overpassIntorno(centro.lat, centro.lon, 9000);
    await sleep(3000);

    const punteggi = lista.map(el => ({
      el, nome: (el.tags && (el.tags.name || el.tags['name:it'])) || '', s: 0
    })).filter(x => x.nome);
    punteggi.forEach(x => { x.s = somiglia(c.n, x.nome); });
    punteggi.sort((a, b) => b.s - a.s);

    console.log('\n== ' + c.n + '  (' + c.com + ', ' + lista.length + ' esercizi)');
    punteggi.slice(0, 5).forEach(x => console.log('     ' + x.s.toFixed(2) + '  ' + x.nome));

    let pos = null, come = '';
    if (punteggi.length && punteggi[0].s >= 0.6) {
      const b = punteggi[0].el;
      pos = { lat: b.lat || (b.center && b.center.lat), lon: b.lon || (b.center && b.center.lon) };
      come = 'OSM: ' + punteggi[0].nome;
    } else {
      const n = await geocodifica(c.n + ', ' + c.com + ', Sicilia');
      await sleep(1500);
      if (n) {
        const hit = n.find(x => somiglia(c.n, x.display_name.split(',')[0]) >= 0.6);
        if (hit) { pos = { lat: +hit.lat, lon: +hit.lon }; come = 'Nominatim: ' + hit.display_name.split(',')[0]; }
      }
    }

    if (!pos) { ancora.push(c.n + ' (' + c.com + ')'); console.log('     -> ancora niente'); continue; }

    const pr = await percorso(partenza, pos);
    await sleep(1500);
    if (!pr) { ancora.push(c.n + ' (percorso fallito)'); continue; }

    out[c.k] = { km: +pr.km.toFixed(1), min: Math.round(pr.min), lat: pos.lat, lon: pos.lon, come };
    console.log('     -> ' + Math.round(pr.min) + ' min, ' + pr.km.toFixed(0) + ' km   ' + come);
  }

  fs.writeFileSync('veri_verificati.json', JSON.stringify(out, null, 1));
  console.log('\ntotale verificati ' + Object.keys(out).length + '/' + candidati.length);
  if (ancora.length) { console.log('\nRESTANO FUORI:'); ancora.forEach(a => console.log('  ' + a)); }
})();
