/* Mette insieme cibo.js: le 16 schede gia' esistenti (estratte, non
   ricopiate) con l'aggiunta del prezzo, piu' le specialita' che mancavano.

   Sui prezzi: sono FASCE INDICATIVE, non un dato verificato come i tempi di
   percorrenza. Nel sito sono etichettate come tali, perche' accanto a numeri
   veri un numero inventato senza avviso e' peggio di nessun numero. */

const fs = require('fs');
const esistenti = require('./cibo_estratto.js');
const ancora = require('./ancora_cibo.js');

/* Le voci nuove vanno raggruppate per zona, altrimenti scorrendo la sezione
   si salta da Catania a Trapani e ritorno. L'ordine e' quello del viaggio:
   prima quello che si mangia sotto casa, poi allontanandosi. */
const ORDINE_ZONE = ['Catania', 'Catania e l’Etna', 'Catania e Palermo', 'Catania e Siracusa',
  'Messina', 'Messina e lo Stretto', 'Interno e Catania', 'Sortino, vicino Siracusa',
  'Ragusa e Modica', 'Modica', 'Palermo e Catania', 'Palermo', 'Palermo e costa',
  'Trapani', 'Trapani e Scopello', 'Ovunque', 'Etna, Noto, Pantelleria'];
/* le zone contengono entita' HTML: vanno normalizzate prima di confrontarle,
   altrimenti "Catania e l&rsquo;Etna" non combacia con la voce dell'elenco
   e la scheda finisce in fondo invece che col suo gruppo */
const pesoZona = z => {
  const pulita = String(z || '').replace(/&rsquo;/g, '’');
  const i = ORDINE_ZONE.indexOf(pulita);
  return i === -1 ? ORDINE_ZONE.length : i;
};

/* Il tipo, con lo stesso vocabolario dei posti (TIPI in build.js): serve a
   mostrare il chip colorato e a far rispondere i piatti al filtro CHE COSA.
   Piu' tipi si separano con uno spazio, come per i posti. */
const TIPO = {
  'Arancino / Arancina': 'street',
  'Pasta alla Norma': 'pasta',
  'Cannolo': 'dolci',
  'Granita e brioche col tuppo': 'dolci',
  'Pani ca meusa': 'street',
  'Panelle e cazzilli': 'street',
  'Sfincione': 'street pizza',
  'Cous cous di pesce': 'pesce',
  'Busiate al pesto trapanese': 'pasta',
  'Pistacchio di Bronte': 'spesa',
  'Gelato al pistacchio': 'dolci',
  'Cassata': 'dolci',
  'Frutta martorana': 'dolci',
  'Caponata': 'pasta',
  'Pizza napoletana': 'pizza',
  'Teste di Moro': 'spesa'
};

const PREZZI = {
  'Arancino / Arancina': '2,50&ndash;3,50 &euro;',
  'Pasta alla Norma': '9&ndash;13 &euro;',
  'Cannolo': '2,50&ndash;4 &euro;',
  'Granita e brioche col tuppo': '4&ndash;5,50 &euro;',
  'Pani ca meusa': '3&ndash;4 &euro;',
  'Panelle e cazzilli': '2,50&ndash;4 &euro;',
  'Sfincione': '2&ndash;3 &euro; al pezzo',
  'Cous cous di pesce': '14&ndash;20 &euro;',
  'Busiate al pesto trapanese': '10&ndash;14 &euro;',
  'Pistacchio di Bronte': '8&ndash;14 &euro; il vasetto da 90 g',
  'Gelato al pistacchio': '3&ndash;4,50 &euro; la coppetta',
  'Cassata': '4&ndash;5 &euro; la porzione',
  'Frutta martorana': '25&ndash;40 &euro; al kg',
  'Caponata': '6&ndash;9 &euro; come antipasto',
  'Pizza napoletana': '7&ndash;12 &euro;',
  'Teste di Moro': '30&ndash;150 &euro; secondo la misura'
};

/* Le nuove. L'ordine tiene vicine le cose della stessa zona, partendo da
   quelle che si trovano sotto casa ad Aci Catena. */
