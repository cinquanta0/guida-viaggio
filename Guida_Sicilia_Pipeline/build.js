const fs = require('fs');
const posti = require('./dati.js');
const cibo = require('./cibo.js');
const OUT = require('path').join(__dirname, '..', 'Guida_Sicilia_Sito', 'index.html');

const TIPI = {
  /* "mangiare" non e' un tipo che si scrive in dati.js: e' la somma dei sei
     tipi di cibo, aggiunta al volo al data-t di ogni scheda. Serve perche' i
     bottoni di uno stesso gruppo si escludono a vicenda, quindi senza questo
     non c'era modo di vedere in un colpo solo tutti i posti dove si mangia:
     bisognava premere Pizza, poi Pesce, poi Carne... uno alla volta.
     Sta per primo perche' e' la domanda piu' frequente. */
  ristorante: 'Ristoranti',
  mangiare: 'Dove si mangia',
  mare: 'Mare', pizza: 'Pizza', street: 'Street food', carne: 'Carne',
  pesce: 'Pesce', pasta: 'Pasta e trattorie', dolci: 'Dolci e granita',
  vedere: 'Da vedere', spesa: 'Spesa e souvenir'
};
/* i tipi che voglion dire "qui si mangia", pasticcerie e friggitorie comprese */
const CIBO = ['pizza', 'pesce', 'carne', 'pasta', 'dolci', 'street'];
/* i tipi che voglion dire "ci si siede e si fa un pasto": primi, secondi,
   pesce, carne. Fuori restano le pizzerie pure, le pasticcerie e le
   friggitorie, che sono posti dove si mangia ma non sono ristoranti.
   Una pizzeria-trattoria ("pizza pasta") invece resta dentro: c'e' il primo
   e ci si siede. */
const RISTORANTE = ['pasta', 'pesce', 'carne'];

/* ---- il collegamento a TheFork ----
   Serve per vedere se un locale accetta prenotazioni online e che sconto ha
   in quel momento. Lo sconto NON si scrive nelle schede: TheFork lo cambia
   ogni giorno, e un numero fisso qui dentro sarebbe falso in una settimana.

   ATTENZIONE, indirizzo da confermare: thefork.it risponde 403 a qualunque
   accesso automatico, homepage compresa, quindi non ho potuto verificare il
   formato della loro ricerca. I loro indirizzi usano codici interni che non
   si possono ricavare (acireale-c4606, basula-braceria-barocca-r717790).
   Finche' non ho il formato vero, mando a una ricerca ristretta al loro sito,
   che funziona di sicuro e porta alla pagina giusta quando esiste.
   Per passare al formato nativo basta cambiare questa funzione: e' l'unico
   punto in tutto il generatore che costruisce quel collegamento. */
function linkTheFork(nome, zona) {
  const l = String(zona || '');
  /* la zona a volte porta una precisazione dopo il trattino o la virgola:
     "Catania — Pescheria" -> "Catania" */
  const citta = l.split(/[—,]/)[0].trim();
  return 'https://duckduckgo.com/?q=' + encodeURIComponent('site:thefork.it ' + nome + ' ' + citta);
}
/* aggiunge i tipi-somma al valore di data-t, senza toccare dati.js
   e senza far comparire chip in piu' sulla scheda */
function tipiFiltro(t) {
  const l = String(t || '').split(/\s+/).filter(Boolean);
  const piu = [];
  if (l.some(x => CIBO.indexOf(x) >= 0)) piu.push('mangiare');
  if (l.some(x => RISTORANTE.indexOf(x) >= 0)) piu.push('ristorante');
  return l.concat(piu).join(' ');
}
const TAG = {
  /* "siciliani" e' piu' stretto di "locali": non lo mette il mio giudizio, ma
     una guida gastronomica che ha segnalato il locale per la cucina. Ogni
     scheda che lo porta dice nel testo da quale guida viene. */
  siciliani: ['Ci vanno i siciliani', 'g-sic'],
  top: ['Top', 'g-top'], locali: ['Da locali', 'g-loc'], eco: ['Economico', 'g-eco'],
  nascosto: ['Poco battuto', 'g-nas'], creator: ['Dai creator', 'g-cre'], vista: ['Vista mare', 'g-vis'], gratis: ['Gratis', 'g-gra'], prenotare: ['Prenotare', 'g-pre']
};
const FONDO = { sabbia: "Sabbia", ciottoli: "Ciottoli", scogli: "Scogli" };
/* livello di affidabilita' del dato: selezionato+verificato / verificato con
   fonte / automatico non verificato. Il badge lo rende visibile su ogni scheda. */
