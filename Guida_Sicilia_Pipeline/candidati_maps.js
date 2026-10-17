/* Candidati trovati su Google Maps (letto col browser, non con curl: Maps
   blocca l'accesso automatico come TheFork), per riempire le zone vicino
   casa dove la guida aveva pochissimo: Acireale, Aci Catena, Aci Castello,
   Aci Trezza, Valverde.

   REGOLA DIVERSA da "Ci vanno i siciliani": questi non sono segnalati da
   una guida gastronomica, sono presi dai voti di Google Maps. Restano SENZA
   quel tag, e ogni scheda dice da dove viene, col voto e il numero di
   recensioni scritto per esteso — cosi' il lettore vede il campione, non
   solo la media.

   Scelti incrociando voto ALTO e volume ALTO di recensioni insieme: un 4,9
   su 9 recensioni non dice niente, un 4,3 su 2200 sì.

   `ind` = indirizzo completo per la geocodifica. Il comune (`com`) serve a
   controllare che il punto trovato cada davvero li', non in un paese con lo
   stesso nome di via da un'altra parte (e' la trappola della Praiola: un
   "Ricci Braceria" cercato per nome portava in Campania).

   Verificati contro dati.js il 22 ago 2026: nessun doppione con quanto
   c'era gia' (controllato per nome). */

