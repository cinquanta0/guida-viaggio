/* Cerca le foto dei piatti passando da Wikipedia invece che da Commons.

   Perche': su Commons bisogna indovinare come si chiama il file, e per i
   piatti regionali il nome puo' essere qualsiasi cosa. Wikipedia invece ha
   una voce per quasi ogni piatto siciliano, e quella voce una foto ce l'ha
   quasi sempre - ospitata su Commons, ma con un nome che non avrei mai
   indovinato. Si parte dalla voce e si arriva al file, non il contrario.

   Uso: node foto_da_wikipedia.js piatti.json risultato.json
   dove piatti.json e' { "chiave": "Titolo o termine di ricerca" } */

const https = require('https');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';

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

async function json(host, percorso) {
  for (let a = 0; a < 4; a++) {
    try { const t = await get(host, percorso); if (t.trim()[0] === '{') return JSON.parse(t); }
    catch (e) { if (e.status === 429) { await sleep(45000); continue; } }
    await sleep(4000 * (a + 1));
  }
  return null;
}

/* file di servizio che compaiono in ogni voce e non c'entrano col piatto */
const SCARTA = /(commons-logo|wiki\w*-logo|disambigua|question|stub|edit-|nuvola|crystal|flag of|bandiera|coat of arms|stemma|map|mappa|icon|logo)/i;

(async () => {
  const piatti = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const esito = {};

  for (const [chiave, termine] of Object.entries(piatti)) {
    console.log('## ' + chiave + '   (cerco "' + termine + '" su it.wikipedia)');

    /* 1. trova la voce */
    const ric = await json('it.wikipedia.org',
      '/w/api.php?action=query&format=json&list=search&srlimit=3&srsearch=' + encodeURIComponent(termine));
    const voci = (ric && ric.query && ric.query.search) || [];
    if (!voci.length) { console.log('   nessuna voce'); await sleep(1200); continue; }

    esito[chiave] = [];
    for (const voce of voci.slice(0, 2)) {
      /* 2. le immagini che usa */
      const im = await json('it.wikipedia.org',
        '/w/api.php?action=query&format=json&prop=images&imlimit=20&titles=' + encodeURIComponent(voce.title));
      const pg = im && im.query && im.query.pages && Object.values(im.query.pages)[0];
      const file = ((pg && pg.images) || [])
        .map(x => x.title.replace(/^File:/, ''))
        .filter(f => /\.(jpe?g|png)$/i.test(f) && !SCARTA.test(f));
      if (!file.length) { await sleep(1000); continue; }

      /* 3. misure e licenza dei candidati, da Commons */
      const info = await json('commons.wikimedia.org',
        '/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&titles='
        + encodeURIComponent(file.slice(0, 6).map(f => 'File:' + f).join('|')));
      const pagine = (info && info.query && info.query.pages) ? Object.values(info.query.pages) : [];
      for (const p of pagine) {
        const ii = p.imageinfo && p.imageinfo[0]; if (!ii) continue;
        const em = ii.extmetadata || {};
        if (ii.width < 700) continue;
        const v = {
          voce: voce.title,
          title: p.title.replace(/^File:/, ''),
          w: ii.width, h: ii.height,
          prop: +(ii.width / ii.height).toFixed(2),
          lic: (em.LicenseShortName && em.LicenseShortName.value) || '?',
          artist: (em.Artist && em.Artist.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 40)
        };
        esito[chiave].push(v);
        console.log('   + [' + voce.title + '] ' + v.title + '  ' + v.w + 'x' + v.h + ' (' + v.prop + ':1) ' + v.lic);
      }
      await sleep(1200);
    }
    if (!esito[chiave] || !esito[chiave].length) console.log('   niente di utilizzabile');
    await sleep(1200);
  }

  fs.writeFileSync(process.argv[3] || 'wikipedia.json', JSON.stringify(esito, null, 1));
})();
