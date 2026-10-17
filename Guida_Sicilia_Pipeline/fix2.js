const https = require('https');
const fs = require('fs');
const OUT = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaOfflineGuide/1.0 (personal, non-commercial; single user)';

// file -> candidati Commons in ordine di preferenza
const jobs = {
  'cannolo.jpg': ['Cannoli tipo mignon con ripieno 02.jpg', 'Cannoli in a box.jpg', 'Cannoli siciliani (7472226896).jpg'],
  'laplaia.jpg': ['Playa Etna (244613663).jpeg', 'Mare di Fontane Bianche (Siracusa).jpg']
};

function fetchBin(url, n = 0) {
  return new Promise((res, rej) => {
    if (n > 6) return rej(new Error('redirects'));
    const req = https.get(url, { headers: { 'User-Agent': UA, Accept: 'image/*' } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume(); return res(fetchBin(new URL(r.headers.location, url).href, n + 1));
      }
      if (r.statusCode !== 200) { r.resume(); const e = new Error('HTTP ' + r.statusCode); e.status = r.statusCode; return rej(e); }
      const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(Buffer.concat(c)));
    });
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

(async () => {
  const done = {};
  for (const [file, cands] of Object.entries(jobs)) {
    let ok = false;
    for (const title of cands) {
      if (ok) break;
      const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/'
        + encodeURIComponent(title.replace(/ /g, '_')) + '?width=1700';
      for (let a = 0; a < 5 && !ok; a++) {
        try {
          const buf = await fetchBin(url);
          if (buf.length < 20000) throw new Error('short ' + buf.length);
          fs.writeFileSync(OUT + file, buf);
          console.log('ok ' + file + ' <- "' + title + '" ' + Math.round(buf.length / 1024) + 'KB');
          done[file] = title; ok = true;
        } catch (e) {
          console.log('   ' + file + ' :: ' + e.message);
          await sleep(e.status === 429 ? 45000 : 5000);
        }
      }
    }
    if (!ok) console.log('FAIL ' + file);
    await sleep(3000);
  }
  fs.writeFileSync('fixed.json', JSON.stringify(done, null, 1));
})();
