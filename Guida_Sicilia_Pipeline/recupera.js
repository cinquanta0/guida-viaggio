const https = require('https');
const fs = require('fs');
const { execFileSync } = require('child_process');

const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
const TMP = 'C:/Users/lucad/AppData/Local/Temp/claude/C--Users-lucad/39b05157-81e5-4f36-becc-b65b72295450/scratchpad/grezze/';
fs.mkdirSync(TMP, { recursive: true });

const cr = JSON.parse(fs.readFileSync('credits.json', 'utf8'));
const meta = {};
for (const f of ['r1.json', 'r2.json', 'r3.json', 'r4.json', 'r5.json', 'r6.json']) {
  if (!fs.existsSync(f)) continue;
  for (const a of Object.values(JSON.parse(fs.readFileSync(f, 'utf8')))) {
    if (Array.isArray(a)) for (const it of a) if (it && it.title) meta[it.title] = it;
  }
}

/* chiave -> titolo su Commons */
const voluti = {};
for (const k of ['santamarialascala', 'santatecla', 'capomulini', 'laplaia', 'mazzaro',
  'giardininaxos', 'fontanebianche', 'mondello', 'egadi', 'ortigia_lungomare',
  'aretusa', 'teatro_siracusa', 'mercatoortigia', 'nelson', 'palermo_cattedrale', 'trapani']) {
  if (cr[k]) voluti[k] = cr[k].title;
}
voluti['licuti'] = 'Volcanic rock beach in San Giovanni li Cuti, Catania 2.jpg';
voluti['arenella'] = 'Spiaggia dell\'Arenella (Siracusa) 03.jpg';
voluti['zingaro'] = 'Riserva naturale orientata dello Zingaro, aprile 2026 - WLE2026 03.jpg';
voluti['alcantara'] = 'Gole dell\'Alcantara-pjt1.jpg';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaOfflineGuide/1.0 (personal, non-commercial; single user)';

function scarica(url, n) {
  n = n || 0;
  return new Promise((res, rej) => {
    if (n > 6) return rej(new Error('troppi redirect'));
    const req = https.get(url, { headers: { 'User-Agent': UA, Accept: 'image/*' } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume(); return res(scarica(new URL(r.headers.location, url).href, n + 1));
      }
      if (r.statusCode !== 200) {
        r.resume();
        const e = new Error('HTTP ' + r.statusCode); e.status = r.statusCode; return rej(e);
      }
      const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(Buffer.concat(c)));
    });
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

(async () => {
  const fatti = {};
  const chiavi = Object.keys(voluti);
  for (let i = 0; i < chiavi.length; i++) {
    const k = chiavi[i], titolo = voluti[k];
    const dest = IMG + k + '.jpg';
    if (fs.existsSync(dest) && fs.statSync(dest).size > 20000) { fatti[k] = titolo; continue; }

    const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/'
      + encodeURIComponent(titolo.replace(/ /g, '_')) + '?width=1400';
    let ok = false;
    for (let a = 0; a < 6 && !ok; a++) {
      try {
        const buf = await scarica(url);
        if (buf.length < 15000) throw new Error('troppo piccola ' + buf.length);
        if (buf.slice(0, 2).toString('hex') !== 'ffd8') throw new Error('non e jpeg');
        fs.writeFileSync(TMP + k + '.jpg', buf);
        execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', TMP + k + '.jpg',
          '-vf', 'scale=w=900:h=900:force_original_aspect_ratio=decrease', '-q:v', '5', dest]);
        console.log('[' + (i + 1) + '/' + chiavi.length + '] ok ' + k + '.jpg  '
          + Math.round(fs.statSync(dest).size / 1024) + 'KB');
        fatti[k] = titolo; ok = true;
      } catch (e) {
        console.log('[' + (i + 1) + '] riprovo ' + k + ' :: ' + e.message);
        await sleep(e.status === 429 ? 45000 : 6000);
      }
    }
    if (!ok) console.log('FALLITA ' + k);
    await sleep(2500);
  }

  /* aggiorna i crediti */
  for (const [k, titolo] of Object.entries(fatti)) {
    const m = meta[titolo] || {};
    cr[k] = {
      file: k + '.jpg', titolo: titolo, title: titolo,
      author: (cr[k] && cr[k].author) || m.artist || '',
      license: (cr[k] && cr[k].license) || m.lic || 'CC BY-SA',
      source: 'https://commons.wikimedia.org/wiki/File:' + titolo.replace(/ /g, '_')
    };
  }
  fs.writeFileSync('credits.json', JSON.stringify(cr, null, 1));
  console.log('\nrecuperate ' + Object.keys(fatti).length + '/' + chiavi.length);
})();
