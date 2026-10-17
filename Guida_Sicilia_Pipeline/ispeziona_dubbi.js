/* Mostra per esteso i POI sospetti, con tutti i tag, per decidere a mano.

   Serve perche' il confronto automatico fra insegne ha sbagliato in due modi
   opposti: ha detto 1.00 per "Angio', macelleria di mare" contro "Trattoria
   Il Mare" (parola in comune: mare) e 0.00 per "U Sulicce'nti" contro
   "Antica Osteria U Suliccenti", che e' lo stesso locale scritto senza
   apostrofo. Nessuna soglia salva da tutti e due i casi: qui guardo
   indirizzo e tipo e decido io.

   Uso: node ispeziona_dubbi.js  */

const https = require('https');

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* cosa cercare, comune per comune: sottostringa nel nome (case insensitive) */
/* Secondo giro (22 ago): i due nomi usciti dalla classifica 50 Top Italy
   delle trattorie, piu' un altro tentativo sui tre che restavano fuori. */
const DUBBI = [
  { com: 'Ragusa',       cerca: 'banchi' },
  { com: 'Raccuja',      cerca: 'borrello' },
  { com: 'Raccuja',      cerca: 'maiale' },
  { com: 'Castelbuono',  cerca: 'palazz' },
  { com: 'Trecastagni',  cerca: 'nicosia' },
  { com: 'Trecastagni',  cerca: 'osteria' }
];

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

/* Overpass sa filtrare per nome da solo: ~ e' la regex, "i" il case-insensitive.
   Cosi' non scarico mille esercizi per cercarne uno. */
async function cerca(comune, frammento) {
  const q = '[out:json][timeout:120];'
    + 'area["name"="' + comune + '"]["boundary"="administrative"]->.a;'
    + '(nwr(area.a)["name"~"' + frammento + '",i];);out center tags;';
  for (let a = 0; a < 3; a++) {
    try {
      const j = JSON.parse(await get('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q)));
      return j.elements || [];
    } catch (e) { await sleep(10000); }
  }
  return null;
}

(async () => {
  for (const d of DUBBI) {
    const el = await cerca(d.com, d.cerca);
    console.log('\n===== ' + d.com + '  /  "' + d.cerca + '"');
    if (el === null) { console.log('  Overpass non ha risposto'); await sleep(4000); continue; }
    if (!el.length) { console.log('  nessun risultato'); await sleep(4000); continue; }
    for (const x of el.slice(0, 8)) {
      const t = x.tags || {};
      const via = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
      console.log('  - ' + (t.name || '(senza nome)'));
      console.log('      tipo: ' + (t.amenity || t.shop || t.craft || t.tourism || '?')
        + (t.cuisine ? '  cucina: ' + t.cuisine : ''));
      if (via) console.log('      via:  ' + via + (t['addr:city'] ? ', ' + t['addr:city'] : ''));
      const lat = x.lat || (x.center && x.center.lat), lon = x.lon || (x.center && x.center.lon);
      console.log('      dove: ' + (lat ? lat.toFixed(5) + ', ' + lon.toFixed(5) : '?'));
    }
    await sleep(4000);
  }
})();
