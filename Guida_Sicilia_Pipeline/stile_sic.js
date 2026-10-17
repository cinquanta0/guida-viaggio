/* Aggiunge al foglio di stile il colore del tag "Ci vanno i siciliani".

   Il rosso #9d2933 non e' in uso: il piu' vicino era #b1401d dei creator,
   che pero' e' un arancio bruciato, e #8e4767 di "poco battuto", che tira
   al rosato. Da spento il bottone resta neutro col solo bordo colorato,
   come gli altri filtri (i tre del fondo spiaggia sono l'eccezione voluta).

   Idempotente: se .g-sic c'e' gia', non fa niente.
   Uso: node stile_sic.js  */

const fs = require('fs');
const F = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/style.css';

let s = fs.readFileSync(F, 'utf8');
if (s.indexOf('g-sic') >= 0) { console.log('gia presente, non tocco niente'); process.exit(0); }

const sostituzioni = [
  ['.fb.g-top, .fb.g-loc, .fb.g-eco, .fb.g-nas,',
   '.fb.g-sic, .fb.g-top, .fb.g-loc, .fb.g-eco, .fb.g-nas,'],
  ['.fb.g-top { border-color: #d9ae2e; }',
   '.fb.g-sic { border-color: #9d2933; }\n.fb.g-top { border-color: #d9ae2e; }'],
  ['.fb.g-top.on { background: #f0c94b; color: #4a3600; border-color: #f0c94b; }',
   '.fb.g-sic.on { background: #9d2933; color: #fff; border-color: #9d2933; }\n.fb.g-top.on { background: #f0c94b; color: #4a3600; border-color: #f0c94b; }'],
  ['.g-top { background: #f0c94b; color: #4a3600; }',
   '.g-sic { background: #9d2933; color: #fff; }\n.g-top { background: #f0c94b; color: #4a3600; }']
];

let guai = 0;
for (const [da, a] of sostituzioni) {
  if (s.indexOf(da) < 0) { console.log('NON TROVATO: ' + da); guai++; continue; }
  s = s.replace(da, a);
}
if (guai) { console.log('\n' + guai + ' ancoraggi mancanti, non scrivo niente'); process.exit(1); }

fs.writeFileSync(F, s, 'utf8');
console.log('aggiunte 4 regole per .g-sic');
