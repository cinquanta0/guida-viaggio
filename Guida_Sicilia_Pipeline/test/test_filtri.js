/* I bottoni della riga COME sembrano gia' accesi da spenti: si distingue
   lo stato attivo da quello inattivo? */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const pausa = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 780 });
  await page.goto(process.env.SITO || 'http://127.0.0.1:8899/', { waitUntil: 'domcontentloaded' });
  await pausa(500);

  /* i bottoni hanno una transizione: leggere il colore subito dopo il click
     restituisce ancora quello di partenza, quindi si aspetta */
  const stato = await page.evaluate(async function () {
    const attesa = ms => new Promise(r => setTimeout(r, ms));
    const out = [];
    const bs = document.querySelectorAll('.fb');
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i];
      const spento = getComputedStyle(b).backgroundColor;
      const classiSpento = b.className;
      b.click();
      await attesa(320);
      const acceso = getComputedStyle(b).backgroundColor;
      const classiAcceso = b.className;
      b.click();
      await attesa(320);
      out.push({
        testo: b.textContent.trim(),
        spento: spento,
        acceso: acceso,
        prendeOn: classiAcceso !== classiSpento,
        distinguibile: spento !== acceso
      });
    }
    return out;
  });

  let ko = 0;
  for (const s of stato) {
    if (!s.distinguibile) ko++;
    console.log((s.distinguibile ? '  ok  ' : '  NO  ') +
      s.testo.padEnd(18) + ' spento ' + s.spento.padEnd(22) + ' acceso ' + s.acceso);
  }
  console.log('\nbottoni in cui acceso e spento sono identici: ' + ko + ' su ' + stato.length);
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
