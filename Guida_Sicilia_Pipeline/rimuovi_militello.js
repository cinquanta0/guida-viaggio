const fs = require('fs');
let s = fs.readFileSync('dati.js', 'utf8');
let tot = 0;
for (const n of ['Ristorante Asteria di Pino', 'A Modo Nostro']) {
  const esc = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('\\{b:\\d+, n:"' + esc + '"[^}]*\\},?\\n');
  if (re.test(s)) { s = s.replace(re, ''); tot++; }
}
fs.writeFileSync('dati.js', s, 'utf8');
console.log('rimosse: ' + tot);
