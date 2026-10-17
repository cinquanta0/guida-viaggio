const puppeteer=require('puppeteer-core');
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const br=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await br.newPage();
await p.emulate({name:'tel',userAgent:'Mozilla/5.0 (Linux; Android 12) Mobile Safari/537.36',viewport:{width:390,height:900,deviceScaleFactor:2,isMobile:true,hasTouch:true}});
await p.goto('http://127.0.0.1:8899/come-e-fatto.html',{waitUntil:'networkidle2'});
await pausa(800);
for (const [sel,file] of [['Più di una foto','fatto1.png'],['Tranne i prezzi','fatto2.png']]) {
  await p.evaluate(t=>{const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.indexOf(t)>=0); h.scrollIntoView({block:'start'}); window.scrollBy(0,-30);}, sel);
  await pausa(700);
  await p.screenshot({path:file});
}
await br.close();console.log('ok');})();
