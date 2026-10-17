/* Toglie dalle schede gli indirizzi che non vengono da una fonte, e corregge
   i due che una fonte ha smentito.

   Il problema: scrivendo le schede ho messo l'indirizzo anche dove la guida
   mi dava solo nome e paese. Quegli indirizzi non li ha detti nessuno, li ho
   scritti io, e in un sito che calcola i tempi con OSRM e verifica le licenze
   delle foto sono esattamente il genere di dato che non deve esserci.
   Il numero civico sbagliato manda una persona a un portone che non e' quello,
   e non c'e' modo per il lettore di sapere che quel dato vale meno degli altri.

   Togliere non rompe niente: il link "Apri in mappa" si costruisce con nome +
   zona, non con l'indirizzo, quindi continua a funzionare.

   Due invece erano proprio sbagliati, e li correggo con quello che dice
   Cronache di Gusto, che li pubblica con nome, indirizzo e telefono:
     Fratelli Borrello  Contrada Fiumara -> Contrada Forte 7
     Andrea             Via Machiavelli 5 -> Corso Vittorio Emanuele

   Uso: node correggi_indirizzi.js    poi build.js && crediti.js  */

const fs = require('fs');
const DATI = 'dati.js';

/* indirizzi scritti da me senza fonte: via dalle schede */
const DA_TOGLIERE = [
  'San Giorgio e il Drago', 'Pasticceria Russo', 'Pasticceria Musumeci',
  'Lo Scrigno dei Sapori', 'U Sulicce’nti', 'Cucina e Vino',
  'Latteria Mamma Iabica', 'Casa & Putia', 'Da Luciana', 'Nangalarruni',
  'Buatta Cucina Popolana', 'Cantina Siciliana', 'Ginger People & Food',
  'Terracotta', 'Caupona Taverna di Sicilia', 'Agriturismo Giannavì'
];

/* smentiti da una fonte che li pubblica per esteso */
const DA_CORREGGERE = {
  'Fratelli Borrello': 'Contrada Forte 7',
  'Andrea — Sapori Montani': 'Corso Vittorio Emanuele'
};

function conta() {
  delete require.cache[require.resolve('./' + DATI)];
  const d = require('./' + DATI);
  const c = {};
  d.forEach(p => Object.keys(p).forEach(k => { c[k] = (c[k] || 0) + 1; }));
  return { n: d.length, campi: c };
}
const prima = conta();

let testo = fs.readFileSync(DATI, 'utf8');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let tolti = 0, corretti = 0;
const guai = [];

for (const nome of DA_TOGLIERE) {
  /* dentro l'oggetto con quel nome, elimino il solo pezzo , a:"..." */
  const re = new RegExp('(\\{b:\\d+, n:"' + esc(nome) + '",[^}]*?), a:"[^"]*"');
  if (!re.test(testo)) { guai.push(nome + ': indirizzo non trovato'); continue; }
  testo = testo.replace(re, '$1');
  tolti++;
}

for (const [nome, nuovo] of Object.entries(DA_CORREGGERE)) {
  const re = new RegExp('(\\{b:\\d+, n:"' + esc(nome) + '",[^}]*?, a:")[^"]*(")');
  if (!re.test(testo)) { guai.push(nome + ': non trovato'); continue; }
  testo = testo.replace(re, '$1' + nuovo + '$2');
  corretti++;
}

fs.writeFileSync(DATI, testo, 'utf8');

const dopo = conta();
console.log('indirizzi tolti: ' + tolti + ' su ' + DA_TOGLIERE.length);
console.log('indirizzi corretti: ' + corretti + ' su ' + Object.keys(DA_CORREGGERE).length);
console.log('campo a: ' + (prima.campi.a || 0) + ' -> ' + (dopo.campi.a || 0));
console.log('schede: ' + prima.n + ' -> ' + dopo.n);
let perso = false;
for (const campo of Object.keys(prima.campi)) {
  if (campo === 'a') continue;   /* questo lo sto togliendo apposta */
  const a = prima.campi[campo], b = dopo.campi[campo] || 0;
  if (b < a) { console.log('  ATTENZIONE: campo ' + campo + ' passato da ' + a + ' a ' + b); perso = true; }
}
if (guai.length) { console.log('\nda guardare:'); guai.forEach(g => console.log('  ' + g)); }
console.log(perso ? '\nQUALCOSA SI E PERSO' : '\nnessun altro campo toccato.');
