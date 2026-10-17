/* Estrae da Overture Maps (dati pubblici, gratuiti, no API key) tutti i posti
   di cibo/mare/vedere/spesa nella zona entro ~1h15 da Aci Catena.
   Salva un JSON grezzo per il passo successivo (dedup + curatela). */
const duckdb = require('duckdb');
const fs = require('fs');
const db = new duckdb.Database(':memory:');
const con = db.connect();

const RELEASE = '2026-08-19.0';
const BBOX = { xmin: 14.85, xmax: 15.65, ymin: 36.95, ymax: 37.95 };

const CATEGORIE_CIBO = [
  'restaurant','pizza_restaurant','seafood_restaurant','italian_restaurant',
  'steakhouse','barbecue_restaurant','sandwich_shop','fast_food_restaurant',
  'trattoria','bakery','dessert_shop','ice_cream_shop','cafe','deli',
  'breakfast_and_brunch_restaurant','food_truck','diner','gastropub',
  'sicilian_restaurant','mediterranean_restaurant','osteria','wine_bar',
  'butcher','fishmonger','gelato_shop','pastry_shop','patisserie'
];
const CATEGORIE_ALTRO = [
  'beach','historical_landmark','monument','castle','museum','art_gallery',
  'church','cathedral','park','nature_preserve','scenic_lookout','tourist_attraction',
  'archaeological_site','garden','harbor_or_marina',
  'gift_shop','souvenir_shop','farmers_market','market','specialty_food_store',
  'wine_and_liquor_store','cheese_shop'
];
const TUTTE = [...new Set([...CATEGORIE_CIBO, ...CATEGORIE_ALTRO])];

const sql = `
INSTALL spatial; LOAD spatial;
INSTALL httpfs; LOAD httpfs;
SET s3_region='us-west-2';

SELECT
  id,
  names.primary AS nome,
  categories.primary AS categoria,
  categories.alternate AS categorie_alt,
  ST_X(geometry) AS lon, ST_Y(geometry) AS lat,
  confidence,
  addresses[1].freeform AS indirizzo,
  addresses[1].locality AS comune,
  addresses[1].region AS regione,
  websites[1] AS sito,
  phones[1] AS telefono,
  sources[1].dataset AS fonte
FROM read_parquet('s3://overturemaps-us-west-2/release/${RELEASE}/theme=places/type=place/*', filename=true, hive_partitioning=1)
WHERE bbox.xmin BETWEEN ${BBOX.xmin} AND ${BBOX.xmax}
  AND bbox.ymin BETWEEN ${BBOX.ymin} AND ${BBOX.ymax}
  AND categories.primary IN (${TUTTE.map(c => `'${c}'`).join(',')})
  AND confidence >= 0.6;
`;

console.time('estrazione');
con.all(sql, (err, res) => {
  console.timeEnd('estrazione');
  if (err) { console.error('ERRORE:', err.message); process.exit(1); }
  console.log('risultati grezzi:', res.length);

  // conteggio per categoria, solo per capire cosa c'e' dentro
  const perCat = {};
  res.forEach(r => { perCat[r.categoria] = (perCat[r.categoria] || 0) + 1; });
  console.log('\nper categoria:');
  Object.entries(perCat).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(' ', c, n));

  const perRegione = {};
  res.forEach(r => { perRegione[r.regione || '(vuoto)'] = (perRegione[r.regione || '(vuoto)'] || 0) + 1; });
  console.log('\nper regione (controllo che sia davvero tutta Sicilia):');
  Object.entries(perRegione).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(' ', c, n));

  fs.writeFileSync('overture_grezzo.json', JSON.stringify(res), 'utf8');
  console.log('\nsalvato in overture_grezzo.json');
});