const AFF = { sel: ['I migliori', 'af-sel'], ver: ['Consigliato', 'af-ver'], auto: ['Da esplorare', 'af-auto'] };
const nAutoPosti = posti.filter(p => p.aff === 'auto').length;
const nVer = posti.length - nAutoPosti; // scelti e verificati (sel + ver)
/* "Il consiglio di oggi": l'elenco dei migliori, da cui app.js ne pesca uno
   diverso ogni giorno in base alla data. Nessun server: cambia da solo. */
const migliori = posti.filter(p => p.aff === 'sel').map(p => ({
  n: p.n, z: p.z, t: p.t, d: p.d,
  map: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.n + ', ' + p.z + ', Sicilia')
}));
const senzaAccenti = s => s.toLowerCase()
  .replace(/[àáâãä]/g, "a").replace(/[èéêë]/g, "e")
  .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
  .replace(/[ùúûü]/g, "u").replace(/ç/g, "c").replace(/ñ/g, "n");
const FASCE = [
  null,
  { t: 'A piedi da casa', s: 'Aci Catena — non serve l’auto' },
  { t: 'Fino a 20 minuti', s: 'Acireale, la costa dei Ciclopi e i primi paesi dell’Etna' },
  { t: '20 &ndash; 35 minuti', s: 'Catania, Taormina, Giardini Naxos' },
  { t: '35 minuti &ndash; 1 ora', s: 'Etna, Alcantara, i borghi del Padrino, Augusta' },
  { t: '1 ora &ndash; 1h35', s: 'Messina, Bronte, Siracusa, Avola, Noto, Caltagirone' },
  { t: '1h35 &ndash; 2h20', s: 'Vendicari, Pachino, Modica, Ragusa, Capo Passero' },
  { t: 'Oltre 2h30', s: 'Cefalù, Palermo, Trapani — solo spostando la base' }
];

