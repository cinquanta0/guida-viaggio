/* Mette una TUA foto su una scheda del cibo.

   Serve per gli otto piatti che su Wikimedia Commons non esistono: carne di
   cavallo, rollò, patacalzone, schiacciata catanese, pignolata messinese,
   pasta 'ncasciata, pesce spada alla ghiotta, maccu di fave. Nessun archivio
   libero ne ha una, ma tu ci passi davanti la settimana prossima.

   Fa tutto: ridimensiona nelle due misure, scrive il credito come foto tua,
   aggancia il file alla scheda e rigenera il sito. Poi resta solo il deploy.

   Uso:
     node foto_mia.js "Carne di cavallo" C:\percorso\alla\foto.jpg
     node foto_mia.js "Rollo" foto.jpg --autore "Luca"

   Il nome della scheda si puo' scrivere senza accenti e senza maiuscole:
   "carne di cavallo", "rollo", "patacalzone". */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const IMG = 'C:/Users/lucad/Downloads/Guida_Sicilia_Sito/assets/img/';

const nomeCercato = process.argv[2];
const sorgente = process.argv[3];
const iAutore = process.argv.indexOf('--autore');
const autore = iAutore > 0 ? process.argv[iAutore + 1] : 'foto dell’autore della guida';

if (!nomeCercato || !sorgente) {
  console.log('Uso: node foto_mia.js "Nome della scheda" percorso\\della\\foto.jpg [--autore "Nome"]');
  process.exit(1);
}
if (!fs.existsSync(sorgente)) { console.log('La foto non esiste: ' + sorgente); process.exit(1); }

/* Le entita' accentate vanno tradotte nella loro lettera PRIMA di buttare
   via il resto: cancellandole e basta, "Roll&ograve;" diventa "roll" e poi
   cercando "rollo" non si aggancia piu' niente. */
const semplice = s => String(s || '').toLowerCase()
  .replace(/<[^>]+>/g, ' ')
  .replace(/&agrave;|&aacute;/g, 'a').replace(/&egrave;|&eacute;/g, 'e')
  .replace(/&igrave;|&iacute;/g, 'i').replace(/&ograve;|&oacute;/g, 'o')
  .replace(/&ugrave;|&uacute;|&uuml;/g, 'u')
  .replace(/&rsquo;/g, "'").replace(/&[a-z]+;/g, ' ')
  .replace(/[àáâ]/g, 'a').replace(/[èé]/g, 'e').replace(/[ìí]/g, 'i')
  .replace(/[òó]/g, 'o').replace(/[ùúü]/g, 'u')
  .replace(/[^a-z0-9]+/g, ' ').trim();

const cibo = require('./cibo.js');
const bersaglio = cibo.find(v => semplice(v.n) === semplice(nomeCercato))
  || cibo.find(v => semplice(v.n).indexOf(semplice(nomeCercato)) !== -1);

if (!bersaglio) {
  console.log('Nessuna scheda si chiama cosi\u0027. Quelle senza foto sono:');
  cibo.filter(v => !v.img).forEach(v => console.log('   ' + semplice(v.n)));
  process.exit(1);
}
if (bersaglio.img) {
  console.log('Attenzione: "' + semplice(bersaglio.n) + '" ha gia\u0027 la foto ' + bersaglio.img + '. La sostituisco.');
}

const chiave = semplice(bersaglio.n).replace(/ /g, '').slice(0, 24);
const nomeFile = chiave + '.jpg';

/* stessa lavorazione delle foto di Commons: 900 per il desktop, 480 per il
   telefono. Se la foto e' verticale si ritaglia in orizzontale, altrimenti
   nella scheda viene lunghissima. */
function converti(larghezza, destinazione) {
  const info = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0', sorgente]).toString().trim();
  const [w, h] = info.split(',').map(Number);
  const filtro = (w / h < 1.15)
    ? 'crop=in_w:in_w*2/3:0:(in_h-in_w*2/3)/3,scale=' + larghezza + ':-1'
    : 'scale=w=' + larghezza + ':h=' + larghezza + ':force_original_aspect_ratio=decrease';
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', sorgente, '-vf', filtro, '-q:v', '5', destinazione]);
}

converti(900, IMG + nomeFile);
converti(480, IMG + chiave + '-480.jpg');

/* il credito: la licenza sei tu, non Commons */
const crediti = JSON.parse(fs.readFileSync('credits.json', 'utf8'));
crediti[chiave] = {
  file: nomeFile,
  title: 'Foto scattata per la guida',
  author: autore,
  license: 'foto propria',
  source: ''
};
fs.writeFileSync('credits.json', JSON.stringify(crediti, null, 1));

/* aggancia il file alla scheda, con una sostituzione testuale mirata */
for (const file of ['componi_cibo.js', 'ancora_cibo.js']) {
  if (!fs.existsSync(file)) continue;
  let testo = fs.readFileSync(file, 'utf8');
  const ago = "n: '" + bersaglio.n.replace(/'/g, "\\'") + "',";
  const dove = testo.indexOf(ago);
  if (dove === -1) continue;
  const fineBlocco = testo.indexOf('\n  }', dove);
  const blocco = testo.slice(dove, fineBlocco);
  if (/\n\s*img: '/.test(blocco)) {
    testo = testo.slice(0, dove) + blocco.replace(/\n(\s*)img: '[^']*',/, "\n$1img: '" + nomeFile + "',") + testo.slice(fineBlocco);
  } else {
    const dopoTipo = testo.indexOf('\n', testo.indexOf("t: '", dove));
    testo = testo.slice(0, dopoTipo + 1) + "    img: '" + nomeFile + "',\n" + testo.slice(dopoTipo + 1);
  }
  fs.writeFileSync(file, testo, 'utf8');
  console.log('agganciata in ' + file);
  break;
}

console.log('\nfoto pronta: ' + nomeFile + ' (' + Math.round(fs.statSync(IMG + nomeFile).size / 1024) + ' KB)');
console.log('scheda: ' + semplice(bersaglio.n));
console.log('\nAdesso:');
console.log('   node componi_cibo.js && node build.js && node crediti.js');
console.log('   cd ..\\Guida_Sicilia_Sito && firebase deploy');
