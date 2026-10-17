const https = require('https');
const fs = require('fs');
const OUT = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaOfflineGuide/1.0 (personal, non-commercial; single user)';

const jobs = {
  'sfincione.jpg': ['Sfincione palermitano 3.jpg', 'Sfincione palermitano 2.jpg'],
  'gelato.jpg': ['Gelato pistacchio.jpg', 'Coppa gelato pistacchio.jpg', 'Gelato al pistacchio di Bronte.jpg', 'Semifreddo ai pistacchi.jpg'],
  'panelle.jpg': ['Pane e panelle.jpg', 'Coppo di panelle e crocchè all\'Azzurro Food Festival 2025 a Sciacca (AG).jpg']
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
      for (let a = 0; a < 4 && !ok; a++) {
        try {
          const buf = await fetchBin(url);
          if (buf.length < 20000) throw new Error('short ' + buf.length);
          if (buf.slice(0, 2).toString('hex') !== 'ffd8') throw new Error('non jpeg');
          fs.writeFileSync(OUT + file, buf);
          console.log('ok ' + file + ' <- "' + title + '" ' + Math.round(buf.length / 1024) + 'KB');
          done[file] = title; ok = true;
        } catch (e) {
          console.log('   ' + file + ' / ' + title + ' :: ' + e.message);
          if (e.status === 404 || /non jpeg/.test(e.message)) break;
          await sleep(e.status === 429 ? 45000 : 5000);
        }
      }
    }
    if (!ok) console.log('FAIL ' + file + ' (resta quella attuale)');
    await sleep(3000);
  }
  fs.writeFileSync('fixed3.json', JSON.stringify(done, null, 1));
})();