const NUOVE = [
  {
    n: 'Crispelle',
    zona: 'Catania',
    t: 'street',
    img: 'crispelle.jpg',
    alt: 'Crispelle di riso',
    p: '1&ndash;2 &euro; l&rsquo;una',
    d: 'Pasta lievitata fritta al momento, in due versioni. <b>Salate:</b> bastoncini con acciuga dentro oppure ricotta, da friggitoria. <b>Dolci:</b> le <b>crispelle di riso</b> col miele, quelle in foto, dolce catanese di San Giuseppe che molte friggitorie tengono tutto l&rsquo;anno. In tutti i casi si mangiano bollenti e in piedi: fredde non hanno pi&ugrave; senso.'
  },
  {
    n: 'Cartocciata e siciliana',
    zona: 'Catania',
    t: 'street',
    img: 'siciliana.jpg',
    p: '3&ndash;4 &euro;',
    d: 'I due pezzi da rosticceria catanese. La <b>cartocciata</b> &egrave; al forno, morbida, con prosciutto, mozzarella e pomodoro. La <b>siciliana</b> &egrave; fritta e dentro ha tuma e acciuga: unge le dita, &egrave; il punto.'
  },
  {
    n: 'Cipollina',
    zona: 'Catania',
    t: 'street',
    img: 'cipollina.jpg',
    p: '1,50&ndash;2,50 &euro;',
    d: 'Sfoglia con cipolla stufata, pomodoro e formaggio. Il pezzo pi&ugrave; catanese di tutti, quello che si prende al volo prima di pranzo. Nel PDF di partenza era segnata come da provare, e vale il consiglio.'
  },
  {
    n: 'Iris',
    zona: 'Catania e Palermo',
    t: 'street dolci',
    img: 'iris.jpg',
    p: '2,50&ndash;3,50 &euro;',
    d: 'Pasta brioche impanata e fritta, riempita di crema di ricotta &mdash; oppure di cioccolato e panna, come quella in foto. Nata a Palermo per una serata all&rsquo;opera, oggi &egrave; banco fisso anche nelle rosticcerie catanesi. Pesantissima e non ve ne pentirete.'
  },
  {
    n: 'Minne di Sant&rsquo;Agata',
    zona: 'Catania',
    t: 'dolci',
    img: 'minne.jpg',
    p: '3&ndash;4 &euro;',
    d: 'Cassatelle tonde di ricotta con glassa bianca e una ciliegia candita in cima, dedicate alla patrona di Catania. La festa &egrave; a febbraio, <b>ma le pasticcerie le fanno tutto l&rsquo;anno.</b> Accanto trovate le <b>olivette</b>, pasta di mandorla verde a forma di oliva.'
  },
  {
    n: 'Schiacciata catanese',
    zona: 'Catania',
    t: 'street pizza',
    p: '4&ndash;6 &euro; al pezzo',
    d: 'Focaccia ripiena chiusa sopra: tuma, acciuga e broccoli, oppure patate. &Egrave; cibo d&rsquo;inverno, ma i forni del catanese la tengono anche d&rsquo;estate. Una fetta pesa come un pasto.'
  },
  {
    n: 'Pidone messinese',
    zona: 'Messina',
    t: 'street',
    img: 'pidone.jpg',
    p: '3&ndash;4 &euro;',
    d: 'Mezzaluna fritta con scarola, tuma e acciuga. A Messina &egrave; la merenda di default e si trova a ogni angolo: se salite verso lo Stretto, questo &egrave; il pezzo da cercare.'
  },
  {
    n: 'Pignolata messinese',
    zona: 'Messina',
    t: 'dolci',
    p: '3&ndash;5 &euro;',
    d: 'Palline di pasta fritta glassate met&agrave; al <b>limone bianco</b> e met&agrave; al <b>cioccolato</b>. Niente a che vedere con la pignolata calabrese al miele: questa &egrave; coperta di glassa lucida e si mangia a cucchiaiate.'
  },
  {
    n: 'Pesce spada alla ghiotta',
    zona: 'Messina e lo Stretto',
    t: 'pesce',
    p: '16&ndash;22 &euro;',
    d: 'Spada in umido con pomodoro, capperi, olive e sedano. In alternativa gli <b>involtini</b>, arrotolati col pangrattato. Sullo Stretto lo spada &egrave; pescato l&igrave;: chiedete se &egrave; del posto, la differenza si sente.'
  },
  {
    n: 'Scaccia ragusana',
    zona: 'Ragusa e Modica',
    t: 'street pizza',
    img: 'scaccia.jpg',
    p: '3&ndash;5 &euro;',
    d: 'Sfoglia sottilissima ripiegata su s&eacute; pi&ugrave; volte, con pomodoro e cipolla, o ricotta e cipolla, o melanzane. Si vende a tranci nei forni: da scendere apposta quando siete gi&ugrave; verso il ragusano.'
  },
  {
    n: 'Cioccolato di Modica',
    zona: 'Modica',
    t: 'dolci spesa',
    img: 'cioccolatomodica.jpg',
    p: '3&ndash;5 &euro; la barretta',
    d: 'Lavorato a freddo: lo zucchero non si scioglie e resta <b>granuloso sotto i denti</b>. Non &egrave; un difetto, &egrave; la tecnica, arrivata dagli spagnoli e prima ancora dagli aztechi. IGP dal 2018.'
  },
  {
    n: '&rsquo;Mpanatigghi',
    zona: 'Modica',
    t: 'dolci',
    img: 'mpanatigghi.jpg',
    p: '2&ndash;3 &euro; l&rsquo;uno',
    d: 'Biscotti mezzaluna ripieni di cioccolato, mandorle, cannella e <b>carne di manzo tritata</b>. S&igrave;, carne, dentro un dolce: non si sente, e sono buonissimi. Eredit&agrave; spagnola del Seicento.'
  },
  {
    n: 'Stigghiola',
    zona: 'Palermo e Catania',
    t: 'street carne',
    img: 'stigghiola.jpg',
    p: '3&ndash;5 &euro;',
    d: 'Budella di agnello o capretto arrotolate su un cipollotto e cotte sulla brace, sale e limone. Si mangia in piedi accanto al braciere. Il PDF segnalava il banco di <b>Riccardo &laquo;u Re r&igrave; stigghiole&raquo;</b> nei mercati di Palermo: chiedete in giro, lo conoscono tutti.'
  },
  {
    n: 'Patacalzone',
    zona: 'Palermo',
    t: 'street',
    img: 'patacalzone.jpg',
    alt: 'Calzoni in una rosticceria siciliana',
    p: '3&ndash;4 &euro;',
    d: 'Calzone fritto con w&uuml;rstel e patatine dentro. Non ha nessuna nobilt&agrave; storica e non gliene serve: &egrave; quello che si mangia al Capo e a Ballar&ograve; passeggiando, e funziona. <i>Nella foto una vetrina di rosticceria siciliana: i calzoni sono quelli, ma cotti al forno &mdash; del patacalzone fritto non esiste una foto libera.</i>'
  },
  {
    n: 'Frittola',
    zona: 'Palermo',
    t: 'street carne',
    img: 'frittola.jpg',
    p: '3&ndash;4 &euro;',
    d: 'Ritagli di vitello cotti nella sugna, tenuti caldi in una cesta coperta e serviti nella carta o dentro il pane. <b>Il pi&ugrave; estremo dello street food palermitano:</b> non vi dicono che pezzi sono, e in genere &egrave; meglio cos&igrave;.'
  },
  {
    n: 'Pane cunzato',
    zona: 'Trapani e Scopello',
    t: 'street',
    img: 'panecunzato.jpg',
    p: '6&ndash;10 &euro;',
    d: 'Pane caldo aperto e &laquo;condito&raquo;: olio, pomodoro, acciughe, primosale, origano. Nato come pasto dei poveri, oggi &egrave; il pranzo perfetto dopo lo Zingaro. Quelli di <b>Scopello</b> sono enormi: uno basta per due.'
  },
  {
    n: 'Cassatelle trapanesi',
    zona: 'Trapani',
    t: 'dolci',
    img: 'cassatelle.jpg',
    p: '2&ndash;3 &euro; l&rsquo;una',
    d: 'Ravioli dolci fritti con ricotta di pecora, zucchero e cannella, spolverati caldi. Si trovano nelle pasticcerie del trapanese e alle sagre: da mangiare appena fatti, tiepidi.'
  },
  {
    n: 'Rianata',
    zona: 'Trapani',
    t: 'pizza',
    img: 'rianata.jpg',
    p: '8&ndash;12 &euro;',
    d: 'La pizza di Trapani: pomodoro fresco, pecorino, acciughe e <b>molto origano</b> &mdash; &laquo;rianu&raquo; in dialetto, da cui il nome. Niente mozzarella, impasto basso.'
  },
  {
    n: 'Sarde a beccafico',
    zona: 'Palermo e costa',
    t: 'pesce',
    img: 'beccafico.jpg',
    p: '8&ndash;12 &euro;',
    d: 'Sarde aperte, farcite di pangrattato, pinoli e uvetta, arrotolate con una foglia d&rsquo;alloro in mezzo. Il nome viene da un uccellino che i nobili mangiavano: questa era la versione dei poveri, ed &egrave; sopravvissuta lei.'
  },
  {
    n: 'Gelo di melone',
    zona: 'Palermo',
    t: 'dolci',
    img: 'gelomelone.jpg',
    p: '3&ndash;4 &euro;',
    d: 'Budino di anguria profumato al gelsomino, con gocce di cioccolato e pistacchio. In Sicilia &laquo;melone&raquo; vuol dire anguria. <b>&Egrave; il dolce d&rsquo;agosto per eccellenza:</b> si mangia freddo e a fine agosto lo trovate ovunque.'
  },
  {
    n: 'Pasta con le sarde',
    zona: 'Palermo',
    t: 'pasta pesce',
    img: 'pastasarde.jpg',
    p: '10&ndash;14 &euro;',
    d: 'Bucatini con sarde, finocchietto selvatico, uvetta, pinoli e zafferano: dolce e salato insieme, il piatto pi&ugrave; arabo di tutti. Se la trovate <b>&laquo;a mare&raquo;</b> significa senza sarde, solo col finocchietto.'
  },
  {
    n: 'I vini dell&rsquo;isola',
    zona: 'Etna, Noto, Pantelleria',
    t: 'spesa',
    img: 'vinietna.jpg',
    p: '15&ndash;35 &euro; la bottiglia in cantina',
    d: '<b>Etna Rosso</b> (nerello mascalese) nasce sulla lava a mezz&rsquo;ora da voi, sul versante nord verso Passopisciaro e Randazzo, e somiglia pi&ugrave; a un Borgogna che a un vino del sud. <b>Nero d&rsquo;Avola</b> per i rossi pieni, <b>Passito di Pantelleria</b> e <b>Marsala</b> per il dolce. Molte cantine dell&rsquo;Etna fanno visita e degustazione su prenotazione.'
  }
];

