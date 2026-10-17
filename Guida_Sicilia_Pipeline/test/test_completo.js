/* Controllo piu' largo: oltre alla tendina, che non si sia rotto nient'altro
   (filtri, ricerca, "scegli tu per noi", link mappa, desktop col mouse). */

const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.SITO || 'http://127.0.0.1:8899/';

const esiti = [];
function dice(nome, ok, info) {
  esiti.push(ok);
  console.log((ok ? '  ok  ' : '  NO  ') + nome + (info ? '  \u2014 ' + info : ''));
}
const pausa = ms => new Promise(r => setTimeout(r, ms));

async function apri(page, testo) {
  await page.evaluate(function () {
    const c = document.getElementById('cerca');
    c.value = '';
    c.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.focus('#cerca');
  await page.type('#cerca', testo, { delay: 25 });
  await pausa(400);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  /* ---------------- telefono ---------------- */
  console.log('\n--- telefono 390x420 (tastiera aperta) ---\n');
  const tel = await browser.newPage();
  await tel.emulate({
    name: 'tel',
    userAgent: 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
    viewport: { width: 390, height: 420, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  });
  await tel.goto(URL, { waitUntil: 'domcontentloaded' });
  await pausa(600);

  await apri(tel, 'san');

  /* lo scorrimento dentro la tendina funziona davvero? */
  const box = await tel.evaluate(function () {
    const b = document.getElementById('sugg');
    const r = b.getBoundingClientRect();
    return { top: r.top, alt: r.height, scrollHeight: b.scrollHeight, clientHeight: b.clientHeight };
  });
  dice('la tendina ha piu' + '\u0027' + ' contenuto di quanto ne mostra',
    box.scrollHeight > box.clientHeight + 2,
    box.scrollHeight + 'px di voci in ' + box.clientHeight + 'px di finestra');

  const y = Math.round(box.top + box.alt / 2);
  await tel.touchscreen.touchStart(195, y);
  await tel.touchscreen.touchMove(195, y - 40);
  await tel.touchscreen.touchMove(195, y - 80);
  await tel.touchscreen.touchEnd();
  await pausa(300);
  const scorso = await tel.evaluate(function () { return document.getElementById('sugg').scrollTop; });
  dice('trascinando il dito la tendina scorre', scorso > 0, 'scrollTop = ' + Math.round(scorso));

  /* l'ultima voce e' raggiungibile */
  const ultima = await tel.evaluate(function () {
    const b = document.getElementById('sugg');
    b.scrollTop = b.scrollHeight;
    const li = b.getElementsByTagName('li');
    const u = li[li.length - 1].getBoundingClientRect();
    const vv = window.visualViewport;
    const limite = (vv ? vv.offsetTop + vv.height : window.innerHeight);
    return { bottom: u.bottom, limite: limite, nome: li[li.length - 1].getAttribute('data-v') };
  });
  dice('l' + '\u0027' + 'ultimo suggerimento si vede tutto',
    ultima.bottom <= ultima.limite + 1,
    '"' + ultima.nome + '" finisce a ' + Math.round(ultima.bottom) + ' su ' + Math.round(ultima.limite));

  /* scorrere la pagina fuori dalla tendina non la chiude */
  await apri(tel, 'san');
  await tel.touchscreen.touchStart(195, 400);
  await tel.touchscreen.touchMove(195, 340);
  await tel.touchscreen.touchMove(195, 300);
  await tel.touchscreen.touchEnd();
  await pausa(250);
  dice('scorrendo la pagina resta aperta',
    await tel.evaluate(function () { return document.getElementById('sugg').className.indexOf('on') !== -1; }));

  /* un tocco fuori invece la chiude ancora */
  await tel.touchscreen.touchStart(195, 400);
  await tel.touchscreen.touchEnd();
  await pausa(250);
  dice('un tocco fuori la chiude',
    await tel.evaluate(function () { return document.getElementById('sugg').className.indexOf('on') === -1; }));

  /* scelta da tocco: porta al posto e lo evidenzia. Serve una voce-POSTO,
     non una voce-zona (data-z="1"): scegliendo una zona il sito filtra
     l'elenco ma non evidenzia una scheda precisa, di proposito (non c'e'
     "il" posto di una zona). Con tanti suggerimenti per "san" la prima
     posizione puo' essere una zona, quindi si cerca la prima riga posto. */
  await apri(tel, 'san');
  /* il bersaglio puo' cadere sotto la piega se ci sono piu' zone impilate
     prima di lui (successo il 24 ago 2026 con 8 zone "San/Sant'" dopo
     l'espansione Overture): si scorre la tendina fino a portarlo visibile,
     esattamente come farebbe un dito vero, invece di assumere che sia gia'
     nella finestra. */
  const riga = await tel.evaluate(function () {
    const sugg = document.getElementById('sugg');
    const voci = sugg.getElementsByTagName('li');
    for (var i = 0; i < voci.length; i++) {
      if (voci[i].getAttribute('data-z') !== '1') {
        sugg.scrollTop = voci[i].offsetTop - 8;
        return voci[i].getBoundingClientRect().top;
      }
    }
    return null;
  });
  await tel.touchscreen.touchStart(195, Math.round(riga + 28));
  await tel.touchscreen.touchEnd();
  await pausa(800);
  const dopo = await tel.evaluate(function () {
    return {
      valore: document.getElementById('cerca').value,
      evidenziati: document.querySelectorAll('.p.evidenzia').length
    };
  });
  dice('la scelta evidenzia il posto', !!dopo.valore && dopo.evidenziati > 0,
    '"' + dopo.valore + '", evidenziati: ' + dopo.evidenziati);

  /* ---------------- desktop ---------------- */
  console.log('\n--- desktop 1280x900, col mouse ---\n');
  const pc = await browser.newPage();
  await pc.setViewport({ width: 1280, height: 900 });
  await pc.goto(URL, { waitUntil: 'domcontentloaded' });
  await pausa(500);

  await pc.focus('#cerca');
  await pc.type('#cerca', 'san', { delay: 25 });
  await pausa(400);
  dice('la tendina si apre anche su desktop',
    await pc.evaluate(function () { return document.getElementById('sugg').className.indexOf('on') !== -1; }));

  const primo = await pc.evaluate(function () {
    const li = document.getElementById('sugg').getElementsByTagName('li')[0];
    const r = li.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, nome: li.getAttribute('data-v') };
  });
  await pc.mouse.click(primo.x, primo.y);
  await pausa(700);
  dice('col mouse la scelta funziona ancora',
    (await pc.evaluate(function () { return document.getElementById('cerca').value; })) === primo.nome,
    primo.nome);

  /* filtri e resto */
  await pc.evaluate(function () {
    const c = document.getElementById('cerca');
    c.value = ''; c.dispatchEvent(new Event('input', { bubbles: true }));
    const b = document.querySelector('.b-pulisci'); if (b) b.click();
  });
  await pausa(400);

  /* le schede nascoste dai filtri restano nel DOM: conta solo quelle
     davvero disegnate, aprendo prima tutte le fasce a fisarmonica */
  const conta = () => pc.evaluate(function () {
    const d = document.querySelectorAll('details.fascia');
    for (let i = 0; i < d.length; i++) d[i].open = true;
    return [].filter.call(document.querySelectorAll('.p'), function (e) {
      return getComputedStyle(e).display !== 'none' && e.offsetParent !== null;
    }).length;
  });
  const tutti = await conta();
  dice('si vedono i posti', tutti > 100, tutti + ' schede visibili');

  const filtri = await pc.$$('.fb');
  if (filtri.length) {
    await filtri[1].click();
    await pausa(400);
    const dopoFiltro = await conta();
    dice('un filtro riduce l' + '\u0027' + 'elenco', dopoFiltro > 0 && dopoFiltro < tutti,
      tutti + ' \u2192 ' + dopoFiltro);
    await filtri[1].click();
    await pausa(300);
  }

  const mappe = await pc.evaluate(function () {
    const a = document.querySelectorAll('.p-map a');
    return { quanti: a.length, primo: a[0] ? a[0].getAttribute('href') : '' };
  });
  dice('i link a Google Maps ci sono', mappe.quanti > 250 && /google\.com\/maps/.test(mappe.primo),
    mappe.quanti + ' link');

  const errori = [];
  pc.on('pageerror', e => errori.push(e.message));
  await pc.reload({ waitUntil: 'domcontentloaded' });
  await pausa(700);
  dice('nessun errore JavaScript in console', errori.length === 0, errori.join(' | '));

  const ko = esiti.filter(x => !x).length;
  console.log('\n' + (esiti.length - ko) + '/' + esiti.length + ' verifiche passate');
  await browser.close();
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error('errore:', e.stack); process.exit(3); });
