/* Ricerca, filtri e "scegli tu per noi".
   ES5, nessuna libreria: gira anche su browser vecchi.
   Se il JS non parte la pagina resta leggibile: si vedono tutti i posti
   e le fasce si aprono a mano, come normali sezioni a fisarmonica. */
(function () {
  'use strict';
  if (!document.querySelectorAll) return;

  var posti = document.querySelectorAll('.fascia[data-f] .p');
  var fasce = document.querySelectorAll('.fascia[data-f]');
  /* Le schede dei piatti stanno in una fascia a parte e vanno trattate a
     parte: rispondono al testo cercato, non ai filtri per tipo o per fondo.
     Filtrare i piatti con «Mare» o «Sabbia» non vorrebbe dire niente. */
  var piatti = document.querySelectorAll('.fascia[data-cibo] .p');
  var fasciaCibo = document.querySelector('.fascia[data-cibo]');
  var bottoni = document.querySelectorAll('.fb');
  var campo = document.getElementById('cerca');
  var pulisci = document.getElementById('pulisci');
  var conta = document.getElementById('conta');
  var vuoto = document.getElementById('vuoto');
  var pescato = document.getElementById('pescato');
  var oltreWrap = document.getElementById('oltre-wrap');
  var oltre = document.getElementById('oltre');

  var scelto = { t: '', g: '', fo: '' };
  /* i posti "auto" (dato automatico non verificato) sono nascosti all'apertura:
     si vedono solo premendo il bottone Affidabilita'. Default = solo verificati. */
  var mostraAuto = false;
  var testo = '';
  var evidenziato = null;

  function contiene(attr, val) {
    return (' ' + attr + ' ').indexOf(' ' + val + ' ') >= 0;
  }

  /* toglie accenti e punteggiatura, cosi' "cefalu" trova "Cefalù" */
  function semplifica(s) {
    s = s.toLowerCase();
    var da = 'àáâãäèéêëìíîïòóôõöùúûüçñ', a = 'aaaaaeeeeiiiiooooouuuucn';
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var p = da.indexOf(s.charAt(i));
      out += p >= 0 ? a.charAt(p) : s.charAt(i);
    }
    return out.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ');
  }

  function spegniEvidenza() {
    if (evidenziato) { evidenziato.className = 'p'; evidenziato = null; }
  }

  /* ---- capire le frasi ----
     "dove si mangia carne ad Acireale" deve portare alla carne di Acireale.
     Prima non funzionava: la ricerca spezzava la frase e pretendeva che ogni
     parola comparisse nel testo della scheda, ma il TIPO di un posto non sta
     nel testo, sta in data-t. Cosi' "carne acireale" non trovava niente.

     Qui riconosco le parole che sono categorie, le uso come filtro e lascio
     il resto come ricerca sul nome e sulla zona.

     Nel vocabolario ci sono solo parole generiche, MAI nomi di piatti: se
     "arancino" accendesse il filtro street food, cercare "arancino" non
     troverebbe piu' la scheda dell'arancino, che e' quello che uno vuole. */
  var PAROLA_TIPO = {
    carne: 'carne', carni: 'carne', braceria: 'carne', bracerie: 'carne',
    brace: 'carne', grigliata: 'carne', grigliate: 'carne', arrosto: 'carne',
    arrosti: 'carne', macelleria: 'carne', macellerie: 'carne',
    bistecca: 'carne', bistecche: 'carne',
    pesce: 'pesce', pesci: 'pesce', crudi: 'pesce', crudo: 'pesce',
    pizza: 'pizza', pizze: 'pizza', pizzeria: 'pizza', pizzerie: 'pizza',
    dolci: 'dolci', dolce: 'dolci', granita: 'dolci', granite: 'dolci',
    gelato: 'dolci', gelati: 'dolci', gelateria: 'dolci', gelaterie: 'dolci',
    pasticceria: 'dolci', pasticcerie: 'dolci',
    trattoria: 'pasta', trattorie: 'pasta', osteria: 'pasta', osterie: 'pasta',
    friggitoria: 'street', friggitorie: 'street', rosticceria: 'street',
    rosticcerie: 'street',
    ristorante: 'ristorante', ristoranti: 'ristorante', cena: 'ristorante',
    cenare: 'ristorante', pranzo: 'ristorante', pranzare: 'ristorante',
    mangiare: 'ristorante', mangia: 'ristorante', mangio: 'ristorante',
    spiaggia: 'mare', spiagge: 'mare', bagno: 'mare',
    visitare: 'vedere', monumenti: 'vedere', monumento: 'vedere',
    souvenir: 'spesa', comprare: 'spesa', negozio: 'spesa', negozi: 'spesa',
    regalo: 'spesa', regali: 'spesa'
  };
  /* Il sito non prova mai a essere completo come Google: si ferma quando una
     zona non sembra piu' scoperta, non quando ha davvero tutto. Questo bottone
     manda a Google Maps con una ricerca gia' pronta, cosi' chi vuole di piu'
     lo trova da solo invece di pensare che manchi qualcosa per errore. Le
     frasi ricalcano quelle usate a mano durante il giro Chrome del 23 ago. */
  var TIPO_RICERCA = {
    carne: 'braceria ristorante di carne', pesce: 'ristorante di pesce',
    pasta: 'trattoria ristorante', pizza: 'pizzeria',
    dolci: 'pasticceria gelateria granita', street: 'rosticceria street food',
    ristorante: 'ristorante', mangiare: 'dove mangiare',
    mare: 'spiagge', vedere: 'monumenti da vedere', spesa: 'negozi tipici souvenir'
  };

  /* parole di servizio: da sole non cercano niente */
  var VUOTE = (' dove si a ad al in nel il lo la i gli le di del da per con e o '
    + 'un uno una che cosa mi ci sono posso voglio vorrei buon buona buoni '
    + 'migliore migliori meglio qualcosa posto posti zona vicino qui ').split(' ');

  function eVuota(p) {
    for (var i = 0; i < VUOTE.length; i++) if (VUOTE[i] === p) return true;
    return false;
  }

  /* Accende il bottone della categoria capita dalla frase, cosi' si vede cosa
     ha capito e lo si puo' smentire premendone un altro. La classe `auto` lo
     distingue da un bottone premuto a mano: quelli non li tocco mai. */
  var autoAcceso = null;
  /* toglie una classe senza regex: la prima versione usava una sostituzione
     che su certe combinazioni mangiava pezzi di altre classi e lasciava i
     bottoni in uno stato sporco */
  function togliClasse(el, c) {
    var p = el.className.split(/\s+/), out = [];
    for (var i = 0; i < p.length; i++) if (p[i] && p[i] !== c) out.push(p[i]);
    el.className = out.join(' ');
  }
  function accendiAuto(tipo) {
    if (autoAcceso && autoAcceso.getAttribute('data-v') !== tipo) {
      togliClasse(autoAcceso, 'on'); togliClasse(autoAcceso, 'auto');
      autoAcceso = null;
    }
    if (!tipo) return;
    for (var i = 0; i < bottoni.length; i++) {
      var b = bottoni[i];
      if (b.getAttribute('data-k') !== 't' || b.getAttribute('data-v') !== tipo) continue;
      if (b.className.split(/\s+/).indexOf('on') < 0) {
        b.className += ' on auto'; autoAcceso = b;
      }
      return;
    }
  }

  /* Ritorna null se nella frase non c'e' nessuna categoria: in quel caso la
     ricerca resta esattamente quella di prima, e non posso rompere niente. */
  function interpreta(q) {
    var p = semplifica(q).split(' ').filter(Boolean);
    var generico = '', specifico = '', resto = [], i;
    for (i = 0; i < p.length; i++) {
      var t = PAROLA_TIPO[p[i]];
      if (!t) { if (!eVuota(p[i])) resto.push(p[i]); continue; }
      /* "dove si mangia carne" contiene due categorie: `mangiare` che vale
         "un ristorante qualsiasi", e `carne` che dice quale. Vince sempre la
         piu' precisa, altrimenti la frase piu' naturale da' il risultato piu'
         generico - che era esattamente il bug del primo giro. */
      if (t === 'ristorante' || t === 'mangiare') { if (!generico) generico = t; }
      else if (!specifico) specifico = t;
    }
    var tipo = specifico || generico;
    if (!tipo) return null;
    return { tipo: tipo, parole: resto };
  }

  function aggiorna() {
    /* se la frase contiene una categoria, la uso come filtro e cerco solo il
       resto (di solito il nome di un paese). Un bottone premuto a mano vince
       sempre su quello dedotto dalla frase. */
    var letta = testo ? interpreta(testo) : null;
    var tipoAuto = letta && !scelto.t ? letta.tipo : '';
    var parole = letta ? letta.parole : (testo ? semplifica(testo).split(' ').filter(Boolean) : []);
    accendiAuto(tipoAuto);
    /* Se stai cercando il nome di una localita', mostro solo i posti che ci
       stanno davvero: senza questo, cercando "Siracusa" usciva l'Anfiteatro di
       Catania, perche' la sua descrizione dice "il secondo dopo Siracusa". */
    var soloIdentita = false;
    if (parole.length) {
      /* le parole rimaste dopo aver tolto la categoria: cosi' "carne acireale"
         riconosce Acireale come zona, che con la frase intera non succedeva */
      var q = parole.join(' ');
      var zone = window.ZONE || [];
      for (var zz = 0; zz < zone.length; zz++) {
        if (zone[zz].indexOf(q) >= 0) { soloIdentita = true; break; }
      }
    }
    var visibili = 0, i, j;
    var tipoUsato = scelto.t || tipoAuto;

    for (i = 0; i < posti.length; i++) {
      var p = posti[i];
      var ok = true;
      if (tipoUsato && !contiene(p.getAttribute('data-t') || '', tipoUsato)) ok = false;
      if (ok && scelto.g && !contiene(p.getAttribute('data-g') || '', scelto.g)) ok = false;
      if (ok && scelto.fo && !contiene(p.getAttribute('data-fo') || '', scelto.fo)) ok = false;
      if (ok && !mostraAuto && p.getAttribute('data-aff') === 'auto') ok = false;
      if (ok && parole.length) {
        var testoScheda = semplifica(
          (soloIdentita ? p.getAttribute('data-i') : p.getAttribute('data-s'))
          || p.getAttribute('data-n') || '');
        for (j = 0; j < parole.length; j++) {
          if (testoScheda.indexOf(parole[j]) < 0) { ok = false; break; }
        }
      }
      p.className = ok ? 'p' : 'p no';
      if (ok) visibili++;
    }

    /* I piatti rispondono al testo cercato e al tipo (un cannolo e' un
       dolce, un arancino e' street food), ma non alla caratteristica ne'
       al fondo della spiaggia: sono proprieta' che solo i posti hanno. */
    var piattiVisibili = 0;
    for (i = 0; i < piatti.length; i++) {
      var pi = piatti[i];
      var okp = true;
      if (scelto.t && !contiene(pi.getAttribute('data-t') || '', scelto.t)) okp = false;
      if (okp && parole.length) {
        var testoPiatto = semplifica(pi.getAttribute('data-s') || '');
        for (j = 0; j < parole.length; j++) {
          if (testoPiatto.indexOf(parole[j]) < 0) { okp = false; break; }
        }
      }
      pi.className = okp ? 'p' : 'p no';
      if (okp) piattiVisibili++;
    }
    if (fasciaCibo) {
      var cc = fasciaCibo.getElementsByTagName('b');
      if (cc.length) cc[0].innerHTML = piattiVisibili;
      fasciaCibo.className = piattiVisibili ? 'fascia' : 'fascia vuota';
      /* se una ricerca pesca un piatto, la fascia si apre da sola:
         altrimenti il risultato resta chiuso dentro la fisarmonica */
      if ((parole.length || scelto.t) && piattiVisibili) fasciaCibo.setAttribute('open', 'open');
    }

    var attivo = scelto.t || scelto.g || scelto.fo || parole.length;

    for (i = 0; i < fasce.length; i++) {
      var f = fasce[i];
      var figli = f.getElementsByTagName('div');
      var n = 0;
      for (j = 0; j < figli.length; j++) if (figli[j].className === 'p') n++;
      f.className = n ? 'fascia' : 'fascia vuota';
      var c = f.getElementsByTagName('b');
      if (c.length) c[0].innerHTML = n;
      if (attivo && n) f.setAttribute('open', 'open');
    }

    if (conta) {
      conta.innerHTML = attivo
        ? visibili + (visibili === 1 ? ' posto trovato' : ' posti trovati')
        : visibili + ' posti in tutto';
    }
    if (vuoto) vuoto.className = visibili ? 'avviso' : 'avviso on';
    if (pescato) pescato.className = 'pescato';
    if (pulisci) pulisci.style.display = testo ? 'block' : 'none';

    if (oltre) {
      var fraseRicerca = TIPO_RICERCA[tipoUsato] || '';
      if (parole.length) fraseRicerca = (fraseRicerca ? fraseRicerca + ' ' : '') + parole.join(' ');
      if (fraseRicerca) {
        oltre.href = 'https://www.google.com/maps/search/' + encodeURIComponent(fraseRicerca + ' ' + (window.REGIONE || 'Sicilia'));
        if (oltreWrap) oltreWrap.style.display = 'block';
      } else if (oltreWrap) {
        oltreWrap.style.display = 'none';
      }
    }

    spegniEvidenza();
  }



  /* Dopo una ricerca la pagina restava ferma in cima e sembrava non fosse
     successo niente. Ora scorre al primo risultato; se si e' scelto un posto
     preciso lo evidenzia, come fa il bottone "scegli tu per noi". */
  function primoVisibile() {
    for (var i = 0; i < posti.length; i++) if (posti[i].className === 'p') return posti[i];
    return null;
  }

  function vaiAiRisultati(nomePreciso) {
    var meta = null;
    if (nomePreciso) {
      for (var i = 0; i < posti.length; i++) {
        if (posti[i].className === 'p' && posti[i].getAttribute('data-n') === nomePreciso) { meta = posti[i]; break; }
      }
      /* se non e' un posto puo' essere un piatto: la scheda sta nella
         fascia del cibo, e ci si arriva allo stesso modo */
      if (!meta) {
        for (var k = 0; k < piatti.length; k++) {
          if (piatti[k].className === 'p' && piatti[k].getAttribute('data-n') === nomePreciso) { meta = piatti[k]; break; }
        }
      }
    }
    var evidenzia = !!meta;
    if (!meta) meta = primoVisibile();
    if (!meta) return;
    var padre = meta.parentNode.parentNode;
    if (padre && padre.setAttribute) padre.setAttribute('open', 'open');
    if (evidenzia) {
      meta.className = 'p';
      /* forza il ricalcolo, altrimenti il battito non riparte se il posto era gia' evidenziato */
      void meta.offsetWidth;
      meta.className = 'p evidenzia';
      evidenziato = meta;
    }
    if (meta.scrollIntoView) meta.scrollIntoView();
  }

  /* ---- suggerimenti sotto il campo di ricerca ---- */
  var boxSugg = document.getElementById("sugg");
  var elenco = window.SUGG || [];

  function chiudiSugg() { if (boxSugg) { boxSugg.innerHTML = ""; boxSugg.className = "sugg"; } }


  /* Un tocco puo' generare piu' eventi (touchstart, poi mousedown, poi click):
     la guardia evita di eseguire la scelta tre volte. */
  var ultimaScelta = 0;
  var attesa = null;
  function prendi(ev) {
    var ora = new Date().getTime();
    if (ora - ultimaScelta < 400) { if (ev && ev.preventDefault) ev.preventDefault(); return false; }
    ultimaScelta = ora;
    if (attesa) { clearTimeout(attesa); attesa = null; }
    if (ev && ev.preventDefault) ev.preventDefault();
    var li = this;
    if (!li || !li.getAttribute) {
      li = ev && (ev.currentTarget || ev.target);
      while (li && li.tagName !== 'LI') li = li.parentNode;
    }
    if (!li || !li.getAttribute) return false;
    var scelto = li.getAttribute("data-v");
    var eZona = li.getAttribute("data-z") === "1";
    campo.value = scelto;
    testo = scelto;
    chiudiSugg();
    aggiorna();
    if (campo.blur) campo.blur();
    /* il ritardo lascia richiudere la tastiera: senza, lo scorrimento
       viene annullato dal ridimensionamento della pagina */
    setTimeout(function () { vaiAiRisultati(eZona ? null : scelto); }, 120);
    return false;
  }

  /* Un dito fermo sceglie, un dito che si muove scorre. Senza questa
     distinzione, con la tendina scorrevole ogni tentativo di scorrere
     l'elenco finiva col selezionare la voce sotto il dito. */
  var toccoX = 0, toccoY = 0, trascinato = false;
  function toccoInizio(ev) {
    var t = ev.touches && ev.touches[0];
    if (!t) return;
    toccoX = t.clientX; toccoY = t.clientY; trascinato = false;
  }
  function toccoMosso(ev) {
    var t = ev.touches && ev.touches[0];
    if (!t) return;
    if (Math.abs(t.clientX - toccoX) > 8 || Math.abs(t.clientY - toccoY) > 8) trascinato = true;
  }
  function toccoFine(ev) {
    if (trascinato) return;
    return prendi.call(this, ev);
  }

  /* La tendina deve stare nello spazio che resta sotto il campo, che con la
     tastiera aperta e' molto meno dell'altezza della finestra: visualViewport
     e' l'unico che sa quanto schermo si vede davvero. */
  function dimensionaSugg() {
    if (!boxSugg || boxSugg.className.indexOf('on') === -1) return;
    var vv = window.visualViewport;
    var alt = vv ? vv.height : (window.innerHeight || 0);
    if (!alt) return;
    var giu = vv ? vv.offsetTop : 0;
    var cima = boxSugg.getBoundingClientRect().top;
    var spazio = alt + giu - cima - 12;
    if (spazio < 150) spazio = 150;
    boxSugg.style.maxHeight = Math.round(spazio) + 'px';
  }
  if (window.visualViewport && window.visualViewport.addEventListener) {
    window.visualViewport.addEventListener('resize', dimensionaSugg);
    window.visualViewport.addEventListener('scroll', dimensionaSugg);
  }

  function mostraSugg(q) {
    if (!boxSugg || !elenco.length) return;
    var s = semplifica(q);
    if (s.length < 2) { chiudiSugg(); return; }
    /* le zone vengono prima dei posti in elenco: con tante zone che
       iniziano per lo stesso prefisso (es. "San"/"Sant'", 8 zone dopo
       l'espansione Overture del 24 ago 2026) riempivano da sole tutti gli
       8 slot visibili, lasciando fuori ogni posto vero. Tetto a 3 zone. */
    var zEsatti = [], zDentro = [], pEsatti = [], pDentro = [];
    for (var i = 0; i < elenco.length && zEsatti.length + zDentro.length + pEsatti.length + pDentro.length < 60; i++) {
      var v = semplifica(elenco[i][0]);
      var eZona = elenco[i][1] === 'zona';
      var idx = v.indexOf(s);
      if (idx === 0) (eZona ? zEsatti : pEsatti).push(elenco[i]);
      else if (idx > 0) (eZona ? zDentro : pDentro).push(elenco[i]);
    }
    var zoneMostrate = zEsatti.concat(zDentro).slice(0, 3);
    var restoMostrato = pEsatti.concat(pDentro).slice(0, 8 - zoneMostrate.length);
    var lista = zoneMostrate.concat(restoMostrato);
    if (!lista.length) { chiudiSugg(); return; }
    var html = "";
    for (var k = 0; k < lista.length; k++) {
      var nome = lista[k][0], sotto = lista[k][1], quanti = lista[k][2], quando = lista[k][3] || "";
      var dettaglio = sotto === "zona" ? quanti + (quanti === 1 ? " posto" : " posti") : sotto;
      html += "<li data-v=\"" + nome.replace(/"/g, "&quot;") + "\""
        + (sotto === "zona" ? " data-z=\"1\"" : "") + ">"
        + "<b>" + nome + "</b>"
        + "<span>" + (quando ? "<i>" + quando + "</i>" : "") + dettaglio + "</span>"
        + "</li>";
    }
    boxSugg.innerHTML = html;
    boxSugg.className = "sugg on";
    dimensionaSugg();
    var voci = boxSugg.getElementsByTagName("li");
    for (var z = 0; z < voci.length; z++) {
      if (voci[z].addEventListener) {
        /* touchend, non touchstart: ora la tendina si scorre, e un dito che
           parte su una voce puo' voler scorrere invece che sceglierla.
           Il bersaglio di touchend resta la voce dove il tocco e' cominciato
           anche se la pagina si e' mossa, quindi non si perde il tocco. */
        voci[z].addEventListener('touchstart', toccoInizio, false);
        voci[z].addEventListener('touchmove', toccoMosso, false);
        voci[z].addEventListener('touchend', toccoFine, false);
        voci[z].addEventListener('mousedown', prendi, false);
        voci[z].addEventListener('click', prendi, false);
      } else {
        voci[z].onmousedown = prendi;
        voci[z].onclick = prendi;
      }
    }
  }

  /* ---- ricerca ---- */
  if (campo) {

    function cerca() {
      testo = campo.value || '';
      chiudiSugg();
      aggiorna();
    }
    campo.onkeyup = function (ev) {
      if (ev && ev.keyCode === 13) { chiudiSugg(); testo = campo.value || ''; aggiorna(); if (campo.blur) campo.blur(); setTimeout(function () { vaiAiRisultati(null); }, 120); return; }
      mostraSugg(campo.value || '');
      if (attesa) clearTimeout(attesa);
      attesa = setTimeout(function () { testo = campo.value || ''; aggiorna(); }, 200);
    };
    campo.onsearch = cerca;
    campo.onchange = cerca;
  }
  if (pulisci) pulisci.onclick = function () {
    campo.value = ''; testo = ''; aggiorna(); campo.focus();
  };

  /* ---- filtri a bottoni ---- */
  for (var k = 0; k < bottoni.length; k++) {
    (function (b) {
      b.onclick = function () {
        var chiave = b.getAttribute('data-k');
        var valore = b.getAttribute('data-v');
        var gia = scelto[chiave] === valore;
        scelto[chiave] = gia ? '' : valore;
        for (var z = 0; z < bottoni.length; z++) {
          if (bottoni[z].getAttribute('data-k') !== chiave) continue;
          togliClasse(bottoni[z], 'on');
          togliClasse(bottoni[z], 'auto');
        }
        /* da qui in poi comanda il bottone premuto, non la frase cercata */
        if (chiave === 't') autoAcceso = null;
        if (!gia) b.className += ' on';
        aggiorna();
      };
    })(bottoni[k]);
  }

  function reset(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    scelto.t = ''; scelto.g = ''; scelto.fo = ''; testo = '';
    if (campo) campo.value = '';
    for (var z = 0; z < bottoni.length; z++) {
      bottoni[z].className = bottoni[z].className.replace(' on', '');
    }
    aggiorna();
  }
  var r1 = document.getElementById('reset');
  var r2 = document.getElementById('reset2');
  if (r1) r1.onclick = reset;
  if (r2) r2.onclick = reset;

  /* interruttore Affidabilita': mostra/nasconde i posti non verificati (auto) */
  var btAuto = document.getElementById('mostraAuto');
  if (btAuto) {
    var autoLabel = btAuto.innerHTML;
    btAuto.onclick = function () {
      mostraAuto = !mostraAuto;
      if (mostraAuto) {
        if ((' ' + btAuto.className + ' ').indexOf(' on ') < 0) btAuto.className += ' on';
        btAuto.innerHTML = 'Nascondi gli altri posti';
      } else {
        btAuto.className = btAuto.className.replace(/\s*\bon\b/g, '');
        btAuto.innerHTML = autoLabel;
      }
      aggiorna();
    };
  }

  /* --- Il consiglio di oggi: un posto diverso ogni giorno tra "I migliori".
     Cambia da solo in base alla data, senza nessun server. --- */
  (function () {
    var box = document.getElementById('oggi');
    var lista = window.MIGLIORI;
    if (!box || !lista || !lista.length) return;
    var d = new Date();
    var giorno = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    var m = lista[giorno % lista.length];
    var desc = (m.d || '').split('. ')[0];
    if (desc && desc.length > 160) desc = desc.slice(0, 157) + '…';
    box.innerHTML = '<p class="oggi-k">Il consiglio di oggi</p>'
      + '<h2 class="oggi-n">' + m.n + '</h2>'
      + '<p class="oggi-z">' + m.z + '</p>'
      + (desc ? '<p class="oggi-d">' + desc + '.</p>' : '')
      + '<p class="oggi-m"><a href="' + m.map + '" target="_blank" rel="noopener">Apri in mappa &rarr;</a></p>';
    box.removeAttribute('hidden');
  })();

  /* ---- pesca a caso tra quelli visibili ---- */
  var caso = document.getElementById('caso');
  if (caso) caso.onclick = function () {
    spegniEvidenza();
    var liberi = [];
    for (var i = 0; i < posti.length; i++) if (posti[i].className === 'p') liberi.push(posti[i]);
    if (!liberi.length) return;
    var p = liberi[Math.floor(Math.random() * liberi.length)];
    var padre = p.parentNode.parentNode;
    if (padre && padre.setAttribute) padre.setAttribute('open', 'open');
    var nome = p.getAttribute('data-n') || '';
    var km = p.getElementsByTagName('p')[0];
    if (pescato) {
      pescato.innerHTML = '<b>' + nome + '</b><span class="pk">'
        + (km ? km.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : '') + '</span>';
      pescato.className = 'pescato on';
    }
    p.className = 'p evidenzia';
    evidenziato = p;
    if (p.scrollIntoView) p.scrollIntoView();
  };

  /* Chiudere la tendina al touchstart la faceva sparire appena si provava a
     scorrere la pagina, perche' anche uno scorrimento comincia con un tocco.
     Si aspetta il touchend e si chiude solo se il dito e' rimasto fermo:
     cioe' se e' stato un tocco fuori davvero, non uno scorrimento. */
  function fuoriDallaTendina(t) {
    while (t) { if (t.id === 'sugg' || t.id === 'cerca') return false; t = t.parentNode; }
    return true;
  }
  var fuoriX = 0, fuoriY = 0, fuoriTrascinato = false;
  document.addEventListener('touchstart', function (ev) {
    var t = ev.touches && ev.touches[0];
    fuoriTrascinato = false;
    if (t) { fuoriX = t.clientX; fuoriY = t.clientY; }
  }, false);
  document.addEventListener('touchmove', function (ev) {
    var t = ev.touches && ev.touches[0];
    if (!t) return;
    if (Math.abs(t.clientX - fuoriX) > 8 || Math.abs(t.clientY - fuoriY) > 8) fuoriTrascinato = true;
  }, false);
  document.addEventListener('touchend', function (ev) {
    if (fuoriTrascinato) return;
    if (fuoriDallaTendina(ev.target)) chiudiSugg();
  }, false);
  document.addEventListener('click', function (ev) {
    if (fuoriDallaTendina(ev.target)) chiudiSugg();
  });


  /* Con oltre trecento voci risalire a mano e' lungo: un bottone che compare
     solo dopo che si e' scorso un po'. */
  var su = document.createElement('a');
  su.href = '#su';
  su.id = 'torna-su';
  su.innerHTML = '&#9650;';
  su.setAttribute('aria-label', 'Torna in cima');
  su.style.display = 'none';
  document.body.appendChild(su);
  su.onclick = function () {
    if (campo) { campo.focus(); }
  };
  var ultimo = 0;
  window.onscroll = function () {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if ((y > 900) !== (ultimo > 900)) su.style.display = y > 900 ? 'block' : 'none';
    ultimo = y;
  };


  /* Dissolvenza delle foto: si parte trasparenti e si accende al caricamento.
     Se una foto e' gia' in cache, "complete" e' vero e si accende subito.
     Se il JavaScript non gira, le foto restano semplicemente visibili. */
  var foto = document.querySelectorAll('.fascia .p > img');
  for (var f = 0; f < foto.length; f++) {
    (function (im) {
      if (im.complete) { im.className = 'caricata'; return; }
      im.className = 'attesa';
      im.onload = function () { im.className = 'caricata'; };
      im.onerror = function () { im.className = 'caricata'; };
    })(foto[f]);
  }

  /* ---- carosello delle foto ----
     Le freccette non tengono uno stato loro: spostano il contenitore che il
     dito sposterebbe comunque, e i pallini leggono da dove si trova. Cosi'
     scorrimento a dito e freccette non possono mai discordare. */
  var gallerie = document.getElementsByClassName('gal');
  for (var q = 0; q < gallerie.length; q++) {
    (function (gal) {
      var str = gal.getElementsByClassName('gal-str')[0];
      if (!str) return;
      var prec = gal.getElementsByClassName('gal-prec')[0];
      var succ = gal.getElementsByClassName('gal-succ')[0];
      var punti = gal.getElementsByClassName('gal-pt')[0];
      var pallini = punti ? punti.getElementsByTagName('i') : [];
      var tot = parseInt(gal.getAttribute('data-tot'), 10) || 1;

      function passo() { return str.clientWidth || 1; }
      function dove() { return Math.round(str.scrollLeft / passo()); }

      function vaiA(i) {
        if (i < 0) i = 0;
        if (i > tot - 1) i = tot - 1;
        var x = i * passo();
        /* scrollTo con le opzioni non c'e' sui browser vecchi: si ripiega
           sull'assegnazione diretta, che salta ma funziona ovunque */
        if (str.scrollTo) {
          try { str.scrollTo({ left: x, behavior: 'smooth' }); return; } catch (e) { }
        }
        str.scrollLeft = x;
      }

      function segna() {
        var i = dove();
        for (var k = 0; k < pallini.length; k++) pallini[k].className = (k === i ? 'on' : '');
        if (prec) prec.hidden = (i <= 0);
        if (succ) succ.hidden = (i >= tot - 1);
      }

      if (prec) prec.onclick = function (ev) {
        if (ev && ev.preventDefault) { ev.preventDefault(); ev.stopPropagation(); }
        vaiA(dove() - 1); return false;
      };
      if (succ) succ.onclick = function (ev) {
        if (ev && ev.preventDefault) { ev.preventDefault(); ev.stopPropagation(); }
        vaiA(dove() + 1); return false;
      };

      /* lo scorrimento arriva a raffica: si aggiorna a raffica finita */
      var timer = null;
      str.onscroll = function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(segna, 90);
      };

      segna();
    })(gallerie[q]);
  }

  aggiorna();
})();
