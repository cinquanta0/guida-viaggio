/* Cerca foto con licenza libera FUORI da Wikimedia Commons.

   Openverse indicizza Flickr e altri archivi tenendo solo licenze aperte.
   Serve per i piatti che su Commons non esistono: la carne di cavallo
   catanese, l'arrusti e mangia, il patacalzone.

   Si filtra su CC0, CC BY e CC BY-SA: le stesse licenze delle foto gia'
   usate, cosi' il registro dei crediti resta coerente e la riga in fondo
   al sito continua a dire il vero.

   Uso: node cerca_openverse.js query.json risultato.json */

const https = require('https');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'SiciliaGuidaViaggio/1.0 (guida di viaggio personale non commerciale)';

function json(percorso) {
  return new Promise((res, rej) => {
    const req = https.get({
      host: 'api.openverse.org', path: percorso,
      headers: { 'User-Agent': UA, Accept: 'application/json' }
    }, r => {
      let s = '';
      r.on('data', d => s += d);
      r.on('end', () => {
        if (r.statusCode !== 200) return rej(new Error('HTTP ' + r.statusCode + ' ' + s.slice(0, 120)));
        try { res(JSON.parse(s)); } catch (e) { rej(e); }
      });
    });
    req.setTimeout(45000, () => req.destroy(new Error('timeout')));
    req.on('error', rej);
  });
}

(async () => {
  const query = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const esito = {};

  for (const [chiave, q] of Object.entries(query)) {
    console.log('## ' + chiave + '   «' + q + '»');
    const url = '/v1/images/?q=' + encodeURIComponent(q)
      + '&license=cc0,by,by-sa&page_size=8&mature=false';
    let j = null;
    for (let a = 0; a < 3 && !j; a++) {
      try { j = await json(url); }
      catch (e) { console.log('   ' + e.message); await sleep(6000 * (a + 1)); }
    }
    if (!j) { await sleep(1500); continue; }

    const buoni = (j.results || [])
      .filter(x => x.width >= 800 && x.width > x.height * 1.1)
      .map(x => ({
        titolo: x.title || '',
        autore: x.creator || '',
        licenza: (x.license || '').toUpperCase() + (x.license_version ? ' ' + x.license_version : ''),
        fonte: x.foreign_landing_url || x.url,
        file: x.url,
        w: x.width, h: x.height
      }));

    esito[chiave] = buoni;
    if (!buoni.length) console.log('   niente di orizzontale e grande abbastanza');
    buoni.slice(0, 5).forEach(b =>
      console.log('   + ' + b.titolo.slice(0, 60).padEnd(60) + ' [' + b.w + 'x' + b.h + '] ' + b.licenza + ' — ' + b.autore.slice(0, 25)));
    await sleep(1800);
  }

  fs.writeFileSync(process.argv[3] || 'openverse.json', JSON.stringify(esito, null, 1));
})();
