/* Aggiunge a come-e-fatto.html la sezione sul tag "Ci vanno i siciliani".

   Va raccontato perche' e' l'affermazione piu' forte di tutta la guida: dire
   "qui vanno i siciliani e non i turisti" e' un giudizio, e un giudizio ha
   bisogno di qualcuno che se lo prenda. La sezione spiega chi.

   Entra dopo "Niente dati raschiati", che e' il paragrafo con cui ragiona.
   Idempotente: se c'e' gia', non fa niente.

   Uso: node sezione_tag.js  */

const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/come-e-fatto.html';

const ANCORA = '<h3>Niente itinerario rigido</h3>';

const SEZIONE = `<h3>Un&rsquo;etichetta che qualcuno deve firmare</h3>
<p>Ventiquattro schede portano il segno <em>Ci vanno i siciliani</em>. &Egrave; l&rsquo;affermazione pi&ugrave;
rischiosa di tutta la guida: dire che un posto &egrave; quello vero e non quello per turisti &egrave; un
giudizio, e un giudizio ha bisogno di qualcuno che se lo prenda. Non sono io.</p>
<p>Ci entra solo un locale segnalato per la cucina da una guida gastronomica &mdash; la Chiocciola di
Slow Food, il Bib Gourmand della Michelin, i Gamberi del Gambero Rosso &mdash; e <strong>ogni scheda
dice quale</strong>, dentro il testo, dove la legge chiunque. Le classifiche di prenotazione online
non contano come fonte: sono i voti di chi prenota su internet, cio&egrave; esattamente il pubblico da
cui l&rsquo;etichetta vorrebbe distinguersi. Per la stessa ragione restano fuori i tre stellati
dell&rsquo;Etna: si mangia benissimo, ma a centoventi euro non &egrave; pi&ugrave; la domanda a cui
questo segno risponde.</p>
<p>Il nome sulla guida per&ograve; non prova che il locale esista ancora, n&eacute; dove sia. Cos&igrave;
ognuno &egrave; stato cercato su OpenStreetMap, e i tempi calcolati con OSRM sull&rsquo;indirizzo
trovato, come per tutti gli altri posti. Su ventinove candidati ne sono passati ventiquattro: cinque
non risultano mappati da nessuna parte e sono rimasti fuori.</p>
<p>Due erano peggio che assenti. Il confronto automatico fra le insegne aveva dato per buono
<em>&ldquo;Trattoria Il Mare&rdquo;</em> al posto di <em>Angi&ograve;, macelleria di mare</em>, con
il massimo del punteggio, perch&eacute; la parola &ldquo;mare&rdquo; compare in tutti e due i nomi; e
aveva agganciato un&rsquo;altra scheda a una pasticceria qualsiasi, perch&eacute; la sigla accorciata
del nome era una lettera sola e una lettera sola sta dentro qualunque parola. Nessuna soglia sistemava
tutti e due i casi insieme. L&rsquo;ho risolta stampando i cinque nomi pi&ugrave; vicini per ogni
locale e guardandoli: a quel punto l&rsquo;errore si vede in un secondo, mentre un numero da solo non
lo mostra mai.</p>

`;

let s = fs.readFileSync(F, 'utf8');
if (s.indexOf('Ci vanno i siciliani</em>') >= 0) { console.log('sezione gia presente'); process.exit(0); }
if (s.indexOf(ANCORA) < 0) { console.log('non trovo il punto di innesto'); process.exit(1); }

s = s.replace(ANCORA, SEZIONE + ANCORA);
fs.writeFileSync(F, s, 'utf8');
console.log('sezione aggiunta prima di "Niente itinerario rigido"');
