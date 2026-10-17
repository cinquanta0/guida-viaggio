/* Le due bracerie di Acireale, dalla fonte che l'utente ha scelto: TheFork.

   Fino a stamattina questa zona restava scoperta perche' il progetto
   escludeva gli aggregatori. L'utente ha deciso di usarli: e' la sua guida,
   e TheFork e' quello che usa per prenotare. Quindi entrano, ma **la scheda
   dice da dove vengono**, esattamente come le altre dicono "Chiocciola Slow
   Food" o "Bib Gourmand". Il lettore deve poter pesare la fonte.

   Per queste due NON metto il tag "Ci vanno i siciliani": quel tag ha una
   regola precisa (segnalato per la cucina da una guida gastronomica) e
   un voto su una piattaforma di prenotazioni non e' la stessa cosa.

   L'indirizzo e' confermato da piu' fonti indipendenti (TheFork, PagineGialle,
   Virgilio, e per Corte Marconi il sito del locale e ViaMichelin), quindi
   stavolta lo scrivo.

   Scartata "La Tana del Lupo": ad Acireale con quel nome non risulta un
   ristorante, risulta un birrificio.

   Uso: node aggiungi_bracerie.js    poi build.js && crediti.js  */

const https = require('https');
const fs = require('fs');
const DATI = 'dati.js';

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const NUOVE = [
  {
    n: 'Basula Braceria Barocca', z: 'Acireale',
    ind: 'Corso Savoia 20, Acireale, Catania',
    a: 'Corso Savoia 20',
    t: 'carne', g: '',
    fork: 'https://www.thefork.it/ristorante/basula-braceria-barocca-r717790',
    d: 'Braceria nel centro barocco di Acireale: tagli alla griglia, tomahawk, polpette di scottona. Ad Acireale e Aci Catena la guida non aveva un solo posto dove mangiare carne, e questo lo copre. Attenzione alla provenienza: non l’ha segnalato una guida gastronomica, l’ho preso da TheFork, dove ha un voto molto alto — che è un’altra cosa.'
  },
  {
    n: 'Braceria Corte Marconi', z: 'Acireale',
    ind: 'Piazza Guglielmo Marconi 16, Acireale, Catania',
    a: 'Piazza Marconi 16',
    t: 'carne', g: '',
    fork: 'https://www.thefork.it/ristorante/braceria-corte-marconi-r824692',
    d: 'Carni selezionate alla brace, hamburger e piatti siciliani, con una carta dei vini del territorio. L’altra braceria di Acireale, a otto minuti da casa. Anche questa arriva da TheFork e non da una guida gastronomica.'
  },

  /* secondo giro: cercando meglio, e non solo dentro i confini di Acireale,
     la carne vicino a casa salta fuori. Il primo giro aveva guardato solo
     Aci Catena e Acireale, ma i paesi qui sono attaccati: Valverde e' a
     pochi minuti, e in Sicilia le bracerie stanno spesso in collina, fuori
     dal centro abitato. */
  {
    n: 'Tenuta Carminello', z: 'Valverde',
    ind: 'Via Carminello 21, Valverde, Catania',
    a: 'Via Carminello 21',
    t: 'carne pizza', g: '',
    fork: 'https://www.thefork.it/ristorante/tenuta-carminello-r852483',
    d: 'Sulla collina di Valverde, fra l’Etna e il mare di Aci Trezza: carne alla brace con una scelta di selvaggina, e anche la pizza. È il voto più alto della zona su TheFork (9,1), da dove l’ho preso — non da una guida gastronomica.'
  },
  {
    n: 'Brace', z: 'Catania',
    ind: 'Via Domenico Cimarosa 12, Catania',
    a: 'Via Domenico Cimarosa 12',
    t: 'carne', g: '',
    fork: 'https://www.thefork.it/ristorante/brace-r691267',
    d: 'Braceria catanese fuori dal giro del centro storico: tagli scelti e cottura precisa. Da TheFork, dove ha 8,8.'
  }
];

/* Scartata "Ricci Braceria", che pure usciva fra i primi risultati per Aci
   Sant'Antonio: e' a Sant'Antonio in CAMPANIA, non in Sicilia. Stessa
   trappola della Praiola, che e' sia a Giarre sia a Terrasini. Prima di
   prendere un locale trovato per nome, guardare in che regione sta.
   Scartato anche "Palmento del Serra" (Viagrande, 9,6): e' un ristorante di
   pesce dentro un boutique hotel, non una braceria.
   Scartata "Era Ora da Davide": ad Acireale non risulta un indirizzo. */

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

async function geo(q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=' + encodeURIComponent(q);
  for (let a = 0; a < 3; a++) {
    try { const j = JSON.parse(await get(url)); return j.length ? j[0] : null; }
    catch (e) { await sleep(6000); }
  }
  return null;
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
  const p0 = await geo('Aci Catena, Catania, Sicilia');
  const partenza = { lat: +p0.lat, lon: +p0.lon };
  await sleep(1500);

  const prima = conta();
  delete require.cache[require.resolve('./' + DATI)];
  const esistenti = new Set(require('./' + DATI).map(p => p.n.toLowerCase()));

  let testo = fs.readFileSync(DATI, 'utf8');
  testo = testo.replace(/\}(\s*)\];\s*$/, '},$1];\n');
  const chiusura = testo.lastIndexOf('];');
  if (chiusura === -1) { console.log('non trovo la fine dell array'); process.exit(1); }

  let righe = '';
  for (const v of NUOVE) {
    if (esistenti.has(v.n.toLowerCase())) { console.log('gia presente: ' + v.n); continue; }
    const g = await geo(v.ind);
    await sleep(1500);
    if (!g) { console.log(v.n + ': indirizzo non trovato, la salto'); continue; }
    const pr = await percorso(partenza, { lat: +g.lat, lon: +g.lon });
    await sleep(1500);
    if (!pr) { console.log(v.n + ': percorso fallito'); continue; }

    righe += '{b:' + fascia(Math.round(pr.min)) + ', n:"' + v.n + '", z:"' + v.z + '"'
      + ', min:' + Math.round(pr.min) + ', km:' + (+pr.km.toFixed(1))
      + ', t:"' + v.t + '", g:"' + v.g + '", a:"' + v.a + '"'
      + ', fork:"' + v.fork + '"'
      + ', d:"' + v.d.replace(/"/g, '\\"') + '"},\n';
    console.log('  + ' + String(Math.round(pr.min) + ' min').padStart(8) + '  ' + v.n
      + '   (' + g.display_name.split(',').slice(0, 2).join(',') + ')');
  }

  if (!righe) { console.log('niente da aggiungere'); return; }
  testo = testo.slice(0, chiusura) + righe + testo.slice(chiusura);
  fs.writeFileSync(DATI, testo, 'utf8');

  const dopo = conta();
  console.log('\nposti: ' + prima.n + ' -> ' + dopo.n);
  let perso = false;
  for (const c of Object.keys(prima.campi)) {
    if ((dopo.campi[c] || 0) < prima.campi[c]) { console.log('  ATTENZIONE: campo ' + c + ' perso'); perso = true; }
  }
  console.log(perso ? 'QUALCOSA SI E PERSO' : 'nessun campo perso.');
})();
