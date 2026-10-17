/* Racconta in come-e-fatto.html la ricerca che capisce le frasi.

   Entra dopo "La ricerca e' nata da un bug d'uso", che e' il paragrafo con
   cui fa coppia: li' si racconta come e' nata la ricerca, qui come e'
   diventata capace di leggere una domanda.

   Uso: node sezione_ricerca.js  */

const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/come-e-fatto.html';

const ANCORA = '<h2>Cosa ho deciso di non fare</h2>';

const SEZIONE = `<h3>Scrivere una domanda invece di una parola</h3>
<p>Chi cerca non pensa per categorie, pensa per frasi: <em>dove si mangia carne ad Acireale</em>.
Scritta cos&igrave;, fino a ieri, non trovava <strong>niente</strong>. La ricerca spezzava la frase e
pretendeva che ogni parola comparisse nel testo della scheda, ma il tipo di un posto non sta nel
testo: sta in un attributo. La parola &ldquo;carne&rdquo; non era scritta da nessuna parte nella
scheda di una braceria.</p>
<p>Ora le parole che sono categorie vengono riconosciute e diventano un filtro, e il resto della
frase &mdash; di solito il nome di un paese &mdash; resta ricerca. <em>Carne ad Acireale</em> accende
<em>Carne</em> e cerca Acireale; il bottone si illumina da solo, cos&igrave; si vede cosa ha capito e
lo si pu&ograve; smentire premendone un altro.</p>
<p>Due cose sono state pi&ugrave; difficili di quanto sembri. La prima: in
&ldquo;dove si <strong>mangia</strong> <strong>carne</strong>&rdquo; ci sono due categorie, e la
prima che si incontra &egrave; quella pi&ugrave; generica. Prendendo la prima, la frase pi&ugrave;
naturale dava il risultato pi&ugrave; vago: adesso vince sempre la pi&ugrave; precisa. La seconda:
nel vocabolario ci sono solo parole generiche, <strong>mai nomi di piatti</strong>. Se
&ldquo;arancino&rdquo; accendesse il filtro street food, cercare &ldquo;arancino&rdquo; non
troverebbe pi&ugrave; la scheda dell&rsquo;arancino &mdash; che &egrave; esattamente quello che uno
sta cercando.</p>
<p>Per lo stesso motivo, se in una frase non c&rsquo;&egrave; nessuna categoria la ricerca resta
identica a prima. Un miglioramento che rompe quello che gi&agrave; funzionava non &egrave; un
miglioramento: quattro delle undici verifiche di questa funzione servono solo a controllare che
cercare <em>Pachino</em>, <em>arancino</em>, <em>granita</em> o il nome di una trattoria dia ancora
gli stessi risultati di prima.</p>

`;

let s = fs.readFileSync(F, 'utf8');
if (s.indexOf('Scrivere una domanda invece di una parola') >= 0) { console.log('gia presente'); process.exit(0); }
if (s.indexOf(ANCORA) < 0) { console.log('non trovo il punto di innesto'); process.exit(1); }
s = s.replace(ANCORA, SEZIONE + ANCORA);
fs.writeFileSync(F, s, 'utf8');
console.log('sezione sulla ricerca aggiunta');