const e = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/à/g, '&agrave;').replace(/è/g, '&egrave;').replace(/é/g, '&eacute;')
  .replace(/ì/g, '&igrave;').replace(/ò/g, '&ograve;').replace(/ù/g, '&ugrave;')
  .replace(/'/g, '&rsquo;').replace(/€/g, '&euro;');

/* Il tag di una foto, in due misure: il telefono scarica quella da 480.
   Dentro un carosello, solo la prima foto vale la pena di prenotarla:
   le altre partono pigre e arrivano quando qualcuno le va a cercare. */
function tagFoto(file, nome, indice, totale, inGalleria) {
  const piccola = file.replace(/\.jpg$/, '-480.jpg');
  const descrizione = indice === 0
    ? e(nome)
    : e(nome) + ' &mdash; foto ' + (indice + 1) + ' di ' + totale;
  return '<img src="assets/img/' + file + '"'
    + ' srcset="assets/img/' + piccola + ' 480w, assets/img/' + file + ' 900w"'
    + ' sizes="(max-width: 700px) 100vw, 672px"'
    + ' alt="' + descrizione + '" loading="lazy" decoding="async"'
    + (inGalleria ? ' class="gal-i"' : '') + '>';
}

function tempo(m) {
  if (m === 0) return 'a piedi';
  if (m < 60) return m + ' min';
  var h = Math.floor(m / 60), r = m % 60;
  return r ? h + 'h' + (r < 10 ? '0' : '') + r : h + 'h';
}



/* La sezione del cibo: prima era HTML scritto a mano dentro il template,
   ora esce da cibo.js come tutto il resto del sito.
   I prezzi sono fasce indicative e sono etichettate come tali: accanto a
   tempi calcolati sul percorso reale, un numero stimato senza avviso
   sembrerebbe altrettanto certo, e non lo e'. */
/* Le descrizioni dei piatti contengono entita' HTML gia' pronte. Per la
   ricerca serve il testo vero: "Sant&rsquo;Agata" deve diventare
   "Sant'Agata", altrimenti cercando "agata" non lo trova. */
function decodifica(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&rsquo;/g, '’')
    .replace(/&laquo;|&raquo;/g, '"')
    .replace(/&agrave;/g, 'à').replace(/&egrave;/g, 'è').replace(/&eacute;/g, 'é')
    .replace(/&igrave;/g, 'ì').replace(/&ograve;/g, 'ò').replace(/&ugrave;/g, 'ù')
    .replace(/&uuml;/g, 'ü').replace(/&Egrave;/g, 'È')
    .replace(/&ndash;|&mdash;/g, ' ').replace(/&euro;/g, 'euro')
    .replace(/&amp;/g, '&').replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/* Per gli attributi serve un escape leggero: `e()` trasformerebbe
   l'apostrofo in &rsquo; e le vocali accentate in entita', e il valore
   letto dal DOM non combacerebbe piu' con quello nei suggerimenti. */
const attr = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* i nomi dei piatti finiscono anche nei suggerimenti della ricerca */
const NOMI_PIATTI = cibo.map(v => decodifica(v.n));

const sezioneCibo = cibo.map((v, k) => {
  const nome = NOMI_PIATTI[k];
  const cercabile = senzaAccenti(decodifica(v.n + ' ' + (v.zona || '') + ' ' + v.d))
    .replace(/[^a-z0-9 ]/g, ' ').replace(/[ ]+/g, ' ');
  let s = '      <div class="p" data-cibo="1" data-t="' + (v.t || '')
    + '" data-n="' + attr(nome) + '" data-s="' + attr(cercabile) + '">';
  if (v.img) {
    const piccola = v.img.replace(/\.jpg$/, '-480.jpg');
    s += '<img src="assets/img/' + v.img + '"'
      + ' srcset="assets/img/' + piccola + ' 480w, assets/img/' + v.img + ' 900w"'
      + ' sizes="(max-width: 700px) 100vw, 672px"'
      + ' alt="' + (v.alt || v.n) + '" loading="lazy" decoding="async">';
  }
  s += '<div class="p-in"><h3>' + v.n + '</h3>';
  if (v.zona) s += '<p class="p-zona">' + v.zona + '</p>';
  /* lo stesso chip colorato delle schede dei posti: senza, i piatti
     sembravano schede a meta' e non rispondevano al filtro CHE COSA */
  if (v.t) {
    s += '<p class="p-tag">';
    v.t.split(' ').filter(Boolean).forEach(t => {
      if (TIPI[t]) s += '<span class="ti ti-' + t + '">' + TIPI[t] + '</span>';
    });
    s += '</p>';
  }
  s += '<p class="p-d">' + v.d + '</p>';
  if (v.p) s += '<p class="p-prezzo"><span>' + v.p + '</span> indicativo</p>';
  s += '</div></div>';
  return s;
}).join('\n');

/* elenco per i suggerimenti della ricerca: prima le zone, poi i singoli posti */
const perZona = {};
posti.forEach(p => { (perZona[p.z] = perZona[p.z] || []).push(p.min); });
/* per una zona mostro il tempo mediano, non il minimo: e' piu' rappresentativo
   della zona nel suo insieme che non il posto piu' vicino in assoluto */
const mediana = v => { const o = v.slice().sort((x, y) => x - y); return o[Math.floor(o.length / 2)]; };
const suggerimenti = [];
Object.keys(perZona).sort().forEach(z =>
  suggerimenti.push([z, 'zona', perZona[z].length, tempo(mediana(perZona[z]))]));
posti.slice().sort((a, b) => a.n.localeCompare(b.n)).forEach(p => suggerimenti.push([p.n, p.z, 0, tempo(p.min)]));
/* I piatti vanno in fondo: il campo suggerisce «Pachino, arancini, granita»,
   quindi cercando un piatto deve uscire anche la sua scheda. In coda perche'
   se una parola e' insieme un posto e un piatto vincono i posti, che sono
   quelli su cui si decide dove andare. */
NOMI_PIATTI.forEach((nome, k) =>
  suggerimenti.push([nome, cibo[k].zona ? 'piatto &middot; ' + decodifica(cibo[k].zona) : 'piatto', 0, '']));
const SUGG = JSON.stringify(suggerimenti);
const ZONE = JSON.stringify(Object.keys(perZona).map(z => z.toLowerCase()
  .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
  .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/[ ]+/g, ' ').trim()));

