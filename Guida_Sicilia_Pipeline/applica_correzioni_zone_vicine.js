/* Applica le correzioni trovate dal controllo (Chrome/Google Maps + WebSearch,
   metodo gratuito) sui 175 posti carne/pesce/pasta delle 22 zone entro 30 min
   diverse da Aci Catena/Acireale (gia' fatte). Vedi sospetti_zone_vicine.md
   (fork, 24 ago 2026) per il dettaglio di ogni verifica.

   Alcune correzioni del fork sono state ammorbidite dopo un controllo a
   campione mio: es. Scialacore aveva un piatto di pesce (stocco) che il
   fork non aveva visto, quindi non gli aggiungo "carne" come suggeriva —
   resta solo "pizza", il minimo cambiamento sicuro. Le 2 macellerie/hotel
   dubbie (Terra di Venera da rimuovere, resto tenuto) sono decisioni mie,
   vedi messaggio in chat. */

const fs = require('fs');
let testo = fs.readFileSync('dati.js', 'utf8');
const righe = testo.split('\n');

// {n, z, tagAtteso, tagNuovo} — verifica il tag attuale prima di cambiare
const RETAG = [
  ['Bar Il Mattiniero di D\'Arrio Concetta E Fragala\' Raf.Rosario', 'Valverde', 'pasta', 'dolci'],
  ['L\'Osteria del Siciliano', 'Nicolosi', 'pasta', 'pasta carne'],
  ['Antichi proverbi n\'festa', 'Nicolosi', 'pasta', 'pizza carne'],
  ['Trattoria N\'Da Calata Zafferana', 'Zafferana Etnea', 'carne', 'pasta'],
  ['I Russo\'', 'Santa Venerina', 'pesce', 'pizza'],
  ['L\'Osteria di Cantine Nicosia', 'Trecastagni', 'pasta', 'pasta carne'],
  ['Trattoria L\'imperiale', 'Catania — Via Plebiscito', 'pasta', 'carne'],
  ['L\'ISKA Catania', 'Catania — Pescheria', 'pesce', 'pizza pesce'],
  ['Cutilisci', 'Catania', 'pesce', 'pizza pesce'],
  ['4 Archi', 'Milo', 'pasta carne', 'pizza pasta carne'],
  ['Casu Osteria Contemporanea', 'Giarre', 'pasta pesce', 'pasta pesce carne'],
  ['Gastronomia Marino', 'Riposto', 'street pesce carne', 'street pesce carne pizza'],
  ['Fornace 41', 'Aci Trezza', 'carne', 'pizza'],
  ['Trattoria da Federico', 'Aci Trezza', 'pasta', 'pesce'],
  ['Bar Il Mattiniero di D’Arrio Concetta E Fragala’ Raf.Rosario', 'Valverde', 'pasta', 'dolci'],
  ['Amelia Risto Pizzeria Food & Drink ( Gluten Free)', 'Aci Sant’Antonio', 'carne', 'pizza'],
  ['La Luna ad Aci Castello', 'Aci Castello', 'carne', 'pizza pasta'],
  ['Locanda Popolare', 'Aci Castello', 'carne', 'pizza'],
  ['La casa di hot dog don bosco P2', 'Valverde', 'carne', 'street'],
  ['Osteria I Saponari', 'Trecastagni', 'carne', 'pizza carne'],
  ['Peccati Di Gola', 'Trecastagni', 'carne', 'pizza carne'],
  ['Antichi Sapori Trattoria Siciliana', 'Trecastagni', 'carne', 'pesce carne'],
  ['Off Restaurant', 'Aci Castello', 'carne', 'pesce'],
  ['Trattoria da Mario', 'Catania', 'pasta', 'carne'],
  ['Trattoria Giglio Rosso', 'Catania', 'pasta', 'pasta pesce carne'],
  ['LE SERRE Pizzeria Tipicità Siciliane', 'Giarre', 'carne', 'pizza'],
  ['250 Grammi Hamburgeria', 'Giarre', 'carne', 'street'],
  ['Antiche Botti', 'Giarre', 'carne', 'pizza carne'],
  ['Scialacore', 'Giarre', 'pesce', 'pizza'],
  ['NONNA BURMELA', 'Giarre', 'pasta', 'street'],
  ['Piazzetta del gusto', 'Gravina di Catania', 'pesce', 'pizza'],
  ['Al Montana', 'Gravina di Catania', 'pasta', 'pizza pasta'],
  ['Novecento', 'Giarre', 'pasta', 'pizza'],
  ['Scorzonera Ristorante Pizzeria a Nicolosi', 'Nicolosi', 'pesce', 'pizza carne'],
  ['Antichi Proverbi STORICO', 'Nicolosi', 'pesce', 'pizza carne'],
  ['Osteria Garibaldi', 'Nicolosi', 'pesce', 'pasta carne'],
  ['Pudamuri', 'Nicolosi', 'pasta', 'pizza'],
  ['L’Osteria del Siciliano', 'Nicolosi', 'pasta', 'pasta carne'],
  ['Antichi proverbi n’festa', 'Nicolosi', 'pasta', 'pizza carne'],
  ['Trattoria N’Da Calata Zafferana', 'Zafferana Etnea', 'carne', 'pasta'],
  ['Trattoria Ardichetto', 'Zafferana Etnea', 'carne', 'pasta'],
  ['Sabir', 'Zafferana Etnea', 'carne', 'pesce'],
  ['La Fenice Medieval Restaurant', 'Zafferana Etnea', 'pesce', 'pizza'],
  ['Oleum Zafferana', 'Zafferana Etnea', 'pasta', 'pizza'],
  ['Ristorante Cunzatu e Mangiato', 'Zafferana Etnea', 'pasta', 'street'],
  ['Da Nonna Rosa', 'Riposto', 'pesce', 'pizza pesce'],
  ['Birreria Riposto', 'Riposto', 'pasta', 'street'],
  ['L’Angolo Di Don Pippo', 'Riposto', 'pasta', 'pizza'],
  ['Il Ciliegino Pizzeria', 'Riposto', 'pizza pasta', 'pizza street'],
  ['Antica Pizzeria Napoletana', 'Santa Venerina', 'pesce', 'pizza'],
  ['I Russo’', 'Santa Venerina', 'pesce', 'pizza'],
  ['Zest - Ristorante, Pizzeria, Panini gourmet, Sicilian Food', 'Santa Venerina', 'pesce', 'pizza street'],
  ['Trattoria A Munacedda', 'Santa Venerina', 'pasta', 'pasta carne'],
  ['Pizzeria Le Sette Torri', 'Mascali', 'pesce', 'pizza street'],
  ['Ristorante Da Rinuccio', 'Milo', 'pesce', 'pasta carne'],
  ['Il Pozzo Antico', 'Mascali', 'pesce', 'carne pizza'],
  ['Le case del Merlo Turismo Rurale', 'Milo', 'pesce', 'pasta'],
  ['De Natale Pizza e Cucina', 'Fiumefreddo di Sicilia', 'pesce', 'pizza'],
  ['Flumen Alley', 'Fiumefreddo di Sicilia', 'pesce', 'street'],
  ['Cohiba Cafè', 'Fiumefreddo di Sicilia', 'pasta', 'dolci'],
  ['La Bussola Ristorante Pizzeria Grill', 'Giardini Naxos', 'pesce', 'pizza pesce'],
  ['Ristorante pizzeria La Spelonca', 'Giardini Naxos', 'pasta pizza', 'pasta pizza pesce'],
  ['Da Lino Trattoria Sicilia Bedda', 'Giardini Naxos', 'pasta', 'pizza pasta pesce'],
  ['Al nuovo caprice 2', 'Valverde', 'pasta', 'street'],
  ['L’Osteria di Cantine Nicosia', 'Trecastagni', 'pasta', 'pasta carne'],
  ['Grigliados - Churrasco & Steakhouse', 'Riposto', 'carne', 'pizza carne'],
  ['Trattoria L’imperiale', 'Catania — Via Plebiscito', 'pasta', 'carne'],
  ['Trattoria Da Zia Tanina', 'Catania — Via Plebiscito', 'pasta', 'carne pasta'],
  ['Spina', 'Mascali', 'pesce', 'pizza pesce'],
  ['Trattoria-pizzeria Brezza di Mare', 'Mascali', 'pesce', 'pizza pesce'],
  ['Chi si mangia?', 'Mascali', 'pasta', 'pizza pasta street'],
  ['mm!! Trattoria', 'Catania — Pescheria', 'pasta', 'pesce'],
  ['L’ISKA Catania', 'Catania — Pescheria', 'pesce', 'pizza pesce'],
  ['Mare Kambo', 'Fiumefreddo di Sicilia', 'pesce', 'pizza pesce'],
  ['AL BRACIERE MILO', 'Milo', 'carne', 'pizza carne'],
  ['Da Totò Ristorante Pizzeria', 'Giardini Naxos', 'pasta pizza', 'pasta pizza pesce'],
  ['Trattoria da Antonio', 'Giardini Naxos', 'pasta', 'pasta pesce'],
  ['Mari criu', 'Giardini Naxos', 'pesce', 'pasta pesce'],
  ['Canto delle Sirene', 'Aci Castello', 'pasta', 'pasta pesce carne']
];

