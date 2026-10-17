/* Candidati per il tag "Ci vanno i siciliani".

   REGOLA DI AMMISSIONE: ci entra solo un locale che una guida gastronomica
   riconosciuta ha segnalato per la cucina, non un locale ben piazzato in una
   classifica di prenotazioni online. TheFork e TripAdvisor NON sono fonti:
   sono voti di chi prenota su internet, cioe' esattamente il pubblico da cui
   questo tag vuole distinguersi.

   Ogni scheda porta scritta la sua fonte. Il campo `fonte` finisce nel testo
   della descrizione, cosi' il lettore sa chi l'ha detto e puo' non fidarsi.

   NON sono ammessi qui i ristoranti stellati da 120 euro (Shalai, Zash,
   Dodici Fontane): si mangia benissimo, ma "dove vanno i siciliani" e' un'altra
   cosa e mescolarli svuoterebbe il tag. Restano fuori.

   `osm` = come cercarlo su OpenStreetMap, quando il nome da guida non coincide
   col nome dell'insegna. Serve a verificare che il locale esista davvero.  */

module.exports = [
  /* ---------- Etna e paesi vicino casa ---------- */
  {
    k: 'quattroarchi', n: '4 Archi', z: 'Milo', com: 'Milo',
    t: 'pasta carne', g: 'siciliani nascosto', a: 'Via Francesco Crispi 9',
    fonte: 'Chiocciola Slow Food e Tre Gamberi del Gambero Rosso',
    d: 'Osteria di montagna aperta dal 1995 ai piedi dell’Etna, in un paese di seicento abitanti. In cucina c’è Lina: funghi, verdure di stagione, pasta fatta a mano, maialino nero dei Nebrodi, e la pizza nel forno a legna. È uno dei tre locali siciliani con i Tre Gamberi, e Milo non è un posto in cui si capita per caso: ci si va apposta.'
  },
  {
    k: 'sangiorgiodrago', n: 'San Giorgio e il Drago', z: 'Randazzo', com: 'Randazzo',
    t: 'pasta carne', g: 'siciliani nascosto', a: 'Piazza San Giorgio 28',
    fonte: 'Chiocciola Slow Food',
    d: 'Trattoria dentro il borgo medievale di Randazzo, sul versante nord dell’Etna. Cucina di territorio vera: verdure di stagione, funghi, salumi e formaggi dei Nebrodi, pasta fresca tirata a mano. Randazzo è di pietra lavica nera ed è fuori dal giro dei pullman.'
  },
  {
    k: 'veneziano', n: 'Ristorante Veneziano', z: 'Randazzo', com: 'Randazzo',
    t: 'carne pasta', g: 'siciliani', a: 'Contrada Arena',
    fonte: 'Bib Gourmand della guida Michelin',
    d: 'Fuori dal paese, in contrada Arena. Piatti semplici e generosi: funghi dell’Etna, formaggi locali, maialino nero dei Nebrodi. Il Bib Gourmand è il simbolo che la Michelin dà a chi fa mangiare bene spendendo poco, ed è il riconoscimento giusto da cercare per un posto così.'
  },
  {
    k: 'daipennisi', n: 'In cucina dai Pennisi', z: 'Linguaglossa', com: 'Linguaglossa',
    t: 'carne', g: 'siciliani', a: 'Via Umberto I 9',
    fonte: 'Bib Gourmand della guida Michelin, new entry 2026',
    d: 'Macelleria con cucina: si sceglie il taglio al banco e lo cuociono sulla fiamma viva. Carni frollate in casa e poi marinate. Circa 30 euro, indicativo. È il modo in cui i paesi dell’Etna hanno sempre mangiato la carne, prima che diventasse una moda in città.'
  },
  {
    k: 'linguagrossa', n: 'Trattoria LinguaGrossa', z: 'Linguaglossa', com: 'Linguaglossa',
    t: 'pasta', g: 'siciliani eco', a: 'Via Guglielmo Marconi 100',
    fonte: 'segnalata dalla stampa gastronomica (Scatti di Gusto)',
    d: 'Trattoria di paese con i vini dell’Etna. Pane fritto con i carciofi, casarecce fatte a mano, gli “sciauni” che sono ravioli fritti. Sui 35–40 euro, indicativo.'
  },
  {
    k: 'osterianicosia', n: 'L’Osteria di Cantine Nicosia', z: 'Trecastagni', com: 'Trecastagni',
    t: 'pasta carne', g: 'siciliani', a: 'Via Luigi Capuana 51',
    fonte: 'Alleanza Slow Food dei cuochi',
    d: 'L’osteria della cantina, sul versante sud dell’Etna. Fa parte dell’Alleanza Slow Food, cioè dei cuochi che si impegnano a usare i presidi e i piccoli produttori del territorio. Si mangia con i vini della casa.'
  },
  {
    k: 'pasticceriarusso', n: 'Pasticceria Russo', z: 'Santa Venerina', com: 'Santa Venerina',
    t: 'dolci', g: 'siciliani', a: 'Via Vittorio Emanuele 105',
    fonte: 'segnalata dalla stampa gastronomica (Scatti di Gusto)',
    d: 'Pasticceria di paese dal 1880, a un quarto d’ora da casa. Granite e pasticceria siciliana senza scenografie per turisti. Santa Venerina è un paese di passaggio: nessuno ci va per fare foto, ci si ferma per la granita.'
  },
  {
    k: 'musumeci', n: 'Pasticceria Musumeci', z: 'Randazzo', com: 'Randazzo',
    t: 'dolci', g: 'siciliani', a: 'Piazza Santa Maria 5',
    fonte: 'segnalata dalla stampa gastronomica (Scatti di Gusto)',
    d: 'Giovanna Musumeci fa granite di gelso, mandorla e perfino di melanzana, e si diverte con il salato: pizza fritta con la granita, focaccia con la pancetta. Vale la sosta se si sale a Randazzo.'
  },

  /* ---------- Il buco dichiarato: Giarre e Riposto ---------- */
  {
    k: 'casu', n: 'Casu Osteria Contemporanea', z: 'Giarre', com: 'Giarre',
    t: 'pasta pesce', g: 'siciliani', a: 'Corso Italia 294',
    fonte: 'guida Michelin e premio Best in Sicily 2024 come trattoria',
    d: 'Mario Casu ha aperto nel 2022 dentro l’ex fabbrica di confetti in cui entrava da bambino. Poche tavole sul corso, menu che cambia, prezzi onesti. Giarre era rimasta scoperta in questa guida proprio perché di locali se ne trovavano solo nelle classifiche di prenotazione: questo invece è segnalato per la cucina.'
  },
  {
    k: 'vicoastemio', n: 'Vico Astemio', z: 'Riposto', com: 'Riposto',
    t: 'pesce', g: 'siciliani', a: 'Via Camillo Benso Conte di Cavour 34',
    fonte: 'selezione della guida Michelin',
    d: 'In un vicolo di Riposto, da cui il nome. Pesce e carne con un menu che segue la stagione, e una carta dei vini scelta bene. Riposto è il porto sotto l’Etna: il pesce arriva lì. Anche questa zona era rimasta scoperta.'
  },

  /* ---------- Catania, i posti dei catanesi ---------- */
  {
    k: 'cumparituriddu', n: 'Mé Cumpari Turiddu', z: 'Catania', com: 'Catania',
    t: 'pasta carne', g: 'siciliani top', a: 'Piazza Turi Ferro 36',
    fonte: 'Chiocciola Slow Food e Bib Gourmand della guida Michelin',
    d: 'Osteria e putia insieme: si mangia in mezzo agli scaffali di piccole produzioni artigianali siciliane, che si possono anche comprare. Cucina della memoria, fatta con i presidi Slow Food. È l’unico locale di Catania ad avere sia la Chiocciola sia il Bib Gourmand.'
  },
  {
    k: 'agricolab', fuori: 'su OSM esiste solo Agricolab al Borgo dell Etna, a 27 km da dove la fonte lo colloca: non e detto sia lo stesso', n: 'Agricolab', z: 'Catania', com: 'Catania',
    t: 'pasta', g: 'siciliani nascosto', a: 'Via Pacini 3',
    fonte: 'segnalato da Slow Food Travel Etna e Catania',
    d: 'Pochi coperti nel cuore di Catania, il menu segue le stagioni e i piccoli produttori. Piccolo davvero: conviene prenotare.'
  },
  {
    k: 'angio', fuori: 'a Catania su OSM non risulta: ci sono solo gli ottici Angiolucci', n: 'Angiò, macelleria di mare', z: 'Catania', com: 'Catania',
    t: 'pesce', g: 'siciliani nascosto', a: 'Viale Africa 28h',
    fonte: 'segnalato dalla stampa gastronomica (Scatti di Gusto)',
    d: 'Alberto Angiolucci tratta il pesce come un macellaio tratta la carne: usa tutto, dalla testa alla coda. Ceviche di triglia, “salame di mare”. Non è una trattoria classica ed è lontano dal giro turistico del centro.'
  },

  /* ---------- Monti Iblei e Val di Noto: i paesi dell'interno ---------- */
  {
    k: 'andrea', n: 'Andrea — Sapori Montani', z: 'Palazzolo Acreide', com: 'Palazzolo Acreide',
    t: 'carne pasta', g: 'siciliani nascosto', a: 'Via Machiavelli 5',
    fonte: 'Chiocciola Slow Food e Bib Gourmand della guida Michelin',
    d: 'Palazzolo Acreide è un paese barocco sui monti Iblei con tre osterie nella guida Slow Food: una densità che non ha nemmeno Palermo. Questa è quella dei sapori di montagna, carne e paste fatte in casa, e ha anche il Bib Gourmand.'
  },
  {
    k: 'scrigno', n: 'Lo Scrigno dei Sapori', z: 'Palazzolo Acreide', com: 'Palazzolo Acreide',
    t: 'pasta carne', g: 'siciliani nascosto', a: 'Via Maddalena 46',
    fonte: 'Chiocciola Slow Food',
    d: 'La seconda delle tre osterie di Palazzolo premiate da Slow Food. Cucina iblea di casa, in un paese dove si sale apposta.'
  },
  {
    k: 'trattoriagallo', n: 'Trattoria del Gallo', z: 'Palazzolo Acreide', com: 'Palazzolo Acreide',
    t: 'pasta carne', g: 'siciliani nascosto eco', a: 'Via Roma 228',
    fonte: 'Chiocciola Slow Food',
    d: 'La terza di Palazzolo Acreide, e la più semplice: trattoria di paese a conduzione familiare. Se le altre due sono piene, questa è il posto.'
  },
  {
    k: 'sulliccenti', n: 'U Sulicce’nti', z: 'Rosolini', com: 'Rosolini',
    t: 'pasta carne', g: 'siciliani nascosto', a: 'Via Sipione 177',
    fonte: 'Chiocciola Slow Food',
    d: 'Rosolini non è un paese che si visita: è un paese dove si vive, nell’estremo sud. Per questo l’osteria è fatta per chi ci abita, e la Chiocciola dice che è fatta bene.'
  },
  {
    k: 'cucinaevino', n: 'Cucina e Vino', z: 'Ragusa Ibla', com: 'Ragusa',
    t: 'pasta carne', g: 'siciliani eco', a: 'Via Orfanotrofio 91',
    fonte: 'Chiocciola Slow Food',
    d: 'Dentro Ibla, a due passi dai palazzi barocchi ma su tutt’altro registro: trattoria vera, prezzi da trattoria. Nel posto più fotografato della Sicilia sud-orientale è la scelta che fanno i ragusani.'
  },
  {
    k: 'mammaiabica', n: 'Latteria Mamma Iabica', z: 'Siracusa', com: 'Siracusa',
    t: 'pasta', g: 'siciliani', a: 'Via Cavour 15',
    fonte: 'Chiocciola Slow Food',
    d: 'A Siracusa, dove quasi tutto è tarato sul turista di Ortigia, questa è una latteria-osteria che punta su formaggi e cucina del territorio.'
  },

  /* ---------- Messina, Nebrodi e Taormina ---------- */
  {
    k: 'casaputia', n: 'Casa & Putia', z: 'Messina', com: 'Messina',
    t: 'pasta pesce', g: 'siciliani', a: 'Via dei Verdi 62',
    fonte: 'Chiocciola Slow Food',
    d: 'Osteria e bottega a Messina, con la cucina dello Stretto: pesce azzurro, verdure, pasta fatta in casa.'
  },
  {
    k: 'fratelliborrello', n: 'Fratelli Borrello', z: 'Sinagra', com: 'Sinagra',
    t: 'carne', g: 'siciliani nascosto', a: 'Contrada Fiumara',
    fonte: 'Chiocciola Slow Food',
    d: 'Sui Nebrodi, in un paese di tremila abitanti. I Borrello allevano il suino nero dei Nebrodi, presidio Slow Food, e lo cucinano loro. Qui il tag “ci vanno i siciliani” è letterale: a Sinagra non arriva nessun altro.'
  },
  {
    k: 'maialenero', fuori: 'doppione: sostituito da maialenero2, agganciato al centro di Raccuja', n: 'Fattoria Borrello — Osteria del Maiale Nero', z: 'Raccuja', com: 'Raccuja',
    t: 'carne', g: 'siciliani nascosto', a: 'Contrada Cardusa',
    fonte: 'Chiocciola Slow Food',
    d: 'L’altra osteria di famiglia, a Raccuja, ancora più dentro i Nebrodi. Salumi e carne di suino nero allevato allo stato brado.'
  },
  {
    k: 'daluciana', n: 'Da Luciana', z: 'San Piero Patti', com: 'San Piero Patti',
    t: 'pasta carne', g: 'siciliani nascosto', a: 'Contrada Scala',
    fonte: 'guida Osterie d’Italia di Slow Food',
    d: 'Osteria di campagna sui Nebrodi, in un paese che non compare su nessuna guida turistica.'
  },
  {
    k: 'tischitoschi', n: 'Tischi Toschi', z: 'Taormina', com: 'Taormina',
    t: 'pasta', g: 'siciliani', a: 'Via Paladini 3',
    fonte: 'Tre Gamberi del Gambero Rosso',
    d: 'Sedici coperti in una via laterale di Taormina, cioè l’esatto contrario di quello che ci si aspetta a Taormina. Cucina siciliana di ricerca a prezzi da trattoria: è uno dei tre locali siciliani con i Tre Gamberi. Prenotare, sempre.'
  },

  /* ---------- Fuori portata giornaliera, ma nella guida ---------- */
  {
    k: 'nangalarruni', n: 'Nangalarruni', z: 'Castelbuono', com: 'Castelbuono',
    t: 'carne pasta', g: 'siciliani nascosto', a: 'Via delle Confraternite 5',
    fonte: 'Chiocciola Slow Food e Bib Gourmand della guida Michelin',
    d: 'Sulle Madonie, il regno dei funghi e del manna. Giuseppe Carollo cucina funghi, erbe spontanee e carni locali. Castelbuono è un borgo dell’interno: da Aci Catena è un’escursione, non una cena.'
  },
  {
    k: 'palazzaccio', n: 'Palazzaccio', z: 'Castelbuono', com: 'Castelbuono',
    t: 'pasta carne', g: 'siciliani nascosto eco', a: 'Via Umberto I 23',
    fonte: 'Bib Gourmand della guida Michelin',
    d: 'L’altra tavola di Castelbuono, semplice e a buon prezzo, cucina madonita.'
  },
  {
    k: 'coronatrattoria', n: 'Corona Trattoria', z: 'Palermo', com: 'Palermo',
    t: 'pesce pasta', g: 'siciliani', a: 'Via Guglielmo Marconi 9',
    fonte: 'Chiocciola Slow Food',
    d: 'Trattoria palermitana di quartiere, pesce e cucina popolare.'
  },
  {
    k: 'buatta', n: 'Buatta Cucina Popolana', z: 'Palermo', com: 'Palermo',
    t: 'pasta carne', g: 'siciliani', a: 'Via Vittorio Emanuele 176',
    fonte: 'Bib Gourmand della guida Michelin e Tre Gamberi del Gambero Rosso',
    d: 'Cucina popolare palermitana rifatta bene: sarde a beccafico, pasta con le sarde, involtini. Anche questo ha i Tre Gamberi.'
  },
  {
    k: 'cantinasiciliana', n: 'Cantina Siciliana', z: 'Trapani', com: 'Trapani',
    t: 'pesce pasta', g: 'siciliani', a: 'Via Giudecca 36',
    fonte: 'Chiocciola Slow Food',
    d: 'Nel quartiere ebraico di Trapani, cucina trapanese: cous cous di pesce, busiate col pesto alla trapanese.'
  },

  /* ---------- Secondo giro (22 ago 2026) ----------
     Le Chiocciole che al primo giro avevo lasciato fuori perche' lontane.
     Non era una mia decisione da prendere: la richiesta era di metterli
     tutti, e la fascia "oltre 2h30" esiste apposta per i posti che si
     raggiungono solo spostando la base. Piu' i nomi usciti dalle altre
     guide.

     Le Macine di Lipari resta fuori, e per un motivo diverso: e' su
     un'isola. Tutto il sito ordina i posti per minuti di auto da Aci
     Catena, e un locale che richiede il traghetto avrebbe un numero
     che non vuol dire niente accanto a tutti gli altri.  */
  {
    k: 'ginger', n: 'Ginger People & Food', z: 'Agrigento', com: 'Agrigento',
    t: 'pasta carne', g: 'siciliani', a: 'Via Giovanni Battista Morello 10',
    fonte: 'Chiocciola Slow Food e Alleanza Slow Food dei cuochi',
    d: 'Nel centro di Agrigento, a due passi dalla Valle dei Templi ma su un altro pianeta rispetto ai menu turistici della zona. Cucina agrigentina fatta con i piccoli produttori.'
  },
  {
    k: 'terracotta', n: 'Terracotta', z: 'Agrigento', com: 'Agrigento',
    t: 'pasta pesce', g: 'siciliani', a: 'Via Panoramica dei Templi 9',
    fonte: 'guida Osterie d’Italia di Slow Food',
    d: 'L’altra osteria di Agrigento segnalata da Slow Food, sulla strada dei templi.'
  },
  {
    k: 'oasimare', n: 'Oasi Osteria del Mare', z: 'Licata', com: 'Licata',
    t: 'pesce', g: 'siciliani nascosto', a: 'Via Sergente Profumo 11',
    fonte: 'Chiocciola Slow Food e Alleanza Slow Food dei cuochi',
    d: 'Licata è un porto di pescatori che non compare su nessun itinerario turistico. L’osteria lavora il pescato del giorno, ed è una delle venti Chiocciole siciliane.'
  },
  {
    k: 'arrhais', n: 'Arrhais', z: 'Pollina', com: 'Pollina',
    t: 'carne pasta', g: 'siciliani nascosto', a: 'Corso Sicilia 2, Finale di Pollina',
    fonte: 'Chiocciola Slow Food',
    d: 'Pollina è un borgo delle Madonie a settecento metri, mille abitanti, affacciato sul mare da lontano. Cucina madonita: erbe, funghi, carni, formaggi del posto.'
  },
  {
    k: 'caupona', n: 'Caupona Taverna di Sicilia', z: 'Trapani', com: 'Trapani',
    t: 'pasta pesce', g: 'siciliani', a: 'Via Torrearsa 13',
    fonte: 'Chiocciola Slow Food',
    d: 'La seconda Chiocciola di Trapani, insieme a Cantina Siciliana. Cucina trapanese di terra e di mare.'
  },
  {
    k: 'giannavi', n: 'Agriturismo Giannavì', z: 'Palazzolo Acreide', com: 'Palazzolo Acreide',
    t: 'carne pasta', g: 'siciliani nascosto', a: 'Contrada Giannavì',
    fonte: 'Alleanza Slow Food dei cuochi',
    d: 'La quarta tavola di Palazzolo Acreide riconosciuta da Slow Food, e l’unica in campagna: agriturismo che cucina quello che coltiva e alleva.'
  },

  /* ---------- Terzo giro: la classifica 50 Top Italy delle trattorie ----------
     Fonte che non avevo consultato, ed e' pubblicata online per intero.
     Delle tre siciliane in classifica una era gia' dentro (Corona Trattoria,
     25esima); le altre due sono queste. Nessuna delle due si trova su
     OpenStreetMap, quindi prendo le coordinate dell'indirizzo dichiarato,
     come per Vico Astemio.  */
  {
    k: 'ibanchi', n: 'I Banchi', z: 'Ragusa Ibla', com: 'Ragusa',
    t: 'pasta pizza', g: 'siciliani', a: 'Via Orfanotrofio 39',
    fonte: 'ventesima trattoria d’Italia per la classifica 50 Top Italy 2026',
    d: 'Panificio con cucina dentro Ibla, aperto da Ciccio Sultano: è la sua tavola informale, non il ristorante stellato. Pane, pizza e piatti ragusani a prezzi da trattoria, ed è la trattoria siciliana più in alto nella classifica 50 Top Italy. Sulla stessa via, al 91, c’è Cucina e Vino: due modi diversi di mangiare bene a cento metri l’uno dall’altro.'
  },
  {
    k: 'maialenero2', n: 'Fattoria Borrello — Osteria del Maiale Nero', z: 'Raccuja', com: 'Raccuja',
    t: 'carne', g: 'siciliani nascosto', a: 'Contrada Bosco',
    fonte: 'Chiocciola Slow Food e quarantaduesima trattoria d’Italia per 50 Top Italy 2026',
    d: 'Cento ettari dentro il parco dei Nebrodi: allevano il suino nero allo stato brado, lo stagionano e lo cucinano loro, nella stessa fattoria. È la sorella di Fratelli Borrello di Sinagra, stessa famiglia. Raccuja ha milletrecento abitanti e non ci passa nessuno per caso. Attenzione al segnaposto: la fattoria è in contrada Bosco, fuori dal paese, ma quella contrada sulle mappe non risulta, quindi il punto indica il centro di Raccuja e il tempo è calcolato fin lì. Telefonate per farvi dire la strada.'
  },

  /* ---------- Quarto giro: le venti trattorie di Cronache di Gusto ----------
     Testata gastronomica siciliana, due elenchi da dieci (Sicilia orientale e
     occidentale) con nome, indirizzo e telefono di ognuna. E' la fonte che
     mancava: locale, dettagliata e fatta apposta per le trattorie.
     Nove erano gia' dentro da altre guide, e le riconferma.
     Villa Carla (Leni, Salina) resta fuori come Le Macine: e' su un'isola.  */
  {
    k: 'ulocale', n: 'Osteria U’Locale', z: 'Buccheri', com: 'Buccheri',
    t: 'carne pasta', g: 'siciliani nascosto', a: 'Via Dusmet 14',
    fonte: 'le dieci migliori trattorie della Sicilia orientale per Cronache di Gusto',
    d: 'Buccheri sta a ottocento metri sui monti Iblei e ha duemila abitanti. Verdure selvatiche, tagliatelle fatte in casa, spiedini di pecora: cucina iblea di montagna, che è una cosa diversa dal barocco del Val di Noto lì sotto.'
  },
  {
    k: 'terramia', n: 'Terra Mia', z: 'Castiglione di Sicilia', com: 'Castiglione di Sicilia',
    t: 'pasta carne', g: 'siciliani nascosto', a: 'SP64, frazione Solicchiata',
    fonte: 'le dieci migliori trattorie della Sicilia orientale per Cronache di Gusto',
    d: 'A Solicchiata, in mezzo alle vigne dell’Etna nord. Leonardo Cuscona fa ricette semplici di una volta: paste fresche, funghi, trote dei Nebrodi.'
  },
  {
    k: 'colonnello', n: 'Locanda del Colonnello', z: 'Modica', com: 'Modica',
    t: 'pasta pesce', g: 'siciliani', a: 'Vico Biscari 6',
    fonte: 'le dieci migliori trattorie della Sicilia orientale per Cronache di Gusto',
    d: 'In un vicolo di Modica, sopra la scalinata. Ravioli di patate, pesce in guazzetto, prodotti iblei trattati con fantasia. Modica è piena di posti per turisti: questo non lo è.'
  },
  {
    k: 'albagatto', n: 'Al Bagatto', z: 'Milazzo', com: 'Milazzo',
    t: 'pasta carne', g: 'siciliani', a: 'Via Regis 11',
    fonte: 'le dieci migliori trattorie della Sicilia orientale per Cronache di Gusto',
    d: 'A Milazzo, dove quasi tutti si fermano solo per prendere il traghetto per le Eolie. Pasta fresca con farine antiche, carne modicana, ortaggi del giorno.'
  },
  {
    k: 'donciccio', n: 'Don Ciccio', z: 'Bagheria', com: 'Bagheria',
    t: 'pasta carne', g: 'siciliani', a: 'Via del Cavaliere 87',
    fonte: 'le dieci migliori trattorie della Sicilia occidentale per Cronache di Gusto',
    d: 'Trattoria storica di Bagheria: pasta con le sarde e bruciuluni, cioè gli involtini palermitani. Tradizione senza rifacimenti.'
  },
  {
    k: 'latonnara', n: 'La Tonnara', z: 'Castellammare del Golfo', com: 'Castellammare del Golfo',
    t: 'pesce', g: 'siciliani', a: 'Via Don Luigi Zangara 29',
    fonte: 'le dieci migliori trattorie della Sicilia occidentale per Cronache di Gusto',
    d: 'Pesce fresco a Castellammare: linguine con le ostriche e anemone di mare.'
  },
  {
    k: 'osteriafolli', n: 'Osteria dei Folli', z: 'Realmonte', com: 'Realmonte',
    t: 'carne pasta', g: 'siciliani nascosto', a: 'Piazza Umberto I 27',
    fonte: 'le dieci migliori trattorie della Sicilia occidentale per Cronache di Gusto',
    d: 'Nella piazza di Realmonte, il paese della Scala dei Turchi: menu del giorno con prodotti biologici del posto e carni Dop. Chi visita la Scala di solito mangia sulla spiaggia, non qui.'
  },
  {
    k: 'terrehimera', n: 'Terre di Himera', z: 'Termini Imerese', com: 'Termini Imerese',
    t: 'carne', g: 'siciliani nascosto', a: 'Contrada Villaurea',
    fonte: 'le dieci migliori trattorie della Sicilia occidentale per Cronache di Gusto',
    d: 'Cucina di casa fuori Termini Imerese: carni sul barbecue e verdure dell’orto.'
  },
  {
    k: 'diegolina', n: 'Diegolina', z: 'Guarrato, Trapani', com: 'Trapani',
    t: 'carne', g: 'siciliani nascosto', a: 'Via Marsala 104, frazione Guarrato',
    fonte: 'le dieci migliori trattorie della Sicilia occidentale per Cronache di Gusto',
    d: 'In una frazione di campagna fuori Trapani: cucina di casa, carni scelte e quinto quarto, cioè le parti che nei ristoranti eleganti non si vedono mai.'
  },
  {
    k: 'forneriamessina', n: 'Antica Forneria Messina', z: 'Monreale', com: 'Monreale',
    t: 'pizza pasta', g: 'siciliani', a: 'Viale Regione Siciliana 100, San Martino delle Scale',
    fonte: 'le dieci migliori trattorie della Sicilia occidentale per Cronache di Gusto',
    d: 'A San Martino delle Scale, sopra Monreale, in montagna: pizza artigianale, pasta fresca e carni servite sulla ghisa.'
  },
  {
    k: 'alritrovo', n: 'Al Ritrovo', z: 'San Vito Lo Capo', com: 'San Vito Lo Capo',
    t: 'pesce', g: 'siciliani', a: 'Viale Cristoforo Colombo 314, Castelluccio',
    fonte: 'le dieci migliori trattorie della Sicilia occidentale per Cronache di Gusto',
    d: 'Cous cous di pesce e frutti di mare a San Vito, che di cous cous è la capitale. Sta a Castelluccio, fuori dal centro pedonale pieno di locali per turisti.'
  }
];
