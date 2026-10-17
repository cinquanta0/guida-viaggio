// Estrae l'array ZONES incorporato in setaccio.html e produce
// candidati_setaccio.js nel formato atteso da aggiungi_setaccio.js
// (stesso formato di candidati_maps.js: n, z, ind, com, t, a, d).
// Esclude i candidati con status "verificare".

const fs = require('fs');
const path = require('path');

const HTML_PATH = process.argv[2];
if (!HTML_PATH) { console.error('uso: node estrai_candidati_setaccio.js <path setaccio.html>'); process.exit(1); }

const html = fs.readFileSync(HTML_PATH, 'utf8');
const m = html.match(/const ZONES = (\[[\s\S]*?\]);\s*\n\nconst zonesEl/);
if (!m) { console.error('non trovo ZONES nel file'); process.exit(1); }
const ZONES = new Function('return ' + m[1])();

// mappa: chiave del report -> { z: label esatta in dati.js, com: comune vero per geocoding }
const MAPPA = {
  "Aci Catena": { z: "Aci Catena", com: "Aci Catena" },
  "Aci Sant'Antonio": { z: "Aci Sant’Antonio", com: "Aci Sant'Antonio" },
  "Aci Bonaccorsi": { z: "Aci Bonaccorsi", com: "Aci Bonaccorsi" },
  "Valverde": { z: "Valverde", com: "Valverde" },
  "Aci Trezza / Costa acese": { z: "Aci Trezza", com: "Aci Castello" },
  "Aci Castello": { z: "Aci Castello", com: "Aci Castello" },
  "Capo Mulini (Frazioni di Acireale)": { z: "Frazioni di Acireale", com: "Acireale" },
  "Trecastagni": { z: "Trecastagni", com: "Trecastagni" },
  "Santa Venerina": { z: "Santa Venerina", com: "Santa Venerina" },
  "Zafferana Etnea": { z: "Zafferana Etnea", com: "Zafferana Etnea" },
  "Giarre": { z: "Giarre", com: "Giarre" },
  "Acireale nord (Santa Tecla / Pozzillo)": { z: "Acireale nord", com: "Acireale" },
  "Gravina di Catania": { z: "Gravina di Catania", com: "Gravina di Catania" },
  "Nicolosi": { z: "Nicolosi", com: "Nicolosi" },
  "Riposto": { z: "Riposto", com: "Riposto" },
  "Catania — Via Plebiscito": { z: "Catania — Via Plebiscito", com: "Catania" },
  "Mascali": { z: "Mascali", com: "Mascali" },
  "Catania — Pescheria": { z: "Catania — Pescheria", com: "Catania" },
  "Fiumefreddo di Sicilia": { z: "Fiumefreddo di Sicilia", com: "Fiumefreddo di Sicilia" },
  "Milo": { z: "Milo", com: "Milo" },
  "Giardini Naxos": { z: "Giardini Naxos", com: "Giardini Naxos" },
  "Linguaglossa": { z: "Linguaglossa", com: "Linguaglossa" },
  "Letojanni": { z: "Letojanni", com: "Letojanni" },
  "Taormina": { z: "Taormina", com: "Taormina" },
  "Paternò": { z: "Paternò", com: "Paternò" },
  "Motta Camastra": { z: "Motta Camastra", com: "Motta Camastra" },
  "Santa Teresa di Riva": { z: "Santa Teresa di Riva", com: "Santa Teresa di Riva" },
  "Castiglione di Sicilia": { z: "Castiglione di Sicilia", com: "Castiglione di Sicilia" },
  "Forza d'Agrò": { z: "Forza d'Agrò", com: "Forza d'Agrò" },
  "Savoca": { z: "Savoca", com: "Savoca" },
  "Lentini": { z: "Lentini", com: "Lentini" },
};

const GENERE = {
  carne: 'Ristorante di carne',
  pesce: 'Ristorante di pesce',
  pasta: 'Trattoria',
  pizza: 'Pizzeria',
  dolci: 'Pasticceria/gelateria',
  street: 'Rosticceria/street food',
};

let out = [];
let saltatiVerificare = [];
let mappaMancante = [];

for (const zona of ZONES) {
  const map = MAPPA[zona.z];
  if (!map) { mappaMancante.push(zona.z); continue; }
  for (const c of zona.cands) {
    if (c.status === 'verificare') { saltatiVerificare.push(c.n + ' (' + zona.z + ')'); continue; }
    const ind = (c.addr && c.addr !== '—') ? (c.addr + ', ' + map.com) : (c.n + ', ' + map.com);
    const d = GENERE[c.cat] + ' a ' + map.z.replace(/—/g, '-') + '. Da Google Maps: '
      + c.rating.toFixed(1).replace('.', ',') + ' su ' + c.rev + ' recensioni.';
    out.push({
      n: c.n,
      z: map.z,
      ind: ind,
      com: map.com,
      t: c.cat,
      a: (c.addr && c.addr !== '—') ? c.addr : '',
      d: d,
    });
  }
}

if (mappaMancante.length) {
  console.log('ATTENZIONE, zone senza mappa:', [...new Set(mappaMancante)]);
}
console.log('Candidati totali pronti per geocoding/inserimento:', out.length);
console.log('Esclusi perche\' "verificare" (' + saltatiVerificare.length + '):');
saltatiVerificare.forEach(s => console.log('  - ' + s));

fs.writeFileSync('candidati_setaccio.js', 'module.exports = ' + JSON.stringify(out, null, 2) + ';\n');
console.log('\nScritto candidati_setaccio.js');
