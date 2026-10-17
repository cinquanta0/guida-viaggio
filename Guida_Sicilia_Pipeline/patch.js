const fs = require('fs');
let b = fs.readFileSync('build.js', 'utf8');
const pezzo = fs.readFileSync('pezzo.js', 'utf8');
const problemi = [];

/* 1. sostituisce il blocco che genera schede e bottoni */
const inizio = b.indexOf("let corpo = '';");
const fine = b.indexOf('const html = `');
if (inizio < 0 || fine < 0) { console.log('ANCORAGGI NON TROVATI'); process.exit(1); }
b = b.substring(0, inizio) + pezzo + '\n' + b.substring(fine);

/* 2. tabella fondo + funzione per togliere gli accenti */
const tabelle = 'const FONDO = { sabbia: "Sabbia", ciottoli: "Ciottoli", scogli: "Scogli" };\n'
  + 'const senzaAccenti = s => s.toLowerCase()\n'
  + '  .replace(/[àáâãä]/g, "a").replace(/[èéêë]/g, "e")\n'
  + '  .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")\n'
  + '  .replace(/[ùúûü]/g, "u").replace(/ç/g, "c").replace(/ñ/g, "n");\n';
if (!b.includes('const FONDO')) b = b.replace('const FASCE = [', tabelle + 'const FASCE = [');
else problemi.push('FONDO gia presente');

/* 3. due caratteristiche nuove */
const vecchioTag = "vista: ['Vista mare', 'g-vis']";
const nuovoTag = "vista: ['Vista mare', 'g-vis'], gratis: ['Gratis', 'g-gra'], prenotare: ['Prenotare', 'g-pre']";
if (b.includes(vecchioTag)) b = b.replace(vecchioTag, nuovoTag);
else problemi.push('non trovato il posto per gratis/prenotare');

/* 4. terza riga di filtri */
const ancora = '    <div class="f-azioni">';
const riga = '    <div class="f-riga">\n'
  + '      <span class="f-lab">Il fondo, per le spiagge</span>\n'
  + '      ${bottoniFondo}\n'
  + '    </div>\n'
  + ancora;
if (b.includes(ancora) && !b.includes('bottoniFondo}')) b = b.replace(ancora, riga);
else problemi.push('riga filtri fondo non inserita');

fs.writeFileSync('build.js', b);
console.log(problemi.length ? 'PROBLEMI: ' + problemi.join(' | ') : 'build.js aggiornato');