let corpo = '';
let totale = 0;

for (let b = 1; b <= 7; b++) {
  const lista = posti.filter(p => p.b === b).sort((x, y) => x.min - y.min);
  if (!lista.length) continue;
  const f = FASCE[b];

  corpo += '\n<details class="fascia"' + (b === 1 ? ' open' : '') + ' data-f="' + b + '">\n';
  corpo += '  <summary><span class="f-t">' + f.t + '</span>'
    + '<span class="f-s">' + f.s + '</span>'
    + '<span class="f-c"><b>' + lista.length + '</b> posti</span></summary>\n';
  corpo += '  <div class="f-in">\n';

  for (const p of lista) {
    totale++;
    const tipi = p.t.split(' ');
    const tags = (p.g || '').split(' ').filter(Boolean);
    /* "identita" = nome, zona e indirizzo. "cerca" aggiunge anche la descrizione.
       Servono separati: cercando una citta si devono pescare solo i posti che ci
       stanno davvero, non chi la nomina di sfuggita nella descrizione. */
    const ripulisci = s => senzaAccenti(s).replace(/[^a-z0-9 ]/g, ' ').replace(/[ ]+/g, ' ');
    const identita = ripulisci(p.n + ' ' + p.z + ' ' + (p.a || ''));
    const cerca = ripulisci(p.n + ' ' + p.z + ' ' + (p.a || '') + ' ' + p.t + ' '
      + (p.fo || '') + ' ' + p.d);
    const mappa = 'https://www.google.com/maps/search/?api=1&query='
      + encodeURIComponent(p.n + ', ' + p.z + ', Sicilia');
    /* se conosco l'indirizzo esatto della pagina su TheFork lo uso, altrimenti
       mando alla ricerca. Il campo `fork` ce l'hanno i pochi locali per cui
       quell'indirizzo l'ho visto davvero. */
    const prenota = tipiFiltro(p.t).indexOf('mangiare') >= 0
      ? (p.fork || linkTheFork(p.n, p.z)) : '';

    corpo += '    <div class="p" data-t="' + tipiFiltro(p.t) + '" data-g="' + (p.g || '') + '"'
      + ' data-fo="' + (p.fo || '') + '" data-aff="' + (p.aff || '') + '" data-n="' + e(p.n) + '"'
      + ' data-i="' + e(identita) + '" data-s="' + e(cerca) + '">\n';
    /* Una foto sola resta un <img> semplice: nessun impianto attorno a
       niente. Da due in su diventa un carosello con le freccette. */
    const foto = p.img ? [p.img].concat(p.piu || []) : [];
    if (foto.length === 1) {
      corpo += '      ' + tagFoto(foto[0], p.n, 0, 1, false) + '\n';
    } else if (foto.length > 1) {
      corpo += '      <div class="gal" data-tot="' + foto.length + '">\n';
      corpo += '        <div class="gal-str">\n';
      for (let i = 0; i < foto.length; i++) {
        corpo += '          ' + tagFoto(foto[i], p.n, i, foto.length, true) + '\n';
      }
      corpo += '        </div>\n';
      corpo += '        <button type="button" class="gal-f gal-prec" aria-label="Foto precedente" tabindex="-1">&#8249;</button>\n';
      corpo += '        <button type="button" class="gal-f gal-succ" aria-label="Foto successiva">&#8250;</button>\n';
      corpo += '        <p class="gal-pt" aria-hidden="true">';
      for (let i = 0; i < foto.length; i++) corpo += '<i' + (i === 0 ? ' class="on"' : '') + '></i>';
      corpo += '</p>\n';
      corpo += '      </div>\n';
    }
    corpo += '      <div class="p-in">\n';
    corpo += '        <p class="p-km"><span class="km-n">' + tempo(p.min) + '</span> '
      + e(p.piedi || p.z) + (p.km != null ? ' <span class="km-d">' + p.km + ' km</span>' : '') + '</p>\n';
    corpo += '        <h3>' + e(p.n) + '</h3>\n';
    if (p.a) corpo += '        <p class="p-a">' + e(p.a) + '</p>\n';
    corpo += '        <p class="p-tag">';
    if (p.aff && AFF[p.aff]) corpo += '<span class="af ' + AFF[p.aff][1] + '">' + AFF[p.aff][0] + '</span>';
    for (const t of tipi) if (TIPI[t]) corpo += '<span class="ti ti-' + t + '">' + TIPI[t] + '</span>';
    if (p.fo && FONDO[p.fo]) corpo += '<span class="tg fo-' + p.fo + '">' + FONDO[p.fo] + '</span>';
    for (const g of tags) if (TAG[g]) corpo += '<span class="tg ' + TAG[g][1] + '">' + TAG[g][0] + '</span>';
    corpo += '</p>\n';
    corpo += '        <p class="p-d">' + e(p.d) + '</p>\n';
    corpo += '        <p class="p-map"><a href="' + mappa + '" target="_blank" rel="noopener">'
      + 'Apri in mappa &rarr;</a>';
    /* il collegamento a TheFork solo dove si mangia: su una spiaggia o su un
       belvedere non vorrebbe dire niente */
    if (prenota) corpo += '<a class="p-fork" href="' + prenota + '" target="_blank" rel="noopener">'
      + (p.fork ? 'Vedi su TheFork' : 'Cerca su TheFork') + ' &rarr;</a>';
    corpo += '</p>\n';
    corpo += '      </div>\n    </div>\n';
  }
  corpo += '  </div>\n</details>\n';
}

