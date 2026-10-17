/* Foto per i piatti/monumenti di Napoli, a licenza libera.
   Flusso (preciso, non "indovina il nome del file"):
     1. cerca la voce su it.wikipedia
     2. prende l'IMMAGINE PRINCIPALE della voce (infobox) via prop=pageimages
        -> e' quella giusta, non un file a caso dell'articolo
     3. chiede a Commons licenza, autore, misure, pagina-fonte
     4. tiene solo licenze LIBERE (CC BY / CC BY-SA / CC0 / pubblico dominio)
     5. scarica e ridimensiona con sharp: <file>.jpg (900px) + <file>-480.jpg
     6. scrive i crediti in credits_napoli.json e la mappa slug->file

   Uso: node foto_napoli.js lista.json
   lista.json = { "slug": "Termine di ricerca su Wikipedia", ... }
   Le foto NON vengono agganciate ai dati: lo decido io dopo averle guardate. */

const https = require('https');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMGDIR = path.join(__dirname, '..', 'Guida_Sicilia_Sito', 'assets', 'img');
const UA = 'GuidaViaggio/1.0 (+https://guida-sicilia-2026.web.app) non-commercial personal guide';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const LIBERE = /(^|[^-])\bcc0\b|cc[ -]?by([ -]?sa)?|public domain|pubblico dominio|\bpd\b|dominio pubblico/i;
const NONLIBERE = /non[- ]?free|fair use|copyright|tutti i diritti|all rights/i;

function getRaw(host, percorso, binary) {
  return new Promise((res, rej) => {
    const req = https.get({ host, path: percorso, headers: { 'User-Agent': UA } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        const u = new URL(r.headers.location, 'https://' + host);
        r.resume();
        return getRaw(u.host, u.pathname + u.search, binary).then(res, rej);
      }
      if (r.statusCode !== 200) { r.resume(); const e = new Error('HTTP ' + r.statusCode); e.status = r.statusCode; return rej(e); }
      if (binary) { const b = []; r.on('data', d => b.push(d)); r.on('end', () => res(Buffer.concat(b))); }
      else { let s = ''; r.on('data', d => s += d); r.on('end', () => res(s)); }
    });
    req.setTimeout(45000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}
async function json(host, percorso) {
  for (let a = 0; a < 4; a++) {
    try { const t = await getRaw(host, percorso, false); if (t.trim()[0] === '{') return JSON.parse(t); }
    catch (e) { if (e.status === 429) { await sleep(30000); continue; } }
    await sleep(3000 * (a + 1));
  }
  return null;
}
const pulisci = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* il download delle immagini da upload.wikimedia.org ogni tanto risponde 429:
   va ritentato con pausa crescente, altrimenti si perde quasi tutto */
async function scarica(url) {
  const u = new URL(url);
  for (let a = 0; a < 6; a++) {
    try { return await getRaw(u.host, u.pathname + u.search, true); }
    catch (e) {
      if (e.status === 429) { await sleep(8000 * (a + 1)); continue; }
      if (a < 2) { await sleep(3000); continue; }
      throw e;
    }
  }
  throw new Error('429 persistente');
}

(async () => {
  const lista = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const crediti = [];
  const mappa = {};
  const scartati = [];

  for (const [slug, termine] of Object.entries(lista)) {
    process.stdout.write('## ' + slug + '  ("' + termine + '") … ');

    // 1. voce
    const ric = await json('it.wikipedia.org',
      '/w/api.php?action=query&format=json&list=search&srlimit=1&srsearch=' + encodeURIComponent(termine));
    const voce = ric && ric.query && ric.query.search && ric.query.search[0];
    if (!voce) { console.log('nessuna voce'); scartati.push([slug, 'nessuna voce']); await sleep(900); continue; }

    // 2. immagine principale della voce
    const pi = await json('it.wikipedia.org',
      '/w/api.php?action=query&format=json&prop=pageimages&piprop=original|name&titles=' + encodeURIComponent(voce.title));
    const pg = pi && pi.query && pi.query.pages && Object.values(pi.query.pages)[0];
    const nomeFile = pg && pg.pageimage;
    if (!nomeFile || !/\.(jpe?g|png)$/i.test(nomeFile)) { console.log('voce "' + voce.title + '" senza foto infobox'); scartati.push([slug, 'no infobox']); await sleep(900); continue; }

    // 3. licenza + info da Commons
    const info = await json('commons.wikimedia.org',
      '/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&titles=' + encodeURIComponent('File:' + nomeFile));
    const cp = info && info.query && info.query.pages && Object.values(info.query.pages)[0];
    const ii = cp && cp.imageinfo && cp.imageinfo[0];
    if (!ii) { console.log('niente imageinfo'); scartati.push([slug, 'no imageinfo']); await sleep(900); continue; }
    const em = ii.extmetadata || {};
    const lic = pulisci(em.LicenseShortName && em.LicenseShortName.value) || '?';
    if (NONLIBERE.test(lic) || !LIBERE.test(lic)) { console.log('licenza non libera (' + lic + ')'); scartati.push([slug, 'licenza ' + lic]); await sleep(900); continue; }
    if (ii.width < 640) { console.log('troppo piccola (' + ii.width + 'px)'); scartati.push([slug, 'piccola ' + ii.width]); await sleep(900); continue; }

    // 4. scarico + ridimensiono
    let buf;
    try { buf = await scarica(ii.url); }
    catch (e) { console.log('download fallito: ' + e.message); scartati.push([slug, 'download']); await sleep(1500); continue; }

    const file = 'nap-' + slug + '.jpg';
    try {
      await sharp(buf).rotate().resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(path.join(IMGDIR, file));
      await sharp(buf).rotate().resize({ width: 480, withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(path.join(IMGDIR, file.replace('.jpg', '-480.jpg')));
    } catch (e) { console.log('resize fallito: ' + e.message); scartati.push([slug, 'resize']); await sleep(900); continue; }

    crediti.push({
      file, slug, voce: voce.title,
      autore: pulisci(em.Artist && em.Artist.value) || 'ignoto',
      licenza: lic,
      fonte: ii.descriptionurl || ('https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(nomeFile))
    });
    mappa[slug] = file;
    console.log('OK  ' + ii.width + 'x' + ii.height + '  ' + lic);
    await sleep(900);
  }

  fs.writeFileSync('credits_napoli.json', JSON.stringify(crediti, null, 1));
  fs.writeFileSync('mappa_foto_napoli.json', JSON.stringify(mappa, null, 1));
  console.log('\n--- FATTO ---');
  console.log('prese: ' + Object.keys(mappa).length + ' | scartate: ' + scartati.length);
  if (scartati.length) console.log('scartate:', scartati.map(x => x[0] + ' (' + x[1] + ')').join(', '));
})();
