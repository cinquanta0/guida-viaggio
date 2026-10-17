const fs = require('fs');
const src = fs.readFileSync('dati.js', 'utf8');
const arr = eval(src.replace('module.exports', 'var POSTI') + ';POSTI');

function fascia(min) {
  if (min === 0) return 1;
  if (min <= 20) return 2;
  if (min <= 35) return 3;
  if (min <= 60) return 4;
  if (min <= 95) return 5;
  if (min <= 140) return 6;
  return 7;
}

console.log('TOTALE POSTI:', arr.length);

// 1. campo b coerente col tempo min
let bSbagliati = arr.filter(p => p.b !== fascia(p.min));
console.log('\n1) fascia (b) non coerente col tempo min:', bSbagliati.length);
bSbagliati.slice(0, 10).forEach(p => console.log('  ', p.n, '| min:', p.min, '| b attuale:', p.b, '| b atteso:', fascia(p.min)));

// 2. velocita' implausibile (km/min troppo alta = oltre 130 km/h, o troppo bassa per lunga distanza)
let veloceSospetti = arr.filter(p => p.km != null && p.min > 3 && (p.km / (p.min / 60)) > 130);
console.log('\n2) velocita media implausibile (>130 km/h):', veloceSospetti.length);
veloceSospetti.forEach(p => console.log('  ', p.n, '|', p.z, '| min:', p.min, 'km:', p.km, '=', (p.km / (p.min / 60)).toFixed(0), 'km/h'));

// 3. min/km mancanti o non numerici
let senzaTempo = arr.filter(p => typeof p.min !== 'number' || isNaN(p.min));
console.log('\n3) senza tempo valido:', senzaTempo.length);
senzaTempo.slice(0, 10).forEach(p => console.log('  ', p.n, '|', p.z));

// 4. zone quasi-duplicate (normalizzazione stretta)
const zone = [...new Set(arr.map(p => p.z))];
function normZ(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(ct\)|\(sr\)|\(rg\)|\(me\)/g, '').replace(/[^a-z0-9]/g, ''); }
const gruppiZ = {};
zone.forEach(z => { const n = normZ(z); (gruppiZ[n] = gruppiZ[n] || []).push(z); });
const dupZ = Object.values(gruppiZ).filter(g => g.length > 1);
console.log('\n4) zone duplicate (stessa forma normalizzata):', dupZ.length);
dupZ.forEach(g => console.log('  ', g.join(' | ')));
console.log('   zone totali distinte:', zone.length);

// 5. campi essenziali mancanti su qualunque posto
const senzaN = arr.filter(p => !p.n || !p.z || typeof p.t !== 'string');
console.log('\n5) posti senza nome/zona/tag:', senzaN.length);

// 6. min negativo o assurdo (oltre 300 min = 5h, improbabile per una guida su Aci Catena)
const assurdi = arr.filter(p => p.min < 0 || p.min > 300);
console.log('\n6) tempi assurdi (<0 o >300 min):', assurdi.length);
assurdi.forEach(p => console.log('  ', p.n, '|', p.z, '| min:', p.min));

// 7. conteggio per fascia, per farsi un'idea della distribuzione
const perFascia = {};
arr.forEach(p => { perFascia[p.b] = (perFascia[p.b] || 0) + 1; });
console.log('\n7) distribuzione per fascia:', JSON.stringify(perFascia));

console.log('\n=== FINE CONTROLLO ===');
