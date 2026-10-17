/* Incrocia il tipo che GOOGLE assegna a un posto (gia' scaricato, finora
   usato solo per escludere negozi) con la categoria che GLI ABBIAMO DATO
   NOI in base a quale ricerca l'ha trovato. Nato dalla revisione a
   campione del 22 ago 2026: "Ristorante Nassa" e' stato inserito come
   "carne" solo perche' la ricerca era "ristorante carne braceria", ma
   Google lo classifica seafood_restaurant — e infatti e' un ristorante di
   pesce puro. Un controllo cosi' l'avrebbe beccato da solo, gratis,
   perche' il campo tipiGoogle era gia' scaricato e semplicemente non
   confrontato con niente.

   Non e' un filtro che blocca l'inserimento (troppo aggressivo, un
   ristorante puo' legittimamente fare piu' cose): segnala le
   CONTRADDIZIONI FORTI perche' un umano le riveda, come questa sessione
   ha fatto a mano sul campione.

   Uso, dopo un giro tipo spazza_cibo.js (prima di seleziona_*):
     node verifica_tipo_google.js spazza_cibo_risultati.json
     node verifica_tipo_google.js spazza_altri_risultati.json
   Oppure senza argomenti per ricontrollare i due giri gia' fatti. */

const fs = require('fs');

/* per ogni categoria nostra: quali tipi Google la CONTRADDICONO in modo
   forte (non "potrebbe anche essere altro", ma "questo e' chiaramente
   un'altra cosa"). Elenco volutamente conservativo: meglio un falso
   negativo (contraddizione vera non segnalata) che un falso positivo
   (segnala un posto giusto), altrimenti il controllo si ignora da solo. */
const CONTRADDICE = {
  carne: ['seafood_restaurant', 'sushi_restaurant', 'bakery', 'dessert_shop', 'ice_cream_shop', 'cafe'],
  pesce: ['steak_house', 'barbecue_restaurant', 'bakery', 'dessert_shop', 'ice_cream_shop'],
  pizza: ['seafood_restaurant', 'steak_house', 'bakery', 'dessert_shop'],
  dolci: ['steak_house', 'barbecue_restaurant', 'seafood_restaurant', 'meal_takeaway'],
  pasta: ['bakery', 'dessert_shop', 'ice_cream_shop'],
  mare: ['restaurant', 'hotel', 'lodging', 'store'],
  vedere: ['restaurant', 'store', 'lodging'],
  /* 'restaurant' escluso apposta: un panificio/gastronomia con cucina
     (pane cunzato, rosticceria) prende spesso anche il tipo restaurant da
     Google pur restando un negozio tipico legittimo — provato il 22 ago
     2026 su 6 casi, tutti falsi positivi. */
  spesa: ['tourist_attraction', 'lodging']
};

function controlla(file) {
  const dati = require('./' + file);
  const trovati = [];
  dati.forEach(d => {
    const tipi = d.tipiGoogle || [];
    const contraddizioni = (CONTRADDICE[d.tipo] || []).filter(t => tipi.includes(t));
    if (contraddizioni.length) trovati.push({ nome: d.nome, zona: d.zona, tipoNostro: d.tipo, tipiGoogle: tipi, contraddizioni });
  });
  console.log('\n=== ' + file + ' ===');
  console.log('voci controllate: ' + dati.length);
  if (!trovati.length) { console.log('nessuna contraddizione trovata.'); return trovati; }
  trovati.forEach(t => console.log('  [' + t.tipoNostro + ' ma Google dice ' + t.contraddizioni.join(',') + ']  ' + t.nome + ' — ' + t.zona));
  console.log('totale sospetti: ' + trovati.length);
  return trovati;
}

const args = process.argv.slice(2);
const file = args[0] ? [args[0]] : ['spazza_cibo_risultati.json', 'spazza_altri_risultati.json'];
let tutti = [];
file.forEach(f => { if (fs.existsSync(f)) tutti = tutti.concat(controlla(f)); });

if (args.length === 0) {
  fs.writeFileSync('sospetti_tipo_google.json', JSON.stringify(tutti, null, 1), 'utf8');
  console.log('\nsalvato in sospetti_tipo_google.json (' + tutti.length + ' voci)');
}
