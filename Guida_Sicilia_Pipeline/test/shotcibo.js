const puppeteer=require('puppeteer-core');
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const br=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await br.newPage();
await p.emulate({name:'tel',userAgent:'Mozilla/5.0 (Linux; Android 12) Mobile Safari/537.36',viewport:{width:390,height:900,deviceScaleFactor:2,isMobile:true,hasTouch:true}});
await p.goto('http://127.0.0.1:8899/',{waitUntil:'networkidle2'});
await pausa(900);
const n=await p.evaluate(()=>{
  const d=[...document.querySelectorAll('details.fascia')].find(x=>x.textContent.indexOf('Cosa vi mettono nel piatto')>=0);
  if(!d) return null; d.open=true; d.scrollIntoView({block:'start'}); window.scrollBy(0,-50);
  return d.querySelectorAll('.p').length;});
await pausa(2500);
await p.screenshot({path:'cibo1.png'});
await p.evaluate(()=>window.scrollBy(0,1500));
await pausa(2000);
await p.screenshot({path:'cibo2.png'});
console.log('schede nella sezione:',n);
await br.close();})();
