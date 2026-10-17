const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.SITO || 'http://127.0.0.1:8899/';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const tel = await browser.newPage();
  await tel.setViewport({ width: 390, height: 420, hasTouch: true, isMobile: true });
  await tel.goto(URL, { waitUntil: 'domcontentloaded' });
  await tel.tap('#cerca');
  await tel.type('#cerca', 'san', { delay: 20 });
  await new Promise(r => setTimeout(r, 400));

  const info = await tel.evaluate(function () {
    const voci = document.getElementById('sugg').getElementsByTagName('li');
    const out = [];
    for (var i = 0; i < Math.min(voci.length, 15); i++) {
      const r = voci[i].getBoundingClientRect();
      out.push({ i: i, testo: voci[i].textContent.trim().slice(0, 40), dataZ: voci[i].getAttribute('data-z'), top: r.top, height: r.height });
    }
    return { totale: voci.length, prime: out, suggClass: document.getElementById('sugg').className };
  });
  console.log('totale suggerimenti:', info.totale);
  console.log('classe #sugg:', info.suggClass);
  info.prime.forEach(v => console.log(' ', v.i, '| z=' + v.dataZ, '| top=' + v.top.toFixed(0), '| h=' + v.height.toFixed(0), '|', v.testo));

  await browser.close();
})();
