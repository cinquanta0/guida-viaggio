/* Propone foto AGGIUNTIVE per i posti che ne hanno gia' una.

   Il metodo: parto dalla foto che gia' uso, leggo le categorie del file su
   Commons, tengo solo quelle che nominano davvero il posto o la sua zona, e
   pesco gli altri file da li' dentro.

   Il filtro sulle categorie non e' pedanteria. Le categorie generiche tipo
   "Beaches of the province of Syracuse" contengono spiagge diverse a decine
   di chilometri l'una dall'altra: pescarci dentro significa mettere sulla
   scheda del Gelsomineto la foto di un'altra spiaggia. Sarebbe una foto
   finta, che e' precisamente cio' che questo sito non fa.

   Non scarica niente: scrive solo una proposta da rileggere.
   Uso: node proponi_extra.js proposta.json [--tipo mare] */

const https = require('https');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';

/* categorie di servizio di Commons: non dicono niente sul luogo */
const SERVIZIO = /^(CC[-_]|PD|GFDL|Self-published|Files? |Media |License |Images? (from|with|missing)|Photographs by|Uploaded|Wiki Loves|Taken with|Pages |Items |Artworks|Panoramio|Flickr|Creative Commons|Public domain|Attribution|Copyrighted)/i;
/* categorie che raggruppano luoghi DIVERSI: il rischio foto sbagliata */
const TROPPO_LARGA = /^(Beaches|Nature|Coast|Sea|Landscapes?|Sunsets?|Churches|Museums|Province|Comuni|Municipalities|Geography|Tourism|Culture|Architecture|Buildings)\b/i;

function get(url) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, r => {
      if (r.statusCode !== 200) { r.resume(); const e = new Error('HTTP ' + r.statusCode); e.status = r.statusCode; return rej(e); }
      let s = ''; r.on('data', d => s += d); r.on('end', () => res(s));
    });
    req.setTimeout(45000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

async function json(url) {
  for (let a = 0; a < 4; a++) {
    try { const t = await get(url); if (t.trim()[0] === '{') return JSON.parse(t); }
    catch (e) { if (e.status === 429) { await sleep(45000); continue; } }
    await sleep(5000 * (a + 1));
  }
  return null;
}

/* "Spiaggia del Gelsomineto" -> ["spiaggia","del","gelsomineto"], senza le
   parole di servizio che non identificano niente */
const VUOTE = new Set(['spiaggia', 'spiagge', 'di', 'del', 'della', 'dello', 'dei', 'delle',
  'da', 'la', 'le', 'lo', 'il', 'i', 'gli', 'e', 'a', 'in', 'lido', 'oasi', 'centro', 'storico']);
function parole(s) {
  return s.toLowerCase()
    .replace(/[àá]/g, 'a').replace(/[èé]/g, 'e').replace(/[ìí]/g, 'i')
    .replace(/[òó]/g, 'o').replace(/[ùú]/g, 'u').replace(/[’']/g, ' ')
    .split(/[^a-z0-9]+/).filter(w => w.length > 2 && !VUOTE.has(w));
}

function parlaDelPosto(nomeCategoria, nome, zona) {
  const c = parole(nomeCategoria);
  if (!c.length) return false;
  const chiavi = parole(nome).concat(parole(zona));
  if (!chiavi.length) return false;
  /* almeno una parola forte del posto deve comparire nella categoria */
  return chiavi.some(k => c.indexOf(k) !== -1);
}

(async () => {
  const posti = require('./dati.js');
  const crediti = JSON.parse(fs.readFileSync('credits.json', 'utf8'));
  const perFile = {};
  for (const [k, c] of Object.entries(crediti)) perFile[c.file] = { chiave: k, title: c.title };

  const iTipo = process.argv.indexOf('--tipo');
  const tipo = iTipo > 0 ? process.argv[iTipo + 1] : null;

  const candidati = posti.filter(p => p.img && !(p.piu && p.piu.length)
    && (!tipo || (p.t || '').indexOf(tipo) !== -1));

  console.log('posti da esaminare: ' + candidati.length + '\n');
  const proposta = {};
  let conCategoria = 0;

  for (let i = 0; i < candidati.length; i++) {
    const p = candidati[i];
    const rif = perFile[p.img];
    if (!rif) { console.log('  --  ' + p.n + ' :: foto senza credito, salto'); continue; }

    /* 1. le categorie della foto che gia' uso */
    const u1 = 'https://commons.wikimedia.org/w/api.php?action=query&format=json'
      + '&titles=' + encodeURIComponent('File:' + rif.title)
      + '&prop=categories&cllimit=50';
    const j1 = await json(u1);
    const pg = j1 && j1.query && j1.query.pages && Object.values(j1.query.pages)[0];
    const cats = ((pg && pg.categories) || [])
      .map(c => c.title.replace(/^Category:/, ''))
      .filter(c => !SERVIZIO.test(c) && !TROPPO_LARGA.test(c))
      .filter(c => parlaDelPosto(c, p.n, p.z));

    if (!cats.length) { console.log('  --  ' + p.n + ' :: nessuna categoria specifica del posto'); await sleep(1300); continue; }
    conCategoria++;

    /* 2. gli altri file dentro quella categoria */
    const u2 = 'https://commons.wikimedia.org/w/api.php?action=query&format=json'
      + '&generator=categorymembers&gcmtitle=' + encodeURIComponent('Category:' + cats[0])
      + '&gcmtype=file&gcmlimit=40&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=600';
    const j2 = await json(u2);
    const pagine = (j2 && j2.query && j2.query.pages) ? Object.values(j2.query.pages) : [];

    const usati = new Set(Object.values(crediti).map(c => c.title));
    const scelti = pagine
      .map(x => {
        const ii = x.imageinfo && x.imageinfo[0]; if (!ii) return null;
        const em = ii.extmetadata || {};
        return {
          title: x.title.replace(/^File:/, ''),
          w: ii.width, h: ii.height,
          lic: (em.LicenseShortName && em.LicenseShortName.value) || '?',
          artist: (em.Artist && em.Artist.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 40)
        };
      })
      .filter(x => x && x.w >= 900 && x.w > x.h * 1.15 && !usati.has(x.title))
      .filter(x => !/\.(svg|pdf|tif|ogv|webm)$/i.test(x.title))
      .filter(x => !/(map|mappa|stemma|coat of arms|logo|diagram|plan |schema)/i.test(x.title))
      .slice(0, 2);

    console.log('## ' + p.n + '   [Category:' + cats[0] + ']');
    if (!scelti.length) console.log('     niente di nuovo e orizzontale');
    scelti.forEach(x => console.log('     + ' + x.title + '  [' + x.w + 'x' + x.h + '] ' + x.lic));

    if (scelti.length) {
      proposta[rif.chiave] = {
        posto: p.n, zona: p.z, categoria: cats[0],
        da: 2, file: scelti.map(x => x.title),
        misure: scelti.map(x => x.w + 'x' + x.h)
      };
    }
    await sleep(1300);
  }

  fs.writeFileSync(process.argv[2] || 'proposta.json', JSON.stringify(proposta, null, 1));
  console.log('\nposti con una categoria specifica: ' + conCategoria + '/' + candidati.length);
  console.log('proposte scritte: ' + Object.keys(proposta).length);
})();
