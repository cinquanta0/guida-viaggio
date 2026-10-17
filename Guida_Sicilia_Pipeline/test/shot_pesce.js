/* Foto dello schermo di una scheda di pesce nuova, per leggere il testo
   come lo legge chi apre il sito: le entita' HTML sbagliate si vedono solo
   cosi'. Nel file la differenza fra &egrave; e e&rsquo; e' invisibile, sulla
   pagina diventa "e'" al posto di "e".

   Uso: node shot_pesce.js  */

const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.SITO || 'http://127.0.0.1:8899';

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 430, height: 1100, deviceScaleFactor: 2 });
  await p.goto(BASE, { waitUntil: 'networkidle2' });

  /* il testo delle schede nuove, letto dal DOM */
  const testi = await p.evaluate(() => {
    const cerca = ['Masculina da magghia', 'Stocco a ghiotta', 'Polpo bollito', 'Neonata', 'Pasta al nero di seppia'];
    const out = [];
    document.querySelectorAll('[data-cibo] , .p').forEach(x => {
      const h = x.querySelector('h3');
      if (!h) return;
      const n = h.textContent.trim();
      if (cerca.indexOf(n) < 0) return;
      const d = x.querySelector('.p-d');
      out.push({ n, d: d ? d.textContent.trim() : '', foto: !!x.querySelector('img') });
    });
    return out;
  });

  const sospette = [];
  testi.forEach(t => {
    console.log('\n== ' + t.n + (t.foto ? '  [con foto]' : '  [senza foto]'));
    console.log('   ' + t.d.slice(0, 150) + (t.d.length > 150 ? '...' : ''));
    /* un apostrofo attaccato a una vocale isolata tradisce &rsquo; usato
       al posto di una lettera accentata */
    const m = t.d.match(/\b(e|piu|cosi|gia|perche|puo)['’](?=\s|$)/g);
    if (m) sospette.push(t.n + ': ' + [...new Set(m)].join(', '));
  });

  console.log('\n' + (sospette.length
    ? 'DA CORREGGERE (accento scritto come apostrofo):\n  ' + sospette.join('\n  ')
    : 'nessun apostrofo al posto di un accento'));

  /* e la scheda del polpo in immagine */
  await p.evaluate(() => {
    const t = [...document.querySelectorAll('.p')].find(x => {
      const h = x.querySelector('h3'); return h && /Polpo bollito/.test(h.textContent);
    });
    if (t) t.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  await p.screenshot({ path: 'pesce.png' });

  await b.close();
  console.log('\nscritto pesce.png');
  process.exit(sospette.length ? 1 : 0);
})();