const bottoniTipo = Object.keys(TIPI)
  .map(k => '<button type="button" class="fb ti-' + k + '" data-k="t" data-v="' + k + '">' + TIPI[k] + '</button>')
  .join('\n      ');
const bottoniTag = Object.keys(TAG)
  .map(k => '<button type="button" class="fb ' + TAG[k][1] + '" data-k="g" data-v="' + k + '">' + TAG[k][0] + '</button>')
  .join('\n      ');
const bottoniFondo = Object.keys(FONDO)
  .map(k => '<button type="button" class="fb fo-' + k + '" data-k="fo" data-v="' + k + '">' + FONDO[k] + '</button>')
  .join('\n      ');

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sicilia &mdash; i posti</title>
<meta name="description" content="I posti dove mangiare bene in Sicilia, ordinati per distanza reale in auto da Aci Catena. Niente itinerario.">
<meta name="theme-color" content="#f7f2e8">
<link rel="stylesheet" href="assets/style.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%232b2320'/%3E%3Ctext x='32' y='46' font-size='40' text-anchor='middle' fill='%23f0c94b' font-family='Georgia,serif'%3ES%3C/text%3E%3C/svg%3E">
<meta property="og:type" content="website">
<meta property="og:title" content="Sicilia — i posti">
<meta property="og:description" content="${nVer} posti scelti e verificati dove mangiare, fare il bagno e girare (più altri ${nAutoPosti} da esplorare), ordinati per distanza reale in auto da Aci Catena. 25–29 agosto 2026.">
<meta property="og:image" content="https://guida-sicilia-2026.web.app/assets/anteprima.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://guida-sicilia-2026.web.app/">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
</head>
<body>

<nav class="dest-nav"><a href="index.html" class="on">Sicilia</a><a href="napoli.html">Napoli &amp; Caserta</a></nav>

<div class="top" id="su">
  <img src="assets/img/hero.jpg" srcset="assets/img/hero-480.jpg 480w, assets/img/hero.jpg 900w" sizes="(max-width: 700px) 100vw, 700px" alt="La costa di Taormina" fetchpriority="high">
  <div class="top-txt">
    <p class="when">25 &ndash; 29 agosto 2026 &middot; in auto</p>
    <h1>Sicilia</h1>
    <p class="base">${nVer} posti scelti e verificati, ordinati per distanza da <b>Aci Catena</b>.<br>
    Più altri ${nAutoPosti} da esplorare. Nessun itinerario: scegliete voi.</p>
  </div>
</div>

