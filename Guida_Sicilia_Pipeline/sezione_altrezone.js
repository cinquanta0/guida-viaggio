/* Racconta il quinto giro: l'audit su tutte le zone, non solo casa, e il
   bug trovato nel controllo anti-omonimo.

   Entra dopo la sezione su Google Maps, di cui e' la naturale continuazione.

   Uso: node sezione_altrezone.js  */

const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/come-e-fatto.html';

const ANCORA = '<h3>Niente itinerario rigido</h3>';

const SEZIONE = `<h3>L&rsquo;audit non finisce a casa</h3>
<p>Dopo aver sistemato le zone vicino ad Aci Catena, la domanda giusta era: <em>e il resto?</em>
Rifacendo la stessa tabella per-zona-per-tipo su <strong>tutto</strong> il sito sono usciti buchi
seri anche in destinazioni importanti, non periferiche: <strong>Siracusa città non aveva un solo
posto per la carne, e nemmeno per la pizza</strong>. Ragusa era quasi vuota su tutti i tipi.
Modica &mdash; la città del cioccolato &mdash; Cefalù, Trapani e Messina non avevano un solo posto
per la carne. Sistemate tutte e sei con lo stesso metodo: ricerche mirate su Google Maps, verifica
che il locale esista davvero, tempo calcolato con OSRM.</p>
<p>Anche Acireale, dopo tre giri di ricerche mirate per tipo, non era ancora esaurita: una ricerca
<strong>generica</strong> &ldquo;ristoranti Acireale&rdquo;, senza filtrare per categoria, ha
tirato fuori cinque locali buoni mai visti. Non c&rsquo;è un punto in cui Google smette di dare
risultati nuovi: c&rsquo;è solo il punto in cui io smetto di provare query diverse. La differenza
fra questo sito e una copia di Google Maps è che qui qualcuno ha scelto, non che la lista sia
finita.</p>
<p>Un bug, in questo giro, ha insegnato una cosa sulla geografia amministrativa italiana: il
controllo che scarta gli indirizzi omonimi cercava la parola &ldquo;Siracusa&rdquo; da qualche
parte nell&rsquo;indirizzo trovato. Ma Siracusa è insieme il nome della città <strong>e</strong>
della sua provincia, quindi un locale a Portopalo di Capo Passero &mdash; che sta in provincia di
Siracusa, a un&rsquo;ora abbondante dalla città &mdash; passava il controllo lo stesso, e un
ristorante e&rsquo; finito in guida con <strong>116 minuti di distanza</strong> spacciati per gli
stessi 70 dei suoi vicini di scheda. Il controllo ora legge il campo strutturato che Nominatim
restituisce per il comune, separato da quello della provincia, invece di cercare una parola dentro
un indirizzo scritto in prosa.</p>

`;

let s = fs.readFileSync(F, 'utf8');
if (s.indexOf('L&rsquo;audit non finisce a casa') >= 0) { console.log('gia presente'); process.exit(0); }
if (s.indexOf(ANCORA) < 0) { console.log('non trovo il punto di innesto'); process.exit(1); }
s = s.replace(ANCORA, SEZIONE + ANCORA);
fs.writeFileSync(F, s, 'utf8');
console.log('sezione aggiunta');
