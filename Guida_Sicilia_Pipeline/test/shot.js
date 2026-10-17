const puppeteer=require('puppeteer-core');
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const br=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await br.newPage();
await p.emulate({name:'tel',userAgent:'Mozilla/5.0 (Linux; Android 12) Mobile Safari/537.36',viewport:{width:390,height:780,deviceScaleFactor:2,isMobile:true,hasTouch:true}});
await p.goto('http://127.0.0.1:8899/',{waitUntil:'networkidle2'});
await pausa(900);
await p.evaluate(()=>{document.querySelectorAll('details.fascia').forEach(d=>d.open=true);});
await pausa(400);
await p.evaluate(()=>{
  const gs=document.getElementsByClassName('gal');
  for(const g of gs){ if(g.parentNode.getAttribute('data-n')&&g.parentNode.getAttribute('data-n').indexOf('Simeto')>=0){ g.parentNode.scrollIntoView({block:'start'}); window.scrollBy(0,-70); return; } }
});
await pausa(1600);
await p.screenshot({path:'carosello.png'});
await br.close();console.log('ok');})();
