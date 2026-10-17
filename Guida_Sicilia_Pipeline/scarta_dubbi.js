/* Toglie da veri_verificati.json i due agganci che si sono rivelati falsi.

   angio     -> il secondo giro gli aveva dato "Trattoria Il Mare" con
                punteggio 1.00, solo perche' "mare" compare in entrambi i
                nomi. Su OSM a Catania "Angio'" non c'e': ci sono gli ottici
                Angiolucci. Meglio una scheda in meno che una scheda che
                manda il lettore all'indirizzo sbagliato.
   agricolab -> esiste "Agricolab al Borgo dell'Etna", ma sta a 37.744, cioe'
                dalle parti di Mascali, mentre la fonte lo mette nel cuore di
                Catania. Puo' essere un secondo locale o un altro locale: non
                lo so, quindi non lo pubblico.

   E' la stessa regola della Praiola: nel dubbio sul soggetto, si lascia fuori.

   Uso: node scarta_dubbi.js  */

const fs = require('fs');
const F = 'veri_verificati.json';
const FUORI = ['angio', 'agricolab'];

const j = JSON.parse(fs.readFileSync(F, 'utf8'));
let n = 0;
for (const k of FUORI) if (j[k]) { delete j[k]; n++; console.log('tolto: ' + k); }
fs.writeFileSync(F, JSON.stringify(j, null, 1));
console.log('rimossi ' + n + ', restano ' + Object.keys(j).length);
