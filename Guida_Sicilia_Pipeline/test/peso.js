const puppeteer=require('puppeteer-core');
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
async function misura(url,etichetta){
 const br=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
 const p=await br.newPage();
 await p.emulate({name:'tel',userAgent:'Mozilla/5.0 (Linux; Android 12) Mobile Safari/537.36',viewport:{width:390,height:780,deviceScaleFactor:2,isMobile:true,hasTouch:true}});
 let bytes=0,img=0,nImg=0;
 p.on('response',async r=>{try{
   const b=(await r.buffer()).length; bytes+=b;
   if(/image/.test(r.headers()['content-type']||'')){img+=b;nImg++;}
 }catch(e){}});
 await p.goto(url,{waitUntil:'networkidle2'});
 await pausa(2500);
 console.log(etichetta.padEnd(26)+ (bytes/1048576).toFixed(2)+' MB totali  |  '+(img/1048576).toFixed(2)+' MB di foto ('+nImg+' immagini)');
 await br.close();
}
(async()=>{
 await misura('https://guida-sicilia-2026.web.app/','online (versione di prima)');
 await misura('http://127.0.0.1:8899/','locale (con i caroselli)');
})();