<div class="filtri">
  <div class="wrap">
    <div class="f-cerca">
      <label class="f-lab" for="cerca">Cerca un posto</label>
      <input type="search" id="cerca" placeholder="per esempio: carne ad Acireale, pesce a Noto, granita..." autocomplete="off">
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
    <div class="f-riga">
      <span class="f-lab">Il fondo, per le spiagge</span>
      ${bottoniFondo}
    </div>
    <div class="f-riga f-aff">
      <span class="f-lab">Affidabilit&agrave;</span>
      <button type="button" id="mostraAuto" class="fb fb-aff">Esplora altri ${nAutoPosti} posti</button>
    </div>
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

<div class="wrap">
<div class="sec">
  <h2 class="sec-h">Il resto</h2>

  <details class="fascia" data-cibo="1">
    <summary><span class="f-t">Cosa vi mettono nel piatto</span><span class="f-s">I nomi sul menu, spiegati</span><span class="f-c"><b>${cibo.length}</b> voci</span></summary>
    <div class="f-in">
      <p class="avviso-prezzi">I prezzi sono <b>fasce indicative</b>, per farvi un&rsquo;idea di quanto tirare fuori: non sono prezzi verificati come lo sono i tempi in auto. Tra una friggitoria di quartiere e un lido di Taormina cambia tutto.</p>
