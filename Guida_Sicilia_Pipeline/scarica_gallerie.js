/* Scarica una o piu' foto per posto e prepara le due misure (900 e 480).
   La prima foto di un posto e' "chiave.jpg", le successive "chiave-2.jpg",
   "chiave-3.jpg": sono quelle che il carosello mostra con le freccette.

   Ingresso, due forme:
     { "chiave": ["Titolo1.jpg", "Titolo2.jpg"] }          parte da chiave.jpg
     { "chiave": { "da": 2, "file": ["Titolo.jpg"] } }      parte da chiave-2.jpg
                                                           (la prima c'e' gia')

   Uso: node scarica_gallerie.js elenco.json

   Wikimedia risponde 429 con generosita': il backoff da 45 secondi non e'
   prudenza, e' il minimo per non finire a scaricare pagine di errore da 2 KB
   scambiandole per foto. */

const https = require('https');
const fs = require('fs');
const { execFileSync } = require('child_process');

const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
const TMP = './grezze_gallerie/';
fs.mkdirSync(TMP, { recursive: true });

const UA = 'SiciliaGuidaViaggio/1.0 (guida personale non commerciale)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function scarica(url, n) {
  n = n || 0;
  return new Promise((res, rej) => {
    if (n > 6) return rej(new Error('troppi redirect'));
    const req = https.get(url, { headers: { 'User-Agent': UA, Accept: 'image/*' } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume(); return res(scarica(new URL(r.headers.location, url).href, n + 1));
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

function testo(url) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, r => {
      if (r.statusCode !== 200) { r.resume(); const e = new Error('HTTP ' + r.statusCode); e.status = r.statusCode; return rej(e); }
      let s = ''; r.on('data', d => s += d); r.on('end', () => res(s));
    });
    req.setTimeout(45000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

/* autore e licenza vanno letti dal file, non inventati */
async function licenza(titolo) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json'
    + '&titles=' + encodeURIComponent('File:' + titolo)
    + '&prop=imageinfo&iiprop=extmetadata';
  for (let a = 0; a < 4; a++) {
    try {
      const t = await testo(url);
      if (t.trim()[0] !== '{') throw new Error('non json');
      const j = JSON.parse(t);
      const p = Object.values(j.query.pages)[0];
      const em = (p.imageinfo && p.imageinfo[0] && p.imageinfo[0].extmetadata) || {};
      return {
        author: (em.Artist && em.Artist.value || '').replace(/<[^>]+>/g, '').trim().slice(0, 60),
        license: (em.LicenseShortName && em.LicenseShortName.value) || 'CC BY-SA'
      };
    } catch (e) {
      await sleep(e.status === 429 ? 45000 : 6000 * (a + 1));
    }
  }
  return null;
}

function ridimensiona(sorgente, destinazione, larghezza) {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', sorgente,
    '-vf', 'scale=w=' + larghezza + ':h=' + larghezza + ':force_original_aspect_ratio=decrease',
    '-q:v', '5', destinazione]);
}

(async () => {
  const elenco = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const crediti = JSON.parse(fs.readFileSync('credits.json', 'utf8'));

  let ok = 0, saltate = 0;
  const falliti = [];
  const fatte = {};

  for (const [chiave, valore] of Object.entries(elenco)) {
    const titoli = Array.isArray(valore) ? valore : valore.file;
    const da = Array.isArray(valore) ? 1 : (valore.da || 1);
    fatte[chiave] = [];

    for (let i = 0; i < titoli.length; i++) {
      const n = da + i;
      const nome = n === 1 ? chiave + '.jpg' : chiave + '-' + n + '.jpg';
      const dest = IMG + nome;
      const piccola = IMG + nome.replace(/\.jpg$/, '-480.jpg');
      const titolo = titoli[i];

      if (fs.existsSync(dest) && fs.statSync(dest).size > 20000) {
        if (!fs.existsSync(piccola)) ridimensiona(dest, piccola, 480);
        fatte[chiave].push(nome); saltate++;
        continue;
      }

      const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/'
        + encodeURIComponent(titolo.replace(/ /g, '_')) + '?width=1600';

      let riuscita = false;
      for (let a = 0; a < 4 && !riuscita; a++) {
        try {
          const buf = await scarica(url);
          /* una pagina d'errore di Wikimedia pesa ~2 KB e non e' un jpeg:
             senza questo controllo finisce dentro il sito come foto */
          if (buf.length < 15000) throw new Error('troppo piccola (' + buf.length + 'B)');
          if (buf.slice(0, 2).toString('hex') !== 'ffd8') throw new Error('non e\u0027 un jpeg');

          const grezza = TMP + nome;
          fs.writeFileSync(grezza, buf);
          ridimensiona(grezza, dest, 900);
          ridimensiona(grezza, piccola, 480);

          const lic = await licenza(titolo);
          crediti[n === 1 ? chiave : chiave + '-' + n] = {
            file: nome,
            title: titolo,
            author: (lic && lic.author) || '',
            license: (lic && lic.license) || 'CC BY-SA',
            source: 'https://commons.wikimedia.org/wiki/File:' + titolo.replace(/ /g, '_')
          };
          fs.writeFileSync('credits.json', JSON.stringify(crediti, null, 1));

          fatte[chiave].push(nome);
          console.log('  ok  ' + nome.padEnd(26) + Math.round(fs.statSync(dest).size / 1024) + 'KB  <- ' + titolo);
          riuscita = true; ok++;
        } catch (e) {
          if (e.status === 404) { console.log('  --  ' + nome + ' :: non esiste su Commons'); break; }
          console.log('      ' + nome + ' :: ' + e.message + (e.status === 429 ? ' (aspetto 45s)' : ''));
          await sleep(e.status === 429 ? 45000 : 6000 * (a + 1));
        }
      }
      if (!riuscita) falliti.push(nome);
      await sleep(2500);
    }
  }

  fs.writeFileSync('gallerie_fatte.json', JSON.stringify(fatte, null, 1));
  console.log('\nscaricate ' + ok + ', gia\u0027 presenti ' + saltate);
  if (falliti.length) console.log('NON RIUSCITE: ' + falliti.join(', '));
  console.log('elenco per dati.js scritto in gallerie_fatte.json');
})();
