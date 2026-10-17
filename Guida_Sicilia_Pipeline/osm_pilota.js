// Pilota: verifica candidati OSM (Nominatim + Overpass, gratuiti) per UN comune,
// da confrontare con dati.js esistente. Solo lettura/scrittura JSON, non tocca dati.js.

const fs = require('fs');

const COMUNE = process.argv[2] || 'Zafferana Etnea';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function nominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'guida-sicilia-personale/1.0 (uso privato, no scopo commerciale)' } });
  const j = await res.json();
  await sleep(1100); // rispetto limite 1 req/sec
  return j[0];
}

async function overpass(query) {
  const url = 'https://overpass-api.de/api/interpreter';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
      'User-Agent': 'guida-sicilia-personale/1.0 (uso privato)',
    },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
  return res.json();
}

const TAGS = [
  ['amenity', 'restaurant'],
  ['amenity', 'fast_food'],
  ['amenity', 'cafe'],
  ['shop', 'bakery'],
  ['shop', 'pastry'],
  ['shop', 'supermarket'],
  ['shop', 'convenience'],
  ['shop', 'gift'],
  ['tourism', 'attraction'],
  ['historic', '~"."'], // qualsiasi valore
  ['natural', 'beach'],
  ['leisure', 'beach_resort'],
];

async function main() {
  console.log(`--- Geocoding "${COMUNE}" ---`);
  const luogo = await nominatim(`${COMUNE}, Sicilia, Italia`);
  if (!luogo) { console.log('Non trovato su Nominatim.'); return; }
  console.log(`Trovato: ${luogo.display_name} (${luogo.lat}, ${luogo.lon})`);

  console.log(`--- Query Overpass su area amministrativa "${COMUNE}" ---`);
  const filtri = TAGS.map(([k, v]) => `  nwr["${k}"${v.startsWith('~') ? v : `="${v}"`}](area.a);`).join('\n');
  const q = `
[out:json][timeout:60];
area["name"="${COMUNE}"]["boundary"="administrative"]->.a;
(
${filtri}
);
out center tags;
`;

  let json;
  try {
    json = await overpass(q);
  } catch (e) {
    console.log('Errore Overpass, riprovo tra 5s:', e.message);
    await sleep(5000);
    json = await overpass(q);
  }

  const elementi = json.elements || [];
  console.log(`Elementi grezzi trovati: ${elementi.length}`);

  const risultati = elementi
    .filter(el => el.tags && el.tags.name) // scarto elementi senza nome
    .map(el => ({
      nome: el.tags.name,
      lat: el.lat || (el.center && el.center.lat),
      lon: el.lon || (el.center && el.center.lon),
      tipo: Object.entries(el.tags).filter(([k]) => ['amenity','shop','tourism','historic','natural','leisure'].includes(k)).map(([k,v])=>`${k}=${v}`).join(','),
      indirizzo: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber']||''}`.trim() : null,
    }));

  // dedup per nome (case-insensitive, spazi normalizzati)
  const visti = new Map();
  for (const r of risultati) {
    const chiave = r.nome.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!visti.has(chiave)) visti.set(chiave, r);
  }
  const unici = [...visti.values()];

  console.log(`Dopo dedup per nome: ${unici.length}`);

  fs.writeFileSync(`osm_pilota_${COMUNE.replace(/\s+/g,'_')}.json`, JSON.stringify(unici, null, 2));
  console.log(`Salvato in osm_pilota_${COMUNE.replace(/\s+/g,'_')}.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
