/* Rifa' i numeri della sezione "Il peso" in come-e-fatto.html.

   Le due misure delle foto sono cresciute con le cinque nuove:
   19 -> 19,9 MB a 900px e 5,3 -> 5,7 MB a 480px, contate sui file veri.

   Il terzo numero e' piu' delicato. La pagina diceva "1,63 MB, diciassette
   immagini" all'apertura, ma test/peso.js oggi misura 0,66 MB e una sola
   immagine, e sulla versione ONLINE - cioe' quella a cui quel numero si
   riferiva - ne misura 0,63. Quindi non e' una cosa che ho rotto io: era
   gia' un numero che lo script in casa non riproduce, preso evidentemente
   con un altro metodo o dopo aver scorso un pezzo di pagina.

   Non lo aggiusto a occhio e non lo lascio com'e': lo sostituisco con quello
   che so misurare, dicendo COME si misura. Chi vuole ricontrollarlo lancia
   test/peso.js e ritrova la stessa cifra.

   Uso: node aggiorna_peso.js  */

const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/come-e-fatto.html';

const CAMBI = [
  ['900px sul lato lungo, per il desktop: <strong>19 MB</strong> in tutto',
   '900px sul lato lungo, per il desktop: <strong>19,9 MB</strong> in tutto'],
  ['<strong>5,3 MB</strong> in tutto',
   '<strong>5,7 MB</strong> in tutto'],
  ['<p>Ma non arrivano nemmeno quelli. Le foto sono tutte a <strong>caricamento pigro</strong>:\nil telefono scarica solo quelle che entrano davvero nello schermo. Aprendo la guida\nil traffico misurato è di <strong>1,63 MB</strong>, diciassette immagini in tutto.\nLe altre duecento arrivano una alla volta, mentre si scorre, e quelle dentro un\ncarosello solo se qualcuno le sfoglia.</p>',
   '<p>Ma non arrivano nemmeno quelli. Le foto sono tutte a <strong>caricamento pigro</strong>:\nil telefono scarica solo quelle che entrano davvero nello schermo. Aprendo la guida\nsu uno schermo da 390&times;780 e stando fermi, il traffico misurato è di\n<strong>0,66 MB</strong>, di cui una sola foto: tutto il resto è la pagina stessa,\nche di posti ne contiene 339. Le altre duecentoquarantuno immagini arrivano una alla\nvolta, mentre si scorre, e quelle dentro un carosello solo se qualcuno le sfoglia.\nIl numero si rifà con <code>test/peso.js</code>, che misura l’apertura senza\nscorrere la pagina.</p>']
];

let s = fs.readFileSync(F, 'utf8');
let fatti = 0;
const mancanti = [];
for (const [da, a] of CAMBI) {
  if (s.indexOf(da) < 0) { mancanti.push(da.slice(0, 70).replace(/\n/g, ' ')); continue; }
  s = s.replace(da, a);
  fatti++;
}
fs.writeFileSync(F, s, 'utf8');
console.log('aggiornati ' + fatti + '/' + CAMBI.length);
if (mancanti.length) { console.log('NON TROVATI:'); mancanti.forEach(m => console.log('  ' + m)); }
