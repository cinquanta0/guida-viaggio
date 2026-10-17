/* Racconta la terza fonte: Google Maps, letto col browser invece che con
   curl, per riempire le zone piu' vicine a casa che erano rimaste scarne.

   Entra subito dopo la sezione su TheFork, di cui e' la naturale
   continuazione: prima la deroga sulle fonti, poi come e' stata usata per
   davvero.

   Uso: node sezione_maps.js  */

const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/come-e-fatto.html';

const ANCORA = '<h3>Niente itinerario rigido</h3>';

const SEZIONE = `<h3>Google Maps per le zone vicino casa</h3>
<p>Con TheFork ammesso come fonte, restava un problema pratico: sia TheFork sia Google Maps
rispondono <strong>403</strong> a qualsiasi richiesta automatica, anche a un browser vero se non
c&rsquo;&egrave; una persona dietro. Curl, script, tutto respinto. La soluzione &egrave; stata
leggerli <strong>col browser</strong>, come fa chiunque altro: a quel punto sono pagine normali.</p>
<p>Serviva perch&eacute; Acireale e Aci Catena, cercando solo dentro i loro confini, sembravano
avere pochissimo da mangiare &mdash; ad Aci Catena, zero carne e zero pesce. L&rsquo;errore era
cercare per comune: qui i paesi sono attaccati uno all&rsquo;altro, e allargando a Aci Castello, Aci
Trezza e Valverde sono usciti sedici locali buoni che prima non c&rsquo;erano. <strong>Aci Castello
non aveva un solo posto dove mangiare</strong>, e ora ne ha quattro.</p>
<p>La selezione incrocia voto alto e numero di recensioni insieme: un 4,9 su nove recensioni non
dice niente, un 4,3 su duemila s&igrave;. Ogni scheda <strong>scrive il voto e il campione</strong>,
non solo la media, e dice che viene da Google Maps &mdash; queste schede non hanno il tag
<em>Ci vanno i siciliani</em>, che resta riservato a chi &egrave; segnalato da una guida
gastronomica.</p>
<p>Una trappola, di nuovo la stessa famiglia della Praiola: cercando i ristoranti di Aci Castello
sono usciti alcuni indirizzi su &ldquo;Lungomare dei Ciclopi&rdquo;, una via che Google conosce ma
che il servizio di geocodifica usato per i tempi non indicizza. Ogni indirizzo &egrave; stato
controllato che cadesse davvero entro pochi chilometri dal centro del comune dichiarato prima di
essere accettato.</p>

`;

let s = fs.readFileSync(F, 'utf8');
if (s.indexOf('Google Maps per le zone vicino casa') >= 0) { console.log('sezione gia presente'); process.exit(0); }
if (s.indexOf(ANCORA) < 0) { console.log('non trovo il punto di innesto'); process.exit(1); }
s = s.replace(ANCORA, SEZIONE + ANCORA);
fs.writeFileSync(F, s, 'utf8');
console.log('sezione su Google Maps aggiunta');
