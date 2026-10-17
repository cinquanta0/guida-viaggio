const https = require('https');
const fs = require('fs');
const { execFileSync } = require('child_process');

const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
const TMP = './grezze7/';
fs.mkdirSync(TMP, { recursive: true });

const scelte = {
  sangiorgioragusa: ["San giorgio Ragusa Ibla.jpg"]
};

const meta = {};
for (const f of fs.readdirSync('.').filter(x => /^r\d+\.json$/.test(x))) {
  for (const a of Object.values(JSON.parse(fs.readFileSync(f, 'utf8')))) {
    if (Array.isArray(a)) for (const it of a) if (it && it.title) meta[it.title] = it;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaOfflineGuide/1.0 (personal, non-commercial; single user)';

function prendi(url, n) {
  n = n || 0;
  return new Promise((res, rej) => {
    if (n > 6) return rej(new Error('redirect'));
    const req = https.get(url, { headers: { 'User-Agent': UA, Accept: 'image/*' } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume(); return res(prendi(new URL(r.headers.location, url).href, n + 1));
      }
      if (r.statusCode !== 200) {
        r.resume(); const e = new Error('HTTP ' + r.statusCode); e.status = r.statusCode; return rej(e);
      }
      const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(Buffer.concat(c)));
    });
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

(async () => {
  const cr = JSON.parse(fs.readFileSync('credits.json', 'utf8'));
  const chiavi = Object.keys(scelte);
  let fatte = 0; const falliti = [];
  for (let i = 0; i < chiavi.length; i++) {
    const k = chiavi[i];
    const dest = IMG + k + '.jpg';
    if (fs.existsSync(dest) && fs.statSync(dest).size > 20000) { fatte++; continue; }
    let ok = false;
    for (const titolo of scelte[k]) {
      if (ok) break;
      const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/'
        + encodeURIComponent(titolo.replace(/ /g, '_')) + '?width=1400';
      for (let a = 0; a < 4 && !ok; a++) {
        try {
          const buf = await prendi(url);
          if (buf.length < 15000) throw new Error('troppo piccola');
          const magia = buf.slice(0, 4).toString('hex');
          if (magia.slice(0, 4) !== 'ffd8' && magia !== '89504e47') throw new Error('non e una immagine');
          const grezza = TMP + k + (magia === '89504e47' ? '.png' : '.jpg');
          fs.writeFileSync(grezza, buf);
          execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', grezza,
            '-vf', 'scale=w=900:h=900:force_original_aspect_ratio=decrease', '-q:v', '5', dest]);
          const m = meta[titolo] || {};
          cr[k] = { file: k + '.jpg', title: titolo, author: m.artist || '',
            license: m.lic || 'CC BY-SA',
            source: 'https://commons.wikimedia.org/wiki/File:' + titolo.replace(/ /g, '_') };
          fs.writeFileSync('credits.json', JSON.stringify(cr, null, 1));
          console.log('[' + (i + 1) + '/' + chiavi.length + '] ok ' + k + '  ' + Math.round(fs.statSync(dest).size / 1024) + 'KB');
          ok = true; fatte++;
        } catch (e) {
          if (e.status === 404) { console.log('   ' + k + ' :: non esiste'); break; }
          console.log('   ' + k + ' :: ' + e.message);
          await sleep(e.status === 429 ? 45000 : 5000);
        }
      }
    }
    if (!ok) falliti.push(k);
    await sleep(2500);
  }
  console.log('\nscaricate ' + fatte + '/' + chiavi.length);
  if (falliti.length) console.log('SENZA FOTO: ' + falliti.join(', '));
})();
