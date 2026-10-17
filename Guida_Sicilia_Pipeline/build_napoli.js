/* Genera napoli.html (destinazione Napoli + Caserta) riusando lo STESSO motore
   del sito Sicilia: stessa CSS (assets/style.css) e stesso JS (assets/app.js).
   Non tocca index.html ne' dati.js. Le schede hanno la stessa struttura/classi
   che app.js si aspetta (.fascia[data-f] .p, data-t/g/aff/n/i/s, #cerca, #sugg,
   #reset, #mostraAuto, #oggi, window.SUGG/ZONE/MIGLIORI). */
const fs = require('fs');
const posti = require('./dati_napoli.js');
const OUT = require('path').join(__dirname, '..', 'Guida_Sicilia_Sito', 'napoli.html');

const TIPI = {
  ristorante: 'Ristoranti', mangiare: 'Dove si mangia',
  pizza: 'Pizza', pesce: 'Pesce', carne: 'Carne', pasta: 'Pasta e trattorie',
  dolci: 'Dolci e caffè', street: 'Street food', vedere: 'Da vedere'
};
const CIBO = ['pizza', 'pesce', 'carne', 'pasta', 'dolci', 'street'];
const RISTORANTE = ['pasta', 'pesce', 'carne'];
const TAG = {
  locali: ['Da locali', 'g-loc'], gratis: ['Gratis', 'g-gra'],
  prenotare: ['Prenotare', 'g-pre'], vista: ['Panorama', 'g-vis']
};
const AFF = { sel: ['I migliori', 'af-sel'], ver: ['Consigliato', 'af-ver'], auto: ['Da esplorare', 'af-auto'] };

/* foto dei monumenti/posti, verificate a mano (Commons, licenze libere): id posto -> file */
const FOTO_POSTI = {
  "napcas-napoli-sansevero": "nap-sansevero.jpg",
  "napcas-napoli-spaccanapoli": "nap-spaccanapoli.jpg",
  "napcas-napoli-san-gregorio": "nap-san-gregorio.jpg",
  "napcas-napoli-duomo": "nap-duomo.jpg",
  "napcas-napoli-sotterranea": "nap-sotterranea.jpg",
  "napcas-napoli-plebiscito": "nap-plebiscito.jpg",
  "napcas-napoli-galleria-umberto": "nap-galleria-umberto.jpg",
  "napcas-napoli-maschio-angioino": "nap-maschio-angioino.jpg",
  "napcas-napoli-castel-ovo": "nap-castel-ovo.jpg",
  "napcas-napoli-san-martino": "nap-san-martino.jpg",
  "napcas-napoli-via-toledo": "nap-via-toledo.jpg",
  "napcas-napoli-mann": "nap-mann.jpg",
  "napcas-napoli-catacombe": "nap-catacombe.jpg",
  "napcas-napoli-san-carlo": "nap-san-carlo.jpg",
  "napcas-napoli-capodimonte": "nap-capodimonte.jpg",
  "napcas-napoli-fontanelle": "nap-fontanelle.jpg",
  "napcas-napoli-galleria-borbonica": "nap-galleria-borbonica.jpg",
  "napcas-napoli-pignasecca": "nap-pignasecca.jpg",
  "napcas-caserta-reggia": "nap-caserta-reggia.jpg",
  "napcas-caserta-san-leucio": "nap-caserta-san-leucio.jpg"
};

function tipiFiltro(t) {
  const l = String(t || '').split(/\s+/).filter(Boolean);
  const piu = [];
  if (l.some(x => CIBO.indexOf(x) >= 0)) piu.push('mangiare');
  if (l.some(x => RISTORANTE.indexOf(x) >= 0)) piu.push('ristorante');
  return l.concat(piu).join(' ');
}
const senzaAccenti = s => String(s).toLowerCase()
  .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
  .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/ç/g, 'c').replace(/ñ/g, 'n');
const simpl = s => senzaAccenti(s).replace(/[^a-z0-9 ]/g, ' ').replace(/ +/g, ' ').trim();
const e = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mapUrl = p => 'https://www.google.com/maps/search/?api=1&query='
  + encodeURIComponent(p.n + ', ' + p.citta + ', Campania');

/* Il tag di una foto, in due misure: il telefono scarica quella da 480.
   Stessa forma del sito Sicilia (build.js). Una foto sola per scheda. */