const RIMUOVI = [
  ['I 4 Canti', 'Catania'],           // chiuso definitivamente
  ['Terra di Venera', 'Santa Venerina'], // ristorante generico di un hotel, nessuna identita' propria
  ['Brace Catania', 'Catania — Pescheria'], // duplicato di "Brace" (zona Catania), stesso indirizzo
  ['Scirocco', 'Catania — Pescheria']       // duplicato di "Scirocco Sicilian Fish Lab", stesso indirizzo
];

let okRetag = 0, mancanti = [], tagDiverso = [];

RETAG.forEach(([n, z, atteso, nuovo]) => {
  const idx = righe.findIndex(r => r.includes('n:"' + n + '"') && r.includes('z:"' + z + '"'));
  if (idx === -1) { mancanti.push(n + ' | ' + z); return; }
  const riga = righe[idx];
  const m = riga.match(/t:"([^"]*)"/);
  if (!m) { mancanti.push(n + ' | ' + z + ' (niente campo t)'); return; }
  if (m[1] !== atteso) { tagDiverso.push(n + ' | ' + z + ' | atteso "' + atteso + '" ma e\' "' + m[1] + '"'); return; }
  righe[idx] = riga.replace('t:"' + atteso + '"', 't:"' + nuovo + '"');
  okRetag++;
});

