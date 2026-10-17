const puppeteer=require('puppeteer-core');
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const br=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await br.newPage();
await p.emulate({name:'tel',userAgent:'Mozilla/5.0 (Linux; Android 12) Mobile Safari/537.36',viewport:{width:390,height:820,deviceScaleFactor:2,isMobile:true,hasTouch:true}});
await p.goto('http://127.0.0.1:8899/',{waitUntil:'networkidle2'});
await pausa(900);
await p.evaluate(()=>{const f=[...document.querySelectorAll('.fb')].find(x=>x.textContent.trim()==='Dolci e granita');f.click();});
await pausa(900);
await p.evaluate(()=>{const d=document.querySelector('.fascia[data-cibo]');d.open=true;d.scrollIntoView({block:'start'});window.scrollBy(0,-40);});
await pausa(1800);
await p.screenshot({path:'cibo_tag.png'});
await br.close();console.log('ok');})();
