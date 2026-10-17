/* I tre locali che il confronto automatico non sapeva agganciare, agganciati
   a mano dopo aver guardato i tag su OpenStreetMap (vedi ispeziona_dubbi.js).

   - Trattoria LinguaGrossa -> su OSM e' "Lingua Grossa", staccato.
   - U Sulicce'nti          -> su OSM e' "Antica Osteria U Suliccenti": stesso
                               locale, l'apostrofo spezzava la parola e il
                               punteggio veniva 0.
   - Vico Astemio           -> a Riposto OSM ha "Ristorante Pizzeria Astemio"
                               a 484 m dall'indirizzo che da' la guida (via
                               Cavour 34). Non sono sicuro che sia la stessa
                               insegna e non lo do per scontato: prendo le
                               coordinate dell'INDIRIZZO DICHIARATO dalla
                               fonte, non quelle del POI. Se sono due locali
                               diversi, il punto sulla mappa resta comunque
                               quello che la guida indica.

   Restano fuori, e non li recupero: Angio' (a Catania su OSM ci sono solo gli
   ottici Angiolucci), Agricolab (esiste, ma "al Borgo dell'Etna" e a 27 km da
   dove la fonte lo colloca: non e' detto sia lo stesso), Palazzaccio,
   l'Osteria del Maiale Nero di Raccuja e l'Osteria di Cantine Nicosia, che su
   OSM non risultano affatto.

   Uso: node aggancia_mano.js       (aggiorna veri_verificati.json)  */

const https = require('https');
const fs = require('fs');

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const AGGANCI = {
  linguagrossa: { lat: 37.84385, lon: 15.14203, come: 'OSM: Lingua Grossa (nome staccato)' },
  sulliccenti:  { lat: 36.82019, lon: 14.95234, come: 'OSM: Antica Osteria U Suliccenti' },
  vicoastemio:  { lat: 37.7310854, lon: 15.1995894, come: 'indirizzo della guida (via Cavour 34); su OSM "Ristorante Pizzeria Astemio" a 484 m' },

  /* I due usciti dalla classifica 50 Top Italy. Nessuno dei due e' mappato,
     quindi geocodifico l'indirizzo dichiarato dalla fonte. */
  ibanchi:      { lat: 36.925691, lon: 14.745270, come: 'indirizzo dichiarato: via Orfanotrofio, Ragusa Ibla (a 130 m da Cucina e Vino, stessa via)' },
  /* qui l'approssimazione e' piu' grossa e la scheda lo dice: contrada Bosco
     non esiste per Nominatim, quindi il punto e' il centro del paese. Meglio
     un tempo dichiarato approssimato che un segnaposto preciso e falso. */
  maialenero2:  { lat: 38.055261, lon: 14.909578, come: 'centro di Raccuja: contrada Bosco non risulta sulle mappe, ed e detto nella scheda' }
};

function get(url) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'it' } }, r => {
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      let s = ''; r.on('data', d => s += d); r.on('end', () => res(s));
    });
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

async function percorso(a, b) {
  const url = 'https://router.project-osrm.org/route/v1/driving/'
    + a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=false';
  for (let t = 0; t < 3; t++) {
    try {
      const j = JSON.parse(await get(url));
      if (j.code === 'Ok') return { km: j.routes[0].distance / 1000, min: j.routes[0].duration / 60 };
    } catch (e) { await sleep(5000); }
  }
  return null;
}

(async () => {
  const g = JSON.parse(await get('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q='
    + encodeURIComponent('Aci Catena, Catania, Sicilia')));
  const partenza = { lat: +g[0].lat, lon: +g[0].lon };
  await sleep(1500);

  const out = JSON.parse(fs.readFileSync('veri_verificati.json', 'utf8'));
  for (const [k, v] of Object.entries(AGGANCI)) {
    const pr = await percorso(partenza, v);
    await sleep(1500);
    if (!pr) { console.log(k + ': percorso fallito'); continue; }
    out[k] = { km: +pr.km.toFixed(1), min: Math.round(pr.min), lat: v.lat, lon: v.lon, come: v.come };
    console.log(k.padEnd(16) + String(Math.round(pr.min)).padStart(4) + ' min ' + pr.km.toFixed(0).padStart(5) + ' km');
  }
  fs.writeFileSync('veri_verificati.json', JSON.stringify(out, null, 1));
  console.log('\nverificati in tutto: ' + Object.keys(out).length);
})();
