// Verifica rigorosa (sola lettura) del secondo campione di controllo qualita'.
// A differenza di verifica_campione_tempi.js (che usava un geocoding naive
// senza controllo comune ed ha causato un falso positivo su "Touche Beefstro"),
// qui uso la stessa pipeline geoConComune con guardia inSicilia() usata per
// gli inserimenti veri, cosi' i risultati sono confrontabili direttamente.
const fs = require('fs');
const campione = require('./campione_qualita.json');

const UA = 'SiciliaGuidaViaggio/1.0 (controllo qualita non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function get(url) {
  return new Promise((res, rej) => {
    const req = require('https').get(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'it' } }, r => {
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      let s = ''; r.on('data', d => s += d); r.on('end', () => res(s));
    });
    req.setTimeout(45000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

const normalizza = s => String(s || '').toLowerCase()
  .replace(/[àáâã]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
  .replace(/[òóôõ]/g, 'o').replace(/[ùúûü]/g, 'u')
  .replace(/['’]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const comuneDi = x => (x.address && (x.address.city || x.address.town || x.address.village)) || '';
function comuneNelDisplayName(x, target) {
  if (!x.display_name) return false;
  const escludi = new Set([normalizza(x.address && x.address.county), normalizza(x.address && x.address.state), normalizza(x.address && x.address.postcode), normalizza(x.address && x.address.country)]);
  return x.display_name.split(',').map(s => normalizza(s)).some(seg => seg === target && !escludi.has(seg));
}
const inSicilia = x => normalizza(x.address && x.address.state) === 'sicilia';
async function geoConComune(q, comune) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=it&q=' + encodeURIComponent(q);
  const target = normalizza(comune);
  for (let a = 0; a < 3; a++) {
    try {
      const j = JSON.parse(await get(url));
      if (!j.length) return { risultati: [] };
      const giusto = j.find(x => inSicilia(x) && (normalizza(comuneDi(x)) === target || comuneNelDisplayName(x, target)));
      return { risultati: j, scelto: giusto || null };
    } catch (e) { await sleep(6000); }
  }
  return { risultati: [] };
}
async function percorso(a, b) {
  const url = 'https://router.project-osrm.org/route/v1/driving/' + a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=false';
  for (let t = 0; t < 3; t++) {
    try { const j = JSON.parse(await get(url)); if (j.code === 'Ok') return { km: j.routes[0].distance / 1000, min: j.routes[0].duration / 60 }; }
    catch (e) { await sleep(5000); }
  }
  return null;
}

// Il campo z (zona) sul sito non e' sempre il nome esatto del comune
// amministrativo (es. "Catania — Via Plebiscito", "Ortigia, Siracusa",
// "Sotto Acireale"). Estraggo una stima ragionevole del comune da usare
// come target per il controllo geoConComune.
function comuneDaZona(z) {
  let s = z.split('—')[0].split(',')[0].trim();
  s = s.replace(/^(Sotto|Frazioni di|Verso)\s+/i, '');
  return s;
}

(async () => {
  const p0Res = await geoConComune('Aci Catena, Catania, Sicilia', 'Aci Catena');
  const p0 = p0Res.scelto || p0Res.risultati[0];
  const partenza = { lat: +p0.lat, lon: +p0.lon };
  await sleep(1200);

  const risultati = [];
  for (const p of campione) {
    const comune = comuneDaZona(p.z);
    const query = p.a ? (p.a + ', ' + comune + ', Sicilia') : (p.n + ', ' + comune + ', Sicilia');
    let r = await geoConComune(query, comune);
    await sleep(1200);
    let g = r.scelto;
    let notaComune = '';
    if (!g) {
      // ritenta solo nome+comune se l'indirizzo esatto non conferma il comune
      if (p.a) {
        r = await geoConComune(p.n + ', ' + comune + ', Sicilia', comune);
        await sleep(1200);
        g = r.scelto;
      }
    }
    if (!g) {
      risultati.push({ ...p, ricalcolato: null, scarto: null, nota: 'comune "' + comune + '" non confermato dal geocoding' });
      console.log('NO-COMUNE', p.n.padEnd(45), '(' + comune + ')');
      continue;
    }
    const pr = await percorso(partenza, { lat: +g.lat, lon: +g.lon });
    await sleep(1200);
    if (!pr) { risultati.push({ ...p, ricalcolato: null, scarto: null, nota: 'percorso OSRM fallito' }); continue; }
    const min = Math.round(pr.min);
    const scarto = min - p.min;
    risultati.push({ ...p, ricalcolato: min, scarto, comuneConfermato: comuneDi(g) || '(via display_name)' });
    console.log((Math.abs(scarto) > 4 ? 'SCARTO!!' : '  ok    '), p.n.padEnd(45), 'sito:', String(p.min).padStart(4), ' ricalcolato:', String(min).padStart(4), ' scarto:', scarto);
  }

  fs.writeFileSync('campione_tempi_risultato2.json', JSON.stringify(risultati, null, 2));
  console.log('\nFatto.');
})();
