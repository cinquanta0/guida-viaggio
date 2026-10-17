/* Ritenta i candidati scartati da aggiungi_setaccio.js, con due correzioni:

   1) comuneDi() guardava solo city/town/village: per molte frazioni siciliane
      (Solicchiata di Castiglione, Sarro/Fleri/Poggiofelice di Zafferana,
      Ragala di Nicolosi, Rina di Savoca, Chianchitta di Giardini-Naxos)
      Nominatim mette la frazione in "village" e NON offre nessun campo
      strutturato col comune vero — ma il comune vero compare comunque come
      segmento a se' nel display_name. Ora si accetta anche quel caso,
      escludendo pero' i segmenti che sono provincia/regione/CAP/stato (la
      stessa cautela che ha già risolto il bug Portopalo/Siracusa).

   2) Se l'indirizzo esatto non si geocodifica, si ritenta con solo
      "<nome>, <comune>" e poi col centro del comune, come già fatto per i
      paesi piccoli nelle sessioni precedenti — accettando una precisione
      minore piuttosto che scartare un posto vero.

   Uso: node recupera_setaccio.js     poi build.js && crediti.js  */

const https = require('https');
const fs = require('fs');
const tuttiCandidati = require('./candidati_setaccio.js');
const scartatiRaw = require('./scartati_setaccio.json');
const DATI = 'dati.js';

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

const normalizza = s => String(s || '').toLowerCase()
  .replace(/[àáâã]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
  .replace(/[òóôõ]/g, 'o').replace(/[ùúûü]/g, 'u')
  .replace(/['’]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

const comuneDi = x => (x.address && (x.address.city || x.address.town || x.address.village)) || '';

function comuneNelDisplayName(x, target) {
  if (!x.display_name) return false;
  const escludi = new Set([
    normalizza(x.address && x.address.county),
    normalizza(x.address && x.address.state),
    normalizza(x.address && x.address.postcode),
    normalizza(x.address && x.address.country),
  ]);
  return x.display_name.split(',').map(s => normalizza(s)).some(seg => seg === target && !escludi.has(seg));
}

/* Guardia scoperta dopo un bug reale: "Nicolosi" e' anche il nome di una via
   a Latina (Lazio). Il controllo per segmento del display_name da solo
   l'aveva accettato perche' "nicolosi" compariva come segmento non escluso.
   Senza richiedere che il risultato sia in Sicilia, un nome di paese che
   coincide con una via/localita' altrove in Italia passa il controllo e
   produce un tempo assurdo (e' successo: 543 min per Nicolosi). */
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

function fascia(min) {
  if (min === 0) return 1;
  if (min <= 20) return 2;
  if (min <= 35) return 3;
  if (min <= 60) return 4;
  if (min <= 95) return 5;
  if (min <= 140) return 6;
  return 7;
}

function conta() {
  delete require.cache[require.resolve('./' + DATI)];
  const d = require('./' + DATI);
  const c = {};
  d.forEach(p => Object.keys(p).forEach(k => { c[k] = (c[k] || 0) + 1; }));
  return { n: d.length, campi: c };
}

(async () => {
  const nomiScartati = scartatiRaw.map(s => s.split(':')[0].trim().toLowerCase());
  const candidati = tuttiCandidati.filter(v => nomiScartati.includes(v.n.toLowerCase()));
  console.log('Da ritentare:', candidati.length);

  const p0Res = await geoConComune('Aci Catena, Catania, Sicilia', 'Aci Catena');
  const p0 = p0Res.scelto || p0Res.risultati[0];
  const partenza = { lat: +p0.lat, lon: +p0.lon };
  await sleep(1500);

  const prima = conta();
  delete require.cache[require.resolve('./' + DATI)];
  const esistenti = new Set(require('./' + DATI).map(p => p.n.toLowerCase()));

  let inseriti = 0;
  const ancoraScartati = [];

  for (const v of candidati) {
    if (esistenti.has(v.n.toLowerCase())) { console.log('già presente: ' + v.n); continue; }

    let g = null;
    // tentativo 1: indirizzo completo (quello gia' provato, ora con la regola in piu' sulla frazione)
    let r = await geoConComune(v.ind, v.com);
    await sleep(1500);
    g = r.scelto;

    // tentativo 2: solo nome + comune, senza via
    if (!g) {
      r = await geoConComune(v.n + ', ' + v.com, v.com);
      await sleep(1500);
      g = r.scelto;
    }

    // tentativo 3: centro del comune (precisione minore, ma meglio di niente per paesi piccoli e compatti)
    let precisioneBassa = false;
    if (!g) {
      r = await geoConComune(v.com + ', Sicilia, Italia', v.com);
      await sleep(1500);
      g = r.scelto;
      precisioneBassa = true;
    }

    if (!g) { ancoraScartati.push(v.n + ': nessun geocoding possibile nemmeno sul centro comune (' + v.com + ')'); continue; }

    const pr = await percorso(partenza, { lat: +g.lat, lon: +g.lon });
    await sleep(1500);
    if (!pr) { ancoraScartati.push(v.n + ': percorso fallito'); continue; }

    const min = Math.round(pr.min);
    const riga = '{b:' + fascia(min) + ', n:"' + v.n.replace(/"/g, '\\"') + '", z:"' + v.z + '"'
      + ', min:' + min + ', km:' + (+pr.km.toFixed(1))
      + ', t:"' + v.t + '", g:"", a:"' + v.a.replace(/"/g, '\\"') + '"'
      + ', d:"' + v.d.replace(/"/g, '\\"') + '"},\n';

    let testo = fs.readFileSync(DATI, 'utf8');
    testo = testo.replace(/\}(\s*)\];\s*$/, '},$1];\n');
    const chiusura = testo.lastIndexOf('];');
    testo = testo.slice(0, chiusura) + riga + testo.slice(chiusura);
    fs.writeFileSync(DATI, testo, 'utf8');
    esistenti.add(v.n.toLowerCase());

    inseriti++;
    console.log('[' + inseriti + '/' + candidati.length + '] + ' + String(min + ' min').padStart(8) + (precisioneBassa ? ' (centro comune)' : '') + '  ' + v.n.padEnd(40) + v.z);
  }

  const dopo = conta();
  console.log('\nposti: ' + prima.n + ' -> ' + dopo.n + '  (+' + inseriti + ')');
  let perso = false;
  for (const c of Object.keys(prima.campi)) {
    if ((dopo.campi[c] || 0) < prima.campi[c]) { console.log('  ATTENZIONE: campo ' + c + ' perso'); perso = true; }
  }
  console.log(perso ? 'QUALCOSA SI E PERSO' : 'nessun campo perso.');
  if (ancoraScartati.length) {
    console.log('\nancora scartati (' + ancoraScartati.length + '):');
    ancoraScartati.forEach(s => console.log('  ' + s));
    fs.writeFileSync('ancora_scartati_setaccio.json', JSON.stringify(ancoraScartati, null, 2));
  }
})();