function tagFoto(file, alt) {
  const piccola = file.replace(/\.jpg$/, '-480.jpg');
  return '<img src="assets/img/' + file + '"'
    + ' srcset="assets/img/' + piccola + ' 480w, assets/img/' + file + ' 900w"'
    + ' sizes="(max-width: 700px) 100vw, 672px"'
    + ' alt="' + attr(alt) + '" loading="lazy" decoding="async">';
}

/* ---- i gruppi (sezioni): Caserta prima (ven sera), poi Napoli per quartiere ---- */
const ordCaserta = ['Caserta', 'San Leucio', 'San Marco Evangelista (CE)', 'Caiazzo (CE)', 'Casertavecchia'];
const ordNapoli = ['Centro storico', 'Via Toledo / Plebiscito', 'Materdei', 'Sanità', 'Capodimonte',
  'Quartieri Spagnoli', 'Lungomare', 'Vomero', 'Municipio / porto', 'Vicino alla stazione'];
function gruppi(citta, ordine) {
  const zs = {};
  posti.filter(p => p.citta === citta).forEach(p => { (zs[p.z] = zs[p.z] || []).push(p); });
  const chiavi = Object.keys(zs).sort((a, b) => {
    const ia = ordine.indexOf(a), ib = ordine.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return chiavi.map(z => [z, zs[z]]);
}

function scheda(p) {
  const tipi = p.t.split(' ');
  const tags = (p.g || '').split(' ').filter(Boolean);
  const identita = simpl(p.n + ' ' + p.z + ' ' + p.citta + ' ' + (p.a || ''));
  const cerca = simpl(p.n + ' ' + p.z + ' ' + p.citta + ' ' + (p.a || '') + ' ' + p.t + ' ' + p.d);
  let s = '    <div class="p" data-t="' + tipiFiltro(p.t) + '" data-g="' + (p.g || '') + '"'
    + ' data-aff="' + (p.aff || '') + '" data-n="' + attr(p.n) + '"'
    + ' data-i="' + attr(identita) + '" data-s="' + attr(cerca) + '">\n';
  const fimg = p.img || FOTO_POSTI[p.id];
  if (fimg) s += '      ' + tagFoto(fimg, p.alt || p.n) + '\n';
  s += '      <div class="p-in">\n';
  s += '        <p class="p-km"><span class="km-n">' + e(p.citta) + '</span> ' + e(p.z) + '</p>\n';
  s += '        <h3>' + e(p.n) + '</h3>\n';
  if (p.a) s += '        <p class="p-a">' + e(p.a) + '</p>\n';
  s += '        <p class="p-tag">';
  if (p.aff && AFF[p.aff]) s += '<span class="af ' + AFF[p.aff][1] + '">' + AFF[p.aff][0] + '</span>';
  for (const t of tipi) if (TIPI[t]) s += '<span class="ti ti-' + t + '">' + TIPI[t] + '</span>';
  for (const g of tags) if (TAG[g]) s += '<span class="tg ' + TAG[g][1] + '">' + TAG[g][0] + '</span>';
  s += '</p>\n';
  s += '        <p class="p-d">' + e(p.d) + '</p>\n';
  s += '        <p class="p-map"><a href="' + mapUrl(p) + '" target="_blank" rel="noopener">Apri in mappa &rarr;</a></p>\n';
  s += '      </div>\n    </div>\n';
  return s;
}

let corpo = '', fid = 0;
function sezione(titolo, sotto, listaGruppi) {
  if (!listaGruppi.length) return;
  corpo += '<h2 class="sec-h">' + titolo + '</h2>\n';
  if (sotto) corpo += '<p class="sec-s">' + sotto + '</p>\n';
  listaGruppi.forEach((g, i) => {
    fid++;
    corpo += '<details class="fascia" data-f="' + fid + '"' + (i === 0 ? ' open' : '') + '>\n';
    corpo += '  <summary><span class="f-t">' + e(g[0]) + '</span>'
      + '<span class="f-c"><b>' + g[1].length + '</b> posti</span></summary>\n';
    corpo += '  <div class="f-in">\n';
    g[1].forEach(p => { corpo += scheda(p); });
    corpo += '  </div>\n</details>\n';
  });
}
sezione('Caserta', 'Venerdì sera, prima di Napoli — si dorme qui', gruppi('Caserta', ordCaserta));
sezione('Napoli', 'Sabato e domenica — in treno da Caserta, poi a piedi e in metro', gruppi('Napoli', ordNapoli));

/* ---- i cibi: piatti classici napoletani spiegati ("Cosa vi mettono nel piatto") ---- */
const piatti = [
  {n:"Pizza Margherita", t:"pizza", d:"La regina: pomodoro, fior di latte (o mozzarella), basilico. Semplice e perfetta, cornicione alto e morbido. Con la marinara è la più tradizionale."},
  {n:"Pizza fritta", t:"street", d:"Disco di pasta ripieno — ricotta, cicoli, provola, pomodoro — e poi fritto. Lo street food napoletano per eccellenza, da mangiare per strada."},
  {n:"Cuoppo", t:"street", d:"Cono di carta con fritti misti: di mare (alici, calamari, gamberi) o di terra (crocchè, frittatine, panzarotti). Caldo, da passeggio."},
  {n:"Frittatina di pasta", t:"street", d:"Nido di pasta legato con besciamella, piselli e provola, impanato e fritto. Il classico della friggitoria, da addentare in piedi."},
  {n:"Sfogliatella", t:"dolci", d:"Riccia (pasta sfoglia croccante) o frolla (più morbida): ripiena di ricotta, semolino, canditi e cannella. Meglio appena sfornata."},
  {n:"Babà", t:"dolci", d:"Piccolo lievitato imbevuto di rum, soffice e inzuppato. Di origine francese, ormai simbolo di Napoli."},
  {n:"Pastiera", t:"dolci", d:"Crostata di ricotta e grano cotto profumata ai fiori d'arancio. Tipica di Pasqua ma si trova tutto l'anno."},
  {n:"Struffoli", t:"dolci", d:"Palline di pasta fritte legate col miele e decorate con confettini. È IL dolce di Natale napoletano: a dicembre li trovi ovunque."},
  {n:"Ragù napoletano", t:"pasta carne", d:"Non un ragù qualsiasi: carne a pezzi cotta nel pomodoro per ore (anche sei). Condisce gli ziti spezzati; la carne è il secondo."},
  {n:"Genovese", t:"pasta", d:"Sugo di tantissime cipolle e carne cotte a lungo fino a diventare una crema dolce, di solito sugli ziti. Napoletana nonostante il nome."},
  {n:"Sartù di riso", t:"", d:"Ricco timballo di riso con ragù, polpettine, piselli, uova e provola. Piatto della cucina 'monzù', di radici francesi."},
  {n:"Parmigiana di melanzane", t:"", d:"Melanzane fritte a strati con pomodoro, mozzarella e parmigiano, al forno. Un classico di casa, ottima anche fredda."},
  {n:"Casatiello", t:"", d:"Rustico salato di pasta lievitata con salumi, formaggi e uova intere nel guscio. Festivo, soprattutto a Pasqua."},
  {n:"Mozzarella di bufala campana", t:"", d:"La DOP delle campagne tra Caserta e Aversa: freschissima, va provata sul posto. A due passi da dove dormite."},
  {n:"Caffè napoletano", t:"", d:"Espresso corto e intenso, spesso servito già zuccherato: chiedilo 'amaro' se lo vuoi senza. Rito irrinunciabile."},
  {n:"Pizza a portafoglio", t:"pizza street", d:"La margherita piegata in quattro, da mangiare per strada con una mano. Versione veloce ed economica della pizza."},
  {n:"Mozzarella in carrozza", t:"street", d:"Fetta di mozzarella tra due fette di pane, impanata e fritta: dentro fila, fuori è croccante. Antipasto o street food."},
  {n:"Friarielli e salsiccia", t:"carne", d:"I friarielli (le cime di rapa napoletane, un po' amarognole) saltati in padella con la salsiccia. Un classico di casa."},
  {n:"Spaghetti alle vongole", t:"pesce pasta", d:"Vongole veraci, aglio, olio e prezzemolo. 'In bianco' o con qualche pomodorino: semplice e di mare."},
  {n:"Impepata di cozze", t:"pesce", d:"Cozze aperte col loro sughetto, tanto pepe e limone. Da fare la scarpetta col pane."},
  {n:"Polpo alla Luciana", t:"pesce", d:"Polpo cotto piano con pomodorino, olive e capperi, dal borgo di Santa Lucia. Morbido e saporito."},
  {n:"Pasta e patate con la provola", t:"pasta", d:"Comfort food partenopeo: pasta mista, patate e provola che fila. Da mangiare col cucchiaio."},
  {n:"Graffe", t:"dolci", d:"Ciambelle fritte di patate passate nello zucchero, soffici e profumate. Lo street food dolce napoletano."},
  {n:"Roccocò", t:"dolci", d:"Biscotti duri a ciambella con mandorle e spezie ('pisto'), tipici di Natale: si inzuppano nel vino o nello spumante. A dicembre sono ovunque."},
  {n:"Mostaccioli", t:"dolci", d:"Dolcetti a rombo di impasto speziato, ricoperti di cioccolato. Classico natalizio napoletano."},
  {n:"Susamielli", t:"dolci", d:"Biscotti natalizi a forma di 'S' con miele, mandorle e spezie. Dolci delle feste."},
  {n:"Insalata di rinforzo", t:"", d:"Il contorno di Natale napoletano: cavolfiore lessato, papaccelle, olive e sottaceti. Si 'rinforza' aggiungendone nei giorni di festa."},
  {n:"Cuzzetiello", t:"street carne", d:"L'estremità del pane cafone svuotata della mollica e riempita di polpette al ragù: la crosta fa da piatto. Si mangia con le mani, la 'marenna' della tradizione. Guai a chiamarlo panino."},
  {n:"'O pere e 'o muss", t:"street", d:"Street food 'povero': piede di maiale e muso di vitello lessati, serviti freddi a pezzetti con sale e limone. Dai carrettini per strada."},
  {n:"Taralli 'nzogna e pepe", t:"street", d:"Taralli sugnacciosi con pepe nero e mandorle, spesso ancora caldi. Da sgranocchiare passeggiando sul lungomare."},
  {n:"Scagliozzi", t:"street", d:"Rombi di polenta fritta, croccanti fuori e morbidi dentro. Il fritto più povero e goloso dei friggitori."},
  {n:"Crocchè (panzarotti di patate)", t:"street", d:"Crocchette di patate fritte, a volte con mozzarella o prosciutto dentro. Immancabili nel cuoppo di terra."},
  {n:"Parigina", t:"street", d:"Rustico di pasta sfoglia con pomodoro, prosciutto e formaggio. Merenda classica da rosticceria."},
  {n:"Sanguinaccio", t:"dolci", d:"Crema dolce di cioccolato (un tempo col sangue di maiale, oggi senza), tipica d'inverno e Carnevale: si intinge coi savoiardi."}
];
/* foto verificate a mano (Wikimedia Commons, licenze libere): nome piatto -> file.
   Solo quelle controllate una a una; i piatti non elencati restano senza foto. */
const FOTO = {
  "Pizza Margherita": "nap-pizza-margherita.jpg",
  "Pizza fritta": "nap-pizza-fritta.jpg",
  "Sfogliatella": "nap-sfogliatella.jpg",
  "Babà": "nap-baba.jpg",
  "Pastiera": "nap-pastiera.jpg",
  "Struffoli": "nap-struffoli.jpg",
  "Ragù napoletano": "nap-ragu-napoletano.jpg",
  "Genovese": "nap-genovese.jpg",
  "Sartù di riso": "nap-sartu.jpg",
  "Parmigiana di melanzane": "nap-parmigiana.jpg",
  "Casatiello": "nap-casatiello.jpg",
  "Mozzarella di bufala campana": "nap-mozzarella-bufala.jpg",
  "Caffè napoletano": "nap-caffe-napoletano.jpg",
  "Pizza a portafoglio": "nap-pizza-portafoglio.jpg",
  "Mozzarella in carrozza": "nap-mozzarella-carrozza.jpg",
  "Spaghetti alle vongole": "nap-spaghetti-vongole.jpg",
  "Polpo alla Luciana": "nap-polpo-luciana.jpg",
  "Roccocò": "nap-roccoco.jpg",
  "Mostaccioli": "nap-mostaccioli.jpg",
  "'O pere e 'o muss": "nap-pere-muss.jpg",
  "Taralli 'nzogna e pepe": "nap-taralli.jpg",
  "Scagliozzi": "nap-scagliozzi.jpg",
  "Crocchè (panzarotti di patate)": "nap-crocche.jpg"
};
corpo += '<h2 class="sec-h">Cosa vi mettono nel piatto</h2>\n';
corpo += '<p class="sec-s">I piatti classici di Napoli, spiegati</p>\n';
corpo += '<details class="fascia" data-cibo="1" open>\n';
corpo += '  <summary><span class="f-t">Piatti tipici</span><span class="f-c"><b>' + piatti.length + '</b> voci</span></summary>\n';
corpo += '  <div class="f-in">\n';
piatti.forEach(v => {
  const cercabile = simpl(v.n + ' ' + (v.t || '') + ' ' + v.d);
  corpo += '    <div class="p" data-cibo="1" data-t="' + (v.t || '') + '" data-n="' + attr(v.n) + '" data-s="' + attr(cercabile) + '">\n';
  const fimg = v.img || FOTO[v.n];
  if (fimg) corpo += '      ' + tagFoto(fimg, v.alt || v.n) + '\n';
  corpo += '      <div class="p-in">\n';
  corpo += '        <h3>' + e(v.n) + '</h3>\n';
  const chips = (v.t || '').split(' ').filter(Boolean).filter(t => TIPI[t]);
  if (chips.length) {
    corpo += '        <p class="p-tag">';
    chips.forEach(t => { corpo += '<span class="ti ti-' + t + '">' + TIPI[t] + '</span>'; });
    corpo += '</p>\n';
  }
  corpo += '        <p class="p-d">' + e(v.d) + '</p>\n';
  corpo += '      </div>\n    </div>\n';
});
corpo += '  </div>\n</details>\n';

/* ---- crediti foto (OBBLIGATORI per le licenze CC): da credits_napoli.json, solo le usate ---- */
let creditiFoto = [];
try {
  // foto usate = quelle dei piatti (FOTO) + quelle dei posti/monumenti (campo img in dati_napoli)
  const usate = new Set([...Object.values(FOTO), ...Object.values(FOTO_POSTI), ...posti.filter(p => p.img).map(p => p.img)]);
  const tutti = [];
  for (const f of ['./credits_piatti.json', './credits_monumenti.json']) {
    try { tutti.push(...require(f)); } catch (_) {}
  }
  const visti = new Set();
  creditiFoto = tutti.filter(c => usate.has(c.file) && !visti.has(c.file) && visti.add(c.file));
} catch (_) {}
if (creditiFoto.length) {
  const nomeDi = {}; Object.entries(FOTO).forEach(([n, f]) => { nomeDi[f] = n; });
  corpo += '<details class="fascia"><summary><span class="f-t">Crediti foto</span>'
    + '<span class="f-c"><b>' + creditiFoto.length + '</b> immagini</span></summary>\n';
  corpo += '  <div class="f-in" style="padding:12px 14px">\n';
  corpo += '    <p class="p-d">Foto dei piatti da Wikimedia Commons, licenze libere (Creative Commons / dominio pubblico), salvate in <code>assets/img/</code>.</p>\n';
  corpo += '    <ul style="font-size:13px;line-height:1.6;padding-left:18px;margin:8px 0 0">\n';
  creditiFoto.forEach(c => {
    corpo += '      <li>' + e(nomeDi[c.file] || c.slug) + ' &mdash; ' + e(c.autore || 'ignoto')
      + ' &middot; ' + e(c.licenza) + ' &middot; <a href="' + attr(c.fonte) + '" target="_blank" rel="noopener">fonte</a></li>\n';
  });
  corpo += '    </ul>\n  </div>\n</details>\n';
}

/* ---- suggerimenti e zone per la ricerca (stessa forma del sito Sicilia) ---- */
const perZona = {};
posti.forEach(p => { (perZona[p.z] = perZona[p.z] || []).push(p); });
const suggerimenti = [];
Object.keys(perZona).sort().forEach(z => suggerimenti.push([z, 'zona', perZona[z].length, '']));
posti.slice().sort((a, b) => a.n.localeCompare(b.n)).forEach(p => suggerimenti.push([p.n, p.z, 0, '']));
const ZONE = JSON.stringify(Object.keys(perZona).map(z => simpl(z)));
const SUGG = JSON.stringify(suggerimenti);
const migliori = posti.filter(p => p.aff === 'sel').map(p => ({ n: p.n, z: p.z, t: p.t, d: p.d, map: mapUrl(p) }));
const nAuto = posti.filter(p => p.aff === 'auto').length;

/* ---- bottoni filtro: solo i tipi/tag presenti nei dati ---- */
const tipiPresenti = {};
posti.forEach(p => tipiFiltro(p.t).split(' ').forEach(t => tipiPresenti[t] = 1));
const bottoniTipo = Object.keys(TIPI).filter(k => tipiPresenti[k])
  .map(k => '<button type="button" class="fb ti-' + k + '" data-k="t" data-v="' + k + '">' + TIPI[k] + '</button>').join('\n      ');
const tagPresenti = {};
posti.forEach(p => (p.g || '').split(' ').filter(Boolean).forEach(g => tagPresenti[g] = 1));
const bottoniTag = Object.keys(TAG).filter(k => tagPresenti[k])
  .map(k => '<button type="button" class="fb ' + TAG[k][1] + '" data-k="g" data-v="' + k + '">' + TAG[k][0] + '</button>').join('\n      ');

const nav = '<nav class="dest-nav"><a href="index.html">Sicilia</a>'
  + '<a href="napoli.html" class="on">Napoli &amp; Caserta</a></nav>';

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Napoli &amp; Caserta &mdash; i posti</title>
<meta name="description" content="I posti migliori dove mangiare e cosa vedere a Napoli e Caserta: cibo classico e visite classiche, scelti a mano.">
<meta name="theme-color" content="#231c17">
<link rel="stylesheet" href="assets/style.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23231c17'/%3E%3Ctext x='32' y='46' font-size='40' text-anchor='middle' fill='%23e6b23c' font-family='Georgia,serif'%3EN%3C/text%3E%3C/svg%3E">
</head>
<body>

${nav}

<div class="top top-testo" id="su">
  <div class="top-txt">
    <p class="when">dicembre 2026 &middot; weekend</p>
    <h1>Napoli &amp; Caserta</h1>
    <p class="base">I posti <b>migliori</b> da mangiare e da vedere, scelti a mano.<br>
    Venerdì Caserta, sabato e domenica Napoli.</p>
  </div>
</div>

<div class="filtri">
  <div class="wrap">
    <div class="f-cerca">
      <label class="f-lab" for="cerca">Cerca un posto</label>
      <input type="search" id="cerca" placeholder="per esempio: pizza, Cristo Velato, Vomero..." autocomplete="off">
      <button type="button" id="pulisci" class="b-pulisci">&times;</button>
      <ul id="sugg" class="sugg"></ul>
    </div>
    <div class="f-riga">
      <span class="f-lab">Che cosa</span>
      ${bottoniTipo}
    </div>
    <div class="f-riga">
      <span class="f-lab">Come</span>
      ${bottoniTag}
    </div>
    ${nAuto > 0 ? `<div class="f-riga f-aff">
      <span class="f-lab">Affidabilità</span>
      <button type="button" id="mostraAuto" class="fb fb-aff">Esplora altri ${nAuto} posti</button>
    </div>` : ''}
    <div class="f-azioni">
      <button type="button" id="reset" class="b-reset">Mostra tutto</button>
      <button type="button" id="caso" class="b-caso">Scegli tu per noi &#127922;</button>
      <span id="conta" class="conta"></span>
    </div>
    <p id="oltre-wrap" class="oltre-wrap" style="display:none">
      <a id="oltre" class="b-oltre" href="#" target="_blank" rel="noopener">Non vedi quello che cerchi? Cerca altro su Google Maps &rarr;</a>
    </p>
    <div id="pescato" class="pescato"></div>
  </div>
</div>

<div class="wrap">
  <section id="oggi" class="oggi" hidden></section>
  <p class="avviso" id="vuoto">Nessun posto con questi filtri. <a href="#" id="reset2">Mostra tutto</a></p>
${corpo}
</div>


<script>window.REGIONE="Napoli Campania";window.MIGLIORI=${JSON.stringify(migliori).replace(/</g, '\\u003c')};</script>
<script>window.SUGG=${SUGG};window.ZONE=${ZONE};</script>
<script src="assets/app.js"></script>
</body>
</html>
`;

fs.writeFileSync(OUT, html, 'utf8');
console.log('napoli.html scritto —', posti.length, 'posti |',
  'sel', migliori.length, '| sezioni/gruppi:', fid);
