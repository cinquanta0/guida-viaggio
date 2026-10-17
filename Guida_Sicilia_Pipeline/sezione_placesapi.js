/* Racconta il cambio di metodo: dalla ricerca manuale col browser alla
   Google Places API, che ha chiuso in un colpo solo 71 dei 73 buchi
   rimasti su tutto il sito.

   Uso: node sezione_placesapi.js  */

const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/come-e-fatto.html';

const ANCORA = '<h3>Niente itinerario rigido</h3>';

const SEZIONE = `<h3>Il cambio di metodo: dal browser alle API</h3>
<p>Cercare col browser, un paese alla volta, funziona ma non scala: aprire una pagina, aspettare
che carichi, scorrere, leggere il testo &mdash; per ogni singola ricerca. L&rsquo;utente ha fatto la
domanda giusta: <em>come fanno gli sviluppatori veri?</em> La risposta &egrave; che non usano un
browser, usano un&rsquo;API strutturata: una chiamata restituisce fino a venti locali gi&agrave; con
nome, indirizzo, voto, numero di recensioni e coordinate, invece di una pagina web da far scorrere
e interpretare.</p>
<p>Con la Google Places API attivata, i <strong>73 buchi rimasti su tutto il sito</strong> &mdash;
zone come Noto, Ragusa, Modica, Agrigento, San Vito Lo Capo che non avevano un solo posto per un
tipo di cibo &mdash; sono stati chiusi in una sessione sola: 73 chiamate, 339 candidati trovati,
<strong>90 scelti</strong> con lo stesso criterio di sempre (voto alto insieme a molte recensioni,
non uno dei due da solo) e uno o due per buco, mai tutti. Restano due buchi soli, entrambi per un
motivo preciso: Marzamemi non aveva un candidato sopra soglia per lo street food, e a Ragusa Ibla
l&rsquo;unico risultato per i dolci era lo stesso locale gi&agrave; scelto per Ragusa &mdash; stessa
gelateria, due ricerche diverse, tenuta una volta sola.</p>
<p>Una cosa e&rsquo; cambiata in meglio nel processo stesso: le coordinate di ogni locale sono
adesso quelle che Google d&agrave; per il locale, non quelle di un indirizzo scritto in prosa da
un secondo servizio di geocodifica. Elimina alla radice l&rsquo;errore di stamattina &mdash; un
locale a Portopalo di Capo Passero scambiato per uno a Siracusa perch&eacute; condividono il nome
della provincia. Ne &egrave; comunque emerso un caso simile: un locale a Palazzolo Acreide il cui
indirizzo diceva chiaramente Siracusa, quaranta chilometri pi&ugrave; in l&agrave;. Il
<em>locationBias</em> con cui la ricerca viene centrata su un paese e&rsquo; un suggerimento per
Google, non un vincolo: pu&ograve; comunque proporre un risultato fuori zona se lo ritiene
pertinente al testo cercato. Scoperto con lo stesso controllo usato per Portopalo &mdash;
confrontare il tempo di ogni scheda nuova con la media della sua zona &mdash; e corretto aggiungendo
un filtro che scarta chi non menziona il comune cercato nel proprio indirizzo.</p>

`;

let s = fs.readFileSync(F, 'utf8');
if (s.indexOf('Il cambio di metodo: dal browser alle API') >= 0) { console.log('gia presente'); process.exit(0); }
if (s.indexOf(ANCORA) < 0) { console.log('non trovo il punto di innesto'); process.exit(1); }
s = s.replace(ANCORA, SEZIONE + ANCORA);
fs.writeFileSync(F, s, 'utf8');
console.log('sezione aggiunta');
