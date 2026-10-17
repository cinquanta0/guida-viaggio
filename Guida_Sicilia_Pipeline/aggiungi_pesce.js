/* Aggiunge cinque piatti di pesce alla sezione "Cosa vi mettono nel piatto".

   Il buco era grosso e si vedeva: su 56 voci il pesce ne aveva 5, in un'isola,
   con la base sulla costa ionica, la Pescheria di Catania in programma e
   Marzamemi che e' una tonnara.

   Ogni piatto ha una fonte:
   - masculina da magghia   Presidio Slow Food, pescata nel Golfo di Catania
   - stocco a ghiotta       Visit Sicily (sito della Regione) e stampa gastronomica
   - polpo bollito          stampa gastronomica su Catania
   - neonata / muccu        cucina catanese (Wikipedia, ricettari siciliani)
   - pasta al nero di seppia  cucina catanese

   Tre restano senza foto e non e' una dimenticanza: della masculina su Commons
   non c'e' niente; lo stoccafisso messinese c'e' ma a 436 px, sotto la misura
   piccola del sito, e la categoria "Stockfish dishes" contiene bacalhau
   portoghese e sgombro giapponese, che sotto il nome di un piatto messinese
   sarebbero foto finte; il nero di seppia non ha nemmeno la categoria.

   NOTA sul formato: a differenza di dati.js, qui le descrizioni vogliono
   l'HTML gia' pronto (&egrave;, &rsquo;, <b>). La parola "indicativo" accanto
   al prezzo la mette build.js da sola: non va scritta nel campo `p`.

   Uso: node aggiungi_pesce.js    poi build.js && crediti.js  */

const fs = require('fs');
const F = 'cibo.js';

const NUOVI = [
  {
    n: 'Masculina da magghia',
    zona: 'Golfo di Catania',
    t: 'pesce pasta',
    p: '10&ndash;16 &euro;',
    d: 'Le alici pescate nel golfo qui davanti, con un metodo che ha un nome preciso: restano prese per la testa nella maglia della rete &mdash; <i>a magghia</i> &mdash; e quel modo di finire dissanguate le rende pi&ugrave; saporite. &Egrave; <b>Presidio Slow Food</b>. Si mangiano nella pasta con il finocchietto selvatico, oppure infilate su uno spiedo alternate a scorza di limone e foglie d&rsquo;alloro e arrostite sulla brace. Si pescano da aprile, di notte. Se le vedete su un menu della costa fra Catania e Aci Trezza, sono di qui.'
  },
  {
    n: 'Stocco a ghiotta',
    zona: 'Messina',
    t: 'pesce',
    p: '12&ndash;18 &euro;',
    d: 'Il piatto che a Messina vale quanto la Norma a Catania. Lo <b>stoccafisso</b> &mdash; merluzzo essiccato al vento del nord, che arriva da Norvegia e Islanda &mdash; cotto in umido con patate, pomodoro, olive, capperi e sedano. Una cosa nordica diventata messinese nei secoli, e non &egrave; un paradosso: senza frigoriferi, il pesce che durava era quello seccato.'
  },
  {
    n: 'Polpo bollito',
    zona: 'Catania, la Pescheria',
    t: 'pesce street',
    img: 'polpo.jpg',
    alt: 'Polpo bollito con olio e limone',
    p: '8&ndash;14 &euro;',
    d: 'Bollito e servito tiepido, tagliato a pezzi, con <b>olio crudo e limone</b> e nient&rsquo;altro. Ai banchi della Pescheria lo servono in un bicchiere di plastica da mangiare in piedi; nelle trattorie arriva nel piatto. &Egrave; il modo pi&ugrave; catanese di mangiare il polpo: nessuna salsa, si sente solo il polpo.'
  },
  {
    n: 'Neonata',
    zona: 'Catania',
    t: 'pesce street',
    img: 'neonata.jpg',
    alt: 'Neonata, novellame di pesce azzurro',
    p: '6&ndash;10 &euro;',
    d: 'Il novellame di pesce azzurro, minuscolo e argentato: a Catania si chiama anche <b>muccu</b>. Si impasta con uovo, farina, prezzemolo e formaggio e si frigge a cucchiaiate, e vengono i <i>puppetti di muccu</i>, polpette piatte. La foto mostra il pesce com&rsquo;&egrave; quando lo comprate, non il piatto finito. <b>Attenzione</b>: la pesca del novellame ha stagioni e limiti di legge, quindi non lo trovate tutto l&rsquo;anno &mdash; ad agosto &egrave; difficile.'
  },
  {
    n: 'Pasta al nero di seppia',
    zona: 'Catania e la costa',
    t: 'pesce pasta',
    p: '10&ndash;16 &euro;',
    d: 'Spaghetti o linguine col nero della seppia, che tinge tutto e lascia un sapore di mare pieno, quasi metallico. Si prepara con aglio, vino bianco e le erbe. Arrivate al tavolo con la bocca nera: fa parte del piatto.'
  }
];

/* controllo: dentro cibo.js NON devono finire apostrofi dritti nelle
   descrizioni, perche' qui il testo passa cosi' com'e' nell'HTML */
const guai = [];
for (const v of NUOVI) {
  if (v.img && !fs.existsSync('C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/' + v.img))
    guai.push(v.n + ': manca il file ' + v.img);
  if (v.img && !fs.existsSync('C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/' + v.img.replace(/\.jpg$/, '-480.jpg')))
    guai.push(v.n + ': manca la versione 480 di ' + v.img);
}
if (guai.length) { guai.forEach(g => console.log('  ' + g)); process.exit(1); }

delete require.cache[require.resolve('./' + F)];
const prima = require('./' + F).length;
const esistenti = new Set(require('./' + F).map(v => v.n.toLowerCase()));

let testo = fs.readFileSync(F, 'utf8');
const chiusura = testo.lastIndexOf('];');
if (chiusura === -1) { console.log('non trovo la fine dell array'); process.exit(1); }

let righe = '';
for (const v of NUOVI) {
  if (esistenti.has(v.n.toLowerCase())) { console.log('gia presente: ' + v.n); continue; }
  righe += ' ' + JSON.stringify(v, null, 1).split('\n').join('\n ') + ',\n';
  console.log('  + ' + v.n.padEnd(26) + (v.img ? '[foto]' : '[senza foto]'));
}
/* la voce prima della chiusura ha gia' la virgola? il file finisce con "}\n];" */
testo = testo.slice(0, chiusura).replace(/\}\s*$/, '},\n') + righe.replace(/,\n$/, '\n') + '];\n';
fs.writeFileSync(F, testo, 'utf8');

delete require.cache[require.resolve('./' + F)];
const dopo = require('./' + F);
console.log('\npiatti: ' + prima + ' -> ' + dopo.length);
const pesce = dopo.filter(v => (v.t || '').split(/\s+/).includes('pesce'));
console.log('di pesce: ' + pesce.length + ' (' + pesce.filter(v => v.img).length + ' con foto)');