module.exports = [
  /* ---------- Acireale: pesce, pasta e dolci erano scoperti ---------- */
  {
    k: 'incognito', n: 'Trattoria Incognito', com: 'Acireale', z: 'Acireale',
    ind: 'Via Giovanni Verga 58, Acireale, Catania', a: 'Via Giovanni Verga 58',
    t: 'pesce', voto: '4,5', rec: 1717,
    d: 'Trattoria di pesce con menù fisso, molto frequentata. Non l’ha segnalata una guida gastronomica: è presa da Google Maps, dove ha 4,5 su 1717 recensioni.'
  },
  {
    k: 'lapolena', n: 'Ristorante La Polena', com: 'Acireale', z: 'Acireale',
    ind: 'Via Nazionale per Catania 178, Acireale, Catania', a: 'Via Nazionale per Catania 178',
    t: 'pesce', voto: '4,3', rec: 2637,
    d: 'Cucina di pesce in ambiente rustico, uno dei ristoranti più recensiti della zona. Trovato su Google Maps: 4,3 su 2637 recensioni.'
  },
  {
    k: 'racina', n: 'Racina — Taverna d’autore', com: 'Acireale', z: 'Acireale',
    ind: 'Via Monsignor Genuardi 36, Acireale, Catania', a: 'Via Monsignor Genuardi 36',
    t: 'pasta', voto: '4,9', rec: 292,
    d: 'Il voto più alto fra le trattorie di Acireale su Google Maps: 4,9 su 292 recensioni. Pasta alla norma e paccheri al pistacchio, dicono le recensioni. Non è una segnalazione di guida.'
  },
  {
    k: 'uputtusu', n: 'Trattoria U Puttusu', com: 'Acireale', z: 'Acireale',
    ind: 'Via Vittorio Emanuele II 175, Acireale, Catania', a: 'Via Vittorio Emanuele II 175',
    t: 'carne pasta', voto: '4,5', rec: 887,
    d: 'Trattoria di carne e cucina di casa, nel centro di Acireale. Da Google Maps: 4,5 su 887 recensioni.'
  },
  {
    k: 'iltino', n: 'Il Tino', com: 'Acireale', z: 'Acireale',
    ind: 'Via Nazionale Guardia 129, Acireale, Catania', a: 'Via Nazionale Guardia 129',
    t: 'carne', voto: '4,8', rec: 416,
    d: 'Carne alla griglia con un’ampia scelta di antipasti, secondo le recensioni. Da Google Maps: 4,8 su 416 recensioni.'
  },
  {
    k: 'palummo', n: 'Pasticceria Siciliana Palummo', com: 'Acireale', z: 'Acireale',
    ind: 'Via Birago 1, Acireale, Catania', a: 'Via Birago 1',
    t: 'dolci', voto: '4,5', rec: 345,
    d: 'Granite, paste di mandorla e cornetti. Da Google Maps: 4,5 su 345 recensioni.'
  },
  {
    k: 'redolce', n: 'Re Dolce Freddo', com: 'Acireale', z: 'Acireale',
    ind: 'Via Giovanni Verga 53, Acireale, Catania', a: 'Via Giovanni Verga 53',
    t: 'dolci', voto: '4,5', rec: 1519,
    d: 'Pasticceria molto frequentata, una delle più recensite di Acireale. Da Google Maps: 4,5 su 1519 recensioni.'
  },

  /* ---------- Aci Catena: zero carne e zero pesce prima di questi ---------- */
  {
    k: 'peschereccio', n: 'Trattoria Pizzeria Al Peschereccio', com: 'Aci Catena', z: 'Aci Catena',
    ind: 'Via Vampolieri 61, Aci Catena, Catania', a: 'Via Vampolieri 61',
    t: 'pesce carne pizza', voto: '4,1', rec: 403,
    d: 'A due passi da casa: pesce, carne e pizza nello stesso posto. Ad Aci Catena la guida non aveva un solo posto per carne o pesce, e questo copre entrambi. Da Google Maps: 4,1 su 403 recensioni.'
  },
  {
    k: 'odissea', n: 'Odissea Ristorante Pizzeria Bar Vampolieri', com: 'Aci Catena', z: 'Aci Catena',
    ind: 'Via Vampolieri 53, Aci Catena, Catania', a: 'Via Vampolieri 53/55',
    t: 'pizza pasta', voto: '4,8', rec: 348,
    d: 'Ristorante pizzeria bar sulla stessa via del Peschereccio. Il voto più alto di Aci Catena su Google Maps: 4,8 su 348 recensioni.'
  },

  /* ---------- Aci Castello: prima zero posti dove mangiare ---------- */
  {
    k: 'mase', n: 'Masè Ristorante di Pesce', com: 'Aci Castello', z: 'Aci Castello',
    ind: 'Via Savoia 35, Aci Castello, Catania', a: 'Via Savoia 35',
    t: 'pesce', voto: '4,8', rec: 421,
    d: 'Nel centro storico di Aci Castello, sotto il castello normanno. Aci Castello non aveva un solo posto dove mangiare in questa guida. Da Google Maps: 4,8 su 421 recensioni.'
  },
  {
    k: 'giancarlobarone', n: 'Ristorante Giancarlo Barone', com: 'Aci Castello', z: 'Aci Castello',
    ind: 'Lungomare Cristoforo Colombo 15, Aci Castello, Catania', a: 'Lungomare Cristoforo Colombo 15',
    t: 'pesce carne', voto: '4,3', rec: 2188,
    d: 'Fronte castello, vista sui faraglioni. Pesce e carne insieme, con oltre duemila recensioni: il locale più recensito della zona. Da Google Maps: 4,3 su 2188 recensioni.'
  },
  {
    k: 'bettola', n: 'Ristorante Bettola', com: 'Aci Castello', z: 'Aci Castello',
    ind: 'Piazza Castello 20, Aci Castello, Catania', a: 'Piazza Castello 20',
    t: 'pesce', voto: '4,1', rec: 886,
    d: 'Piatti di pesce in atmosfera familiare, sulla piazza del castello, con vista sui faraglioni di Aci Trezza. Da Google Maps: 4,1 su 886 recensioni.'
  },
  {
    /* Nominatim non indicizza "Lungomare dei Ciclopi" come via: geocodifico
       il centro di Aci Castello, che essendo un paese piccolo e compatto
       resta a poche centinaia di metri dall'indirizzo vero. */
    k: 'marinaigraziano', n: 'Osteria Dei Marinai da Graziano', com: 'Aci Castello', z: 'Aci Castello',
    ind: 'Aci Castello, Catania, Sicilia', a: 'Via Lungomare dei Ciclopi 185',
    t: 'pasta pesce', voto: '4,3', rec: 1167,
    d: 'Cucina mediterranea sul lungomare dei Ciclopi. Da Google Maps: 4,3 su 1167 recensioni.'
  },

  /* ---------- Aci Trezza: aggiunta una terza opzione di pesce ---------- */
  {
    /* stesso caso: la via non si geocodifica, uso il centro di Acitrezza */
    k: 'portonuovo', n: 'Trattoria Porto Nuovo', com: 'Aci Trezza', z: 'Aci Trezza',
    ind: 'Acitrezza, Catania, Sicilia', a: 'Via Lungomare 143/b',
    t: 'pesce', voto: '4,4', rec: 2480,
    d: 'Sul lungomare di Aci Trezza, il locale più recensito del borgo dei faraglioni. Da Google Maps: 4,4 su 2480 recensioni.'
  },

  /* ---------- Valverde: pizza e un secondo pesce, oltre a Tenuta Carminello ---------- */
  {
    k: 'tuttopizzavalverde', n: 'Tutto Pizza Valverde', com: 'Valverde', z: 'Valverde',
    ind: 'Via Calì 10, Valverde, Catania', a: 'Via Calì 10',
    t: 'pizza', voto: '4,5', rec: 328,
    d: 'Pizzeria di Valverde, sottile e croccante secondo le recensioni. Da Google Maps: 4,5 su 328 recensioni.'
  },
  {
    k: 'miro', n: 'Trattoria Miró', com: 'Valverde', z: 'Valverde',
    ind: 'Corso Vittorio Emanuele III 32, Valverde, Catania', a: 'Corso Vittorio Emanuele III 32',
    t: 'pesce', voto: '4,5', rec: 257,
    d: 'Cucina di pesce a Valverde, fascia di prezzo più alta della media della zona. Da Google Maps: 4,5 su 257 recensioni.'
  },

  /* ---------- Secondo giro (22 ago 2026): carne e street food, dove il
     primo giro era rimasto debole. Ad Acireale la carne era ferma a 4 posti
     contro i 5 di pesce e pizza: non una scelta, una prima ricerca troppo
     stretta. Qui ho cercato con termini più mirati (braceria, macelleria
     con cucina, griglia, steakhouse) e ho aggiunto lo street food, che
     prima mancava del tutto fuori da Catania. ---------- */

  /* Carne */
  {
    k: 'bracireale', n: 'Bracireale', com: 'Acireale', z: 'Acireale',
    ind: 'Via Salvatore Vigo 32, Acireale, Catania', a: 'Via Salvatore Vigo 32',
    t: 'carne street', voto: '4,7', rec: 37,
    d: 'Pollo allo spiedo e gastronomia da asporto, ad Acireale. Da Google Maps: 4,7 su 37 recensioni — un campione piccolo, da prendere con più cautela degli altri.'
  },
  {
    k: 'nerogrill', n: 'Nero Grill', com: 'Aci Bonaccorsi', z: 'Aci Bonaccorsi',
    ind: 'Piazza della Regione 3, Aci Bonaccorsi, Catania', a: 'Piazza della Regione 3',
    t: 'carne', voto: '4,6', rec: 288,
    d: 'Griglia in stile americano — brisket, costine, affumicati — ad Aci Bonaccorsi, il paese confinante con Aci Catena. Da Google Maps: 4,6 su 288 recensioni.'
  },
  {
    k: 'chilogrammo', n: 'Chilogrammo Steak House', com: 'Taormina', z: 'Taormina',
    ind: 'Via Giardinazzo 1, Taormina, Messina', a: 'Via Giardinazzo 1',
    t: 'carne', voto: '4,6', rec: 391,
    d: 'A Taormina, dove prima non c’era un solo posto per la carne in questa guida. Da Google Maps: 4,6 su 391 recensioni.'
  },
  {
    /* il vicolo non si geocodifica: uso il centro di Taormina, che dentro
       le mura del centro storico resta a poche centinaia di metri */
    k: 'adduma', n: 'Adduma', com: 'Taormina', z: 'Taormina',
    ind: 'Taormina, Messina, Sicilia', a: 'Vico Giordano Bruno 2',
    t: 'carne', voto: '4,7', rec: 408,
    d: 'La seconda griglia di Taormina che ho trovato, in un vicolo del centro. Da Google Maps: 4,7 su 408 recensioni.'
  },

  /* Street food, fuori Catania era quasi assente */
  {
    k: 'ilrosticcere', n: 'Il Rosticcere', com: 'Acireale', z: 'Acireale',
    ind: 'Corso Savoia 50, Acireale, Catania', a: 'Corso Savoia 50',
    t: 'street', voto: '4,6', rec: 778,
    d: 'Arancini e rosticceria sul corso principale di Acireale, uno dei più recensiti della città. Da Google Maps: 4,6 su 778 recensioni.'
  },
  {
    /* Via Annunziata non si geocodifica, e usare "Aci Catena, Catania,
       Sicilia" da sola avrebbe dato lo stesso punto esatto della partenza
       (stessa query!), col risultato assurdo di "0 min". Uso Via Vittorio
       Emanuele, la via centrale del paese, come punto di riferimento vero
       e diverso dal centroide. */
    k: 'chianalea', n: 'Arancini Rosticceria Siciliana Chianalea', com: 'Aci Catena', z: 'Aci Catena',
    ind: 'Via Vittorio Emanuele, Aci Catena, Catania', a: 'Via Annunziata 14',
    t: 'street', voto: '4,9', rec: 62,
    d: 'Rosticceria di paese ad Aci Catena, il voto più alto della zona su Google Maps: 4,9 su 62 recensioni.'
  },
  {
    k: 'stuzzichino', n: 'Stuzzichino', com: 'Aci Castello', z: 'Aci Castello',
    ind: 'Via Re Martino 161, Aci Castello, Catania', a: 'Via Re Martino 161',
    t: 'street', voto: '4,9', rec: 211,
    d: 'Arancini e pizza al volo ad Aci Castello. Da Google Maps: 4,9 su 211 recensioni.'
  },
  {
    k: 'girarrosto', n: 'Gastronomia Girarrosto di Leonardi Egidio', com: 'Giarre', z: 'Giarre',
    ind: 'Via Callipoli 299, Giarre, Catania', a: 'Via Callipoli 299',
    t: 'carne street', voto: '4,7', rec: 67,
    d: 'Rosticceria e polli allo spiedo a Giarre. Da Google Maps: 4,7 su 67 recensioni.'
  },
  {
    k: 'marino', n: 'Gastronomia Marino', com: 'Riposto', z: 'Riposto',
    ind: 'Via Cristoforo Colombo 19, Riposto, Catania', a: 'Via Cristoforo Colombo 19',
    t: 'street pesce carne', voto: '4,3', rec: 569,
    d: 'Gastronomia da asporto a Riposto: pizza al taglio, rosticceria, primi, piatti di pesce e di carne. Il locale più recensito del paese su Google Maps: 4,3 su 569 recensioni.'
  }
];
