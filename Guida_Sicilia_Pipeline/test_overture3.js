const duckdb = require('duckdb');
const db = new duckdb.Database(':memory:');
const con = db.connect();

// Box approssimativo 1h15 da Aci Catena: Catania, Taormina, Giardini Naxos,
// Etna (Zafferana/Nicolosi), costa ionica fino a Siracusa nord
const sql = `
INSTALL spatial; LOAD spatial;
INSTALL httpfs; LOAD httpfs;
SET s3_region='us-west-2';

SELECT count(*) AS n
FROM read_parquet('s3://overturemaps-us-west-2/release/2026-08-19.0/theme=places/type=place/*', filename=true, hive_partitioning=1)
WHERE bbox.xmin BETWEEN 14.85 AND 15.65
  AND bbox.ymin BETWEEN 36.95 AND 37.95
  AND (categories.primary IN ('restaurant','pizza_restaurant','seafood_restaurant','italian_restaurant',
       'steakhouse','barbecue_restaurant','sandwich_shop','fast_food_restaurant','trattoria',
       'bakery','dessert_shop','ice_cream_shop','cafe','deli')
       OR list_contains(categories.alternate, 'restaurant'));
`;

console.time('query');
con.all(sql, (err, res) => {
  console.timeEnd('query');
  if (err) { console.error('ERRORE:', err.message); process.exit(1); }
  console.log(res);
});
