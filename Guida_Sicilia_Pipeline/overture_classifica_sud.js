/* Passo 2: classifica i candidati grezzi di Overture nei nostri tag,
   scarta i negozi (macellerie/pescherie senza tavoli, stessa regola gia'
   usata per Ora.Gel il 24 agosto), e deduplica contro dati.js esistente.
   NON scrive dati.js: produce solo candidati_overture.json + un report. */
const fs = require('fs');

const grezzi = JSON.parse(fs.readFileSync('overture_grezzo_sud.json', 'utf8'));
const src = fs.readFileSync('dati.js', 'utf8');
const esistenti = eval(src.replace('module.exports', 'var POSTI') + ';POSTI');

// --- mappa categoria Overture -> nostro tag (null = serve la regola sul nome) ---
const CATEGORIA_MAP = {
  pizza_restaurant: 'pizza', seafood_restaurant: 'pesce',
  steakhouse: 'carne', barbecue_restaurant: 'carne',
  sandwich_shop: 'street', fast_food_restaurant: 'street', food_truck: 'street', diner: 'street',
  breakfast_and_brunch_restaurant: 'dolci', bakery: 'dolci', dessert_shop: 'dolci',
  ice_cream_shop: 'dolci', gelato_shop: 'dolci', pastry_shop: 'dolci', patisserie: 'dolci',
  wine_bar: 'street', gastropub: 'street',
  cheese_shop: 'spesa', souvenir_shop: 'spesa', farmers_market: 'spesa',
  market: 'spesa', specialty_food_store: 'spesa', wine_and_liquor_store: 'spesa',
  // gift_shop tolta: su Overture e' un contenitore-negozio troppo largo (ci sono finiti
  // dentro un negozio di casalinghi, una stazione di benzina, un gioielliere)
  beach: 'mare',
  museum: 'vedere', art_gallery: 'vedere', monument: 'vedere', historical_landmark: 'vedere',
  castle: 'vedere', church: 'vedere', cathedral: 'vedere', nature_preserve: 'vedere',
  scenic_lookout: 'vedere', tourist_attraction: 'vedere', archaeological_site: 'vedere',
  garden: 'vedere', harbor_or_marina: 'vedere',
  // negozi: un posto dove non ci si siede a mangiare non entra (regola Ora.Gel, 24 ago)
  butcher: 'ESCLUDI_NEGOZIO', fishmonger: 'ESCLUDI_NEGOZIO', deli: 'ESCLUDI_NEGOZIO',
  // troppo generiche, serve il nome
  restaurant: null, italian_restaurant: null, mediterranean_restaurant: null,
  sicilian_restaurant: null, trattoria: null, osteria: null,
  park: 'ESCLUDI_TROPPO_GENERICO' // troppo rumore (parchetti di quartiere), non "da vedere" veri
};

const REGOLE_NOME = [
  [/pizzer/i, 'pizza'],
  [/macelleria|braceria|steak|grill\b/i, 'carne'],
  [/pescheria|pesce\b/i, 'pesce'],
  [/gelat|pasticceria|dolciaria|cioccolat|patisserie/i, 'dolci'],
  [/paninoteca|panineria|hamburger|street ?food|friggitoria|rosticceria|girarrosto|arancin/i, 'street']
];

// base militare NATO di Sigonella: non accessibile ai turisti, va escluso a prescindere dal tag
const RE_MILITARE = /sigonella|naval air station|nas ii|caserma/i;
// catene generiche/internazionali: non e' quello che una guida curata vuole raccontare
const RE_CATENA = /^subway$|^mcdonald|^burger king|^kfc\b|^domino|^eni\b|^ip\b.*station|^q8\b|^esso\b|^autogrill\b|old wild west/i;

const ALT_SPECIFICI = {
  seafood_restaurant: 'pesce', steakhouse: 'carne', barbecue_restaurant: 'carne',
  bar_and_grill_restaurant: 'carne', pizza_restaurant: 'pizza',
  sandwich_shop: 'street', fast_food_restaurant: 'street', delicatessen: 'street',
  food_truck: 'street', diner: 'street',
  bakery: 'dolci', dessert_shop: 'dolci', ice_cream_shop: 'dolci', gelato_shop: 'dolci',
  pastry_shop: 'dolci', patisserie: 'dolci', chocolatier: 'dolci', pancake_house: 'dolci',
  wine_bar: 'street', gastropub: 'street'
};

