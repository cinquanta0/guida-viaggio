const puppeteer=require('puppeteer-core');
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
const WEB='http://127.0.0.1:8899/assets/img';
const file=['rollo','cipollina','nzuddi','rianata','salsiccia','polpette','lattemandorla','focacciamessinese','pizzasiciliana','patacalzone','arrusti','bolognese'].map(f=>f+'.jpg');
(async()=>{
const br=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await br.newPage(); await p.setViewport({width:1100,height:700});
await p.goto('http://127.0.0.1:8899/');
await p.setContent('<style>body{font:13px sans-serif;margin:0;padding:8px}div{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}img{width:100%;height:180px;object-fit:contain;background:#eee;display:block}figcaption{padding:3px 0}</style><div>'
 + file.map(f=>'<figure style="margin:0"><img src="'+WEB+'/'+f+'"><figcaption>'+f+'</figcaption></figure>').join('') + '</div>');
await pausa(1500);
await p.screenshot({path:'provino_cibo3.png',fullPage:true});
await br.close();console.log('ok');})();
