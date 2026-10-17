const fs = require('fs');
let b = fs.readFileSync('build.js', 'utf8');
const problemi = [];

/* 1. genera l'elenco dei suggerimenti: zone (con quanti posti) e nomi dei posti */
const blocco = `
/* elenco per i suggerimenti della ricerca: prima le zone, poi i singoli posti */
const contaZona = {};
posti.forEach(p => { contaZona[p.z] = (contaZona[p.z] || 0) + 1; });
const suggerimenti = [];
Object.keys(contaZona).sort().forEach(z => suggerimenti.push([z, 'zona', contaZona[z]]));
posti.slice().sort((a, b) => a.n.localeCompare(b.n)).forEach(p => suggerimenti.push([p.n, p.z, 0]));
const SUGG = JSON.stringify(suggerimenti);
`;
if (!b.includes('const SUGG')) b = b.replace('let corpo = \'\';', blocco + '\nlet corpo = \'\';');
else problemi.push('SUGG gia presente');

/* 2. il contenitore dei suggerimenti sotto il campo di ricerca */
const ancora = '      <button type="button" id="pulisci" class="b-pulisci">&times;</button>';
if (b.includes(ancora) && !b.includes('id="sugg"')) {
  b = b.replace(ancora, ancora + '\n      <ul id="sugg" class="sugg"></ul>');
} else problemi.push('contenitore suggerimenti non inserito');

/* 3. passa l'elenco alla pagina */
const primaDelloScript = '<script src="assets/app.js"></script>';
if (!b.includes('window.SUGG')) {
  b = b.replace(primaDelloScript, '<script>window.SUGG=${SUGG};</script>\n' + primaDelloScript);
} else problemi.push('window.SUGG gia presente');

fs.writeFileSync('build.js', b);
console.log(problemi.length ? 'PROBLEMI: ' + problemi.join(' | ') : 'build.js aggiornato');
