/* Copre in un colpo solo tutti i buchi di gap_completo.json usando la
   Google Places API. Un comune viene geocodificato una sola volta anche
   se ha piu' buchi (Nominatim, gratis, per il centro della ricerca);
   ogni coppia zona+tipo e' una chiamata a Places.

   Filtra subito il rumore (voto basso o pochissime recensioni) e toglie
   quello che nella guida c'e' gia' (per nome, tollerante ad accenti e
   maiuscole). Il risultato NON entra da solo in dati.js: scrive un
   riepilogo leggibile e un JSON per zona, la scelta di cosa aggiungere e
   le descrizioni restano a mano.

   Uso: node cerca_bulk.js  */

const https = require('https');
const fs = require('fs');
const API_KEY = require('./chiave_google.js');
const gap = require('./gap_completo.json');
const P = require('./dati.js');

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const VOTO_MIN = 4.3;
const RECENSIONI_MIN = 60;

const QUERY_PER_TIPO = {
  carne: 'ristorante carne braceria',
  pesce: 'ristorante pesce',
  pasta: 'trattoria',
  pizza: 'pizzeria',
  dolci: 'pasticceria gelateria',
  street: 'street food rosticceria arancini friggitoria'
};

const normalizza = s => String(s || '').toLowerCase()
  .replace(/[àáâã]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
  .replace(/[òóôõ]/g, 'o').replace(/[ùúûü]/g, 'u')
  .replace(/['’]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

const nomiEsistenti = new Set(P.map(p => normalizza(p.n)));
function giaPresente(nome) {
  const n = normalizza(nome);
  for (const e of nomiEsistenti) if (e === n || e.includes(n) || n.includes(e)) return true;
  return false;
}

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

function postJson(url, body, headers) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }, headers)
    }, r => {
      let s = ''; r.on('data', d => s += d);
      r.on('end', () => {
        if (r.statusCode !== 200) return reject(new Error('HTTP ' + r.statusCode + ': ' + s));
        resolve(JSON.parse(s));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const cacheGeo = {};
async function geocodificaComune(nome) {
  if (cacheGeo[nome]) return cacheGeo[nome];
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q='
    + encodeURIComponent(nome + ', Sicilia, Italia');
  const j = JSON.parse(await get(url));
  await sleep(1100);
  const r = j.length ? { lat: +j[0].lat, lon: +j[0].lon } : null;
  cacheGeo[nome] = r;
  return r;
}

/* Questo script resta apposta a UNA pagina (20 risultati): il suo lavoro
   e' riempire zone che hanno ZERO posti di un tipo, quindi basta trovarne
   uno buono, non tutti quelli che esistono. Per un giro a fondo su una
   zona che conta (tipo "carne ad Acireale", dove Acireale aveva gia'
   qualcosa e serviva scovare il meglio fra tanti candidati) usare invece
   cerca_places.js, che dal 22 ago 2026 pagina fino a 60 risultati —
   scoperto necessario quando l'utente ha trovato a mano, scorrendo Google
   fino a pagina 4, tre locali buoni che una singola pagina non mostrava. */
async function cercaPlaces(query, comune, centro) {
  const body = {
    textQuery: query + ', ' + comune + ', Sicilia',
    languageCode: 'it', regionCode: 'IT', rankPreference: 'RELEVANCE', pageSize: 20
  };
  if (centro) body.locationBias = { circle: { center: { latitude: centro.lat, longitude: centro.lon }, radius: 6000 } };
  const j = await postJson('https://places.googleapis.com/v1/places:searchText', body, {
    'X-Goog-Api-Key': API_KEY,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,'
      + 'places.userRatingCount,places.location,places.types,places.googleMapsUri'
  });
  return j.places || [];
}

(async () => {
  fs.mkdirSync('places_cache', { recursive: true });
  const tuttiIBuoni = [];
  let chiamate = 0;

  for (const g of gap) {
    const centro = await geocodificaComune(g.z);
    let posti = [];
    try {
      posti = await cercaPlaces(QUERY_PER_TIPO[g.t], g.z, centro);
      chiamate++;
    } catch (e) {
      console.log(g.z + ' / ' + g.t + ': ERRORE ' + e.message);
      await sleep(400);
      continue;
    }
    await sleep(400);

    /* locationBias e' un suggerimento per Google, non un vincolo rigido:
       ha proposto per Palazzolo Acreide un locale il cui indirizzo diceva
       chiaramente "Siracusa", 40 km piu' in la'. Scartato dopo, con lo
       stesso controllo di plausibilita' che aveva scoperto il bug di
       Portopalo — qui lo anticipo filtrando chi non menziona il comune
       cercato nel proprio indirizzo. */
    const buoni = posti.filter(p =>
      (p.rating || 0) >= VOTO_MIN
      && (p.userRatingCount || 0) >= RECENSIONI_MIN
      && !giaPresente((p.displayName && p.displayName.text) || '')
      && normalizza(p.formattedAddress || '').includes(normalizza(g.z))
    );

    if (buoni.length) {
      console.log('\n=== ' + g.z + ' / ' + g.t + '  (' + posti.length + ' trovati, ' + buoni.length + ' passano il filtro)');
      buoni.sort((a, b) => (b.userRatingCount || 0) - (a.userRatingCount || 0));
      buoni.slice(0, 6).forEach(p => {
        const nome = (p.displayName && p.displayName.text) || '?';
        console.log('  ' + p.rating + ' su ' + p.userRatingCount + '  ' + nome + '  —  ' + (p.formattedAddress || ''));
        tuttiIBuoni.push({ zona: g.z, tipo: g.t, nome, voto: p.rating, recensioni: p.userRatingCount,
          indirizzo: p.formattedAddress, lat: p.location.latitude, lon: p.location.longitude,
          tipiGoogle: p.types || [] });
      });
    } else {
      console.log(g.z + ' / ' + g.t + ': nessun candidato sopra soglia (' + posti.length + ' trovati in tutto)');
    }
  }

  fs.writeFileSync('places_cache/riepilogo_completo.json', JSON.stringify(tuttiIBuoni, null, 1), 'utf8');
  console.log('\n\n' + chiamate + ' chiamate fatte, ' + tuttiIBuoni.length
    + ' candidati sopra soglia (voto >= ' + VOTO_MIN + ', recensioni >= ' + RECENSIONI_MIN + ')');
  console.log('tutto salvato in places_cache/riepilogo_completo.json');
})();
