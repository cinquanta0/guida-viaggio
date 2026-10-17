/* Scarica le foto per i piatti di pesce nuovi.

   Solo due, e non e' una resa: sono le uniche due con un soggetto giusto e
   una misura utilizzabile.

   - Lo **stoccafisso alla messinese** su Commons c'e', ma e' 436x333: sotto
     la misura piccola del sito, che e' 480. E la categoria "Stockfish dishes"
     contiene bacalhau portoghese e sgombro giapponese: mettere quelli sotto
     il nome di un piatto messinese sarebbe una foto finta.
   - Il **nero di seppia** non ha nemmeno la categoria (Squid ink dishes non
     esiste).
   - La **masculina da magghia** non ha foto su Commons, ed e' il piatto piu'
     interessante dei cinque.

   Quei tre entrano senza foto, come le altre voci gia' dichiarate.

   Uso: node scarica_pesce.js  */

const https = require('https');
const fs = require('fs');
const { execFileSync } = require('child_process');

const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
const TMP = './grezze_pesce/';
fs.mkdirSync(TMP, { recursive: true });

const scelte = {
  polpo:   ["Polpo all'olio di oliva e limone.jpg"],
  neonata: ['Neonata (novellame).jpg']
};

/* i metadati stanno nei risultati delle ricerche gia' fatte */
const meta = {};
for (const f of ['ris_pesce.json', 'ris_cat_pesce.json', 'elenco_cucina.json']) {
  if (!fs.existsSync(f)) continue;
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const dentro = Array.isArray(j) ? j : Object.values(j);
    for (const a of dentro) {
      const lista = Array.isArray(a) ? a : [a];
      for (const it of lista) if (it && it.title) meta[it.title] = it;
    }
  } catch (e) { /* file con un'altra forma: lo salto */ }
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

  for (const k of chiavi) {
    const dest = IMG + k + '.jpg';
    const dest480 = IMG + k + '-480.jpg';
    let ok = false;

    for (const titolo of scelte[k]) {
      if (ok) break;
      const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/'
        + encodeURIComponent(titolo.replace(/ /g, '_')) + '?width=1400';
      for (let a = 0; a < 4 && !ok; a++) {
        try {
          const buf = await prendi(url);
          if (buf.length < 15000) throw new Error('troppo piccola, forse una pagina di errore');
          if (buf.slice(0, 2).toString('hex') !== 'ffd8') throw new Error('non e un jpeg');
          fs.writeFileSync(TMP + k + '.jpg', buf);
          execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', TMP + k + '.jpg',
            '-vf', 'scale=w=900:h=900:force_original_aspect_ratio=decrease', '-q:v', '5', dest]);
          execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', TMP + k + '.jpg',
            '-vf', 'scale=w=480:h=480:force_original_aspect_ratio=decrease', '-q:v', '5', dest480]);
          const m = meta[titolo] || {};
          cr[k] = {
            file: k + '.jpg', title: titolo, author: m.artist || '',
            license: m.lic || 'CC BY-SA',
            source: 'https://commons.wikimedia.org/wiki/File:' + titolo.replace(/ /g, '_')
          };
          fs.writeFileSync('credits.json', JSON.stringify(cr, null, 1));
          console.log('ok  ' + k.padEnd(10)
            + Math.round(fs.statSync(dest).size / 1024) + 'KB  +  '
            + Math.round(fs.statSync(dest480).size / 1024) + 'KB (480)');
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
