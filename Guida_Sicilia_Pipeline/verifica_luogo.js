/* Prima di mettere una foto su una scheda, controlla che sia davvero QUEL
   posto: coordinate, categorie e descrizione dal file su Commons.
   Serve perche' i nomi si ripetono: "Praiola" e' sia a Giarre sia a
   Terrasini, a 250 km di distanza. Mettere quella sbagliata sarebbe una
   foto finta, che e' esattamente cio' che questo sito non fa.

   Uso: node verifica_luogo.js file_titoli.json
   dove il json e' { "chiave": ["Titolo su Commons.jpg", ...] } */

const https = require('https');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';

/* riferimento: la Sicilia orientale, dove si svolge il viaggio */
const BASE = { lat: 37.60, lon: 15.13 };

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
    catch (e) { if (/429/.test(e.message)) await sleep(45000); }
    await sleep(4000 * (a + 1));
  }
  return null;
}

function km(a, b) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

(async () => {
  const gruppi = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const esito = {};
  for (const [chiave, titoli] of Object.entries(gruppi)) {
    console.log('\n## ' + chiave);
    esito[chiave] = [];
    for (const titolo of titoli) {
      const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json'
        + '&titles=' + encodeURIComponent('File:' + titolo)
        + '&prop=imageinfo|categories|coordinates'
        + '&iiprop=url|size|extmetadata&cllimit=50&colimit=10';
      const j = await json(url);
      const p = j && j.query && j.query.pages && Object.values(j.query.pages)[0];
      if (!p || p.missing !== undefined) { console.log('   ' + titolo + ' :: NON ESISTE'); await sleep(1200); continue; }
      const ii = (p.imageinfo || [])[0] || {};
      const em = ii.extmetadata || {};
      const co = (p.coordinates || [])[0];
      const cats = (p.categories || []).map(c => c.title.replace(/^Category:/, ''));
      const desc = (em.ImageDescription && em.ImageDescription.value || '')
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110);
      const dist = co ? km(BASE, { lat: co.lat, lon: co.lon }) : null;
      const voce = {
        title: titolo,
        w: ii.width, h: ii.height,
        proporzione: ii.width && ii.height ? +(ii.width / ii.height).toFixed(2) : null,
        lat: co ? co.lat : null, lon: co ? co.lon : null,
        kmDaAciCatena: dist,
        categorie: cats.slice(0, 8),
        descrizione: desc,
        author: (em.Artist && em.Artist.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 60),
        license: (em.LicenseShortName && em.LicenseShortName.value) || '?'
      };
      esito[chiave].push(voce);
      console.log('   ' + titolo);
      console.log('      ' + ii.width + 'x' + ii.height + '  (' + voce.proporzione + ':1)  ' + voce.license);
      console.log('      coord: ' + (co ? co.lat.toFixed(4) + ', ' + co.lon.toFixed(4) + '  ~' + dist + ' km da Aci Catena' : 'ASSENTI'));
      if (cats.length) console.log('      cat: ' + cats.slice(0, 5).join(' | '));
      if (desc) console.log('      desc: ' + desc);
      await sleep(1200);
    }
  }
  fs.writeFileSync(process.argv[3] || 'verifica.json', JSON.stringify(esito, null, 1));
})();
