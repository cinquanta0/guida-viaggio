/* freshness.js — il "guardiano" del sito: controlla se i posti in elenco sono
   ancora APERTI e raccoglie segnali (rating, n. recensioni) come SPIA, non come
   selettore. NON sceglie i migliori, NON aggiunge posti, NON fa deploy: produce
   solo un report. L'aggiunta/promozione resta scelta umana.

   Fonte: Google Places API (New) — searchText. Costo tenuto a zero così:
     - controlla al massimo MAX posti a giro (default 60), A ROTAZIONE
       (salva l'indice in freshness_cursor.json: il giro dopo riparte da lì)
     - modalità a secco (--dry) = ZERO chiamate, stampa solo cosa controllerebbe

   Uso:
     node freshness.js --dry           # prova senza spendere
     node freshness.js                 # controlla i prossimi MAX posti
     FRESHNESS_MAX=30 node freshness.js # cambia il tetto

   Output:
     freshness_report.md   — da leggere (chiusi, segnali, da guardare)
     freshness_flags.json  — { chiusi:[...], segnali:[...] } per gli altri script */

const https = require('https');
const fs = require('fs');

const DRY = process.argv.includes('--dry');
const MAX = parseInt(process.env.FRESHNESS_MAX || '60', 10);
/* in locale: da chiave_google.js · in cloud (GitHub): dal segreto GOOGLE_PLACES_KEY */
const KEY = process.env.GOOGLE_PLACES_KEY || (() => { try { return require('./chiave_google.js'); } catch (_) { return ''; } })();
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* carico i posti dai due DB; tengo nome, zona, città (per la query) e un id stabile */
function carica() {
  const out = [];
  const PUBBLICATI = p => p && p.n && (p.aff === 'sel' || p.aff === 'ver'); // NON i 'auto' (bacino da esplorare)
  try {
    require('./dati.js').filter(PUBBLICATI).forEach(p => {
      out.push({ fonte: 'sicilia', aff: p.aff, id: p.id || ('sic:' + p.n), n: p.n, z: p.z || '', citta: p.z || '', regione: 'Sicilia' });
    });
  } catch (e) { console.error('dati.js non letto:', e.message); }
  try {
    require('./dati_napoli.js').filter(PUBBLICATI).forEach(p => {
      out.push({ fonte: 'napoli', aff: p.aff, id: p.id || ('nap:' + p.n), n: p.n, z: p.z || '', citta: p.citta || '', regione: 'Campania' });
    });
  } catch (e) { console.error('dati_napoli.js non letto:', e.message); }
  /* i 'sel' (i migliori, pochi) prima: li controlliamo più spesso */
  out.sort((a, b) => (a.aff === 'sel' ? 0 : 1) - (b.aff === 'sel' ? 0 : 1));
  return out;
}

function postPlaces(testo) {
  const body = JSON.stringify({ textQuery: testo, languageCode: 'it', maxResultCount: 1 });
  const opt = {
    method: 'POST', host: 'places.googleapis.com', path: '/v1/places:searchText',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.displayName,places.businessStatus,places.rating,places.userRatingCount,places.formattedAddress'
    }
  };
  return new Promise((res, rej) => {
    const req = https.request(opt, r => {
      let s = ''; r.on('data', d => s += d);
      r.on('end', () => { try { res({ status: r.statusCode, j: JSON.parse(s || '{}') }); } catch (e) { rej(e); } });
    });
    req.setTimeout(30000, () => req.destroy(new Error('timeout')));
    req.on('error', rej); req.write(body); req.end();
  });
}

(async () => {
  const posti = carica();
  if (!posti.length) { console.error('nessun posto caricato'); process.exit(1); }

  /* rotazione: riparto da dove avevo lasciato */
  let cur = 0;
  try { cur = JSON.parse(fs.readFileSync('freshness_cursor.json', 'utf8')).i || 0; } catch (_) {}
  if (cur >= posti.length) cur = 0;
  const lotto = posti.slice(cur, cur + MAX);
  const prossimo = (cur + MAX) % posti.length;

  console.log((DRY ? '[A SECCO] ' : '') + 'controllo ' + lotto.length + ' posti (da ' + cur + ' a ' + (cur + lotto.length - 1) + ' di ' + posti.length + ')');

  if (DRY) {
    lotto.forEach(p => console.log('  - ' + p.n + '  [' + (p.citta || p.z) + ']'));
    console.log('\nNessuna chiamata fatta. Togli --dry per controllare davvero.');
    return;
  }
  if (!KEY) { console.error('manca la chiave Google (chiave_google.js)'); process.exit(1); }

  const chiusi = [], segnali = [], errori = [];
  for (const p of lotto) {
    try {
      const q = [p.n, p.citta, p.regione].filter(Boolean).join(', ');
      const { status, j } = await postPlaces(q);
      if (status !== 200) { errori.push({ n: p.n, status }); await sleep(400); continue; }
      const g = j.places && j.places[0];
      if (!g) { errori.push({ n: p.n, status: 'non trovato' }); await sleep(400); continue; }
      const stato = g.businessStatus || 'UNKNOWN';
      const rec = { id: p.id, n: p.n, citta: p.citta || p.z, stato, rating: g.rating || null, voti: g.userRatingCount || 0 };
      if (stato !== 'OPERATIONAL') chiusi.push(rec);
      else if ((g.rating && g.rating < 4.0) || (g.userRatingCount && g.userRatingCount < 30)) segnali.push(rec);
      await sleep(400);
    } catch (e) { errori.push({ n: p.n, status: e.message }); await sleep(400); }
  }

  fs.writeFileSync('freshness_cursor.json', JSON.stringify({ i: prossimo }, null, 1));
  fs.writeFileSync('freshness_flags.json', JSON.stringify({ chiusi, segnali, quando: new Date().toISOString() }, null, 1));

  let md = '# Freshness — ' + new Date().toISOString().slice(0, 10) + '\n\n';
  md += 'Controllati ' + lotto.length + ' posti su ' + posti.length + ' (prossimo giro da ' + prossimo + ').\n\n';
  md += '## Risultano CHIUSI (da togliere/segnare) — ' + chiusi.length + '\n';
  md += chiusi.length ? chiusi.map(c => '- **' + c.n + '** (' + c.citta + ') → ' + c.stato).join('\n') : '_nessuno_';
  md += '\n\n## Segnali da guardare (rating basso o pochi voti) — ' + segnali.length + '\n';
  md += segnali.length ? segnali.map(s => '- ' + s.n + ' (' + s.citta + ') → ' + (s.rating || '?') + '★ / ' + s.voti + ' voti').join('\n') : '_nessuno_';
  md += '\n\n_Nota: rating e voti sono SPIE per decidere a mano, non pubblicati sul sito e non un criterio di ingresso._\n';
  if (errori.length) md += '\n## Non verificati (' + errori.length + ')\n' + errori.map(e => '- ' + e.n + ' (' + e.status + ')').join('\n') + '\n';
  fs.writeFileSync('freshness_report.md', md);

  console.log('\n--- FATTO ---  chiusi:', chiusi.length, '| segnali:', segnali.length, '| errori:', errori.length);
  console.log('report: freshness_report.md');
})();
