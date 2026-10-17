/* Riproduce il problema segnalato: con la tendina dei suggerimenti aperta,
   provare a scorrere per vedere le voci in fondo la fa sparire.
   Usa eventi touch veri (CDP Input.dispatchTouchEvent), non click simulati. */

const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.SITO || 'http://127.0.0.1:8899/';

/* Un telefono con la tastiera aperta: l'area visibile si riduce parecchio.
   E' la situazione in cui si usa davvero la ricerca. */
const LARGH = 390;
const ALT_TASTIERA = 420;

function riquadro(page, sel) {
  return page.evaluate(function (s) {
    const e = document.querySelector(s);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height, visibile: r.height > 0 };
  }, sel);
}

async function apriTendina(page, testo) {
  await page.evaluate(function () {
    const c = document.getElementById('cerca');
    c.value = '';
    c.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.focus('#cerca');
  await page.type('#cerca', testo, { delay: 30 });
  await new Promise(r => setTimeout(r, 400));
  return page.evaluate(function () {
    const b = document.getElementById('sugg');
    return {
      aperta: b.className.indexOf('on') !== -1,
      voci: b.getElementsByTagName('li').length
    };
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.emulate({
    name: 'telefono',
    userAgent: 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
    viewport: { width: LARGH, height: ALT_TASTIERA, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  const esiti = [];
  const dice = (nome, ok, info) => {
    esiti.push({ nome, ok, info });
    console.log((ok ? '  ok  ' : '  NO  ') + nome + (info ? '  \u2014 ' + info : ''));
  };

  /* cerco una parola che riempia la tendina */
  let query = null, apertura = null;
  for (const q of ['san', 'cas', 'mar', 'pia', 'ca']) {
    const a = await apriTendina(page, q);
    if (a.aperta && a.voci >= 6) { query = q; apertura = a; break; }
  }
  if (!query) { console.log('non riesco ad aprire una tendina piena'); await browser.close(); process.exit(2); }
  console.log('\nquery "' + query + '" \u2192 ' + apertura.voci + ' suggerimenti\n');

  /* --- 1. la tendina sta dentro lo schermo? --- */
  const r = await riquadro(page, '#sugg');
  const fuori = r.bottom - ALT_TASTIERA;
  dice('la tendina sta dentro l\'area visibile',
    r.bottom <= ALT_TASTIERA,
    'alta ' + Math.round(r.height) + 'px, finisce a ' + Math.round(r.bottom) +
    'px su ' + ALT_TASTIERA + ' visibili' + (fuori > 0 ? ' \u2192 ' + Math.round(fuori) + 'px TAGLIATI' : ''));

  /* --- 2. la tendina si puo' scorrere da sola? --- */
  const scorribile = await page.evaluate(function () {
    const b = document.getElementById('sugg');
    const st = getComputedStyle(b);
    return { overflowY: st.overflowY, maxHeight: st.maxHeight, puoScorrere: b.scrollHeight > b.clientHeight + 2 };
  });
  dice('la tendina ha uno scorrimento suo',
    scorribile.overflowY === 'auto' || scorribile.overflowY === 'scroll',
    'overflow-y: ' + scorribile.overflowY + ', max-height: ' + scorribile.maxHeight);

  /* --- 3. scorrere la pagina con un dito la fa sparire? --- */
  /* swipe che parte SOTTO la tendina, come chi vuole scorrere la pagina */
  const partenzaY = Math.min(ALT_TASTIERA - 30, Math.round(r.bottom) + 20);
  await page.touchscreen.touchStart(LARGH / 2, partenzaY);
  await page.touchscreen.touchMove(LARGH / 2, partenzaY - 90);
  await page.touchscreen.touchEnd();
  await new Promise(r2 => setTimeout(r2, 250));
  const dopoSwipeFuori = await page.evaluate(function () {
    return document.getElementById('sugg').className.indexOf('on') !== -1;
  });
  dice('scorrendo la pagina la tendina resta aperta', dopoSwipeFuori,
    dopoSwipeFuori ? '' : 'si chiude al primo tocco: e\' il bug segnalato');

  /* --- 4. swipe che parte SOPRA la tendina: scorre o seleziona per sbaglio? --- */
  await apriTendina(page, query);
  const r2box = await riquadro(page, '#sugg');
  const dentroY = Math.round(r2box.top + 30);
  const primaValore = await page.evaluate(function () { return document.getElementById('cerca').value; });
  await page.touchscreen.touchStart(LARGH / 2, dentroY);
  await page.touchscreen.touchMove(LARGH / 2, dentroY - 80);
  await page.touchscreen.touchEnd();
  await new Promise(r3 => setTimeout(r3, 400));
  const dopoValore = await page.evaluate(function () { return document.getElementById('cerca').value; });
  dice('scorrere DENTRO la tendina non seleziona una voce',
    dopoValore === primaValore,
    dopoValore === primaValore ? '' : 'ha scelto "' + dopoValore + '" invece di scorrere');

  /* --- 5. un tocco vero su una voce la seleziona ancora? --- */
  await apriTendina(page, query);
  const r3box = await riquadro(page, '#sugg');
  const tocca = Math.round(r3box.top + 30);
  await page.touchscreen.touchStart(LARGH / 2, tocca);
  await page.touchscreen.touchEnd();
  await new Promise(r4 => setTimeout(r4, 600));
  const scelto = await page.evaluate(function () {
    return {
      valore: document.getElementById('cerca').value,
      chiusa: document.getElementById('sugg').className.indexOf('on') === -1
    };
  });
  dice('un tocco secco su una voce la seleziona',
    scelto.valore && scelto.valore !== query && scelto.chiusa,
    'campo = "' + scelto.valore + '"');

  const falliti = esiti.filter(e => !e.ok).length;
  console.log('\n' + (esiti.length - falliti) + '/' + esiti.length + ' verifiche passate');
  await browser.close();
  process.exit(falliti ? 1 : 0);
})().catch(e => { console.error('errore:', e.message); process.exit(3); });
