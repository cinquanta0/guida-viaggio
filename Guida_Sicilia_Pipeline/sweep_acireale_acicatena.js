/* Sweep esaustivo di tutte le categorie di cibo per Acireale e Aci Catena,
   su richiesta esplicita dell'utente (eccezione una tantum alla curatela
   normale del sito). Ogni candidato e' stato verificato prima di essere
   incluso qui: esistenza confermata via web (non solo Google Maps), e
   controllo incrociato contro le liste esistenti di Acireale/Aci Catena in
   dati.js per escludere duplicati (es. "Vulcanica Pizzeria", "Frumento",
   "Il Tocco", "Sensazionipizzeria", "Odissea...", "50 Sfumature di Gusto",
   "Pasticceria Siciliana Palummo", "Re Dolce Freddo", "L'angolo Dolce" =
   Pasticceria Sciacca gia' presente, gia' tutti scartati a monte).

   Stesso metodo Nominatim+OSRM gia' usato nella pipeline (geoConComune con
   guardia inSicilia, niente fallback silenzioso sul centro del comune se il
   posto non e' verificato).

   Uso: node sweep_acireale_acicatena.js   poi build.js && crediti.js */
const https = require('https');
const fs = require('fs');
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

const CANDIDATI = [
  // Acireale — dolci
  { n: "Andrea D'Anna Patissiere", z: "Acireale", com: "Acireale", a: "Via Fabio 37", t: "dolci", d: "Pasticceria e gelateria ad Acireale. Da Google Maps: 5,0 su 121 recensioni." },
  { n: "Gelateria Siculastreet", z: "Acireale", com: "Acireale", a: "Via Vittorio Emanuele III 174", t: "dolci", d: "Gelateria ad Acireale. Da Google Maps: 4,7 su 185 recensioni." },
  { n: "Gelateria Siculastreet — Piazza Vigo", z: "Acireale", com: "Acireale", a: "P.zza Lionardo Vigo 12", t: "dolci", d: "Seconda sede della gelateria, sulla piazza principale di Acireale. Da Google Maps: 4,8 su 65 recensioni." },
  { n: "Orazio Cordai Gelateria", z: "Acireale", com: "Acireale", a: "Corso Umberto 34", t: "dolci", d: "Gelateria della famiglia Cordai, che ad Acireale gestisce anche una pizzeria e un ristorante. Da Google Maps: 4,6 su 147 recensioni." },
  { n: "Très Noir Gelateria Pasticceria", z: "Acireale", com: "Acireale", a: "", t: "dolci", d: "Gelateria e pasticceria nel centro di Acireale. Da Google Maps: 4,0 su 270 recensioni." },
  { n: "Pasticceria Massimo Cannavò", z: "Acireale", com: "Acireale", a: "Corso Savoia 141", t: "dolci", d: "Pasticceria e gelateria ad Acireale. Da Google Maps: 4,6 su 329 recensioni." },
  { n: "Al San Domenico Bar", z: "Acireale", com: "Acireale", a: "Via Musmeci 66/68", t: "dolci", d: "Bar molto frequentato per la granita, ad Acireale. Da Google Maps: 4,4 su 1082 recensioni." },
  { n: "Gelateria Rococó", z: "Acireale", com: "Acireale", a: "Corso Umberto 109/111", t: "dolci", d: "Gelateria artigianale sul corso di Acireale. Da Google Maps: 4,3 su 476 recensioni." },
  { n: "Condorelli Orazio Bar E Pasticceria", z: "Acireale", com: "Acireale", a: "Via Dottor Oreste Scionti 24/26", t: "dolci", d: "Bar e pasticceria ad Acireale, noto per le granite. Da Google Maps: 4,4 su 910 recensioni." },
  { n: "Caffè Cipriani", z: "Acireale", com: "Acireale", a: "P.zza Lionardo Vigo 3", t: "dolci", d: "Caffè storico sulla piazza principale di Acireale. Da Google Maps: 4,3 su 2550 recensioni." },
  // Acireale — pizza
  { n: "Pizzeria La Stella", z: "Acireale", com: "Acireale", a: "Via Pennisi 30/32", t: "pizza", d: "Pizzeria napoletana alle spalle della Basilica di San Sebastiano, ad Acireale. Da Google Maps: 4,7 su 267 recensioni." },
  { n: "Focacceria Acqua e Farina", z: "Acireale", com: "Acireale", a: "Corso Savoia 111C", t: "pizza", d: "Focacceria ad Acireale. Da Google Maps: 4,7 su 294 recensioni." },
  { n: "Pekó Acireale", z: "Acireale", com: "Acireale", a: "Via San Martino 9", t: "pizza", d: "Pizzeria gourmet ad Acireale. Da Google Maps: 4,7 su 235 recensioni." },
  { n: "Pizzeria Garibaldi", z: "Acireale", com: "Acireale", a: "Piazza Giuseppe Garibaldi 16", t: "pizza", d: "Pizzeria nel centro di Acireale. Da Google Maps: 4,7 su 107 recensioni." },
  { n: "Pizzeria Regina Margherita", z: "Acireale", com: "Acireale", a: "Viale Regina Margherita 9", t: "pizza", d: "Pizzeria ad Acireale. Da Google Maps: 4,7 su 104 recensioni." },
  { n: "Pizzeria Vecchia Stazione", z: "Acireale", com: "Acireale", a: "Viale della Libertà 24/a", t: "pizza", d: "Pizzeria ad Acireale. Da Google Maps: 4,4 su 184 recensioni." },
  // Acireale — pesce
  { n: "Philia Fish & Grill", z: "Acireale", com: "Acireale", a: "Via Davì 43", t: "pesce", d: "Cucina di pesce e alla griglia, ad Acireale. Da Google Maps: 4,8 su 82 recensioni." },
  // Acireale — street
  { n: "Arancino' Pasticceria Raciti", z: "Acireale", com: "Acireale", a: "Piazza Agostino Pennisi 27", t: "street dolci", d: "Arancini e pasticceria siciliana ad Acireale. Da Google Maps: 4,7 su 211 recensioni." },
  { n: "Il re dello Street Food", z: "Acireale", com: "Acireale", a: "Viale Libertà 14", t: "street", d: "Gastronomia da asporto ad Acireale. Da Google Maps: 4,3 su 323 recensioni." },
  { n: "Bontà siciliane", z: "Acireale", com: "Acireale", a: "Via Sciarelle 73", t: "street", d: "Gastronomia tipica siciliana ad Acireale. Da Google Maps: 4,7 su 249 recensioni." },
  { n: "Gastronomia Aci E Galatea", z: "Acireale", com: "Acireale", a: "Via Torquato Tasso 17", t: "street", d: "Gastronomia ad Acireale. Da Google Maps: 4,7 su 87 recensioni." },
  // Aci Catena — dolci
  { n: "Pasticceria Mignemi", z: "Aci Catena", com: "Aci Catena", a: "Piano Umberto 46", t: "dolci", d: "Pasticceria e gelateria ad Aci Catena. Da Google Maps: 4,5 su 295 recensioni." },
  { n: "La pasticceria Pistone", z: "Aci Catena", com: "Aci Catena", a: "Via Croce 115/117", t: "dolci", d: "Pasticceria ad Aci Catena. Da Google Maps: 4,3 su 114 recensioni." },
  { n: "Pasticceria Crème Caramel", z: "Aci Catena", com: "Aci Catena", a: "Via Vittorio Emanuele 7", t: "dolci", d: "Pasticceria ad Aci Catena. Da Google Maps: 4,5 su 21 recensioni — un campione piccolo, da prendere con più cautela degli altri." },
  { n: "Pasticceria Di Basile Carmelo", z: "Aci Catena", com: "Aci Catena", a: "Via Regina Margherita 81", t: "dolci", d: "Pasticceria ad Aci Catena. Da Google Maps: 4,7 su 86 recensioni." },
  // Aci Catena — pasta/pizza
  { n: "Antica Trattoria Reitana", z: "Aci Catena", com: "Aci Catena", a: "Via Reitana 53", t: "pizza pasta", d: "Trattoria e pizzeria storica di Aci Catena, dal 1826. Da Google Maps: 4,0 su 449 recensioni." },
  { n: "Al Borgo di Sciacca", z: "Aci Catena", com: "Aci Catena", a: "Via Gesualdo Bufalino 2", t: "pizza pasta", d: "Ristorante pizzeria ad Aci Catena. Da Google Maps: 4,2 su 663 recensioni." },
  { n: "Pizzeria Cubisia", z: "Aci Catena", com: "Aci Catena", a: "Via Vittorio Emanuele 302", t: "pizza", d: "Pizzeria ad Aci Catena. Da Google Maps: 4,7 su 34 recensioni — un campione piccolo, da prendere con più cautela degli altri." },
];

