const https = require('https');
const fs = require('fs');
const path = require('path');

const picks = JSON.parse(fs.readFileSync('picks.json', 'utf8'));
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const meta = {};
for (const f of ['r1.json', 'r2.json', 'r3.json', 'r4.json', 'r5.json']) {
  if (!fs.existsSync(f)) continue;
  for (const arr of Object.values(JSON.parse(fs.readFileSync(f, 'utf8')))) {
    if (!Array.isArray(arr)) continue;
    for (const it of arr) if (it && it.title) meta[it.title] = it;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaOfflineGuide/1.0 (personal, non-commercial; single user)';

function fetchBin(url, redirects = 0) {
  return new Promise((res, rej) => {
    if (redirects > 6) return rej(new Error('redirects'));
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept': 'image/*' } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume();
        return res(fetchBin(new URL(r.headers.location, url).href, redirects + 1));
      }
      if (r.statusCode !== 200) {
        r.resume();
        const e = new Error('HTTP ' + r.statusCode);
        e.status = r.statusCode;
        return rej(e);
      }
      const chunks = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => res(Buffer.concat(chunks)));
    });
    req.setTimeout(60000, () => { req.destroy(new Error('timeout')); });
    req.on('error', rej);
  });
}

(async () => {
  const credits = JSON.parse(fs.existsSync('credits.json') ? fs.readFileSync('credits.json', 'utf8') : '{}');
  const entries = Object.entries(picks);
  for (let i = 0; i < entries.length; i++) {
    const [key, title] = entries[i];
    const ext = (path.extname(title) || '.jpg').toLowerCase().replace('.jpeg', '.jpg');
    const file = key + ext;
    const dest = path.join(OUT, file);
    const m = meta[title] || {};
    const record = () => {
      credits[key] = { file, title, author: m.artist || '', license: m.lic || '',
        source: 'https://commons.wikimedia.org/wiki/File:' + title.replace(/ /g, '_') };
      fs.writeFileSync('credits.json', JSON.stringify(credits, null, 1));
    };

    if (fs.existsSync(dest) && fs.statSync(dest).size > 30000) { record(); continue; }

    let url = m.thumb;
    if (url && !url.includes('/thumb/') && m.w > 1900) {
      const parts = url.split('/wikipedia/commons/');
      const name = parts[1].split('/').pop();
      url = parts[0] + '/wikipedia/commons/thumb/' + parts[1] + '/1700px-' + name;
    }

    let ok = false;
    for (let a = 0; a < 6 && !ok; a++) {
      try {
        const buf = await fetchBin(url);
        if (buf.length < 8000) throw new Error('short ' + buf.length);
        fs.writeFileSync(dest, buf);
        console.log('[' + (i + 1) + '/' + entries.length + '] ok ' + file + ' ' + Math.round(buf.length / 1024) + 'KB');
        ok = true; record();
      } catch (e) {
        const wait = e.status === 429 ? 45000 : 6000 * (a + 1);
        console.log('[' + (i + 1) + '] retry ' + file + ' :: ' + e.message + ' (wait ' + wait / 1000 + 's)');
        await sleep(wait);
      }
    }
    if (!ok) console.log('FAIL ' + file);
    await sleep(2500);
  }
  const got = Object.keys(credits).filter(k => fs.existsSync(path.join(OUT, credits[k].file)));
  console.log('\nDONE: ' + got.length + '/' + entries.length);
  console.log('mancanti: ' + Object.keys(picks).filter(k => !got.includes(k)).join(', '));
})();
