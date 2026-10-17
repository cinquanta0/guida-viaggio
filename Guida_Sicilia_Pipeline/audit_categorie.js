// audit_categorie.js — trova incoerenze nome<->tag e corregge SOLO l'ovvio e additivo.
// Non cancella MAI un tag ne' un posto. Scrive un report dei casi da giudicare a mano.
// Idempotente: non aggiunge un tag gia' presente.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'dati.js');
const REPORT = path.join(__dirname, 'audit_categorie_report.md');
const CIBO = ['pizza', 'pasta', 'carne', 'pesce', 'dolci', 'street'];

function norm(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, '').toLowerCase();
}
function field(line, key) {
  // ancora la chiave a '{' o ',' per non pescare sottostringhe (es. 't' dentro 'dest')
  const m = line.match(new RegExp('[{,]\\s*' + key + ':"((?:[^"\\\\]|\\\\.)*)"'));
  return m ? m[1] : '';
}

// Regole ADDITIVE sicure: se il nome contiene questi, il tag deve esserci.
const ADD = [
  { tag: 'pizza',  re: /\b(pizzeria|pizza)\b/ },
  { tag: 'dolci',  re: /\b(pasticceria|gelateria|gelati|gelato|gelati?eria|cioccolat|dolceria|cannoli|granita|caffetteria|pasticcio)\b/ },
  { tag: 'street', re: /\b(rosticceria|friggitoria|arancin|paninoteca|panineria|tavola calda|street food|kebab|hamburg|burger)\b/ },
  { tag: 'carne',  re: /\b(braceria|bracier|girarrosto|steak|steakhouse|brace|griglia|grigliate|grill)\b/ },
];
// Parole che segnalano un MONUMENTO (dovrebbe avere 'vedere', non un tag cibo).
const MON = /\b(museo|chiesa|castello|palazzo|teatro|duomo|basilica|santuario|cattedrale|torre|villa comunale|piazza|monumento|anfiteatro|necropoli|catacomb|riserva|parco archeologico)\b/;
// Parole che segnalano un NEGOZIO (da verificare, non un ristorante).
const SHOP = /\b(macelleria|norcineria|pescheria|supermercato|salumeria|forno(?!\s+a\s+legna)|panificio|fruttivendolo|enoteca|cantina)\b/;

const txt = fs.readFileSync(FILE, 'utf8');
const lines = txt.split(/\r?\n/);

let fixAdd = 0, nObj = 0;
const review = [];       // casi da giudicare a mano
const fixLog = [];       // correzioni applicate

const out = lines.map(line => {
  if (!/^\{/.test(line)) return line;
  nObj++;
  const n = field(line, 'n');
  const z = field(line, 'z');
  const aff = field(line, 'aff');
  const tRaw = field(line, 't');
  const tags = tRaw.split(/\s+/).filter(Boolean);
  const nn = norm(n);
  const hasCibo = tags.some(t => CIBO.includes(t));

  // 1) correzioni additive sicure
  let added = [];
  for (const r of ADD) {
    if (r.re.test(nn) && !tags.includes(r.tag)) {
      tags.push(r.tag);
      added.push(r.tag);
    }
  }
  if (added.length) {
    fixAdd += added.length;
    fixLog.push(`+ [${aff}] ${n} (${z}): "${tRaw}" -> aggiunto ${added.join(',')}  (tag ora: ${tags.join(' ')})`);
  }

  // 2) segnalazioni per revisione (NON tocco)
  //   a) monumento con tag cibo
  if (MON.test(nn) && hasCibo) review.push(`MONUMENTO-con-cibo [${aff}] ${n} (${z}) t="${tags.join(' ')}"`);
  //   b) negozio taggato come posto dove si mangia
  if (SHOP.test(nn) && hasCibo) review.push(`NEGOZIO? [${aff}] ${n} (${z}) t="${tags.join(' ')}"`);
  //   c) pizzeria nel nome ma tag cibo diverso senza pizza (dopo l'add pizza c'e', ma segnalo i misti)
  if (/\b(pizzeria|pizza)\b/.test(nn) && (tags.includes('pesce') || tags.includes('pasta') || tags.includes('carne')))
    review.push(`PIZZERIA-mista-verifica [${aff}] ${n} (${z}) t="${tags.join(' ')}"`);
  //   d) un solo tag 'carne' isolato (pattern noto di errore: spesso e' anche pizza)
  if (tags.length === 1 && tags[0] === 'carne')
    review.push(`SOLO-carne-verifica [${aff}] ${n} (${z})`);

  if (!added.length) return line;
  // riscrivi SOLO il vero campo t (ancorato a { o ,), non 't' dentro 'dest'
  return line.replace(/([{,]\s*)t:"(?:[^"\\]|\\.)*"/, '$1t:"' + tags.join(' ') + '"');
});

if (!fs.existsSync(FILE + '.pre-audit')) fs.copyFileSync(FILE, FILE + '.pre-audit');
fs.writeFileSync(FILE, out.join('\n'), 'utf8');

// report
const byAff = c => review.filter(r => r.includes('[' + c + ']')).length;
let md = `# Audit categorie Sicilia\n\n`;
md += `Oggetti: ${nObj}\n\nCorrezioni additive applicate: ${fixAdd} (su ${fixLog.length} schede)\n`;
md += `Casi da rivedere a mano: ${review.length}\n\n`;
md += `## Correzioni applicate (additive, nessuna cancellazione)\n\n` + (fixLog.join('\n') || '(nessuna)') + '\n\n';
md += `## Da rivedere a mano (NON toccati)\n\n` + (review.join('\n') || '(nessuno)') + '\n';
fs.writeFileSync(REPORT, md, 'utf8');

console.log('Oggetti:', nObj);
console.log('Correzioni additive applicate:', fixAdd, 'su', fixLog.length, 'schede');
console.log('Da rivedere a mano:', review.length,
  '  (sel:' + byAff('sel'), 'ver:' + byAff('ver'), 'auto:' + byAff('auto') + ')');
console.log('Report scritto in:', REPORT);
console.log('--- primi 8 fix ---');
console.log(fixLog.slice(0, 8).join('\n'));
