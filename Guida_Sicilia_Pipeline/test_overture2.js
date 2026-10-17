const duckdb = require('duckdb');
const db = new duckdb.Database(':memory:');
const con = db.connect();

con.all(`INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';
  SELECT file FROM glob('s3://overturemaps-us-west-2/release/*') LIMIT 50;`, (err, res) => {
  if (err) { console.error('ERRORE:', err.message); process.exit(1); }
  res.forEach(r => console.log(r.file));
});
