/* Rimette la sezione sui due filtri dentro il LEGGIMI.

   La prima volta l'ho scritta passando il testo dentro `node -e`, e la shell
   di questo ambiente si e' mangiata tutto quello che stava fra i backtick:
   nella tabella erano spariti i nomi dei tipi e degli script, lasciando frasi
   come "Non sono tipi scritti in **: li aggiunge  dentro  al valore di ,".
   E' la stessa trappola gia' segnata per gli heredoc quotati.
   Regola, di nuovo: testo non banale si scrive con un file, mai in riga.

   Idempotente: taglia la sezione se c'e' gia' e la riscrive.
   Uso: node ripara_leggimi.js  */

const fs = require('fs');
const F = 'LEGGIMI.md';
const TITOLO = '## I due filtri sul mangiare';

const b = '`';   /* il backtick tenuto in una variabile, non scritto in riga */

const SEZIONE = TITOLO + `

Primi due bottoni di CHE COSA. **Non sono tipi scritti in ${b}dati.js${b}**: li
aggiunge ${b}tipiFiltro()${b} dentro ${b}build.js${b} al valore di ${b}data-t${b},
e non producono chip sulle schede.

| Bottone | Regola | Quanti |
|---|---|---|
| **Ristoranti** | ${b}pasta${b} / ${b}pesce${b} / ${b}carne${b}: ci si siede e si fa un pasto | 114 |
| **Dove si mangia** | tutti e sei i tipi di cibo, pasticcerie e friggitorie comprese | 208 |

Una **pizzeria-trattoria** (${b}pizza pasta${b}) sta dentro *Ristoranti*: c'e' il
primo e ci si siede. Sono 11. Restano fuori le pizzerie pure, le 42 pasticcerie
e gelaterie e le 15 friggitorie.

Servono perche' i bottoni di uno stesso gruppo **si escludono a vicenda**:
premendo *Pesce* si spegne *Pizza*, quindi senza questi due non c'era modo di
vedere i ristoranti tutti insieme.

Li protegge ${b}test/test_mangiare.js${b} (13 verifiche), che controlla anche che
nessuna pasticceria entri fra i ristoranti e che le pizzerie-trattorie invece
ci restino.
`;

let s = fs.readFileSync(F, 'utf8');
const i = s.indexOf(TITOLO);
if (i >= 0) s = s.slice(0, i);          /* via la versione rovinata */
s = s.trimEnd() + '\n\n' + SEZIONE;
fs.writeFileSync(F, s, 'utf8');

/* controllo: nella sezione i nomi devono esserci davvero */
const scritto = fs.readFileSync(F, 'utf8').slice(s.indexOf(TITOLO));
const attesi = ['dati.js', 'tipiFiltro()', 'build.js', 'data-t', 'pasta', 'pesce', 'carne', 'test/test_mangiare.js'];
const persi = attesi.filter(x => scritto.indexOf(x) < 0);
console.log('sezione riscritta, ' + fs.readFileSync(F, 'utf8').split('\n').length + ' righe in tutto');
console.log(persi.length ? 'ANCORA PERSI: ' + persi.join(', ') : 'tutti i nomi al loro posto: ' + attesi.length);
