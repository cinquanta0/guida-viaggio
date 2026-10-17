/* Inserisce in dati.js i candidati scelti da seleziona_bulk.js.

   Le coordinate sono quelle che Google ha gia' dato per il locale stesso:
   NON si passa da un secondo geocoding (Nominatim), quindi non puo'
   ripetersi l'errore di stamattina (Portopalo al posto di Siracusa) — la
   fonte delle coordinate e' il locale stesso, non un indirizzo scritto in
   prosa da reinterpretare.

   Serve solo calcolare il tempo reale in auto da Aci Catena (OSRM) per
   ognuno, e scrivere la riga.

   Uso: node aggiungi_bulk.js     poi build.js && crediti.js  */

const https = require('https');
const fs = require('fs');
const candidati = require('./candidati_bulk.js');
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
  const p0url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q='
    + encodeURIComponent('Aci Catena, Catania, Sicilia');
  const p0 = JSON.parse(await get(p0url))[0];
  const partenza = { lat: +p0.lat, lon: +p0.lon };
  await sleep(1200);

  const prima = conta();
  delete require.cache[require.resolve('./' + DATI)];
  const esistenti = new Set(require('./' + DATI).map(p => p.n.toLowerCase()));

  let testo = fs.readFileSync(DATI, 'utf8');
  testo = testo.replace(/\}(\s*)\];\s*$/, '},$1];\n');
  const chiusura = testo.lastIndexOf('];');
  if (chiusura === -1) { console.log('non trovo la fine dell array'); process.exit(1); }

  let righe = '', inseriti = 0;
  const saltati = [];
  for (const c of candidati) {
    if (esistenti.has(c.n.toLowerCase())) { saltati.push(c.n + ': gia presente'); continue; }
    if (/[<>]/.test(c.n) || /&[a-zA-Z]+;/.test(c.n)) { saltati.push(c.n + ': caratteri non ammessi'); continue; }

    const pr = await percorso(partenza, { lat: c.lat, lon: c.lon });
    await sleep(1300);
    if (!pr) { saltati.push(c.n + ': percorso fallito'); continue; }

    const min = Math.round(pr.min);
    righe += '{b:' + fascia(min) + ', n:"' + c.n.replace(/"/g, '\\"') + '", z:"' + c.z + '"'
      + ', min:' + min + ', km:' + (+pr.km.toFixed(1))
      + ', t:"' + c.t + '", g:""'
      + (c.a ? ', a:"' + c.a.replace(/"/g, '\\"') + '"' : '')
      + ', d:"' + c.d.replace(/"/g, '\\"') + '"},\n';
    inseriti++;
    console.log('  + ' + String(min + ' min').padStart(8) + '  ' + c.z.padEnd(22) + c.n);
  }

  testo = testo.slice(0, chiusura) + righe + testo.slice(chiusura);
  fs.writeFileSync(DATI, testo, 'utf8');

  const dopo = conta();
  console.log('\ninseriti: ' + inseriti + ' su ' + candidati.length);
  console.log('posti: ' + prima.n + ' -> ' + dopo.n);
  let perso = false;
  for (const campo of Object.keys(prima.campi)) {
    if ((dopo.campi[campo] || 0) < prima.campi[campo]) { console.log('  ATTENZIONE: campo ' + campo + ' perso'); perso = true; }
  }
  console.log(perso ? 'QUALCOSA SI E PERSO' : 'nessun campo perso.');
  if (saltati.length) { console.log('\nsaltati:'); saltati.forEach(s => console.log('  ' + s)); }
})();