function classifica(r) {
  if (RE_MILITARE.test(r.indirizzo || '') || RE_MILITARE.test(r.nome || '')) return null;
  if (RE_CATENA.test((r.nome || '').trim())) return null;
  const mappa = CATEGORIA_MAP[r.categoria];
  if (mappa === 'ESCLUDI_NEGOZIO' || mappa === 'ESCLUDI_TROPPO_GENERICO') return null;
  if (mappa) return mappa;
  // categoria generica: prova le regole sul nome
  for (const [re, tag] of REGOLE_NOME) if (re.test(r.nome || '')) return tag;
  // poi prova le categorie alternative specifiche (vedi ALT_SPECIFICI)
  for (const alt of (r.categorie_alt || [])) if (ALT_SPECIFICI[alt]) return ALT_SPECIFICI[alt];
  return null; // niente segnale affidabile, si scarta invece di indovinare
}

// --- normalizzazione nomi per il confronto (stessa filosofia gia' usata nel progetto) ---
function normalizza(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // toglie accenti
    .replace(/['''`]/g, '')
    .replace(/\b(ristorante|pizzeria|trattoria|osteria|bar|caffe|cafe|di|da|dei|del|della|srl|snc|sas|s\.n\.c\.|s\.r\.l\.)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

const nomiEsistenti = esistenti.map(p => normalizza(p.n)).filter(n => n.length >= 4);
const setEsistenti = new Set(nomiEsistenti);

function giaPresente(nome) {
  const norm = normalizza(nome);
  if (norm.length < 4) return true; // nome troppo corto/generico per fidarsi, meglio scartare
  if (setEsistenti.has(norm)) return true;
  // contenimento: nomi molto simili con parole in piu'/meno
  for (const e of nomiEsistenti) {
    if (norm.length >= 6 && e.length >= 6 && (norm.includes(e) || e.includes(norm))) return true;
  }
  return false;
}

// --- applica ---
let scartatiNegozio = 0, scartatiGenerico = 0, scartatiSenzaSegnale = 0, scartatiConfidenzaBassa = 0;
let duplicati = 0, duplicatiInterni = 0;
const buoni = [];
const vistiNormalizzati = new Set(); // dedup fra i candidati Overture stessi

grezzi.forEach(r => {
  if (CATEGORIA_MAP[r.categoria] === 'ESCLUDI_NEGOZIO') { scartatiNegozio++; return; }
  if (CATEGORIA_MAP[r.categoria] === 'ESCLUDI_TROPPO_GENERICO') { scartatiGenerico++; return; }
  const tag = classifica(r);
  if (!tag) { scartatiSenzaSegnale++; return; }
  if (giaPresente(r.nome)) { duplicati++; return; }
  const norm = normalizza(r.nome);
  if (vistiNormalizzati.has(norm)) { duplicatiInterni++; return; }
  vistiNormalizzati.add(norm);
  buoni.push({
    nome: r.nome, tag, categoriaOverture: r.categoria,
    lat: r.lat, lon: r.lon, indirizzo: r.indirizzo, comune: r.comune,
    confidence: r.confidence, sito: r.sito, telefono: r.telefono, fonte: r.fonte
  });
});

fs.writeFileSync('candidati_overture_sud.json', JSON.stringify(buoni, null, 1), 'utf8');

console.log('grezzi totali:', grezzi.length);
console.log('scartati (negozio, non ristorante):', scartatiNegozio);
console.log('scartati (categoria troppo generica, es. park):', scartatiGenerico);
console.log('scartati (nessun segnale affidabile per il tag):', scartatiSenzaSegnale);
console.log('scartati (gia\' presenti in dati.js):', duplicati);
console.log('scartati (doppioni fra loro):', duplicatiInterni);
console.log('CANDIDATI NUOVI BUONI:', buoni.length);

const perTag = {};
buoni.forEach(b => { perTag[b.tag] = (perTag[b.tag] || 0) + 1; });
console.log('\nper tag:');
Object.entries(perTag).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log(' ', t, n));

const perComune = {};
buoni.forEach(b => { const c = b.comune || '(sconosciuto)'; perComune[c] = (perComune[c] || 0) + 1; });
console.log('\nper comune (top 25):');
Object.entries(perComune).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([c, n]) => console.log(' ', c, n));
