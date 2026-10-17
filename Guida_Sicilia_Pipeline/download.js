const https = require('https');
const fs = require('fs');
const path = require('path');

const picks = JSON.parse(fs.readFileSync('picks.json', 'utf8'));
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

// merge all search result files to recover license/author metadata
const meta = {};
for (const f of ['r1.json', 'r2.json', 'r3.json', 'r4.json', 'r5.json']) {
  if (!fs.existsSync(f)) continue;
  for (const arr of Object.values(JSON.parse(fs.readFileSync(f, 'utf8')))) {
    if (!Array.isArray(arr)) continue;
    for (const it of arr) if (it && it.title) meta[it.title] = it;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaTravelGuide/1.0 (personal offline travel guide)';

function fetchBin(url, redirects = 0) {
  return new Promise((res, rej) => {
    if (redirects > 6) return rej(new Error('too many redirects'));
    https.get(url, { headers: { 'User-Agent': UA } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume();
        return res(fetchBin(new URL(r.headers.location, url).href, redirects + 1));
      }
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      const chunks = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => res(Buffer.concat(chunks)));
    }).on('error', rej);
  });
}

(async () => {
  const credits = {};
  for (const [key, title] of Object.entries(picks)) {
    const ext = (path.extname(title) || '.jpg').toLowerCase().replace('.jpeg', '.jpg');
    const file = key + ext;
    const dest = path.join(OUT, file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 20000) {
      console.log('skip  ' + file);
    } else {
      const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/'
        + encodeURIComponent(title.replace(/ /g, '_')) + '?width=1700';
      let ok = false;
      for (let a = 0; a < 3 && !ok; a++) {
        try {
          const buf = await fetchBin(url);
          if (buf.length < 5000) throw new Error('too small: ' + buf.length);
          fs.writeFileSync(dest, buf);
          console.log('ok    ' + file + '  ' + Math.round(buf.length / 1024) + 'KB');
          ok = true;
        } catch (e) {
          console.log('retry ' + file + ' :: ' + e.message);
          await sleep(3000 * (a + 1));
        }
      }
      if (!ok) { console.log('FAIL  ' + file); continue; }
      await sleep(700);
    }
    const m = meta[title] || {};
    credits[key] = {
      file,
      title,
      author: m.artist || '',
      license: m.lic || '',
      source: 'https://commons.wikimedia.org/wiki/File:' + title.replace(/ /g, '_')
    };
  }
  fs.writeFileSync('credits.json', JSON.stringify(credits, null, 1));
  console.log('\nscaricate ' + Object.keys(credits).length + '/' + Object.keys(picks).length);
})();
