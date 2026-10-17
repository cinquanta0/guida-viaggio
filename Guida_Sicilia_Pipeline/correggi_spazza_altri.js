/* Correzioni manuali sui candidati_spazza_altri.js, trovate rivedendo
   l'elenco prima dell'inserimento:
   - alcune spiagge sono uscite dalla ricerca "vedere" (Google le tagga
     tourist_attraction, non beach) e non da quella "mare" — il filtro
     ammessi di mare non includeva tourist_attraction, quindi la ricerca
     mare da sola non le avrebbe mai trovate. Riclassificate a mare.
   - "Parco dell'Etna" e' finito sotto mare perche' il tipo Google
     national_park era nell'elenco ammessi di mare, ma l'Etna non e' una
     spiaggia. Spostato a vedere.
   - negozi fuori tema anche se sopra soglia voto/recensioni: bomboniere
     (nessun turista in settimana compra bomboniere), usato, ingrosso,
     articoli sportivi generici, centro commerciale generico (fuori dallo
     spirito "negozi tipici" della categoria).
   - un nome con un carattere di scarto lasciato da Google. */

const fs = require('fs');
let s = fs.readFileSync('candidati_spazza_altri.js', 'utf8');

const daMareAVedere = ["Parco dell'Etna"];
const daVedereAMare = ['Spiaggia di Lungomare Tremoli', 'Spiaggia dei Due Mari', 'Spiaggia Pietre Nere',
  'Spiaggia Playa', 'Cala Bianca', 'Cala del Prèveto'];
const daRimuovere = ['Lanzalone regali - bomboniere - articoli da regalo', 'R.C. ACCESSORI BOMBONIERE',
  'Chimera Bomboniere', 'Il Bello dell\'Usato - Gravina di Catania', 'Riposto Pesca Srl',
  'Tre Anelli Sport di Beninato', 'Parco Corolla'];

const dati = eval(s.replace('module.exports = ', ''));

let cambiTag = 0, rimossi = 0;
const puliti = dati.filter(d => {
  if (daRimuovere.includes(d.n)) { rimossi++; return false; }
  return true;
}).map(d => {
  if (daMareAVedere.includes(d.n) && d.t === 'mare') {
    cambiTag++;
    return Object.assign({}, d, { t: 'vedere', d: d.d.replace('Spiaggia a', 'Da vedere a') });
  }
  if (daVedereAMare.includes(d.n) && d.t === 'vedere') {
    cambiTag++;
    return Object.assign({}, d, { t: 'mare', d: d.d.replace('Da vedere a', 'Spiaggia a') });
  }
  if (d.n.includes('�') || /["“”].*Licata Sicilia$/.test(d.n)) {
    return Object.assign({}, d, { n: d.n.replace(/["“”]?Licata Sicilia$/, '').trim() });
  }
  return d;
});

fs.writeFileSync('candidati_spazza_altri.js',
  '/* Generato da seleziona_spazza_altri.js, corretto da correggi_spazza_altri.js. */\nmodule.exports = ' + JSON.stringify(puliti, null, 1) + ';\n', 'utf8');

console.log('rimossi: ' + rimossi + '  |  tag cambiati: ' + cambiTag + '  |  totale finale: ' + puliti.length);
