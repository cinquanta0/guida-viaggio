const https = require('https');
const fs = require('fs');
const { execFileSync } = require('child_process');

const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
const TMP = './grezze2/';
fs.mkdirSync(TMP, { recursive: true });

/* chiave -> candidati su Commons, in ordine di preferenza */
const scelte = {
  acicastello: ['Aci Castello Sicily Italy - Creative Commons by gnuckx (5085398127).jpg'],
  riposto: ['Riposto (Catania province).jpg', 'Lungomare Riposto 2.jpg'],
  torrearchirafi: ['Torre Archirafi 02.jpg', 'Torre Archirafi 01.jpg'],
  fiumefreddo: ['Oasi Fiumefreddo - panoramio.jpg'],
  zafferana: ['Zafferana Etnea 2017-04-27h.jpg'],
  trecastagni: ['Trecastagni panorama.jpg'],
  milo: ['Edificio del Comune di Milo.jpg'],
  randazzo: ['Randazzo, Catania, Sicily, Italy.jpg'],
  castiglione: ['Vista di Castiglione di Sicilia.jpg'],
  savoca: ['Savoca Bar Vitelli.jpg', 'Savoca - Bar Vitelli.jpg', 'Savoca.jpg',
    'Savoca, Messina, Sicily, Italy - panoramio.jpg', 'Savoca panorama.jpg'],
  forzadagro: ['Forza d\'Agro 009 4019.jpg'],
  milazzo: ['Castello (Milazzo) 03 11 2024 33.jpg'],
  augusta: ['Augusta - Castello svevo 3376.jpg'],
  brucoli: ['Brucoli Syracuse Sicily Italy - Creative Commons by gnuckx - panoramio (64).jpg'],
  avola: ['Panorama di Avola (Sicilia) - panoramio.jpg'],
  cavagrande: ['Cavagrande del Cassibile-pjt.jpg', 'Laghetti Cavagrande.jpg'],
  notomarina: ['Spiaggia del Lido di Noto.jpg'],
  vendicari: ['Tonnara Vendicari (2017).jpg'],
  pachino: ['Pomodoro di Pachino.jpg'],
  portopalo: ['Portopalo di Capo Passero.jpg', 'Portopalo dal mare.jpg'],
  isolacorrenti: ['Isola delle Correnti, Portopalo di Capo Passero, Syracuse, Sicily, Italy - panoramio.jpg'],
  caltagirone: ['Scalinata di Santa Maria del Monte, Caltagirone, Sicily, Italy (4894141011).jpg'],
  scicli: ['Scicli ChurchSanta Maria della Croce 010 0873.jpg'],
  marinaragusa: ['Marina di Ragusa, Province of Ragusa, Italy - panoramio (2).jpg'],
  sampieri: ['Fornace penna 4-1-2020.jpg'],
  catania_ursino: ['Castello Ursino, Catania 2024.jpg'],
  catania_benedettini: ['Catania, ex Monastero dei Benedettini 1.jpg'],
  maniace: ['The Castle of Maniace, Ortigia, Siracusa, Sicily.jpg']
};

const meta = {};
for (const f of ['r1.json', 'r2.json', 'r3.json', 'r4.json', 'r5.json', 'r6.json', 'r7.json', 'r8.json']) {
  if (!fs.existsSync(f)) continue;
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
  let fatte = 0;
  const falliti = [];

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
          if (buf.length < 15000) throw new Error('piccola');
          if (buf.slice(0, 2).toString('hex') !== 'ffd8') throw new Error('non jpeg');
          fs.writeFileSync(TMP + k + '.jpg', buf);
          execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', TMP + k + '.jpg',
            '-vf', 'scale=w=900:h=900:force_original_aspect_ratio=decrease', '-q:v', '5', dest]);
          const m = meta[titolo] || {};
          cr[k] = {
            file: k + '.jpg', title: titolo, author: m.artist || '',
            license: m.lic || 'CC BY-SA',
            source: 'https://commons.wikimedia.org/wiki/File:' + titolo.replace(/ /g, '_')
          };
          fs.writeFileSync('credits.json', JSON.stringify(cr, null, 1));
          console.log('[' + (i + 1) + '/' + chiavi.length + '] ok ' + k + '  '
            + Math.round(fs.statSync(dest).size / 1024) + 'KB');
          ok = true; fatte++;
        } catch (e) {
          if (e.status === 404) { console.log('   ' + k + ' :: non esiste "' + titolo.slice(0, 40) + '"'); break; }
          console.log('   ' + k + ' :: ' + e.message);
          await sleep(e.status === 429 ? 45000 : 5000);
        }
      }
    }
    if (!ok) falliti.push(k);
    await sleep(2500);
  }
  console.log('\nscaricate ' + fatte + '/' + chiavi.length);
  if (falliti.length) console.log('FALLITE: ' + falliti.join(', '));
})();
