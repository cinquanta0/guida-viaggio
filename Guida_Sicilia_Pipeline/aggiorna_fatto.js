/* Riallinea i numeri scritti a mano dentro come-e-fatto.html.

   Quella pagina non e' generata: i numeri stanno nell'HTML e vanno rifatti a
   ogni aggiunta, altrimenti diventano falsi in silenzio (era gia' successo
   con la sezione "Il peso", che citava i megabyte della prima infornata).

   I numeri di adesso, tutti ricontati da dati.js:
     339 posti, 88 zone, 242 foto, 134 schede illustrate
     191 schede sono locali dove si mangia, 182 di queste senza foto
     159 tratte OSRM distinte (chiavi dei file tempi*.json piu' i locali nuovi)

   Il "129 tratte" del racconto a meta' pagina NON si tocca: li' si racconta
   il primo giro di calcolo, e quel giro ha prodotto davvero quel numero.
   La cifra in cima invece e' un totale, e il totale e' cambiato.

   Uso: node aggiorna_fatto.js  */

const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/come-e-fatto.html';

const CAMBI = [
  ['content="Come è stata costruita la guida: estrazione da PDF, percorsi calcolati con OSRM, 237 foto',
   'content="Come è stata costruita la guida: estrazione da PDF, percorsi calcolati con OSRM, 242 foto'],
  ['<div><b>315</b><span>posti, in 83 zone</span></div>',
   '<div><b>339</b><span>posti, in 88 zone</span></div>'],
  ['<div><b>237</b><span>foto, licenza verificata</span></div>',
   '<div><b>242</b><span>foto, licenza verificata</span></div>'],
  ['<div><b>129</b><span>percorsi stradali calcolati</span></div>',
   '<div><b>159</b><span>percorsi stradali calcolati</span></div>'],
  ['<p>167 schede su 315 sono pizzerie, trattorie e pasticcerie.',
   '<p>191 schede su 339 sono pizzerie, trattorie e pasticcerie, e 182 di loro restano senza foto.'],
  ['ha deciso cosa vale. 315 posti scelti battono 30.000 copiati.',
   'ha deciso cosa vale. 339 posti scelti battono 30.000 copiati.'],
  ['25–29 agosto 2026 &middot; 315 posti &middot; 237 foto con licenza libera.',
   '25–29 agosto 2026 &middot; 339 posti &middot; 242 foto con licenza libera.']
];

let s = fs.readFileSync(F, 'utf8');
let fatti = 0;
const mancanti = [];
for (const [da, a] of CAMBI) {
  if (s.indexOf(da) < 0) { mancanti.push(da.slice(0, 60)); continue; }
  s = s.replace(da, a);
  fatti++;
}

/* la frase sui ristoranti proseguiva con "Restano senza foto, e al loro posto":
   ora il numero e' gia' detto sopra, quindi la ripetizione va tolta */
s = s.replace('e 182 di loro restano senza foto. Foto degli interni con licenza libera non\nesistono, e una foto generica di pizza sotto un nome preciso sarebbe un\u2019immagine falsa. Restano senza\nfoto, e al loro posto ci sono etichette colorate',
              'e 182 di loro restano senza foto. Foto degli interni con licenza libera non\nesistono, e una foto generica di pizza sotto un nome preciso sarebbe un\u2019immagine falsa. Al loro posto ci sono etichette colorate');

fs.writeFileSync(F, s, 'utf8');
console.log('numeri aggiornati: ' + fatti + '/' + CAMBI.length);
if (mancanti.length) { console.log('NON TROVATI:'); mancanti.forEach(m => console.log('  ' + m)); }
