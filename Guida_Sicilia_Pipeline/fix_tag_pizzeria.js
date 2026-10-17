// Corregge i tag di posti chiamati esplicitamente "Pizzeria X" (o simili)
// che erano rimasti taggati "pasta" con la descrizione generica "Trattoria a X"
// — segno che sono stati inseriti durante una ricerca combinata trattoria/pizzeria
// e il tag pizza non e' stato aggiunto per disattenzione (stesso bug gia' trovato
// e corretto parzialmente in una sessione precedente, qui la coda rimasta).
const fs = require('fs');
let testo = fs.readFileSync('dati.js', 'utf8');

const fixPizza = [
  "Risto Pizzeria Grano", "Sensazionipizzeria", "Vulcanica Pizzeria",
  "Pizzeria I Love Pizza Di Gaetano Di Grazia", "La Luna Rossa Pizzeria(Acitrezza)",
  "Pizzeria Quattro Quarti", "Ramses Pub Pizzeria", "Caracajada Pub Pizzeria",
  "Il Ciliegino Pizzeria", "Pizzeria Dilizi", "Pizzeria Fuori Binario",
  "Pdpizza Peppe Danilo", "Pizzeria Forno a legna", "Baglio Balata Ristorante Pizzeria",
  "Da Elide Ristorante Pizzeria", "Ristorante e Pizzeria Pizzi cotti",
  "Valle D'Agrò B&B - Pizzeria - Ristorante -", "Osteria Pizzeria Giovanni & Barone",
];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let fatti = 0;
const mancati = [];

fixPizza.forEach(function (n) {
  const re = new RegExp('(n:"' + escapeRe(n) + '"[^}]*?t:)"pasta"');
  if (re.test(testo)) { testo = testo.replace(re, '$1"pizza pasta"'); fatti++; }
  else mancati.push(n);
});

const re1 = /(n:"Jonica Pesce Puglisi - Trattoria di Pesce e Pescheria"[^}]*?t:)"pasta"/;
if (re1.test(testo)) { testo = testo.replace(re1, '$1"pesce pasta"'); fatti++; }
else mancati.push('Jonica Pesce Puglisi');

const re2 = /(n:"Panineria Bacciulli\.\.\."[^}]*?t:)"pasta"/;
if (re2.test(testo)) { testo = testo.replace(re2, '$1"street"'); fatti++; }
else mancati.push('Panineria Bacciulli');

fs.writeFileSync('dati.js', testo, 'utf8');
console.log('corretti:', fatti, '/ 20');
if (mancati.length) console.log('NON TROVATI (controllare a mano):', mancati);
