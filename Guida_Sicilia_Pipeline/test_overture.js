const duckdb = require('duckdb');
const db = new duckdb.Database(':memory:');
const con = db.connect();

const sql = `
INSTALL spatial; LOAD spatial;
INSTALL httpfs; LOAD httpfs;
SET s3_region='us-west-2';

SELECT names.primary AS name, categories.primary AS categoria,
       ST_X(geometry) AS lon, ST_Y(geometry) AS lat, confidence
FROM read_parquet('s3://overturemaps-us-west-2/release/2026-08-19.0/theme=places/type=place/*', filename=true, hive_partitioning=1)
WHERE bbox.xmin BETWEEN 15.13 AND 15.20
  AND bbox.ymin BETWEEN 37.61 AND 37.65
LIMIT 20;
`;

console.time('query');
con.all(sql, (err, res) => {
  console.timeEnd('query');
  if (err) { console.error('ERRORE:', err.message); process.exit(1); }
  console.log('risultati:', res.length);
  res.forEach(r => console.log(r.name, '|', r.categoria, '|', r.lat.toFixed(4), r.lon.toFixed(4)));
});
