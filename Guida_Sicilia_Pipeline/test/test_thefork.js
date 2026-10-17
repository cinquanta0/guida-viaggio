/* Il collegamento a TheFork sulle schede.

   Controlla che ci sia dove serve e NON dove non serve: su una spiaggia o su
   un belvedere un link per prenotare un tavolo non vuol dire niente.

   Controlla anche che i link siano ben formati e si aprano in una scheda
   nuova con rel="noopener": sono link verso l'esterno, e senza noopener la
   pagina aperta puo' toccare quella di partenza.

   Uso: node test_thefork.js        (sito su 127.0.0.1:8899)
        SITO=https://... node test_thefork.js  */

const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.SITO || 'http://127.0.0.1:8899';

let ok = 0, ko = 0;
const dice = (b, t, extra) => {
  console.log('  ' + (b ? 'ok  ' : 'NO  ') + t + (extra ? '  — ' + extra : ''));
  b ? ok++ : ko++;
};

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  const errori = [];
  p.on('pageerror', e => errori.push(e.message));
  await p.goto(BASE, { waitUntil: 'networkidle2' });

  const r = await p.evaluate(() => {
    const CIBO = ['pizza', 'pesce', 'carne', 'pasta', 'dolci', 'street'];
    let conFork = 0, senzaFork = 0, forkSuNonCibo = 0, ciboSenzaFork = 0;
    const esempiSbagliati = [];
    document.querySelectorAll('.fascia[data-f] .p').forEach(x => {
      const t = (x.getAttribute('data-t') || '').split(/\s+/);
      const siMangia = t.some(v => CIBO.indexOf(v) >= 0);
      const a = x.querySelector('.p-fork');
      if (a) conFork++; else senzaFork++;
      if (a && !siMangia) { forkSuNonCibo++; esempiSbagliati.push((x.querySelector('h3') || {}).textContent); }
      if (!a && siMangia) { ciboSenzaFork++; esempiSbagliati.push((x.querySelector('h3') || {}).textContent); }
    });
    const link = [...document.querySelectorAll('.p-fork')];
    return {
      conFork, senzaFork, forkSuNonCibo, ciboSenzaFork,
      esempi: esempiSbagliati.slice(0, 3),
      tuttiHttps: link.every(a => /^https:\/\//.test(a.getAttribute('href') || '')),
      tuttiNuovaScheda: link.every(a => a.getAttribute('target') === '_blank'),
      tuttiNoopener: link.every(a => /noopener/.test(a.getAttribute('rel') || '')),
      diretti: link.filter(a => /thefork\.it\/ristorante\//.test(a.getAttribute('href'))).length,
      testiDiretti: [...new Set(link.filter(a => /thefork\.it\/ristorante\//.test(a.getAttribute('href')))
        .map(a => a.textContent.trim()))],
      /* nessun link deve contenere segnaposto o spazi non codificati */
      malformati: link.filter(a => / /.test(a.getAttribute('href') || '')).length
    };
  });

  dice(r.conFork > 0, 'il collegamento c e', r.conFork + ' schede su ' + (r.conFork + r.senzaFork));
  dice(r.forkSuNonCibo === 0, 'non compare dove non si mangia',
    r.forkSuNonCibo + ' sbagliati' + (r.esempi.length ? ': ' + r.esempi.join(', ') : ''));
  dice(r.ciboSenzaFork === 0, 'c e su tutti i posti dove si mangia', r.ciboSenzaFork + ' mancanti');
  dice(r.tuttiHttps, 'tutti i link sono https');
  dice(r.tuttiNuovaScheda, 'si aprono in una scheda nuova');
  dice(r.tuttiNoopener, 'hanno rel=noopener');
  dice(r.malformati === 0, 'nessun link con spazi non codificati', r.malformati + ' malformati');
  dice(r.diretti > 0, 'i locali con la pagina nota puntano dritto li',
    r.diretti + ' diretti, etichetta: ' + r.testiDiretti.join(' / '));
  dice(errori.length === 0, 'nessun errore JavaScript', errori.join(' | '));

  await b.close();
  console.log('\n' + ok + '/' + (ok + ko) + ' verifiche passate');
  process.exit(ko ? 1 : 0);
})();
