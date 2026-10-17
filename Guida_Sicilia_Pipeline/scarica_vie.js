/* Scarica le foto per cinque schede rimaste scoperte: le vie dello shopping
   e un borgo. Non erano mai state cercate perche' nel gruppo "spesa" stanno
   soprattutto negozi, di cui foto libere non esistono; ma un corso cittadino
   e' un luogo, e su Commons c'e'.

   Ogni file e' gia' passato da verifica_luogo.js: coordinate, categorie e
   descrizione dicono che il soggetto e' quello giusto.

   Restano fuori di proposito:
   - Corso Cavour per "Shopping a Messina": la scheda parla di via Garibaldi
     e via I Settembre, quindi sarebbe la foto di un'altra strada.
   - "Etna da Macchia" per Macchia di Giarre: inquadra il vulcano, non il
     borgo. E' lo stesso errore dell'eruzione finita sul porto di Riposto.
     Prendo la Chiesa Madre, che il paese lo mostra davvero.

   Scrive le due misure che vuole build.js: piena a 900px e -480 per il
   telefono. Uso: node scarica_vie.js  */

const https = require('https');
const fs = require('fs');
const { execFileSync } = require('child_process');

const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';
const TMP = './grezze_vie/';
fs.mkdirSync(TMP, { recursive: true });

/* Il primo titolo e' quello scelto; gli altri sono le riserve, provate in
   ordine se il primo non si scarica.

   Per via Etnea e Cefalu' la prima infornata aveva dato foto deboli: il
   Palazzo Minoriti era coperto da un cartellone pubblicitario e da un
   ponteggio, e il corso di Cefalu' era una veduta datata (c'e' ancora
   l'insegna del Banco di Sicilia, marchio sparito nel 2010) con le auto in
   primo piano. Il soggetto era giusto, ma la scheda promette una via da
   passeggio e le foto mostravano un cantiere e un parcheggio. Le seconde
   arrivano dalle categorie, che su Commons rendono sempre piu' della
   ricerca per titolo. */
const scelte = {
  viaetnea:        ['Catania - Via Etnea.jpg', 'Catania, Via Etnea, Palazzo Minoriti.jpg'],
  corsoumberto:    ['Corso Umberto Taormina - panoramio.jpg'],
  corsoruggero:    ['Crowded street with tourists, Cefalú, Sicily, Italy (9449811633).jpg',
                    'Corso Ruggero (Cefalù) 01 (js).jpg'],
  corsovittoriotp: ['Trapani - Corso Vittorio Emanuele - panoramio (1).jpg'],
  macchiagiarre:   ['Chiesa Madre di Macchia.jpg']
};

/* i metadati (autore, licenza) stanno nei risultati delle ricerche */
const meta = {};
for (const f of ['ris_scoperti.json', 'ris_cat_vie.json']) {
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
  let fatte = 0; const falliti = [];

  for (let i = 0; i < chiavi.length; i++) {
    const k = chiavi[i];
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
          /* Wikimedia sotto rate limit risponde con pagine di errore da pochi KB:
             se non controllo, finiscono su disco come se fossero foto */
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
          console.log('ok  ' + k.padEnd(18)
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
