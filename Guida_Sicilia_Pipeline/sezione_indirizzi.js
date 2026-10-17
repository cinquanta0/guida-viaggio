/* Sistema una frase resa incoerente dal nuovo conteggio e aggiunge il
   paragrafo sugli indirizzi tolti.

   Va raccontato perche' e' un errore che ho fatto e corretto, ed e' lo stesso
   tipo di errore contro cui tutto il resto della pagina mette in guardia:
   un dato che sembra preciso come gli altri, e invece non lo e'.

   Uso: node sezione_indirizzi.js  */

const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/come-e-fatto.html';

let s = fs.readFileSync(F, 'utf8');

/* "Quattro non risultano... un quarto risulta" non torna piu' */
const vecchia = 'guida lo colloca, e non ho modo di sapere se &egrave; lo stesso locale o un altro con lo stesso nome.</p>';
const nuova   = 'guida lo colloca, e non ho modo di sapere se &egrave; lo stesso locale o un altro con lo stesso nome.</p>';
s = s.replace('Quattro\nnon risultano mappati da nessuna parte; un quarto risulta, ma a ventisette chilometri da dove la',
              'Quattro\nnon risultano mappati da nessuna parte; un altro risulta, ma a ventisette chilometri da dove la');

const PARAGRAFO = `<p>E c&rsquo;&egrave; una cosa che ho dovuto togliere. Scrivendo le schede avevo messo
l&rsquo;indirizzo anche dove la guida mi dava solo il nome e il paese: quei numeri civici non li
aveva detti nessuno, li avevo scritti io. Me ne sono accorto quando una fonte successiva ha
pubblicato gli indirizzi per esteso e due non combaciavano &mdash; Fratelli Borrello non &egrave; in
contrada Fiumara ma in contrada Forte, e Andrea non &egrave; in via Machiavelli ma sul corso.
Ho corretto quei due e <strong>cancellato gli altri diciotto</strong>, lasciando solo il paese.
In un sito che calcola i tempi sul percorso vero e verifica la licenza di ogni foto, un civico
inventato &egrave; il dato peggiore di tutti: sembra preciso quanto gli altri, e manda una persona
al portone sbagliato. Il collegamento alla mappa funziona lo stesso, perch&eacute; usa il nome e il
paese, non il numero.</p>

`;

const ANCORA = '<h3>Niente itinerario rigido</h3>';
if (s.indexOf('cancellato gli altri diciotto') >= 0) {
  console.log('paragrafo gia presente');
} else if (s.indexOf(ANCORA) < 0) {
  console.log('non trovo il punto di innesto'); process.exit(1);
} else {
  s = s.replace(ANCORA, PARAGRAFO + ANCORA);
  console.log('paragrafo sugli indirizzi aggiunto');
}

fs.writeFileSync(F, s, 'utf8');
