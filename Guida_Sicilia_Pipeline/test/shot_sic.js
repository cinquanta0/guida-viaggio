/* Foto dello schermo del filtro nuovo e di una scheda che porta il tag,
   perche' i colori vanno guardati e non dedotti dal CSS.

   Uso: node shot_sic.js   (col sito servito su 127.0.0.1:8899) */

const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 430, height: 900, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8899/', { waitUntil: 'networkidle2' });

  /* i bottoni dei filtri, col nuovo acceso */
  const bot = await p.$('.fb.g-sic');
  if (!bot) { console.log('bottone .g-sic non trovato'); await b.close(); process.exit(1); }
  await bot.click();
  /* i bottoni hanno una transizione: leggere subito il colore da' quello
     vecchio e sembra che il click non abbia fatto niente */
  await new Promise(r => setTimeout(r, 400));

  const info = await p.evaluate(() => {
    const b = document.querySelector('.fb.g-sic');
    const visibili = [...document.querySelectorAll('.fascia[data-f] .p')].filter(x => x.offsetParent !== null);
    return {
      testo: b.textContent,
      acceso: getComputedStyle(b).backgroundColor,
      quanti: visibili.length,
      primi: visibili.slice(0, 3).map(x => (x.querySelector('h3') || {}).textContent)
    };
  });
  console.log('bottone: "' + info.testo + '"  acceso: ' + info.acceso);
  console.log('posti mostrati col filtro: ' + info.quanti);
  console.log('primi: ' + info.primi.join(' / '));

  await p.screenshot({ path: 'sic_filtro.png' });

  /* e una scheda col chip, cercandola per nome */
  await p.evaluate(() => {
    const t = [...document.querySelectorAll('.fascia[data-f] .p')]
      .find(x => x.offsetParent !== null && /Casu/.test(x.textContent));
    if (t) t.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 500));
  await p.screenshot({ path: 'sic_scheda.png' });

  await b.close();
  console.log('\nscritti sic_filtro.png e sic_scheda.png');
})();