let okRimuovi = 0;
RIMUOVI.forEach(([n, z]) => {
  const idx = righe.findIndex(r => r.includes('n:"' + n + '"') && r.includes('z:"' + z + '"'));
  if (idx === -1) { mancanti.push('(rimuovi) ' + n + ' | ' + z); return; }
  righe.splice(idx, 1);
  okRimuovi++;
});

// aggiunge l'indirizzo mancante a "Scirocco Sicilian Fish Lab" prima di scrivere
const idxSFL = righe.findIndex(r => r.includes('n:"Scirocco Sicilian Fish Lab"'));
if (idxSFL !== -1 && !righe[idxSFL].includes('a:"')) {
  righe[idxSFL] = righe[idxSFL].replace(', t:"street pesce"', ', t:"street pesce", a:"Piazza Alonzo di Benedetto 7"');
}

fs.writeFileSync('dati.js', righe.join('\n'), 'utf8');

console.log('retag applicati:', okRetag, '/', RETAG.length);
console.log('rimozioni applicate:', okRimuovi, '/', RIMUOVI.length);
if (mancanti.length) { console.log('\nNON TROVATI:'); mancanti.forEach(x => console.log(' -', x)); }
if (tagDiverso.length) { console.log('\nTAG DIVERSO DA ATTESO (non toccati):'); tagDiverso.forEach(x => console.log(' -', x)); }
