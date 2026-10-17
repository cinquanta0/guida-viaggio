/* Ritaglia la barra dei filtri del sito PUBBLICATO, per far vedere dove sta
   il bottone. Descriverlo a parole non stava funzionando.

   Uso: node shot_dove.js  */

const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SITO = process.env.SITO || 'https://guida-sicilia-2026.web.app';

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 430, height: 1000, deviceScaleFactor: 2 });
  await p.goto(SITO, { waitUntil: 'networkidle2' });

  /* la zona che va dal campo di ricerca all'ultima riga di filtri */
  const box = await p.evaluate(() => {
    const campo = document.getElementById('cerca');
    const righe = document.querySelectorAll('.f-riga');
    if (!campo || !righe.length) return null;
    const a = campo.getBoundingClientRect();
    const z = righe[righe.length - 1].getBoundingClientRect();
    return {
      x: 0, y: Math.max(0, a.top + window.scrollY - 40),
      w: document.documentElement.clientWidth,
      h: (z.bottom + window.scrollY) - (a.top + window.scrollY) + 60
    };
  });
  if (!box) { console.log('non trovo la barra dei filtri'); await b.close(); process.exit(1); }

  await p.screenshot({ path: 'dove_sta.png', clip: { x: box.x, y: box.y, width: box.w, height: box.h } });

  /* e il conto di cosa fa ogni bottone, per scriverlo nella risposta */
  const conti = await p.evaluate(() => {
    const out = [];
    const vis = () => [...document.querySelectorAll('.fascia[data-f] .p')].filter(x => x.offsetParent !== null).length;
    for (const v of ['mangiare', 'siciliani']) {
      const b = document.querySelector('button[data-v="' + v + '"]');
      if (!b) { out.push([v, 'BOTTONE ASSENTE', 0]); continue; }
      b.click();
      out.push([v, b.textContent.trim(), vis()]);
      b.click();
    }
    return out;
  });
  conti.forEach(([v, t, n]) => console.log('  data-v="' + v + '"  "' + t + '"  ->  ' + n + ' posti'));

  await b.close();
  console.log('\nscritto dove_sta.png');
})();
