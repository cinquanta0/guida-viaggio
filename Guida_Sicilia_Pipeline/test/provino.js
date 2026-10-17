const puppeteer=require('puppeteer-core');
const fs=require('fs');
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
const IMG='C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img';
const WEB='http://127.0.0.1:8899/assets/img';
(async()=>{
 const file=fs.readdirSync(IMG).filter(f=>/-(2|3)\.jpg$/.test(f)&&!/-480/.test(f)).sort();
 const pagina=Math.ceil(file.length/24);
 const br=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox','--allow-file-access-from-files']});
 const p=await br.newPage();
 await p.setViewport({width:1200,height:1000});
 for(let n=0;n<pagina;n++){
  const gruppo=file.slice(n*24,(n+1)*24);
  const html='<style>body{font:12px sans-serif;background:#fff;margin:0;padding:8px}'
   +'div{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}'
   +'figure{margin:0}img{width:100%;height:150px;object-fit:cover;display:block}'
   +'figcaption{font-size:11px;padding:2px 0;word-break:break-all}</style><div>'
   +gruppo.map(f=>'<figure><img src="'+WEB+'/'+f+'"><figcaption>'+f.replace('.jpg','')+'</figcaption></figure>').join('')
   +'</div>';
  await p.goto('http://127.0.0.1:8899/');await p.setContent(html);
  await pausa(1200);
  await p.screenshot({path:'provino'+(n+1)+'.png',fullPage:true});
 }
 await br.close();
 console.log('fogli:',pagina,'| foto:',file.length);
})();
