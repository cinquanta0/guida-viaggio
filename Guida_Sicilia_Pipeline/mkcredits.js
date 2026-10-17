const fs = require('fs');
const path = require('path');
const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img';
const OUT = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/credits.js';

const all = JSON.parse(fs.readFileSync('credits.json', 'utf8'));
const html = fs.readFileSync('C:/Users/lucad/Downloads/Guida_Sicilia_Sito/index.html', 'utf8');

const kept = {};
const missing = [];
for (const [k, c] of Object.entries(all)) {
  const used = html.includes('assets/img/' + c.file);
  const there = fs.existsSync(path.join(IMG, c.file));
  if (used && !there) missing.push(c.file);
  if (used && there) kept[k] = c;
}

fs.writeFileSync(OUT,
  '/* Crediti fotografici — generato automaticamente. Tutte le immagini da Wikimedia Commons. */\n' +
  'window.FOTO_CREDITI = ' + JSON.stringify(kept, null, 1) + ';\n', 'utf8');

console.log('crediti scritti: ' + Object.keys(kept).length);
console.log('usate nel sito ma MANCANTI su disco: ' + (missing.join(', ') || 'nessuna'));

// elenco immagini referenziate nell'HTML che non sono in picks/credits
const refs = [...new Set((html.match(/assets\/img\/[A-Za-z0-9_.-]+/g) || []))]
  .map(s => s.replace('assets/img/', ''));
const have = new Set(fs.readdirSync(IMG));
console.log('referenziate senza file: ' + (refs.filter(r => !have.has(r)).join(', ') || 'nessuna'));
