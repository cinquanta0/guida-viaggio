/* Cerca su OpenStreetMap i posti dove si mangia carne ad Aci Catena e
   Acireale, che nella guida mancavano del tutto.

   Perche' da OSM e non da una guida: per queste due zone guide gastronomiche
   non ce ne sono. Cercando escono solo TheFork, PagineGialle e TripAdvisor,
   cioe' proprio le fonti che questo sito esclude. Scelta dell'utente: meglio
   un elenco di quello che c'e' davvero, **dichiarando che nessuno l'ha
   segnalato**, che nessuna informazione o un giudizio preso da un
   aggregatore.

   Quindi queste schede NON avranno il tag "Ci vanno i siciliani" e diranno
   nel testo da dove vengono.

   Cerca due cose:
   - i locali con cuisine da carne (barbecue, grill, steak_house, meat)
   - i locali il cui nome parla di carne (braceria, brace, carne, macelleria)

   Uso: node cerca_carne.js  */

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
    req.setTimeout(120000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

async function overpass(q) {
  for (let a = 0; a < 4; a++) {
    try {
      const j = JSON.parse(await get('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q)));
      if (j.elements) return j.elements;
    } catch (e) { console.log('   (ritento: ' + e.message + ')'); await sleep(15000); }
  }
  return null;
}

const COMUNI = ['Aci Catena', 'Acireale'];

(async () => {
  const trovati = {};

  for (const com of COMUNI) {
    const q = '[out:json][timeout:120];'
      + 'area["name"="' + com + '"]["boundary"="administrative"]->.a;'
      + '('
      + 'nwr(area.a)["amenity"~"restaurant|fast_food"]["cuisine"~"barbecue|grill|steak|meat",i];'
      + 'nwr(area.a)["amenity"~"restaurant|fast_food"]["name"~"brace|carne|macelleria|grill|steak",i];'
      + 'nwr(area.a)["shop"="butcher"];'
      + ');out center tags;';

    console.log('\n===== ' + com);
    const el = await overpass(q);
    await sleep(5000);
    if (el === null) { console.log('  Overpass non ha risposto'); continue; }
    if (!el.length) { console.log('  nessun risultato'); continue; }

    for (const x of el) {
      const t = x.tags || {};
      const lat = x.lat || (x.center && x.center.lat);
      const lon = x.lon || (x.center && x.center.lon);
      const via = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
      console.log('  - ' + (t.name || '(senza nome)'));
      console.log('      cosa:  ' + (t.amenity || t.shop || '?')
        + (t.cuisine ? '   cucina: ' + t.cuisine : ''));
      if (via) console.log('      via:   ' + via);
      if (t.phone || t['contact:phone']) console.log('      tel:   ' + (t.phone || t['contact:phone']));
      console.log('      dove:  ' + (lat ? lat.toFixed(5) + ', ' + lon.toFixed(5) : '?'));
      if (t.name && lat) {
        trovati[com] = trovati[com] || [];
        trovati[com].push({
          nome: t.name, tipo: t.amenity || t.shop, cucina: t.cuisine || '',
          via, tel: t.phone || t['contact:phone'] || '', lat, lon
        });
      }
    }
  }

  fs.writeFileSync('carne_osm.json', JSON.stringify(trovati, null, 1));
  const n = Object.values(trovati).reduce((a, b) => a + b.length, 0);
  console.log('\nsalvati ' + n + ' locali in carne_osm.json');
})();