${sezioneCibo}
    </div>
  </details>

  <details class="fascia">
    <summary><span class="f-t">Sagre nei vostri giorni</span><span class="f-s">25 &ndash; 29 agosto</span><span class="f-c"><b>7</b> eventi</span></summary>
    <div class="f-in">
      <div class="p"><div class="p-in"><p class="p-km"><span class="km-n">35 min</span> Letojanni, vicino Taormina <span class="km-d">41 km</span></p><h3>Sagra del Pesce &middot; 29&ndash;31 ago</h3><p class="p-tag"><span class="tg g-top">L&rsquo;unica a portata</span></p><p class="p-d">Pesce fresco locale cucinato in piazza. Se siete gi&agrave; in zona Taormina &egrave; a cinque minuti.</p></div></div>
      <div class="p"><div class="p-in"><p class="p-km"><span class="km-n">3h37</span> Balestrate (PA) <span class="km-d">279 km</span></p><h3>Le Vie del Mango &middot; 27&ndash;31 ago</h3><p class="p-d">Sagra dedicata al mango, coltivato in zona grazie al microclima.</p></div></div>
      <div class="p"><div class="p-in"><p class="p-km"><span class="km-n">4h10</span> Salemi (TP) <span class="km-d">320.6 km</span></p><h3>Sagra della Busiata &middot; 28&ndash;30 ago</h3><p class="p-d">La pasta trapanese tirata a mano, con pesto alla trapanese e sughi locali.</p></div></div>
      <div class="p"><div class="p-in"><p class="p-km"><span class="km-n">4h11</span> Buseto Palizzolo (TP) <span class="km-d">317.4 km</span></p><h3>Sagra della Busiata &middot; 28&ndash;30 ago</h3><p class="p-d">Stessa zona e stesso weekend, in versione pi&ugrave; contadina.</p></div></div>
      <div class="p"><div class="p-in"><p class="p-km"><span class="km-n">4h21</span> Selinunte (TP) <span class="km-d">266.9 km</span></p><h3>Sagra della Sarda &middot; 29 ago</h3><p class="p-d">Sardine fresche in tutte le varianti tipiche della costa occidentale.</p></div></div>
      <div class="p"><div class="p-in"><p class="p-km"><span class="km-n">1h57</span> Pozzallo (RG) <span class="km-d">131.9 km</span></p><h3>Sagra del Pesce &middot; 29&ndash;31 ago</h3><p class="p-d">Sulla costa sud: ha senso solo se scendete verso Ragusa e Modica.</p></div></div>
      <div class="p"><div class="p-in"><p class="p-km"><span class="km-n">finita</span> Sciacca (AG) <span class="km-d">232.4 km</span></p><h3>Azzurro Food Festival &middot; 20&ndash;23 ago</h3><p class="p-d">Chiude il 23, appena prima del vostro arrivo. Il 25 potreste trovare ancora code di eventi collaterali.</p></div></div>
    </div>
  </details>

  <details class="fascia">
    <summary><span class="f-t">In auto, ad agosto</span><span class="f-s">Le cose che fanno la differenza</span><span class="f-c"><b>9</b> note</span></summary>
    <div class="f-in">
      <div class="p"><div class="p-in"><h3>ZTL e telecamere</h3><p class="p-d">Catania, Taormina e Ortigia hanno zone a traffico limitato attive e sorvegliate. Lasciate l&rsquo;auto nei parcheggi esterni: <b>Talete</b> a Ortigia, <b>Lumbi</b> con navetta a Taormina. Le multe arrivano a casa mesi dopo.</p></div></div>
      <div class="p"><div class="p-in"><h3>Autostrade</h3><p class="p-d">La <b>A18 Catania&ndash;Messina</b> &egrave; a pedaggio (poco, ma tenete monete o carta a portata). La <b>A19 verso Palermo</b> &egrave; gratuita ma ha cantieri cronici: mettete in conto tempo in pi&ugrave; rispetto a quanto dice il navigatore.</p></div></div>
      <div class="p"><div class="p-in"><h3>Se arrivate col traghetto</h3><p class="p-d">Da Villa San Giovanni si sbarca a <b>Messina</b>, che &egrave; a 40 minuti dalla base. Le corse sono frequenti tutto il giorno; d&rsquo;agosto in certe fasce c&rsquo;&egrave; coda all&rsquo;imbarco, meglio non incastrarla a ridosso di un orario.</p></div></div>
      <div class="p"><div class="p-in"><h3>Benzina</h3><p class="p-d">Fate rifornimento in citt&agrave;: i distributori in autostrada costano sensibilmente di pi&ugrave;. In alcuni paesi dell&rsquo;interno la domenica trovate solo self-service.</p></div></div>
      <div class="p"><div class="p-in"><h3>Parcheggiare d&rsquo;estate</h3><p class="p-d">Nelle zone di mare le strisce blu si riempiono presto e i posti liberi spariscono verso le 10. Ad Aci Trezza e Isola Bella conviene arrivare presto anche solo per l&rsquo;auto.</p></div></div>
      <div class="p"><div class="p-in"><h3>Il caldo detta gli orari</h3><p class="p-d">Tra le 13 e le 17 si superano i 35&deg; e le citt&agrave; si svuotano per un motivo. Mare o riposo in quella fascia, visite presto la mattina e nel tardo pomeriggio.</p></div></div>
      <div class="p"><div class="p-in"><h3>Contanti nei mercati</h3><p class="p-d">Pescheria, Ballar&ograve; e i banchi di street food spesso non accettano carte, o dicono che il POS non funziona. Tenete 20&ndash;30&euro; in contanti a testa.</p></div></div>
      <div class="p"><div class="p-in"><h3>Scarpette da scoglio</h3><p class="p-d">Da Acireale ad Aci Trezza &egrave; tutta roccia lavica: tagliente, rovente al sole e scivolosa sott&rsquo;acqua. Dieci euro che cambiano le giornate di mare.</p></div></div>
      <div class="p"><div class="p-in"><h3>Meduse e scirocco</h3><p class="p-d">Con lo scirocco le meduse si avvicinano alla costa ionica. Chiedete al lido prima di entrare: i bagnini lo sanno sempre e lo dicono volentieri.</p></div></div>
    </div>
  </details>

  <details class="fascia">
    <summary><span class="f-t">Palermo o Catania</span><span class="f-s">Il confronto che era nel PDF, quando la base non era decisa</span><span class="f-c"><b>6</b> criteri</span></summary>
    <div class="f-in">
      <div class="p"><div class="p-in"><h3>Mare</h3><p class="p-d"><b>Palermo:</b> ottimo ma richiede spostamenti, San Vito Lo Capo &egrave; il top assoluto ma &egrave; a pi&ugrave; di un&rsquo;ora. <b>Catania:</b> pi&ugrave; comodo, Aci Trezza e la Playa a 15&ndash;25 minuti, meno &ldquo;wow&rdquo; del meglio di Palermo.</p></div></div>
      <div class="p"><div class="p-in"><h3>Cibo salato</h3><p class="p-d"><b>Palermo:</b> regina dello street food, arancine, sfincione, pane ca meusa. <b>Catania:</b> arancini eccellenti, napoletana di altissimo livello e arrusti e mangia.</p></div></div>
      <div class="p"><div class="p-in"><h3>Dolci</h3><p class="p-d"><b>Palermo:</b> ottimi, moltissima scelta. <b>Catania:</b> pari livello, forse pi&ugrave; verace.</p></div></div>
      <div class="p"><div class="p-in"><h3>Shopping</h3><p class="p-d"><b>Palermo:</b> Via della Libert&agrave;, offerta pi&ugrave; ampia. <b>Catania:</b> Via Etnea storica, offerta simile.</p></div></div>
      <div class="p"><div class="p-in"><h3>Escursioni</h3><p class="p-d"><b>Palermo:</b> Cefal&ugrave;, Egadi, San Vito Lo Capo. <b>Catania:</b> Taormina, Etna, Aci Trezza, Siracusa, molto pi&ugrave; concentrate.</p></div></div>
      <div class="p"><div class="p-in"><h3>Budget 200&euro;+</h3><p class="p-d">Ampiamente sufficiente in entrambe: si mangia benissimo con soldi d&rsquo;avanzo.</p></div></div>
    </div>
  </details>

  <details class="fascia">
    <summary><span class="f-t">Chi seguire</span><span class="f-s">Creator siciliani, per farsi un&rsquo;idea prima</span><span class="f-c"><b>6</b> profili</span></summary>
    <div class="f-in">
      <div class="p"><div class="p-in"><h3>Rockin Kitchen Sicily</h3><p class="p-a">TikTok @rockinkitchentv &middot; YouTube @rockinkitchensicily</p><p class="p-d">Fernando Massana, guida certificata di street food tour: ha video dedicati proprio alla Pescheria di Catania.</p></div></div>
      <div class="p"><div class="p-in"><h3>Giulia Vitaliti</h3><p class="p-a">Catania &middot; 1,5M+ follower</p><p class="p-d">Racconta la Sicilia con video POV e recitazione.</p></div></div>
      <div class="p"><div class="p-in"><h3>Marco Mazzaglia</h3><p class="p-a">Catania &middot; ~300k follower</p><p class="p-d">Comicit&agrave; dialettale catanese.</p></div></div>
      <div class="p"><div class="p-in"><h3>Giuseppe Ricotta da Palermo</h3><p class="p-a">TikTok @giuseppericottadapalermo</p><p class="p-d">Street food e vita di citt&agrave; palermitana in chiave comica.</p></div></div>
      <div class="p"><div class="p-in"><h3>Alice Trupia</h3><p class="p-a">TikTok / Instagram @alicetrupia</p><p class="p-d">Food blogger siciliana, contenuti su piatti e locali dell&rsquo;isola.</p></div></div>
      <div class="p"><div class="p-in"><h3>Andrea &ldquo;KEVIN&rdquo;</h3><p class="p-a">TikTok e YouTube, base a Palermo</p><p class="p-d">Contenuti comici su vita quotidiana, famiglia e cibo palermitano.</p></div></div>
    </div>
  </details>

  <p class="su"><a href="#su">&#9650; Torna su</a></p>
