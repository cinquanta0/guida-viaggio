/* Cerca locali con la Google Places API (New) — sostituisce il giro
   manuale col browser (Chrome MCP) fatto finora per riempire i buchi sulla
   carne, sul pesce eccetera.

   Cosa fa diverso da prima:
   - Una chiamata = fino a 20 risultati gia' strutturati (nome, indirizzo,
     voto, numero di recensioni, coordinate), invece di aprire una pagina,
     aspettare, scorrere e leggere il testo.
   - Le coordinate sono quelle vere del locale secondo Google, non passano
     da un secondo servizio di geocodifica: niente piu' rischio Portopalo
     al posto di Siracusa.
   - "locationBias" centra la ricerca sul paese giusto, cosi' anche una
     query semplice ("pizzeria") non va a pescare a caso in tutta la Sicilia.

   Cosa NON fa, di proposito: non sceglie da solo cosa mettere in guida.
   Stampa i risultati con voto e recensioni, ordinati, e la scelta di
   quali aggiungere e come descriverli resta a mano — altrimenti la guida
   diventerebbe un dump di Google, che e' esattamente quello che non deve
   essere.

   Uso:
     node cerca_places.js "carne braceria" "Acireale"
     node cerca_places.js "pesce" "Aci Catena" --raggio=4000

   Scrive anche un file JSON in ./places_cache/ con la risposta grezza,
   cosi' se serve rileggerla non si spende un'altra chiamata. */

const https = require('https');
const fs = require('fs');
const API_KEY = require('./chiave_google.js');

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

async function geocodificaComune(nome) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q='
    + encodeURIComponent(nome + ', Sicilia, Italia');
  const j = JSON.parse(await get(url));
  if (!j.length) return null;
  return { lat: +j[0].lat, lon: +j[0].lon };
}

function postJson(url, body, headers) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: Object.assign({
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }, headers)
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

/* La prima versione si fermava a un pageSize:20 senza mai chiedere la
   pagina successiva: prendeva 20 risultati su un massimo di 60 e si
   fermava li'. L'utente ha scorso a mano fino a pagina 4 di Google Search
   (un servizio diverso, ma stesso principio) e ha trovato tre locali veri
   che quella prima chiamata non vedeva. Qui si chiedono fino a 3 pagine
   (60 risultati) usando il nextPageToken che Google restituisce — la
   documentazione dice di aspettare un momento prima che il token diventi
   valido, altrimenti la richiesta con quel token fallisce. */
async function cercaPlaces(query, comune, raggioMetri, maxPagine) {
  const centro = await geocodificaComune(comune);
  const headers = {
    'X-Goog-Api-Key': API_KEY,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,'
      + 'places.userRatingCount,places.location,places.types,places.googleMapsUri,places.priceLevel,nextPageToken'
  };
  /* Google e' esplicito: "Request parameters for paging requests must
     match the initial SearchText request" — locationBias va rimandato
     identico a ogni pagina, non tolto in favore del solo pageToken. Il
     primo tentativo lo toglieva e la seconda pagina falliva con un 400. */
  const bodyBase = {
    textQuery: query + ', ' + comune + ', Sicilia',
    languageCode: 'it', regionCode: 'IT', rankPreference: 'RELEVANCE', pageSize: 20
  };
  if (centro) bodyBase.locationBias = { circle: { center: { latitude: centro.lat, longitude: centro.lon }, radius: raggioMetri || 6000 } };

  const tutti = [];
  let pageToken = null;
  const pagine = maxPagine || 3;

  for (let p = 0; p < pagine; p++) {
    const body = Object.assign({}, bodyBase);
    if (pageToken) body.pageToken = pageToken;

    const j = await postJson('https://places.googleapis.com/v1/places:searchText', body, headers);
    tutti.push(...(j.places || []));
    if (!j.nextPageToken) break;
    pageToken = j.nextPageToken;
    await sleep(2200); // il token non e' valido subito
  }
  return tutti;
}

(async () => {
  const query = process.argv[2];
  const comune = process.argv[3];
  const raggioArg = process.argv.find(a => a.startsWith('--raggio='));
  const raggio = raggioArg ? +raggioArg.split('=')[1] : 6000;

  if (!query || !comune) {
    console.log('Uso: node cerca_places.js "<query>" "<comune>" [--raggio=6000]');
    console.log('Esempio: node cerca_places.js "carne braceria" "Acireale"');
    process.exit(1);
  }

  console.log('cerco: "' + query + '" vicino a ' + comune + ' (raggio ' + raggio + ' m)...\n');

  let posti;
  try {
    posti = await cercaPlaces(query, comune, raggio);
  } catch (e) {
    console.log('ERRORE: ' + e.message);
    process.exit(1);
  }

  if (!posti.length) { console.log('nessun risultato'); return; }

  posti.sort((a, b) => (b.userRatingCount || 0) - (a.userRatingCount || 0));

  fs.mkdirSync('places_cache', { recursive: true });
  const nomeFile = 'places_cache/' + comune.replace(/[^a-zA-Z0-9]/g, '_') + '_'
    + query.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
  fs.writeFileSync(nomeFile, JSON.stringify(posti, null, 1), 'utf8');

  posti.forEach((p, i) => {
    const nome = (p.displayName && p.displayName.text) || '?';
    console.log(String(i + 1).padStart(2) + '. ' + nome);
    console.log('    ' + (p.rating || '?') + ' su ' + (p.userRatingCount || 0) + ' recensioni'
      + '   ' + (p.formattedAddress || ''));
    console.log('    tipi: ' + (p.types || []).slice(0, 4).join(', '));
    console.log('    ' + p.location.latitude.toFixed(5) + ', ' + p.location.longitude.toFixed(5));
    console.log('');
  });

  console.log(posti.length + ' risultati, salvati anche in ' + nomeFile);
})();
