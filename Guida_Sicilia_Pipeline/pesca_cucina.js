/* Invece di cercare un piatto alla volta indovinando il nome del file,
   svuota le categorie di Commons sulla cucina siciliana e mette da parte
   l'elenco. Poi si cercano le parole chiave dentro quell'elenco.

   Motivo: i nomi dei file non seguono nessuna regola. "Pidoni-Wikipedia.jpg",
   "Minnuzze di sant'aita.jpg", "Cassateddi.jpg". Cercare per titolo vuol dire
   indovinare; leggere tutta la categoria vuol dire guardare.

   Uso: node pesca_cucina.js elenco_cucina.json */

const https = require('https');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';

const CATEGORIE = [
  'Cuisine of Sicily',
  'Sicilian cuisine',
  'Food of Sicily',
  'Street food of Sicily',
  'Cuisine of Catania',
  'Cuisine of Palermo',
  'Cuisine of Messina',
  'Sicilian pastries',
  'Sicilian desserts',
  'Sicilian bread',
  'Pizza in Italy',
  'Sfincione',
  'Rosticceria'
];

function get(host, percorso) {
  return new Promise((res, rej) => {
    const req = https.get({ host: host, path: percorso, headers: { 'User-Agent': UA } }, r => {
      if (r.statusCode !== 200) { r.resume(); const e = new Error('HTTP ' + r.statusCode); e.status = r.statusCode; return rej(e); }
      let s = ''; r.on('data', d => s += d); r.on('end', () => res(s));
    });
    req.setTimeout(45000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

async function json(percorso) {
  for (let a = 0; a < 4; a++) {
    try { const t = await get('commons.wikimedia.org', percorso); if (t.trim()[0] === '{') return JSON.parse(t); }
    catch (e) { if (e.status === 429) { await sleep(45000); continue; } }
    await sleep(4000 * (a + 1));
  }
  return null;
}

/* i file di una categoria, piu' le sottocategorie da visitare */
async function contenuto(cat) {
  const file = [], sotto = [];
  let cont = '';
  for (let giro = 0; giro < 3; giro++) {
    const j = await json('/w/api.php?action=query&format=json&list=categorymembers'
      + '&cmtitle=' + encodeURIComponent('Category:' + cat)
      + '&cmlimit=500&cmtype=file|subcat' + (cont ? '&cmcontinue=' + encodeURIComponent(cont) : ''));
    if (!j || !j.query) break;
    for (const m of j.query.categorymembers || []) {
      if (m.ns === 6) file.push(m.title.replace(/^File:/, ''));
      else if (m.ns === 14) sotto.push(m.title.replace(/^Category:/, ''));
    }
    if (j.continue && j.continue.cmcontinue) { cont = j.continue.cmcontinue; await sleep(900); }
    else break;
  }
  return { file: file, sotto: sotto };
}

(async () => {
  const visti = new Set();
  const tutti = new Set();
  const coda = CATEGORIE.slice();

  while (coda.length) {
    const cat = coda.shift();
    if (visti.has(cat)) continue;
    visti.add(cat);
    const c = await contenuto(cat);
    c.file.forEach(f => tutti.add(f));
    /* una sola discesa nelle sottocategorie, e solo se parlano di cibo */
    if (visti.size <= CATEGORIE.length) {
      c.sotto.filter(s => !/people|photographs by|of the|maps|coats/i.test(s))
        .slice(0, 12).forEach(s => coda.push(s));
    }
    console.log(cat.padEnd(34) + c.file.length + ' file, ' + c.sotto.length + ' sottocategorie');
    await sleep(1100);
  }

  const elenco = [...tutti].filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
  fs.writeFileSync(process.argv[2] || 'elenco_cucina.json', JSON.stringify(elenco, null, 1));
  console.log('\nfile raccolti in tutto: ' + elenco.length);
})();
