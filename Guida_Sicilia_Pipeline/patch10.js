const fs = require('fs');
const righe = fs.readFileSync('build.js', 'utf8').split('\n');

const i = righe.findIndex(r => r.indexOf('const cerca = senzaAccenti(') >= 0);
if (i < 0) { console.log('riga cerca non trovata'); process.exit(1); }
if (righe[i + 1].indexOf('p.d)') < 0) { console.log('seconda riga inattesa: ' + righe[i + 1]); process.exit(1); }

const nuove = [
  "    /* \"identita\" = nome, zona e indirizzo. \"cerca\" aggiunge anche la descrizione.",
  "       Servono separati: cercando una citta si devono pescare solo i posti che ci",
  "       stanno davvero, non chi la nomina di sfuggita nella descrizione. */",
  "    const ripulisci = s => senzaAccenti(s).replace(/[^a-z0-9 ]/g, ' ').replace(/[ ]+/g, ' ');",
  "    const identita = ripulisci(p.n + ' ' + p.z + ' ' + (p.a || ''));",
  "    const cerca = ripulisci(p.n + ' ' + p.z + ' ' + (p.a || '') + ' ' + p.t + ' '",
  "      + (p.fo || '') + ' ' + p.d);"
];

righe.splice(i, 2, ...nuove);
fs.writeFileSync('build.js', righe.join('\n'));
console.log('build.js: identita e cerca separate');
