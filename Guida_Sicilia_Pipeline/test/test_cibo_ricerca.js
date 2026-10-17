/* La sezione cibo deve rispondere al testo cercato ma NON ai filtri di
   categoria, e scegliere un piatto dai suggerimenti deve portarci sopra. */
const puppeteer=require('puppeteer-core');
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.env.SITO||'http://127.0.0.1:8899/';
/* quante voci aspettarsi lo dice cibo.js, non un numero scritto qui */
const VOCI=require('../cibo.js').length;
const esiti=[];
const dice=(n,ok,i)=>{esiti.push(ok);console.log((ok?'  ok  ':'  NO  ')+n+(i?'  \u2014 '+i:''));};
(async()=>{
const br=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await br.newPage();
const err=[]; p.on('pageerror',e=>err.push(e.message));
await p.emulate({name:'tel',userAgent:'Mozilla/5.0 (Linux; Android 12) Mobile Safari/537.36',viewport:{width:390,height:800,deviceScaleFactor:2,isMobile:true,hasTouch:true}});
await p.goto(URL,{waitUntil:'domcontentloaded'});
await pausa(1000);

const stato=()=>p.evaluate(()=>{
  const vis=e=>getComputedStyle(e).display!=='none';
  const d=document.querySelector('.fascia[data-cibo]');
  const cibo=[...d.querySelectorAll('.p')];
  return {
    ciboVis: cibo.filter(vis).length, ciboTot: cibo.length,
    contatore: d.querySelector('.f-c b').textContent,
    aperta: d.hasAttribute('open'),
    evidenziati: document.querySelectorAll('.p.evidenzia').length
  };
});
async function scrivi(q){
  await p.evaluate(()=>{const c=document.getElementById('cerca');c.value='';c.dispatchEvent(new Event('input',{bubbles:true}));});
  await p.focus('#cerca'); await p.type('#cerca',q,{delay:25}); await pausa(500);
}

const a=await stato();
dice('senza ricerca si vedono tutti i piatti', a.ciboVis===VOCI&&a.contatore===String(VOCI), a.ciboVis+'/'+a.ciboTot+', contatore '+a.contatore);

await scrivi('cannolo');
const b=await stato();
dice('cercando un piatto resta solo quello', b.ciboVis===1, b.ciboVis+' visibile, contatore '+b.contatore);
dice('il contatore della fascia si aggiorna', b.contatore==='1');
dice('la fascia del cibo si apre da sola', b.aperta);

/* un filtro di categoria NON deve toccare i piatti */
await p.evaluate(()=>{const c=document.getElementById('cerca');c.value='';c.dispatchEvent(new Event('input',{bubbles:true}));const b=document.querySelector('.b-pulisci');if(b)b.click();});
await pausa(400);
await p.evaluate(()=>{const f=[...document.querySelectorAll('.fb')].find(x=>x.textContent.trim()==='Mare');f.click();});
await pausa(600);
const c=await stato();
dice('il filtro «Mare» svuota la sezione cibo (nessun piatto e una spiaggia)', c.ciboVis===0, c.ciboVis+'/'+VOCI);
await p.evaluate(()=>{const f=[...document.querySelectorAll('.fb')].find(x=>x.textContent.trim()==='Mare');f.click();});
await pausa(400);

/* scegliere un piatto dai suggerimenti */
await scrivi('patacalz');
const sugg=await p.evaluate(()=>[...document.querySelectorAll('#sugg li')].map(l=>l.getAttribute('data-v')));
dice('il piatto compare fra i suggerimenti', sugg.indexOf('Patacalzone')>=0, sugg.join(' / ')||'nessuno');
const box=await p.evaluate(()=>{const l=[...document.querySelectorAll('#sugg li')].find(x=>x.getAttribute('data-v')==='Patacalzone');const r=l.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
await p.touchscreen.touchStart(box.x,box.y);
await p.touchscreen.touchEnd();
await pausa(900);
const d=await p.evaluate(()=>{
  const ev=document.querySelector('.p.evidenzia');
  return { valore:document.getElementById('cerca').value, nome: ev?ev.getAttribute('data-n'):null, cibo: ev?ev.hasAttribute('data-cibo'):false };
});
dice('scegliendolo si arriva sulla scheda del piatto', d.nome==='Patacalzone'&&d.cibo, 'evidenziato: '+d.nome);

/* il prezzo si vede sulla scheda trovata */
const pr=await p.evaluate(()=>{
  const ev=document.querySelector('.p.evidenzia');
  const e=ev&&ev.querySelector('.p-prezzo');
  return e?e.textContent.replace(/\s+/g,' ').trim():null;});
dice('e il prezzo e\u0027 li\u0027 sulla scheda', !!pr&&/indicativo/.test(pr), pr||'assente');

dice('nessun errore JavaScript', err.length===0, err.join(' | '));
const ko=esiti.filter(x=>!x).length;
console.log('\n'+(esiti.length-ko)+'/'+esiti.length+' verifiche passate');
await br.close(); process.exit(ko?1:0);
})().catch(e=>{console.error(e.stack);process.exit(3);});
