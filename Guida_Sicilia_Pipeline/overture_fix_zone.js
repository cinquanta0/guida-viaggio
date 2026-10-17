const fs = require('fs');
let testo = fs.readFileSync('dati.js', 'utf8');
const map = {
  'San Giovanni La Punta': 'San Giovanni la Punta',
  'Giardini-Naxos': 'Giardini Naxos',
  'Misterbianco (CT)': 'Misterbianco',
  'Valverde (CT)': 'Valverde',
  'Syracuse': 'Siracusa'
};
let totale = 0;
Object.entries(map).forEach(([vecchio, nuovo]) => {
  const cerca = 'z:"' + vecchio + '"';
  const sost = 'z:"' + nuovo + '"';
  const conta = testo.split(cerca).length - 1;
  testo = testo.split(cerca).join(sost);
  totale += conta;
  console.log(vecchio, '->', nuovo, ':', conta, 'sostituite');
});
fs.writeFileSync('dati.js', testo, 'utf8');
console.log('totale:', totale);