(async () => {
  const p0Res = await geoConComune('Aci Catena, Catania, Sicilia', 'Aci Catena');
  const p0 = p0Res.scelto || p0Res.risultati[0];
  const partenza = { lat: +p0.lat, lon: +p0.lon };
  await sleep(1500);

  const prima = conta();
  delete require.cache[require.resolve('./' + DATI)];
  const esistenti = new Set(require('./' + DATI).map(p => p.n.toLowerCase()));

  let inseriti = 0;
  const scartati = [];

  for (const v of CANDIDATI) {
    if (esistenti.has(v.n.toLowerCase())) { console.log('già presente: ' + v.n); continue; }

    let g = null;
    let precisioneBassa = false;

    if (v.a) {
      let r = await geoConComune(v.a + ', ' + v.com + ', Sicilia', v.com);
      await sleep(1500);
      g = r.scelto;
    }

    if (!g) {
      let r = await geoConComune(v.n + ', ' + v.com + ', Sicilia', v.com);
      await sleep(1500);
      g = r.scelto;
      if (g) precisioneBassa = true;
    }

    if (!g) { scartati.push(v.n + ': nessun geocoding possibile (verificato esistente ma indirizzo non risolto)'); continue; }

    const pr = await percorso(partenza, { lat: +g.lat, lon: +g.lon });
    await sleep(1500);
    if (!pr) { scartati.push(v.n + ': percorso OSRM fallito'); continue; }

    const min = Math.round(pr.min);
    const campoA = v.a ? ', a:"' + v.a.replace(/"/g, '\\"') + '"' : '';
    const riga = '{b:' + fascia(min) + ', n:"' + v.n.replace(/"/g, '\\"') + '", z:"' + v.z + '"'
      + ', min:' + min + ', km:' + (+pr.km.toFixed(1))
      + ', t:"' + v.t + '", g:""' + campoA
      + ', d:"' + v.d.replace(/"/g, '\\"') + '"},\n';

    let testo = fs.readFileSync(DATI, 'utf8');
    testo = testo.replace(/\}(\s*)\];\s*$/, '},$1];\n');
    const chiusura = testo.lastIndexOf('];');
    testo = testo.slice(0, chiusura) + riga + testo.slice(chiusura);
    fs.writeFileSync(DATI, testo, 'utf8');
    esistenti.add(v.n.toLowerCase());

    inseriti++;
    console.log('[' + inseriti + '/' + CANDIDATI.length + '] + ' + String(min + ' min').padStart(8) + (precisioneBassa ? ' (nome+comune)' : '') + '  ' + v.n.padEnd(40) + v.z);
  }

  const dopo = conta();
  console.log('\nposti: ' + prima.n + ' -> ' + dopo.n + '  (+' + inseriti + ')');
  let perso = false;
  for (const c of Object.keys(prima.campi)) {
    if ((dopo.campi[c] || 0) < prima.campi[c]) { console.log('  ATTENZIONE: campo ' + c + ' perso'); perso = true; }
  }
  console.log(perso ? 'QUALCOSA SI E PERSO' : 'nessun campo perso.');
  if (scartati.length) {
    console.log('\nscartati (' + scartati.length + '):');
    scartati.forEach(s => console.log('  ' + s));
  }
})();
