/* Il filtro CHE COSA deve tirare su anche i piatti; caratteristica e fondo no. */
const puppeteer=require('puppeteer-core');
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.env.SITO||'http://127.0.0.1:8899/';
/* quante voci aspettarsi lo dice cibo.js, non un numero scritto qui */
const VOCI=require('../cibo.js').length;
const esiti=[];const dice=(n,ok,i)=>{esiti.push(ok);console.log((ok?'  ok  ':'  NO  ')+n+(i?'  \u2014 '+i:''));};
(async()=>{
const br=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await br.newPage(); const err=[]; p.on('pageerror',e=>err.push(e.message));
await p.setViewport({width:390,height:800});
await p.goto(URL,{waitUntil:'domcontentloaded'}); await pausa(1000);

const stato=()=>p.evaluate(()=>{
  const vis=e=>getComputedStyle(e).display!=='none';
  const d=document.querySelector('.fascia[data-cibo]');
  const cibo=[...d.querySelectorAll('.p')];
  return {vis:cibo.filter(vis).length, tot:cibo.length, contatore:d.querySelector('.f-c b').textContent, aperta:d.hasAttribute('open')};
});
const premi=t=>p.evaluate(t=>{const f=[...document.querySelectorAll('.fb')].find(x=>x.textContent.trim()===t);f.click();},t);

dice('tutti i piatti hanno il chip del tipo',
  await p.evaluate(()=>[...document.querySelectorAll('.fascia[data-cibo] .p')].every(x=>x.querySelector('.p-tag .ti'))),
  await p.evaluate(()=>document.querySelectorAll('.fascia[data-cibo] .p-tag .ti').length)+' chip');

await premi('Dolci e granita'); await pausa(600);
const a=await stato();
dice('il filtro «Dolci e granita» tira su i piatti dolci', a.vis>0&&a.vis<a.tot, a.vis+'/'+a.tot+', contatore '+a.contatore);
dice('e apre la fascia del cibo', a.aperta);
await premi('Dolci e granita'); await pausa(500);

await premi('Street food'); await pausa(600);
const b=await stato();
dice('«Street food» tira su i pezzi da friggitoria', b.vis>0&&b.vis<b.tot, b.vis+'/'+b.tot);
await premi('Street food'); await pausa(500);

await premi('Sabbia'); await pausa(600);
const c=await stato();
dice('il fondo «Sabbia» lascia stare i piatti', c.vis===c.tot, c.vis+'/'+c.tot);
await premi('Sabbia'); await pausa(500);

await premi('Da locali'); await pausa(600);
const d=await stato();
dice('la caratteristica «Da locali» lascia stare i piatti', d.vis===d.tot, d.vis+'/'+d.tot);
await premi('Da locali'); await pausa(500);

const e=await stato();
dice('togliendo i filtri tornano tutti', e.vis===VOCI&&e.contatore===String(VOCI), e.vis+'/'+e.tot);
dice('nessun errore JavaScript', err.length===0, err.join(' | '));
const ko=esiti.filter(x=>!x).length;
console.log('\n'+(esiti.length-ko)+'/'+esiti.length+' verifiche passate');
await br.close(); process.exit(ko?1:0);
})().catch(e=>{console.error(e.stack);process.exit(3);});
