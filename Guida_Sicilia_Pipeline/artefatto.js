const fs = require('fs');
const path = require('path');
const SITO = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/';
const OUT = 'C:/Users/lucad/AppData/Local/Temp/claude/C--Users-lucad/39b05157-81e5-4f36-becc-b65b72295450/scratchpad/sicilia-posti.html';

let h = fs.readFileSync(SITO + 'index.html', 'utf8');
const css = fs.readFileSync(SITO + 'assets/style.css', 'utf8');
const js = fs.readFileSync(SITO + 'assets/app.js', 'utf8');

// solo il contenuto del body: l'artifact fornisce da solo doctype/head/body
let corpo = h.substring(h.indexOf('<body>') + 6, h.lastIndexOf('</body>'));

// via i riferimenti ai file esterni, che verranno incorporati
corpo = corpo.replace(/<script src="assets\/app\.js"><\/script>/, '');

// nella versione online le foto sono dentro la pagina, non in una cartella
corpo = corpo.replace(
  /Foto da Wikimedia Commons[^<]*<code>assets\/img\/<\/code>\./,
  'Foto da Wikimedia Commons, licenza libera (Creative Commons, CC0 o pubblico dominio), incorporate nella pagina.'
);

// foto -> data URI
const usate = {};
corpo = corpo.replace(/assets\/img\/([A-Za-z0-9_.-]+)/g, function (_, file) {
  if (!usate[file]) {
    const buf = fs.readFileSync(SITO + 'assets/img/' + file);
    usate[file] = 'data:image/jpeg;base64,' + buf.toString('base64');
  }
  return usate[file];
});

const out =
  '<title>I posti di Sicilia</title>\n' +
  '<style>\n' + css + '\n</style>\n' +
  corpo + '\n' +
  '<script>\n' + js + '\n</script>\n';

fs.writeFileSync(OUT, out, 'utf8');
const mb = Buffer.byteLength(out) / 1048576;
console.log('scritto ' + OUT);
console.log('foto incorporate: ' + Object.keys(usate).length);
console.log('peso: ' + mb.toFixed(2) + ' MB  (limite 16 MB)');
console.log('riferimenti esterni rimasti: ' + (out.match(/(src|href)="(?!data:|#)[^"]*"/g) || []).length);
