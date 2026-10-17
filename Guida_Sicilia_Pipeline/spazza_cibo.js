/* Giro sistematico su TUTTE le zone (non solo quelle a zero), per tutti e
   sei i tipi di cibo, con la ricerca paginata a 60 risultati. E' la stessa
   logica usata a mano su Acireale/pesce e Acireale/carne, ma qui gira da
   sola su 92 zone perche' rivedere ogni risultato a mano come per Acireale
   non e' possibile su questa scala.

   Filtri automatici, nell'ordine:
   1. tipo Google non ammesso (negozio, macelleria, pescheria: vedi
      TIPI_NEGOZIO) — un negozio non e' un posto dove sedersi a mangiare,
      anche con voto alto
   2. voto e recensioni sopra soglia
   3. non gia' presente in dati.js (per nome)
   4. l'indirizzo trovato menziona il comune cercato — altrimenti e' un
      "Portopalo al posto di Siracusa"
   5. non piu' di TETTO per zona+tipo, per non gonfiare una zona gia' ricca

   Scrive un unico riepilogo (spazza_cibo_risultati.json) da rivedere
   PRIMA di inserire: questo script NON tocca dati.js.

   Uso: node spazza_cibo.js                    (tutte le zone, tutti i tipi)
        node spazza_cibo.js --da=20 --a=40     (solo un pezzo dell'elenco,
                                                  utile per non fare tutto
                                                  in una sessione sola)  */

const https = require('https');
const fs = require('fs');
const API_KEY = require('./chiave_google.js');
const P = require('./dati.js');

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const VOTO_MIN = 4.3;
const RECENSIONI_MIN = 60;
const TETTO_PER_ZONA_TIPO = 12; // oltre non ha senso continuare a cercare

const QUERY_PER_TIPO = {
  carne: 'ristorante carne braceria', pesce: 'ristorante pesce', pasta: 'trattoria',
  pizza: 'pizzeria', dolci: 'pasticceria gelateria',
  street: 'street food rosticceria arancini friggitoria'
};

/* tipi Google che indicano un negozio, non un ristorante */
const TIPI_NEGOZIO = new Set([
  'butcher_shop', 'seafood_market', 'grocery_store', 'supermarket', 'food_store',
  'convenience_store', 'meal_delivery', 'wholesaler', 'store',
  'wedding_venue', 'event_venue', 'banquet_hall', 'tobacco_shop', 'convention_center'
]);

/* nomi che segnalano un locale non adatto anche se Google lo tagga come
   ristorante — trovato durante il test su Aci Bonaccorsi: "Villa Verdiana |
   Location Matrimoni" passava il filtro sui tipi perche' Google non
   l'aveva marcato wedding_venue */
const NOME_SOSPETTO = /location|matrimon|eventi|tabaccheria|ricevimenti|congress|hotel\b/i;

