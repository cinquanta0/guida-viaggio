/* Inserisce in dati.js i candidati Overture gia' arricchiti con min/km OSRM.
   Stesso schema/meccanismo di aggiungi_bulk.js: trova la chiusura "];",
   inserisce le righe prima, controlla che nessun campo esistente si perda.
   Descrizioni oneste sulla fonte: niente voti/recensioni inventati (li ha
   solo Google Maps, non Overture) — vedi CLAUDE.md di questa sessione. */
const fs = require('fs');
const DATI = 'dati.js';

function fascia(min) {
  if (min === 0) return 1;
  if (min <= 20) return 2;
  if (min <= 35) return 3;
  if (min <= 60) return 4;
  if (min <= 95) return 5;
  if (min <= 140) return 6;
  return 7;
}

const DESC_CATEGORIA = {
  pizza_restaurant: 'Pizzeria', seafood_restaurant: 'Cucina di pesce',
  steakhouse: 'Carne alla griglia', barbecue_restaurant: 'Carne alla griglia',
  sandwich_shop: 'Paninoteca', fast_food_restaurant: 'Fast food',
  food_truck: 'Street food', diner: 'Tavola calda',
  breakfast_and_brunch_restaurant: 'Colazione e brunch',
  bakery: 'Panificio', dessert_shop: 'Dolci', ice_cream_shop: 'Gelateria',
  gelato_shop: 'Gelateria', pastry_shop: 'Pasticceria', patisserie: 'Pasticceria',
  wine_bar: 'Wine bar', gastropub: 'Gastropub',
  cheese_shop: 'Formaggeria', souvenir_shop: 'Souvenir', farmers_market: 'Mercato',
  market: 'Mercato', specialty_food_store: 'Gastronomia', wine_and_liquor_store: 'Enoteca',
  beach: 'Spiaggia', museum: 'Museo', art_gallery: 'Galleria d’arte',
  monument: 'Monumento', historical_landmark: 'Luogo storico', castle: 'Castello',
  church: 'Chiesa', cathedral: 'Cattedrale', nature_preserve: 'Riserva naturale',
  scenic_lookout: 'Punto panoramico', tourist_attraction: 'Attrazione',
  archaeological_site: 'Sito archeologico', garden: 'Giardino', harbor_or_marina: 'Porto'
};
const DESC_TAG = { pizza: 'Pizzeria', carne: 'Ristorante di carne', pesce: 'Cucina di pesce',
  dolci: 'Dolci', street: 'Street food', spesa: 'Negozio tipico', vedere: 'Da vedere', mare: 'Spiaggia' };

function descrizione(c) {
  const base = DESC_CATEGORIA[c.categoriaOverture] || DESC_TAG[c.tag] || 'Posto';
  return base + ' a ' + c.comuneZona + '. Fonte: OpenStreetMap (via Overture Maps), non verificato singolarmente.';
}

// --- risoluzione zona: riusa il nome esatto di una zona esistente se combacia, altrimenti crea una zona nuova col nome del comune ---
function normalizzaZona(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’`]/g, '').trim();
}

(async () => {
  let testo = fs.readFileSync(DATI, 'utf8');
  const prima = eval(testo.replace('module.exports', 'var P') + ';P');
  const esistentiZone = [...new Set(prima.map(p => p.z))];
  const mappaZoneNorm = {};
  esistentiZone.forEach(z => { mappaZoneNorm[normalizzaZona(z)] = z; });
  const nomiEsistentiLower = new Set(prima.map(p => p.n.toLowerCase()));

  const contaCampiPrima = {};
  prima.forEach(p => Object.keys(p).forEach(k => { contaCampiPrima[k] = (contaCampiPrima[k] || 0) + 1; }));

  const cand = JSON.parse(fs.readFileSync('candidati_overture.json', 'utf8'));

  let righe = '', inseriti = 0;
  const saltati = [];
  const nuoveZone = new Set();

  for (const c of cand) {
    if (typeof c.min !== 'number') { saltati.push(c.nome + ': niente tempo calcolato'); continue; }
    if (c.min > 75) { saltati.push(c.nome + ': oltre 75 min (' + c.min + ')'); continue; }
    if (nomiEsistentiLower.has(c.nome.toLowerCase())) { saltati.push(c.nome + ': gia presente (nome esatto)'); continue; }
    if (/[<>]/.test(c.nome) || /&[a-zA-Z]+;/.test(c.nome)) { saltati.push(c.nome + ': caratteri non ammessi'); continue; }

    const norm = normalizzaZona(c.comune);
    const zona = mappaZoneNorm[norm] || (c.comune || '').trim();
    if (!zona) { saltati.push(c.nome + ': nessun comune'); continue; }
    if (!mappaZoneNorm[norm]) nuoveZone.add(zona);
    c.comuneZona = zona;

    const min = c.min;
    const desc = descrizione(c);
    const indirizzo = c.indirizzo ? String(c.indirizzo).replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ').trim() : '';

    righe += '{b:' + fascia(min) + ', n:"' + c.nome.replace(/"/g, '\\"') + '", z:"' + zona.replace(/"/g, '\\"') + '"'
      + ', min:' + min + ', km:' + c.km
      + ', t:"' + c.tag + '", g:""'
      + (indirizzo ? ', a:"' + indirizzo + '"' : '')
      + ', d:"' + desc.replace(/"/g, '\\"') + '"},\n';
    inseriti++;
  }

  const chiusura = testo.lastIndexOf('];');
  testo = testo.slice(0, chiusura) + righe + testo.slice(chiusura);
  fs.writeFileSync(DATI, testo, 'utf8');

  const dopo = eval(fs.readFileSync(DATI, 'utf8').replace('module.exports', 'var P') + ';P');
  console.log('inseriti:', inseriti, '/', cand.length);
  console.log('posti:', prima.length, '->', dopo.length);
  console.log('nuove zone create:', nuoveZone.size, [...nuoveZone].sort().join(', '));
  const contaCampiDopo = {};
  dopo.forEach(p => Object.keys(p).forEach(k => { contaCampiDopo[k] = (contaCampiDopo[k] || 0) + 1; }));
  let perso = false;
  Object.keys(contaCampiPrima).forEach(k => {
    if ((contaCampiDopo[k] || 0) < contaCampiPrima[k]) { console.log('ATTENZIONE campo perso:', k); perso = true; }
  });
  console.log(perso ? 'QUALCOSA SI E PERSO' : 'nessun campo esistente perso.');
  console.log('\nsaltati:', saltati.length);
  const motivi = {};
  saltati.forEach(s => { const m = s.split(': ')[1]; motivi[m] = (motivi[m] || 0) + 1; });
  Object.entries(motivi).forEach(([m, n]) => console.log(' -', m, ':', n));
})();
