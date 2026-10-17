// Giro completo: per ogni comune entro 70km da Aci Catena, interroga Overpass
// per gli stessi tag del pilota. Salva un file JSON grezzo per comune in osm_raw/,
// cosi' e' ripartibile se si interrompe (salta i comuni gia' fatti).

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, 'osm_raw');
if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function overpass(query, tentativi = 3) {
  for (let i = 0; i < tentativi; i++) {
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*',
          'Accept-Encoding': 'identity',
          'User-Agent': 'guida-sicilia-personale/1.0 (uso privato)',
        },
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.log('  tentativo', i + 1, 'fallito:', e.message);
      await sleep(5000 * (i + 1));
    }
  }
  throw new Error('Overpass fallito dopo ' + tentativi + ' tentativi');
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
  ['historic', '~"."'],
  ['natural', 'beach'],
  ['leisure', 'beach_resort'],
];

function nomeFile(comune) {
  return path.join(RAW_DIR, comune.replace(/[^a-zA-Z0-9]/g, '_') + '.json');
}

async function faiComune(comune) {
  const filtri = TAGS.map(([k, v]) => `  nwr["${k}"${v.startsWith('~') ? v : `="${v}"`}](area.a);`).join('\n');
  const q = `
[out:json][timeout:90];
area["name"="${comune}"]["boundary"="administrative"]->.a;
(
${filtri}
);
out center tags;
`;
  const json = await overpass(q);
  const elementi = (json.elements || [])
    .filter(el => el.tags && el.tags.name)
    .map(el => ({
      nome: el.tags.name,
      lat: el.lat || (el.center && el.center.lat),
      lon: el.lon || (el.center && el.center.lon),
      tipo: Object.entries(el.tags).filter(([k]) => ['amenity','shop','tourism','historic','natural','leisure'].includes(k)).map(([k,v])=>`${k}=${v}`).join(','),
      indirizzo: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber']||''}`.trim() : null,
    }));
  return elementi;
}

async function main() {
  const comuni = require('./osm_comuni_vicini.json').filter(c => c.km <= 70);
  console.log('Comuni da processare:', comuni.length);

  let fatti = 0, saltati = 0, errori = 0;
  for (const c of comuni) {
    const f = nomeFile(c.nome);
    if (fs.existsSync(f)) { saltati++; continue; }
    process.stdout.write(`[${fatti + saltati + errori + 1}/${comuni.length}] ${c.nome}... `);
    try {
      const elementi = await faiComune(c.nome);
      fs.writeFileSync(f, JSON.stringify(elementi, null, 2));
      console.log(elementi.length + ' elementi');
      fatti++;
    } catch (e) {
      console.log('ERRORE: ' + e.message);
      fs.writeFileSync(f + '.errore', e.message);
      errori++;
    }
    await sleep(1800); // rispetto del server pubblico Overpass
  }
  console.log(`\nCompletato. Fatti: ${fatti}, gia' presenti: ${saltati}, errori: ${errori}`);
}

main().catch(e => { console.error(e); process.exit(1); });
