/* Il bottone "Cerca altro su Google Maps": deve stare nascosto senza
   filtri, comparire con un filtro tipo o una ricerca, e portare a un
   indirizzo Google Maps coerente con quello scelto. */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const pausa = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 780 });
  await page.goto(process.env.SITO || 'http://127.0.0.1:8899/', { waitUntil: 'domcontentloaded' });
  await pausa(400);

  let ok = 0, tot = 0;
  function verifica(nome, cond) {
    tot++;
    console.log((cond ? '  ok  ' : '  NO  ') + nome);
    if (cond) ok++;
  }

  const nascostoAllInizio = await page.evaluate(() => {
    const w = document.getElementById('oltre-wrap');
    return w ? getComputedStyle(w).display === 'none' : false;
  });
  verifica('nascosto senza filtri', nascostoAllInizio);

  await page.click('.fb[data-k="t"][data-v="carne"]');
  await pausa(150);
  const conCarne = await page.evaluate(() => {
    const w = document.getElementById('oltre-wrap');
    const a = document.getElementById('oltre');
    return { visibile: w && getComputedStyle(w).display !== 'none', href: a ? a.href : '' };
  });
  verifica('compare col filtro Carne', conCarne.visibile);
  verifica('href contiene "carne"', decodeURIComponent(conCarne.href).toLowerCase().includes('carne'));
  verifica('href e\' una ricerca Google Maps', conCarne.href.indexOf('google.com/maps/search/') >= 0);

  await page.type('#cerca', 'acireale');
  await pausa(350);
  const conZona = await page.evaluate(() => document.getElementById('oltre').href);
  verifica('href aggiunge la zona cercata', decodeURIComponent(conZona).toLowerCase().includes('acireale'));

  await page.click('#reset');
  await pausa(150);
  const dopoReset = await page.evaluate(() => {
    const w = document.getElementById('oltre-wrap');
    return w ? getComputedStyle(w).display === 'none' : false;
  });
  verifica('torna nascosto dopo "Mostra tutto"', dopoReset);

  const errori = [];
  page.on('pageerror', e => errori.push(e.message));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await pausa(300);
  verifica('nessun errore JavaScript', errori.length === 0);

  console.log('\n' + ok + '/' + tot + ' verifiche passate');
  await browser.close();
  if (ok !== tot) process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
