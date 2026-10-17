const puppeteer=require('puppeteer-core');
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.env.SITO||'https://guida-sicilia-2026.web.app/';
(async()=>{
const br=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await br.newPage();
await p.setViewport({width:390,height:800});
await p.goto(URL,{waitUntil:'domcontentloaded'});
await pausa(1200);

async function cerca(q){
  await p.evaluate(()=>{const c=document.getElementById('cerca');c.value='';c.dispatchEvent(new Event('input',{bubbles:true}));});
  await p.focus('#cerca');
  await p.type('#cerca',q,{delay:25});
  await pausa(500);
  return p.evaluate(()=>{
    const vis=e=>getComputedStyle(e).display!=='none';
    document.querySelectorAll('details').forEach(d=>d.open=true);
    // schede dei posti (fasce con data-f)
    const posti=[...document.querySelectorAll('.fascia[data-f] .p')];
    // schede del cibo
    const dett=[...document.querySelectorAll('details.fascia')].find(d=>d.textContent.indexOf('Cosa vi mettono nel piatto')>=0);
    const cibo=[...dett.querySelectorAll('.p')];
    const sugg=[...document.querySelectorAll('#sugg li')].map(li=>li.getAttribute('data-v'));
    return {
      postiVisibili: posti.filter(vis).length,
      postiTotali: posti.length,
      ciboVisibili: cibo.filter(vis).length,
      ciboTotali: cibo.length,
      suggerimenti: sugg.slice(0,3),
      contatore: (document.querySelector('.b-conta,.conta,#conta')||{textContent:''}).textContent.trim()
    };
  });
}

for (const q of ['cannolo','arancino','granita','patacalzone','stigghiola','pistacchio']){
  const r=await cerca(q);
  console.log('cerco "'+q+'"');
  console.log('   posti mostrati: '+r.postiVisibili+'/'+r.postiTotali
    +'   |   schede cibo mostrate: '+r.ciboVisibili+'/'+r.ciboTotali);
  console.log('   suggerimenti: '+(r.suggerimenti.length?r.suggerimenti.join(' / '):'nessuno'));
}
await br.close();
})();
