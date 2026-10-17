/* Scopre il formato vero degli URL di ricerca di TheFork.

   Serve perche' i loro indirizzi usano codici interni che non posso
   inventare (acireale-c4606, basula-...-r717790): se sbaglio il formato,
   pubblico duecento link rotti. Quindi invece di indovinare provo alcuni
   indirizzi plausibili con un browser vero e guardo dove finiscono.

   Uso: node scopri_thefork.js  */

const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const PROVE = [
  'https://www.thefork.it/cerca?cityName=Acireale&searchText=Basula',
  'https://www.thefork.it/search?q=Basula%20Acireale',
  'https://www.thefork.it/cerca?searchText=Basula',
  'https://www.thefork.it/restaurants?q=Basula',
  'https://www.thefork.it/'
];

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const p = await b.newPage();
  await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36');

  for (const url of PROVE) {
    try {
      const r = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(x => setTimeout(x, 2500));
      const titolo = await p.title();
      const finale = p.url();
      const risultati = await p.evaluate(() => {
        /* quante schede di ristorante si vedono */
        const a = document.querySelectorAll('a[href*="/ristorante/"]');
        return { n: a.length, primo: a.length ? a[0].getAttribute('href') : '' };
      });
      console.log('\n== ' + url);
      console.log('   stato:   ' + (r ? r.status() : '?'));
      console.log('   finito su: ' + finale);
      console.log('   titolo:  ' + titolo.slice(0, 70));
      console.log('   link a ristoranti trovati: ' + risultati.n + (risultati.primo ? '  es. ' + risultati.primo : ''));
    } catch (e) {
      console.log('\n== ' + url + '\n   errore: ' + e.message);
    }
  }

  await b.close();
})();
