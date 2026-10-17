/* Tappe aggiunte: quelle vicine che erano state saltate.
   k = chiave in tempi.json, da cui build.js prende il tempo reale in auto. */
module.exports = [

/* ---------- costa a nord e a sud di casa ---------- */
{k:"acicastello", n:"Castello Normanno di Aci Castello", z:"Aci Castello", t:"vedere", g:"top", img:"acicastello.jpg",
 d:"Castello del 1076 costruito su uno sperone di lava nera a picco sul mare, con il museo dentro e la vista sui faraglioni dall'alto. È la cosa più bella a un quarto d'ora da casa, e nel documento di partenza non c'era."},
{k:"acicastello", n:"Scogliera di Aci Castello", z:"Aci Castello", t:"mare", g:"",
 d:"Piattaforme di lava sotto il castello con scalette per entrare in acqua. Niente sabbia, ma il fondale è pulito e a due passi c'è tutto."},
{k:"riposto", n:"Riposto e il porto dell'Etna", z:"Riposto", t:"vedere mare", g:"nascosto", img:"riposto.jpg",
 d:"Marina grande, lungomare per la passeggiata serale e gelaterie. Poco turistico: qui ci vanno soprattutto i catanesi."},
{k:"torrearchirafi", n:"Torre Archirafi", z:"Riposto", t:"mare", g:"nascosto", img:"torrearchirafi.jpg",
 d:"Borgo sulla scogliera con piscine naturali tra la lava e la celebre acqua sorgiva che sgorga dalla roccia, imbottigliata da sempre. Uno dei posti meno battuti della zona."},
{k:"fiumefreddo", n:"Marina di Cottone e riserva del Fiumefreddo", z:"Fiumefreddo di Sicilia", t:"mare", g:"nascosto", img:"fiumefreddo.jpg",
 d:"Spiaggia lunga di ciottoli e sabbia scura, molto meno affollata di quelle a sud. Accanto la riserva del fiume Fiumefreddo, con acque sorgive gelide e papiri spontanei."},

/* ---------- i paesi dell'Etna ---------- */
{k:"zafferana", n:"Zafferana Etnea", z:"Zafferana Etnea", t:"vedere dolci", g:"nascosto", img:"zafferana.jpg",
 d:"Capitale del miele siciliano e balcone sull'Etna. Pasticcerie ovunque, e le zeppole sono la specialità. Sosta naturale scendendo dal Rifugio Sapienza."},
{k:"trecastagni", n:"Trecastagni", z:"Trecastagni", t:"vedere carne", g:"locali", img:"trecastagni.jpg",
 d:"Paese etneo a un quarto d'ora da casa, noto per le salsicce e le carni alla brace nei ristoranti di paese. Vista sul golfo di Catania dal sagrato della Basilica."},
{k:"milo", n:"Milo", z:"Milo", t:"vedere spesa", g:"nascosto", img:"milo.jpg",
 d:"Borgo minuscolo sul versante est. È l'unico posto dove si produce l'Etna Bianco Superiore DOC: se volete portare a casa una bottiglia dell'Etna, si compra qui."},
{k:"nicolosi", n:"Nicolosi e i Monti Rossi", z:"Nicolosi", t:"vedere", g:"",
 d:"La porta dell'Etna: si attraversa salendo al Rifugio Sapienza. I Monti Rossi sono due crateri spenti con una pineta, comodi per una passeggiata breve senza salire in quota."},
{k:"randazzo", n:"Randazzo", z:"Randazzo", t:"vedere", g:"nascosto", img:"randazzo.jpg",
 d:"Il borgo medievale meglio conservato dell'Etna, costruito interamente in pietra lavica nera. Scampato a tutte le colate, ha un centro storico che sembra un set."},
{k:"castiglione", n:"Castiglione di Sicilia", z:"Castiglione di Sicilia", t:"vedere spesa", g:"nascosto", img:"castiglione.jpg",
 d:"Uno dei Borghi più belli d'Italia, arroccato sopra la valle dell'Alcantara. È il cuore delle cantine dell'Etna nord: molte fanno degustazione su prenotazione."},

/* ---------- i borghi del Padrino e il porto per le Eolie ---------- */
{k:"savoca", n:"Savoca", z:"Savoca", t:"vedere", g:"nascosto", img:"savoca.jpg",
 d:"Il borgo dove Coppola girò le scene siciliane del Padrino. Il Bar Vitelli è rimasto identico e la chiesa di San Nicolò è quella del matrimonio. Vista che spazia su tutta la costa."},
{k:"forzadagro", n:"Forza d'Agrò", z:"Forza d'Agrò", t:"vedere", g:"nascosto", img:"forzadagro.jpg",
 d:"L'altro borgo del Padrino, a pochi minuti da Savoca. Vicoli stretti, castello in cima e una vista sullo Stretto che da sola vale la salita."},
{k:"milazzo", n:"Milazzo — porto per le Eolie", z:"Milazzo", t:"vedere mare", g:"", img:"milazzo.jpg",
 d:"Da qui partono gli aliscafi per Vulcano e Lipari: circa 40 minuti di traversata. Se volete vedere le Eolie in giornata è l'unico imbarco sensato, ma è una giornata lunga."},

/* ---------- Augusta e Brucoli ---------- */
{k:"augusta", n:"Augusta", z:"Augusta", t:"vedere", g:"nascosto", img:"augusta.jpg",
 d:"Città costruita su un'isola fortificata e collegata da ponti, con il castello svevo di Federico II. Fuori da qualsiasi circuito turistico: ci si passa e non ci si ferma quasi mai."},
{k:"brucoli", n:"Brucoli", z:"Augusta", t:"mare vedere", g:"nascosto", img:"brucoli.jpg",
 d:"Borgo di pescatori affacciato su un canale naturale che entra nella terraferma come un fiordo in miniatura, con il castello aragonese all'imbocco. Acqua trasparente e quasi nessuno."},

/* ---------- Avola e dintorni ---------- */
{k:"avola", n:"Avola", z:"Avola", t:"vedere spesa", g:"", img:"avola.jpg",
 d:"Città barocca a pianta esagonale, ricostruita dopo il 1693. Patria della mandorla di Avola, la più pregiata d'Italia, e del vitigno Nero d'Avola: entrambe si comprano qui a prezzi che altrove non trovate."},
{k:"cavagrande", n:"Cava Grande del Cassibile", z:"Avola", t:"vedere mare", g:"nascosto", img:"cavagrande.jpg",
 d:"Canyon profondo con una fila di laghetti color smeraldo sul fondo, dove si fa il bagno. La discesa è ripida e lunga: si scende in mezz'ora e si risale in un'ora abbondante. Portate acqua e non fatelo nelle ore calde."},
{k:"notomarina", n:"Lido di Noto", z:"Noto Marina", t:"mare", g:"", img:"notomarina.jpg",
 d:"La spiaggia di Noto, sabbiosa e attrezzata, a un quarto d'ora dal centro barocco. Comoda per unire mare e città nella stessa giornata."},
{k:"vendicari", n:"Riserva di Vendicari e Calamosche", z:"Noto", t:"mare vedere", g:"nascosto", img:"vendicari.jpg",
 d:"Riserva con pantani, fenicotteri e la vecchia tonnara sul mare. La spiaggia di Calamosche, incastrata tra due promontori, si raggiunge solo con venti minuti a piedi ed è regolarmente tra le più belle d'Italia."},

/* ---------- Pachino e la punta della Sicilia ---------- */
{k:"pachino", n:"Pachino", z:"Pachino", t:"spesa", g:"", img:"pachino.jpg",
 d:"Il pomodoro di Pachino IGP nasce qui, e qui costa una frazione di quello che pagate al nord. Zona anche di Nero d'Avola e Moscato."},
{k:"portopalo", n:"Portopalo di Capo Passero", z:"Portopalo", t:"mare vedere", g:"nascosto", img:"portopalo.jpg",
 d:"Il paese più a sud della Sicilia continentale, più a sud di Tunisi. Porto di pescatori, tonnara e l'isolotto di Capo Passero raggiungibile a piedi nell'acqua bassa."},
{k:"isolacorrenti", n:"Isola delle Correnti", z:"Portopalo", t:"mare", g:"nascosto", img:"isolacorrenti.jpg",
 d:"La punta estrema dell'isola, dove lo Ionio e il Mediterraneo si incontrano visibilmente: due mari di colore diverso che si toccano. Vento quasi sempre, ottimo per il kite, meno per l'ombrellone."},

/* ---------- ceramica e sud-est ---------- */
{k:"caltagirone", n:"Caltagirone", z:"Caltagirone", t:"vedere spesa", g:"top", img:"caltagirone.jpg",
 d:"Capitale della ceramica siciliana. La scalinata di Santa Maria del Monte è fatta di 142 gradini, ognuno decorato con maioliche diverse. Le teste di Moro le comprate qui, alla fonte."},
{k:"scicli", n:"Scicli", z:"Scicli", t:"vedere", g:"", img:"scicli.jpg",
 d:"Barocco UNESCO incastrato tra tre gole, e il commissariato di Montalbano nella serie. Meno affollata di Noto e Ragusa."},
{k:"marinaragusa", n:"Marina di Ragusa", z:"Marina di Ragusa", t:"mare", g:"", img:"marinaragusa.jpg",
 d:"Spiaggia lunga e attrezzata con un lungomare vivo la sera. È il mare di riferimento della zona di Ragusa."},
{k:"sampieri", n:"Sampieri e la Fornace Penna", z:"Sampieri", t:"mare vedere", g:"nascosto", img:"sampieri.jpg",
 d:"Spiaggia di sabbia chiara lunga chilometri, con dietro lo scheletro della Fornace Penna, la fabbrica bruciata nel 1924 che nella serie di Montalbano è la Mànnara."},

/* ---------- cose di Catania che mancavano ---------- */
{k:"catania_ursino", n:"Castello Ursino", z:"Catania", t:"vedere", g:"", img:"catania_ursino.jpg",
 d:"Fortezza di Federico II del Duecento, oggi museo civico. Una curiosità: era sul mare, poi la colata del 1669 lo circondò e ora è nell'entroterra."},
{k:"catania_benedettini", n:"Monastero dei Benedettini", z:"Catania", t:"vedere", g:"nascosto", img:"catania_benedettini.jpg",
 d:"Uno dei complessi monastici più grandi d'Europa, costruito sopra la colata lavica e oggi sede dell'università. Si visita con guida e quasi nessun turista lo mette in programma."},
{k:"catania_bellini", n:"Villa Bellini", z:"Catania", t:"vedere", g:"eco",
 d:"Il giardino storico della città, con il grande orologio floreale e l'ombra dei ficus. Gratis, e utile per far passare le ore peggiori del caldo. All'ingresso c'è la rosticceria Quaranta."},

/* ---------- Siracusa che mancava ---------- */
{k:"siracusa", n:"Castello Maniace", z:"Ortigia, Siracusa", t:"vedere", g:"", img:"maniace.jpg",
 d:"La fortezza sveva sulla punta estrema di Ortigia, circondata dal mare su tre lati. Il salone ipostilo con le colonne è la parte che vale il biglietto."}
];
