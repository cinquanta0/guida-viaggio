/* Racconta in come-e-fatto.html il collegamento a TheFork e il cambio di
   regola che comporta.

   Va detto perche' e' una deroga esplicita a una scelta dichiarata in quella
   stessa pagina ("niente dati raschiati", "le classifiche di prenotazione non
   sono una fonte"). Una pagina che spiega il metodo e poi non racconta quando
   il metodo e' stato cambiato non serve a niente.

   Uso: node sezione_thefork.js  */

const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/come-e-fatto.html';

const ANCORA = '<h3>Niente itinerario rigido</h3>';

const SEZIONE = `<h3>E poi TheFork, con un distinguo</h3>
<p>Su ogni scheda dove si mangia c&rsquo;&egrave; un collegamento a TheFork, accanto a quello per la
mappa: serve a vedere se il locale prende prenotazioni online e che sconto ha <em>in quel
momento</em>. Lo sconto non &egrave; scritto qui dentro apposta: TheFork lo cambia ogni giorno, e un
numero fisso in questa pagina sarebbe falso nel giro di una settimana.</p>
<p>&Egrave; una deroga a una regola che questa guida si era data, e va detta. Le classifiche di
prenotazione restano <strong>fuori come fonte</strong>: nessun locale entra nel tag
<em>Ci vanno i siciliani</em> perch&eacute; ha molte stelline su una piattaforma. Ma come
<strong>strumento</strong> per prenotare sono un&rsquo;altra cosa, e tenerle fuori per coerenza
sarebbe stato un dispetto a chi la guida la usa davvero.</p>
<p>L&rsquo;eccezione sono le due bracerie di Acireale. Aci Catena e Acireale non avevano
<strong>un solo posto dove mangiare carne</strong>: le guide gastronomiche non arrivano fin qui, e su
OpenStreetMap in tutta la zona non c&rsquo;&egrave; una braceria mappata &mdash; quindici macellerie e
nessun ristorante. Quelle due vengono da TheFork, e <strong>la loro scheda lo dice</strong>, come le
altre dicono &ldquo;Chiocciola Slow Food&rdquo;. Portano l&rsquo;indirizzo perch&eacute; l&rsquo;ho
trovato confermato da quattro fonti diverse, ma non portano il tag: un voto su una piattaforma di
prenotazioni non &egrave; una segnalazione per la cucina.</p>

`;

let s = fs.readFileSync(F, 'utf8');
if (s.indexOf('E poi TheFork') >= 0) { console.log('sezione gia presente'); process.exit(0); }
if (s.indexOf(ANCORA) < 0) { console.log('non trovo il punto di innesto'); process.exit(1); }
s = s.replace(ANCORA, SEZIONE + ANCORA);
fs.writeFileSync(F, s, 'utf8');
console.log('sezione su TheFork aggiunta');