</div>
</div>

<div class="fondo">
  <div class="wrap">
    <h2>Buon viaggio</h2>
    <p>Sicilia, 25&ndash;29 agosto 2026 &middot; base Aci Catena &middot; ${totale} posti.<br>
    Tempi e chilometri calcolati sul percorso stradale reale da Aci Catena (OpenStreetMap / OSRM). Sono tempi a traffico scorrevole: ad agosto, dentro Catania e verso Taormina, mettete in conto qualcosa in pi&ugrave;.</p>
    <p style="margin:14px 0 0"><a href="come-e-fatto.html">Come &egrave; fatto questo sito &rarr;</a></p>
    <details>
      <summary>Crediti fotografici</summary>
      <p class="crediti">Foto da Wikimedia Commons, licenza libera (Creative Commons, CC0 o pubblico dominio), salvate in locale in <code>assets/img/</code>.</p>
      <ul class="crediti">
<!--CREDITI-->
      </ul>
    </details>
  </div>
</div>

<script>window.SUGG=${SUGG};window.ZONE=${ZONE};</script>
<script>window.MIGLIORI=${JSON.stringify(migliori).replace(/</g, '\\u003c')};</script>
<script src="assets/app.js"></script>
</body>
</html>
`;

fs.writeFileSync(OUT, html, 'utf8');
console.log('index.html scritto — ' + totale + ' posti');
