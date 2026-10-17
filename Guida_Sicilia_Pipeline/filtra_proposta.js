/* Ripulisce la proposta prima di scaricare.

   Il filtro automatico prende quello che si misura (proporzioni assurde,
   doppioni). Il resto e' una lista scritta a mano: le categorie di Commons
   contengono anche foto che col posto non c'entrano, e nessuna euristica
   riconosce che un'eruzione dell'Etna non e' il porto di Riposto o che dei
   fichi d'india non sono Cefalu'. Quello si vede solo leggendo i titoli.

   Uso: node filtra_proposta.js proposta_mare.json da_scaricare.json */

const fs = require('fs');

/* scartate a mano, col motivo: mostrano un soggetto che non e' il posto */
const SCARTATE = {
  "Laughing Out Loud (254594227).jpeg": "titolo senza senso, soggetto ignoto",
  "Etna Vulcano-Sicilia-Italy-Castielli CC0 HQ - panoramio.jpg": "e' l'Etna, non la spiaggia di Pozzillo",
  "Etna Volcano Paroxysmal Eruption July 30 2011 - Creative Commons by gnuckx (5993354142).jpg": "un'eruzione, non il porto di Riposto",
  "Etna Volcano Paroxysmal Eruption July 30 2011 - Creative Commons by gnuckx (5993911456).jpg": "un'eruzione, non il porto di Riposto",
  "Panorama Mascali.jpg": "il paese di Mascali, non la spiaggia di Fondachello",
  "Scritta mussoliniana su casa di Mascali.JPG": "una scritta fascista su un muro",
  "Cataniaetnaecirco.jpg": "Catania con l'Etna, non la Plaia",
  "Catania mit Aetna.JPG": "Catania con l'Etna, non la Plaia",
  "Ficchidindia.JPG": "fichi d'india, non Cefalu'",
  "Isole ciclopi.JPG": "i faraglioni sono ad Aci Trezza, non a Capo Mulini",
  "Acitrezza Cyclops Faraglioni Sicily Italy - Creative Commons by gnuckx (5017934521).jpg": "e' Aci Trezza, non Aci Castello",
  "Priolo-Panorama.JPG": "il paese di Priolo, e per giunta una striscia 3:1",
  "Veduta aerea di Siracusa e con l'Etna sullo sfondo (Foto di Angelo Bonomo).jpg": "veduta aerea di Siracusa, non la caletta",
  "Ortigia dall'alto.jpg": "Ortigia dall'alto, non la caletta",
  "Marzamemi01 flickr.jpg": "il borgo di Marzamemi, non la spiaggia della Spinazza",
  "Marzamemi 3.JPG": "il borgo di Marzamemi, non la spiaggia della Spinazza"
};

const MAX_PROPORZIONE = 2.6;

const proposta = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const uscita = {};
const visti = new Set();
const scartati = [];

for (const [chiave, v] of Object.entries(proposta)) {
  const tenuti = [];
  for (let i = 0; i < v.file.length; i++) {
    const titolo = v.file[i];
    const misura = (v.misure[i] || '0x0').split('x').map(Number);
    const prop = misura[1] ? misura[0] / misura[1] : 0;

    if (SCARTATE[titolo]) { scartati.push([v.posto, titolo, SCARTATE[titolo]]); continue; }
    if (prop > MAX_PROPORZIONE) { scartati.push([v.posto, titolo, 'striscia ' + prop.toFixed(1) + ':1, inguardabile in una scheda']); continue; }
    /* stessa foto proposta su due schede: la tiene solo la prima */
    if (visti.has(titolo)) { scartati.push([v.posto, titolo, "gia' usata su un'altra scheda"]); continue; }
    visti.add(titolo);
    tenuti.push(titolo);
  }
  if (tenuti.length) uscita[chiave] = { da: 2, file: tenuti };
}

fs.writeFileSync(process.argv[3], JSON.stringify(uscita, null, 1));

console.log('SCARTATE (' + scartati.length + '):');
scartati.forEach(function (r) {
  console.log('  ' + r[0].slice(0, 30).padEnd(30) + ' ' + r[1].slice(0, 44).padEnd(44) + ' ' + r[2]);
});

const quante = Object.values(uscita).reduce((n, v) => n + v.file.length, 0);
console.log('\nTENUTE: ' + quante + ' foto su ' + Object.keys(uscita).length + ' posti');
