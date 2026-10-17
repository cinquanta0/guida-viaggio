/* Il carosello: freccette, pallini, scorrimento a dito, e soprattutto che
   NON rubi lo scorrimento verticale della pagina. Quest'ultimo e' il punto:
   un dito che scorre la pagina passa spesso sopra una foto, e se il
   carosello se lo prende la pagina si blocca sotto le dita. */

const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.SITO || 'http://127.0.0.1:8899/';
/* quanti caroselli aspettarsi lo dice dati.js, non un numero scritto qui */
const ATTESI = require('../dati.js').filter(p => p.piu && p.piu.length).length;
const pausa = ms => new Promise(r => setTimeout(r, ms));

const esiti = [];
function dice(nome, ok, info) {
  esiti.push(ok);
  console.log((ok ? '  ok  ' : '  NO  ') + nome + (info ? '  \u2014 ' + info : ''));
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  const errori = [];
  page.on('pageerror', e => errori.push(e.message));
  await page.emulate({
    name: 'tel',
    userAgent: 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
    viewport: { width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await pausa(900);

  /* apre tutte le fasce, altrimenti le schede sono chiuse dentro i details */
  await page.evaluate(() => {
    const d = document.querySelectorAll('details.fascia');
    for (let i = 0; i < d.length; i++) d[i].open = true;
  });
  await pausa(400);

  const quanti = await page.evaluate(() => document.getElementsByClassName('gal').length);
  dice("i caroselli ci sono", quanti === ATTESI, quanti + " caroselli (attesi " + ATTESI + ")");

  /* porta il primo carosello in vista */
  const info = await page.evaluate(() => {
    const g = document.getElementsByClassName('gal')[0];
    g.scrollIntoView({ block: 'center' });
    const str = g.getElementsByClassName('gal-str')[0];
    return {
      tot: +g.getAttribute('data-tot'),
      immagini: g.getElementsByClassName('gal-i').length,
      pallini: g.getElementsByClassName('gal-pt')[0].getElementsByTagName('i').length,
      scorrevole: str.scrollWidth > str.clientWidth + 2,
      nome: g.parentNode.getAttribute('data-n')
    };
  });
  await pausa(500);
  dice('immagini e pallini coincidono',
    info.immagini === info.tot && info.pallini === info.tot,
    info.nome + ': ' + info.immagini + ' foto, ' + info.pallini + ' pallini');
  const nastro = await page.evaluate(() => { const s = document.getElementsByClassName("gal-str")[0]; return { largo: s.scrollWidth, finestra: s.clientWidth }; });
  const nastroLargo = nastro.largo > nastro.finestra + 2;
  dice('il nastro e' + '\u0027' + ' piu' + '\u0027' + ' largo della finestra', nastroLargo, nastro.largo + "px di foto in " + nastro.finestra + "px di finestra");

  const stato = () => page.evaluate(() => {
    const g = document.getElementsByClassName('gal')[0];
    const str = g.getElementsByClassName('gal-str')[0];
    const pal = g.getElementsByClassName('gal-pt')[0].getElementsByTagName('i');
    let acceso = -1;
    for (let i = 0; i < pal.length; i++) if (pal[i].className === 'on') acceso = i;
    return {
      indice: Math.round(str.scrollLeft / (str.clientWidth || 1)),
      scrollLeft: Math.round(str.scrollLeft),
      acceso: acceso,
      precNascosta: g.getElementsByClassName('gal-prec')[0].hidden,
      succNascosta: g.getElementsByClassName('gal-succ')[0].hidden
    };
  });

  const s0 = await stato();
  dice('si parte dalla prima foto', s0.indice === 0 && s0.acceso === 0);
  dice('la freccia indietro e' + '\u0027' + ' nascosta all' + '\u0027' + 'inizio', s0.precNascosta === true);
  dice('la freccia avanti si vede all' + '\u0027' + 'inizio', s0.succNascosta === false);

  /* --- freccia avanti --- */
  await page.evaluate(() => document.getElementsByClassName('gal-succ')[0].click());
  await pausa(700);
  const s1 = await stato();
  dice('la freccia avanti porta alla foto 2', s1.indice === 1 && s1.acceso === 1,
    'indice ' + s1.indice + ', pallino ' + s1.acceso);

  /* --- fino in fondo --- */
  for (let i = 0; i < info.tot; i++) {
    await page.evaluate(() => {
      const b = document.getElementsByClassName('gal-succ')[0];
      if (!b.hidden) b.click();
    });
    await pausa(600);
  }
  const sf = await stato();
  dice('arrivati in fondo la freccia avanti sparisce',
    sf.indice === info.tot - 1 && sf.succNascosta === true,
    'indice ' + sf.indice + ' di ' + (info.tot - 1));

  /* --- indietro --- */
  await page.evaluate(() => document.getElementsByClassName('gal-prec')[0].click());
  await pausa(700);
  const sp = await stato();
  dice('la freccia indietro torna alla foto precedente', sp.indice === info.tot - 2,
    'indice ' + sp.indice);

  /* --- scorrimento a dito in orizzontale --- */
  await page.evaluate(() => {
    const str = document.getElementsByClassName('gal-str')[0];
    str.scrollLeft = 0;
  });
  await pausa(400);
  const rect = await page.evaluate(() => {
    const g = document.getElementsByClassName('gal')[0];
    g.scrollIntoView({ block: 'center' });
    const r = g.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await pausa(400);
  const r2 = await page.evaluate(() => {
    const r = document.getElementsByClassName('gal')[0].getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.touchscreen.touchStart(r2.x + 90, r2.y);
  await page.touchscreen.touchMove(r2.x + 20, r2.y);
  await page.touchscreen.touchMove(r2.x - 60, r2.y);
  await page.touchscreen.touchEnd();
  await pausa(900);
  const sd = await stato();
  dice('il dito fa scorrere le foto in orizzontale', sd.scrollLeft > 20,
    'scrollLeft = ' + sd.scrollLeft);

  /* --- IL PUNTO: la pagina scorre ancora se il dito parte da una foto --- */
  const primaY = await page.evaluate(() => window.pageYOffset);
  await page.touchscreen.touchStart(r2.x, r2.y);
  await page.touchscreen.touchMove(r2.x, r2.y - 60);
  await page.touchscreen.touchMove(r2.x, r2.y - 140);
  await page.touchscreen.touchEnd();
  await pausa(800);
  const dopoY = await page.evaluate(() => window.pageYOffset);
  dice('la pagina scorre anche col dito appoggiato su una foto',
    dopoY > primaY + 20, primaY + ' \u2192 ' + dopoY);

  /* --- le foto in piu' partono pigre --- */
  const pigre = await page.evaluate(() => {
    const im = document.getElementsByClassName('gal-i');
    let lazy = 0;
    for (let i = 0; i < im.length; i++) if (im[i].getAttribute('loading') === 'lazy') lazy++;
    return { totale: im.length, lazy: lazy };
  });
  dice('tutte le foto del carosello sono a caricamento pigro',
    pigre.lazy === pigre.totale, pigre.lazy + '/' + pigre.totale);

  /* Nessuna scheda deve avere sia una foto diretta sia un carosello, e le
     schede con carosello devono essere esattamente quelle previste.
     Si controlla l'invariante, non un numero magico. */
  const misto = await page.evaluate(() => {
    const p = document.querySelectorAll('.p');
    let diretta = 0, galleria = 0, entrambi = 0;
    for (let i = 0; i < p.length; i++) {
      let img = false, gal = false;
      for (let k = 0; k < p[i].children.length; k++) {
        if (p[i].children[k].tagName === 'IMG') img = true;
        if (p[i].children[k].className === 'gal') gal = true;
      }
      if (img) diretta++;
      if (gal) galleria++;
      if (img && gal) entrambi++;
    }
    return { diretta: diretta, galleria: galleria, entrambi: entrambi };
  });
  dice('nessuna scheda ha sia foto singola sia carosello', misto.entrambi === 0,
    misto.diretta + ' con foto singola, ' + misto.galleria + ' con carosello');
  dice('i caroselli sono solo dove servono', misto.galleria === ATTESI);

  dice('nessun errore JavaScript', errori.length === 0, errori.join(' | '));

  const ko = esiti.filter(x => !x).length;
  console.log('\n' + (esiti.length - ko) + '/' + esiti.length + ' verifiche passate');
  await browser.close();
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error('errore:', e.stack); process.exit(3); });