const tutte = esistenti.map(v => {
  const o = { n: v.n, d: v.d };
  if (TIPO[v.n]) o.t = TIPO[v.n];
  if (v.img) o.img = v.img;
  if (v.alt) o.alt = v.alt;
  if (PREZZI[v.n]) o.p = PREZZI[v.n];
  return o;
}).concat(
  NUOVE.concat(ancora)
    /* ordinamento stabile per zona: dentro una zona resta l'ordine scritto */
    .map((v, i) => ({ v: v, i: i }))
    .sort((a, b) => (pesoZona(a.v.zona) - pesoZona(b.v.zona)) || (a.i - b.i))
    .map(x => {
      const v = x.v;
      const o = { n: v.n, zona: v.zona, t: v.t };
      if (v.img) o.img = v.img;
      if (v.alt) o.alt = v.alt;
      o.p = v.p;
      o.d = v.d;
      return o;
    }));

const testa = '/* Le voci della sezione "Cosa vi mettono nel piatto".\n' +
  '   n = nome, zona = dove si mangia, p = prezzo INDICATIVO (non verificato,\n' +
  '   a differenza dei tempi di percorrenza), img = foto, d = descrizione.\n' +
  '   La descrizione contiene HTML gia\' pronto: entita\' accentate e <b>. */\n';

fs.writeFileSync('cibo.js', testa + 'module.exports = ' + JSON.stringify(tutte, null, 1) + ';\n', 'utf8');

console.log('cibo.js: ' + tutte.length + ' voci (' + esistenti.length + ' esistenti + ' + NUOVE.length + ' nuove)');
console.log('con foto: ' + tutte.filter(v => v.img).length + ' | senza: ' + tutte.filter(v => !v.img).length);
console.log('con prezzo: ' + tutte.filter(v => v.p).length);
