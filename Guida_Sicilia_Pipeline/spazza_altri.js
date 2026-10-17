/* Stessa logica di spazza_cibo.js, ma per mare / vedere / spesa — che
   NON funzionano come il cibo. Una spiaggia e' spesso una destinazione
   sola, non "una scelta fra tante trattorie": qui il filtro e' piu'
   severo, e ci si aspetta (a ragione, un audit precedente l'aveva gia'
   mostrato) che i risultati nuovi siano molto meno che per il cibo.

   Query e tipi ammessi diversi per categoria:
   - mare: solo luoghi che Google tagga come spiaggia/parco acquatico/
     riserva naturale — non hotel, non ristoranti sul mare (quelli sono
     gia' "pesce" o "vista mare", categoria diversa)
   - vedere: monumenti, musei, luoghi di culto, siti storici
   - spesa: negozi, mercati — esclusi supermercati di catena

   Uso: node spazza_altri.js               (tutte le zone)
        node spazza_altri.js --tipo=mare   (solo un tag)  */

const https = require('https');
const fs = require('fs');
const API_KEY = require('./chiave_google.js');
const P = require('./dati.js');

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const VOTO_MIN = 4.3, RECENSIONI_MIN = 40; // spiagge/monumenti hanno spesso meno recensioni delle trattorie

const CONFIG = {
  mare: {
    query: 'spiaggia',
    ammessi: ['beach', 'natural_feature', 'national_park', 'water_park', 'marina'],
    escludi_nome: /hotel|resort|villaggio turistico|camping|residence/i
  },
  vedere: {
    query: 'monumenti musei chiese da vedere',
    ammessi: ['tourist_attraction', 'museum', 'church', 'historical_landmark', 'monument',
      'castle', 'archaeological_site', 'art_gallery', 'place_of_worship', 'hindu_temple',
      'cultural_center', 'observation_deck', 'plaza', 'park'],
    escludi_nome: /scuola|school|ufficio|comune di|municipio/i
  },
  spesa: {
    query: 'negozi tipici souvenir mercato',
    ammessi: ['store', 'gift_shop', 'shopping_mall', 'clothing_store', 'market',
      'liquor_store', 'jewelry_store', 'home_goods_store', 'craft_store'],
    escludi_nome: /supermercato|conad|carrefour|lidl|eurospin|md discount|penny/i
  }
};

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

/* comune vero dal campo strutturato "locality", non dalla sottostringa
   dentro formattedAddress — vedi la nota in spazza_cibo.js sul bug di
   "Militello" scattato uguale per due comuni diversi. */
function comuneDi(p) {
  const c = (p.addressComponents || []).find(x => (x.types || []).includes('locality'));
  return c ? c.longText : '';
}

async function cercaPagine(query, comune, centro, maxPagine) {
  const headers = { 'X-Goog-Api-Key': API_KEY, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location,places.types,places.addressComponents' };
  const bodyBase = { textQuery: query + ', ' + comune + ', Sicilia', languageCode: 'it', regionCode: 'IT', rankPreference: 'RELEVANCE', pageSize: 20 };
  if (centro) bodyBase.locationBias = { circle: { center: { latitude: centro.lat, longitude: centro.lon }, radius: 8000 } };
  const tutti = []; let pageToken = null;
  for (let p = 0; p < (maxPagine || 2); p++) {
    const body = Object.assign({}, bodyBase);
    if (pageToken) body.pageToken = pageToken;
    let j;
    try { j = await postJson('https://places.googleapis.com/v1/places:searchText', body, headers); } catch (e) { break; }
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
  const argTipo = process.argv.find(a => a.startsWith('--tipo='));
  const soloTipi = argTipo ? [argTipo.split('=')[1]] : Object.keys(CONFIG);

  const zoneMap = {};
  P.forEach(p => { const base = p.z.split(/[—,]/)[0].trim(); (zoneMap[base] = zoneMap[base] || []).push(p); });
  const zone = Object.keys(zoneMap).map(z => ({ z, min: Math.min(...zoneMap[z].map(p => p.min)), gia: zoneMap[z] }))
    .filter(zz => zz.min < 300).sort((x, y) => x.min - y.min);

  console.log('zone: ' + zone.length + '  |  tipi: ' + soloTipi.join(', ') + '\n');

  const risultati = [];
  let chiamate = 0;
  const iniziato = Date.now();

  for (let zi = 0; zi < zone.length; zi++) {
    const zz = zone[zi];
    const centro = await geocodificaComune(zz.z);
    for (const tipo of soloTipi) {
      const cfg = CONFIG[tipo];
      const giaCount = zz.gia.filter(p => (p.t || '').split(/\s+/).includes(tipo)).length;
      if (giaCount >= 8) continue;

      const maxPagine = zz.min <= 60 ? 2 : 1;
      let posti = [];
      try { posti = await cercaPagine(cfg.query, zz.z, centro, maxPagine); chiamate++; }
      catch (e) { console.log(zz.z + '/' + tipo + ': ERRORE ' + e.message); continue; }
      await sleep(350);

      const buoni = posti.filter(p => {
        const nome = (p.displayName && p.displayName.text) || '';
        const tipiP = p.types || [];
        if (!tipiP.some(t => cfg.ammessi.includes(t))) return false;
        if (cfg.escludi_nome.test(nome)) return false;
        if ((p.rating || 0) < VOTO_MIN || (p.userRatingCount || 0) < RECENSIONI_MIN) return false;
        if (giaPresente(nome)) return false;
        if (normalizza(comuneDi(p)) !== normalizza(zz.z)) return false;
        return true;
      });

      buoni.sort((x, y) => (y.userRatingCount || 0) - (x.userRatingCount || 0));
      for (const p of buoni) {
        risultati.push({ zona: zz.z, tipo, nome: p.displayName.text, voto: p.rating, recensioni: p.userRatingCount,
          indirizzo: p.formattedAddress, lat: p.location.latitude, lon: p.location.longitude, tipiGoogle: p.types || [] });
      }
    }
    const trascorsi = ((Date.now() - iniziato) / 1000).toFixed(0);
    console.log('[' + (zi + 1) + '/' + zone.length + '] ' + zz.z.padEnd(24) + ' fatto  (chiamate: ' + chiamate + ', ' + trascorsi + 's)');
    fs.writeFileSync('spazza_altri_risultati.json', JSON.stringify(risultati, null, 1), 'utf8');
  }

  console.log('\n' + chiamate + ' chiamate, ' + risultati.length + ' candidati sopra soglia');
})();
