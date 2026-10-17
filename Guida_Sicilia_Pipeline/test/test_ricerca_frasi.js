/* La ricerca che capisce le frasi.

   Prima "carne acireale" non trovava niente: la ricerca pretendeva che ogni
   parola comparisse nel testo della scheda, ma il tipo di un posto sta in
   data-t, non nel testo. Ora le parole che sono categorie diventano filtro.

   Qui verifico le tre cose che possono andare storte:
   1. che le frasi funzionino
   2. che NON si rompa quello che gia' funzionava (nomi di posti, nomi di
      piatti, nomi di paesi) - e' il rischio vero
   3. che un bottone premuto a mano vinca sulla frase

   Uso: node test_ricerca_frasi.js        (sito su 127.0.0.1:8899)
        SITO=https://... node test_ricerca_frasi.js  */

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
  await p.setViewport({ width: 430, height: 900 });
  await p.goto(BASE, { waitUntil: 'networkidle2' });

  /* scrive nella casella e aspetta il debounce da 200 ms */
  async function cerca(q) {
    await p.evaluate(() => {
      const c = document.getElementById('cerca');
      c.value = ''; c.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await p.type('#cerca', q);
    await new Promise(r => setTimeout(r, 500));
    return p.evaluate(() => {
      const vis = [...document.querySelectorAll('.fascia[data-f] .p')].filter(x => x.offsetParent !== null);
      const acceso = [...document.querySelectorAll('.fb.on')].map(x => x.textContent.trim());
      return {
        n: vis.length,
        primi: vis.slice(0, 3).map(x => (x.querySelector('h3') || {}).textContent),
        zone: [...new Set(vis.map(x => {
          const z = x.querySelector('.km-n') ? x.querySelector('p.p-km') : null;
          return z ? z.textContent.replace(/\d+\s*(min|h\d*)|km|[\d.,]/g, '').trim() : '';
        }))].filter(Boolean).slice(0, 4),
        acceso
      };
    });
  }

  console.log('--- le frasi ---');
  let r = await cerca('dove si mangia carne ad Acireale');
  dice(r.acceso.indexOf('Carne') >= 0, 'la frase accende il filtro Carne', r.acceso.join(', ') || 'nessuno');

  r = await cerca('carne a Catania');
  dice(r.n > 0 && r.acceso.indexOf('Carne') >= 0, 'carne a Catania trova qualcosa',
    r.n + ' posti: ' + r.primi.join(', '));

  r = await cerca('dove si mangia pesce a Noto');
  dice(r.acceso.indexOf('Pesce') >= 0, 'pesce a Noto accende Pesce', r.n + ' posti');

  r = await cerca('pizzeria Taormina');
  dice(r.n > 0 && r.acceso.indexOf('Pizza') >= 0, 'pizzeria Taormina', r.n + ': ' + r.primi.join(', '));

  r = await cerca('ristoranti a Ragusa');
  dice(r.n > 0 && r.acceso.indexOf('Ristoranti') >= 0, 'ristoranti a Ragusa', r.n + ': ' + r.primi.join(', '));

  console.log('\n--- quello che gia funzionava non si rompe ---');
  r = await cerca('Pachino');
  dice(r.n > 0 && r.acceso.length === 0, 'il nome di un paese non accende filtri', r.n + ' posti');

  r = await cerca('arancino');
  const piatti = await p.evaluate(() =>
    [...document.querySelectorAll('.fascia[data-cibo] .p')].filter(x => x.offsetParent !== null)
      .map(x => (x.querySelector('h3') || {}).textContent));
  dice(piatti.some(x => /Arancin/i.test(x)), 'cercare un piatto lo trova ancora', piatti.slice(0, 2).join(', '));

  r = await cerca('Nespolo');
  dice(r.n > 0, 'il nome di un locale lo trova ancora', r.primi.join(', '));

  r = await cerca('granita');
  const gp = await p.evaluate(() =>
    [...document.querySelectorAll('.fascia[data-cibo] .p')].filter(x => x.offsetParent !== null).length);
  dice(gp > 0, 'granita trova ancora il piatto', gp + ' piatti');

  console.log('\n--- il bottone a mano vince ---');
  await cerca('carne');
  /* il click va dato via JS e non per coordinate: scrivendo "carne" si apre
     la tendina dei suggerimenti, che copre i filtri, e il click finirebbe su
     un suggerimento. Non e' un difetto del sito, e' come sono impilati. */
  await p.evaluate(() => document.querySelector('button[data-v="pesce"]').click());
  await new Promise(r2 => setTimeout(r2, 400));
  const dopo = await p.evaluate(() => {
    const vis = [...document.querySelectorAll('.fascia[data-f] .p')].filter(x => x.offsetParent !== null);
    return { n: vis.length, tutti: vis.every(x => (x.getAttribute('data-t') || '').split(/\s+/).indexOf('pesce') >= 0) };
  });
  dice(dopo.tutti && dopo.n > 0, 'premendo Pesce con scritto "carne" comandano i bottoni', dopo.n + ' posti, tutti di pesce');

  dice(errori.length === 0, 'nessun errore JavaScript', errori.join(' | '));

  await b.close();
  console.log('\n' + ok + '/' + (ok + ko) + ' verifiche passate');
  process.exit(ko ? 1 : 0);
})();
