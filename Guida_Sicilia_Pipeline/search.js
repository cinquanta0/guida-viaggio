const https = require('https');
const fs = require('fs');

const queries = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

function get(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'SiciliaTravelGuide/1.0 (personal offline guide; contact: local user)' } }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(d));
    }).on('error', rej);
  });
}

async function getJson(url) {
  for (let a = 0; a < 5; a++) {
    const t = await get(url);
    if (t.trim().startsWith('{')) return JSON.parse(t);
    await sleep(4000 * (a + 1));
  }
  throw new Error('rate limited');
}

(async () => {
  const out = {};
  for (const [key, q] of Object.entries(queries)) {
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search'
      + '&gsrsearch=' + encodeURIComponent(q + ' filetype:bitmap')
      + '&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|extmetadata'
      + '&iiurlwidth=1800&format=json';
    try {
      const j = await getJson(url);
      const pages = j.query && j.query.pages ? Object.values(j.query.pages) : [];
      out[key] = pages
        .sort((a, b) => a.index - b.index)
        .map(p => {
          const ii = p.imageinfo[0];
          const em = ii.extmetadata || {};
          return {
            title: p.title.replace(/^File:/, ''),
            w: ii.width, h: ii.height,
            thumb: ii.thumburl.split('?')[0],
            artist: (em.Artist && em.Artist.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 50),
            lic: (em.LicenseShortName && em.LicenseShortName.value) || '?'
          };
        })
        .filter(x => x.w >= 900);
    } catch (e) { out[key] = [{ error: e.message }]; }
    await sleep(1500);
  }
  fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
  for (const [k, v] of Object.entries(out)) {
    console.log('## ' + k);
    v.slice(0, 7).forEach((x, i) => console.log('  ' + i + ') ' + x.title + '  [' + x.w + 'x' + x.h + '] ' + x.lic));
  }
})();
