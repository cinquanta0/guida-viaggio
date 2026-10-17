const fs = require('fs');

const CENTRO = { lat: 37.60257, lon: 15.14196 }; // Aci Catena
const RAGGIO_M = 65000;

async function overpass(query) {
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
  if (!res.ok) throw new Error('Overpass HTTP ' + res.status + ': ' + (await res.text()).slice(0, 300));
  return res.json();
}

function distanzaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function main() {
  const q = `
[out:json][timeout:120];
relation["boundary"="administrative"]["admin_level"="8"](around:${RAGGIO_M},${CENTRO.lat},${CENTRO.lon});
out center tags;
`;
  const json = await overpass(q);
  const comuni = json.elements
    .filter(el => el.tags && el.tags.name && el.center)
    .map(el => ({
      nome: el.tags.name,
      lat: el.center.lat,
      lon: el.center.lon,
      km: Math.round(distanzaKm(CENTRO.lat, CENTRO.lon, el.center.lat, el.center.lon) * 10) / 10,
    }))
    .sort((a, b) => a.km - b.km);

  console.log(`Comuni trovati entro ${RAGGIO_M/1000} km: ${comuni.length}`);
  comuni.forEach(c => console.log(c.km.toString().padStart(6), 'km ', c.nome));

  fs.writeFileSync('osm_comuni_vicini.json', JSON.stringify(comuni, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
