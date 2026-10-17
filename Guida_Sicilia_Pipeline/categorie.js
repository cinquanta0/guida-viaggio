/* La ricerca testuale di Commons non trova i luoghi minori.
   Le categorie sì: elenco i file dentro una categoria e mostro i candidati. */
const https = require('https');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';

function get(url) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, r => {
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      let s = ''; r.on('data', d => s += d); r.on('end', () => res(s));
    });
    req.setTimeout(45000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

async function json(url) {
  for (let a = 0; a < 4; a++) {
    try { const t = await get(url); if (t.trim()[0] === '{') return JSON.parse(t); }
    catch (e) { }
    await sleep(5000 * (a + 1));
  }
  return null;
}

const categorie = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

(async () => {
  const out = {};
  for (const [k, cat] of Object.entries(categorie)) {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json'
      + '&generator=categorymembers&gcmtitle=' + encodeURIComponent('Category:' + cat)
      + '&gcmtype=file&gcmlimit=60&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1400';
    const j = await json(url);
    console.log('## ' + k + '   [Category:' + cat + ']');
    if (!j || !j.query || !j.query.pages) { console.log('   categoria vuota o inesistente'); out[k] = []; await sleep(1500); continue; }
    const file = Object.values(j.query.pages)
      .map(p => {
        const ii = p.imageinfo && p.imageinfo[0]; if (!ii) return null;
        const em = ii.extmetadata || {};
        return {
          title: p.title.replace(/^File:/, ''), w: ii.width, h: ii.height,
          lic: (em.LicenseShortName && em.LicenseShortName.value) || '?',
          artist: (em.Artist && em.Artist.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 40)
        };
      })
      .filter(x => x && x.w >= 900 && x.w >= x.h);   // solo orizzontali decenti
    out[k] = file;
    file.slice(0, 5).forEach((x, i) => console.log('   ' + i + ') ' + x.title + '  [' + x.w + 'x' + x.h + '] ' + x.lic));
    if (!file.length) console.log('   nessun file orizzontale utilizzabile');
    await sleep(1500);
  }
  fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
})();
