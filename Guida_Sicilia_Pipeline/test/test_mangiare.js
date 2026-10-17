/* Il filtro unico "Dove si mangia", e il controllo sugli apostrofi.

   Perche' esiste: i bottoni dello stesso gruppo si escludono a vicenda, quindi
   prima per vedere tutti i posti dove si mangia bisognava premerne sei uno
   alla volta. "Dove si mangia" e' la somma dei sei tipi di cibo, aggiunta al
   data-t in fase di build senza toccare dati.js e senza chip in piu'.

   Il secondo controllo riguarda una trappola gia' nota al progetto: data-n
   passa ancora da e() invece che da attr(), e e() trasforma l'apostrofo
   dritto in &rsquo;. Se il nome dentro window.SUGG resta con l'apostrofo
   dritto, la tendina propone un nome che poi non ritrova. Qui provo proprio
   un locale con l'apostrofo nel nome.

   Uso: node test_mangiare.js       (col sito su 127.0.0.1:8899)
        SITO=https://... node test_mangiare.js  */

const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.SITO || 'http://127.0.0.1:8899';

let ok = 0, ko = 0;
const dice = (buono, testo, extra) => {
  console.log('  ' + (buono ? 'ok  ' : 'NO  ') + testo + (extra ? '  — ' + extra : ''));
  buono ? ok++ : ko++;
};

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  const errori = [];
  p.on('pageerror', e => errori.push(e.message));
  await p.setViewport({ width: 390, height: 780 });
  await p.goto(BASE, { waitUntil: 'networkidle2' });

  const visibili = () => p.evaluate(() =>
    [...document.querySelectorAll('.fascia[data-f] .p')].filter(x => x.offsetParent !== null).length);

  const tutti = await visibili();

  /* i due filtri sul mangiare aprono il gruppo "che cosa", in quest'ordine:
     prima "Ristoranti" (la domanda piu' frequente), poi "Dove si mangia" */
  const primi = await p.evaluate(() =>
    [...document.querySelectorAll('button[data-k="t"]')].slice(0, 2)
      .map(b => ({ v: b.getAttribute('data-v'), t: b.textContent.trim() })));
  dice(primi[0] && primi[0].v === 'ristorante', 'il primo bottone di CHE COSA e "Ristoranti"',
    primi[0] ? '"' + primi[0].t + '"' : 'non trovato');
  dice(primi[1] && primi[1].v === 'mangiare', 'il secondo e "Dove si mangia"',
    primi[1] ? '"' + primi[1].t + '"' : 'non trovato');

  /* accendendolo restano solo i posti dove si mangia */
  await p.click('button[data-v="mangiare"]');
  await new Promise(r => setTimeout(r, 400));
  const conFiltro = await visibili();
  dice(conFiltro > 0 && conFiltro < tutti, 'il filtro riduce l elenco',
    tutti + ' -> ' + conFiltro);

  /* e sono tutti e soli quelli con un tipo di cibo */
  const controllo = await p.evaluate(() => {
    const CIBO = ['pizza', 'pesce', 'carne', 'pasta', 'dolci', 'street'];
    let giusti = 0, intrusi = 0;
    document.querySelectorAll('.fascia[data-f] .p').forEach(x => {
      if (x.offsetParent === null) return;
      const t = (x.getAttribute('data-t') || '').split(/\s+/);
      t.some(v => CIBO.indexOf(v) >= 0) ? giusti++ : intrusi++;
    });
    return { giusti, intrusi };
  });
  dice(controllo.intrusi === 0, 'nessun intruso senza tipo di cibo',
    controllo.giusti + ' giusti, ' + controllo.intrusi + ' intrusi');

  /* il tipo-somma non deve comparire come etichetta sulle schede */
  const chipFinti = await p.evaluate(() =>
    [...document.querySelectorAll('.ti')].filter(x => /Dove si mangia/.test(x.textContent)).length);
  dice(chipFinti === 0, 'non compare come chip sulle schede', chipFinti + ' chip');

  /* spegnendolo tornano tutti */
  await p.click('button[data-v="mangiare"]');
  await new Promise(r => setTimeout(r, 400));
  dice((await visibili()) === tutti, 'spegnendolo tornano tutti');

  /* --- "Ristoranti": solo dove ci si siede e si fa un pasto --- */
  await p.click('button[data-v="ristorante"]');
  await new Promise(r => setTimeout(r, 400));
  const soloRist = await visibili();
  dice(soloRist > 0 && soloRist < conFiltro,
    'Ristoranti e piu stretto di Dove si mangia', conFiltro + ' -> ' + soloRist);

  const dettaglio = await p.evaluate(() => {
    const PASTO = ['pasta', 'pesce', 'carne'];
    let intrusi = 0, pizzerieTrattorie = 0;
    const fuori = [];
    document.querySelectorAll('.fascia[data-f] .p').forEach(x => {
      const t = (x.getAttribute('data-t') || '').split(/\s+/);
      const eRist = t.some(v => PASTO.indexOf(v) >= 0);
      const visibile = x.offsetParent !== null;
      if (visibile && !eRist) intrusi++;
      if (visibile && eRist && t.indexOf('pizza') >= 0) pizzerieTrattorie++;
      /* una pasticceria pura non deve esserci */
      if (visibile && t.indexOf('dolci') >= 0 && !eRist) fuori.push((x.querySelector('h3') || {}).textContent);
    });
    return { intrusi, pizzerieTrattorie, fuori };
  });
  dice(dettaglio.intrusi === 0, 'niente pasticcerie, pizzerie pure o friggitorie',
    dettaglio.intrusi + ' intrusi' + (dettaglio.fuori.length ? ': ' + dettaglio.fuori.slice(0, 3).join(', ') : ''));
  dice(dettaglio.pizzerieTrattorie > 0, 'le pizzerie-trattorie invece ci sono',
    dettaglio.pizzerieTrattorie + ' con pizza e primo');

  await p.click('button[data-v="ristorante"]');
  await new Promise(r => setTimeout(r, 400));
  dice((await visibili()) === tutti, 'spegnendo Ristoranti tornano tutti');

  /* --- apostrofi: la tendina propone U Sulicce'nti e lo ritrova? --- */
  const campo = await p.$('#cerca');
  await campo.click();
  await campo.type('sulicce');
  await new Promise(r => setTimeout(r, 500));
  const sugg = await p.evaluate(() =>
    [...document.querySelectorAll('#sugg li')].map(x => x.textContent.trim()));
  dice(sugg.length > 0, 'la tendina propone il locale con l apostrofo', sugg.join(' / ') || 'niente');

  if (sugg.length) {
    await p.evaluate(() => {
      const li = document.querySelector('#sugg li');
      const t = li.getBoundingClientRect();
      const ev = n => new TouchEvent(n, {
        bubbles: true, cancelable: true,
        touches: n === 'touchend' ? [] : [new Touch({ identifier: 1, target: li, clientX: t.x + 5, clientY: t.y + 5 })],
        changedTouches: [new Touch({ identifier: 1, target: li, clientX: t.x + 5, clientY: t.y + 5 })]
      });
      li.dispatchEvent(ev('touchstart')); li.dispatchEvent(ev('touchend'));
    });
    await new Promise(r => setTimeout(r, 600));
    const ris = await p.evaluate(() => {
      const ev = document.querySelectorAll('.p.ev, .p.evidenzia, .p[class*="ev"]');
      return { quanti: ev.length, nome: ev.length ? (ev[0].querySelector('h3') || {}).textContent : '' };
    });
    dice(ris.quanti === 1, 'scegliendolo la scheda viene trovata ed evidenziata',
      ris.nome || 'nessuna scheda evidenziata');
  }

  dice(errori.length === 0, 'nessun errore JavaScript', errori.join(' | '));

  await b.close();
  console.log('\n' + ok + '/' + (ok + ko) + ' verifiche passate');
  process.exit(ko ? 1 : 0);
})();