const normalizza = s => String(s || '').toLowerCase()
  .replace(/[àáâã]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
  .replace(/[òóôõ]/g, 'o').replace(/[ùúûü]/g, 'u')
  .replace(/['’]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

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
    const req = https.request(url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }, headers) }, r => {
      let s = ''; r.on('data', d => s += d);
      r.on('end', () => { if (r.statusCode !== 200) return reject(new Error('HTTP ' + r.statusCode + ': ' + s)); resolve(JSON.parse(s)); });
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

const cacheGeo = {};
async function geocodificaComune(nome) {
  if (cacheGeo[nome]) return cacheGeo[nome];
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=' + encodeURIComponent(nome + ', Sicilia, Italia');
  let r = null;
  try { const j = JSON.parse(await get(url)); if (j.length) r = { lat: +j[0].lat, lon: +j[0].lon }; } catch (e) {}
  await sleep(1100);
  cacheGeo[nome] = r;
  return r;
}

/* il comune vero, dal campo strutturato "locality" — non dalla
   sottostringa dentro formattedAddress. "Militello" e' scattato uguale
   sia per "Militello in Val di Catania" sia per "Sant'Agata di
   Militello" (comune diverso, provincia di Messina): due schede sono
   finite nel posto sbagliato prima che questo controllo esistesse. */
function comuneDi(p) {
  const c = (p.addressComponents || []).find(x => (x.types || []).includes('locality'));
  return c ? c.longText : '';
}

async function cercaPagine(query, comune, centro, maxPagine) {
  const headers = {
    'X-Goog-Api-Key': API_KEY,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,'
      + 'places.userRatingCount,places.location,places.types,places.addressComponents'
  };
  const bodyBase = { textQuery: query + ', ' + comune + ', Sicilia', languageCode: 'it', regionCode: 'IT', rankPreference: 'RELEVANCE', pageSize: 20 };
  if (centro) bodyBase.locationBias = { circle: { center: { latitude: centro.lat, longitude: centro.lon }, radius: 6000 } };
  const tutti = []; let pageToken = null;
  for (let p = 0; p < (maxPagine || 2); p++) {
    const body = Object.assign({}, bodyBase);
    if (pageToken) body.pageToken = pageToken;
    let j;
    try { j = await postJson('https://places.googleapis.com/v1/places:searchText', body, headers); }
    catch (e) { break; }
    tutti.push(...(j.places || []));
    if (!j.nextPageToken) break;
    pageToken = j.nextPageToken;
    await sleep(2200);
  }
  return tutti;
}

const nomiEsistenti = new Set(P.map(p => normalizza(p.n)));
function giaPresente(nome) {
  const n = normalizza(nome);
  for (const e of nomiEsistenti) if (e === n || e.includes(n) || n.includes(e)) return true;
  return false;
}

(async () => {
  const argDa = process.argv.find(a => a.startsWith('--da='));
  const argA = process.argv.find(a => a.startsWith('--a='));
  const da = argDa ? +argDa.split('=')[1] : 0;
  const a = argA ? +argA.split('=')[1] : 999;

  /* la lista di zone, dalla piu' vicina alla piu' lontana, con quanti tipi
     di cibo hanno gia' */
  const TIPI = Object.keys(QUERY_PER_TIPO);
  const zoneMap = {};
  P.forEach(p => { const base = p.z.split(/[—,]/)[0].trim(); (zoneMap[base] = zoneMap[base] || []).push(p); });
  const zone = Object.keys(zoneMap)
    .map(z => ({ z, min: Math.min(...zoneMap[z].map(p => p.min)), gia: zoneMap[z] }))
    .filter(zz => zz.min < 300)
    .sort((x, y) => x.min - y.min)
    .slice(da, a);

  console.log('zone da processare: ' + zone.length + ' (indici ' + da + '-' + Math.min(a, zone.length + da) + ')\n');

  const risultati = [];
  let chiamate = 0;
  const iniziato = Date.now();

  for (let zi = 0; zi < zone.length; zi++) {
    const zz = zone[zi];
    const centro = await geocodificaComune(zz.z);
    for (const tipo of TIPI) {
      const giaCount = zz.gia.filter(p => (p.t || '').split(/\s+/).includes(tipo)).length;
      if (giaCount >= TETTO_PER_ZONA_TIPO) continue;

      const maxPagine = zz.min <= 60 ? 3 : 1; // zone vicine, guarda a fondo; lontane, una pagina basta
      let posti = [];
      try { posti = await cercaPagine(QUERY_PER_TIPO[tipo], zz.z, centro, maxPagine); chiamate++; }
      catch (e) { console.log(zz.z + '/' + tipo + ': ERRORE ' + e.message); continue; }
      await sleep(350);

      const buoni = posti.filter(p => {
        const nome = (p.displayName && p.displayName.text) || '';
        if ((p.types || []).some(t => TIPI_NEGOZIO.has(t))) return false;
        if (NOME_SOSPETTO.test(nome)) return false;
        if ((p.rating || 0) < VOTO_MIN || (p.userRatingCount || 0) < RECENSIONI_MIN) return false;
        if (giaPresente(nome)) return false;
        if (normalizza(comuneDi(p)) !== normalizza(zz.z)) return false;
        return true;
      });

      if (buoni.length) {
        buoni.sort((x, y) => (y.userRatingCount || 0) - (x.userRatingCount || 0));
        for (const p of buoni) {
          risultati.push({
            zona: zz.z, tipo, nome: p.displayName.text, voto: p.rating, recensioni: p.userRatingCount,
            indirizzo: p.formattedAddress, lat: p.location.latitude, lon: p.location.longitude,
            tipiGoogle: p.types || [], giaInZona: giaCount
          });
        }
      }
    }
    const trascorsi = ((Date.now() - iniziato) / 1000).toFixed(0);
    console.log('[' + (zi + 1) + '/' + zone.length + '] ' + zz.z.padEnd(24) + ' fatto  (chiamate finora: ' + chiamate + ', ' + trascorsi + 's)');
    fs.writeFileSync('spazza_cibo_risultati.json', JSON.stringify(risultati, null, 1), 'utf8');
  }

  console.log('\n' + chiamate + ' chiamate, ' + risultati.length + ' candidati totali sopra soglia');
  console.log('salvato in spazza_cibo_risultati.json');
})();
