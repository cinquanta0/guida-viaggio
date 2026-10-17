// Candidati dallo spazzolamento esaustivo di tutte le categorie cibo
// per Acireale e Aci Catena (richiesta esplicita utente, ago 2026).
// Ogni riga: nome esatto Google Maps, comune target per geocoding,
// indirizzo, zona (label sul sito), tag, descrizione.
module.exports = [
  // ACIREALE - pesce
  { n: "Philia Fish & Grill", com: "Acireale", ind: "Via Davì 43, Acireale", z: "Acireale", t: "pesce",
    d: "Cucina di pesce ad Acireale. Da Google Maps: 4,8 su 82 recensioni." },

  // ACIREALE - pizza
  { n: "Pizzeria La Stella", com: "Acireale", ind: "Via Pennisi 32, Acireale", z: "Acireale", t: "pizza",
    d: "Pizzeria ad Acireale. Da Google Maps: 4,7 su 267 recensioni." },
  { n: "Focacceria Acqua e Farina", com: "Acireale", ind: "Corso Savoia 111C, Acireale", z: "Acireale", t: "pizza street",
    d: "Focacceria e pizza al taglio sul Corso Savoia. Da Google Maps: 4,7 su 294 recensioni." },
  { n: "Pekó", com: "Acireale", ind: "Via S. Martino 9, Acireale", z: "Acireale", t: "pizza",
    d: "Pizzeria ad Acireale. Da Google Maps: 4,7 su 235 recensioni." },
  { n: "Pizzeria Garibaldi", com: "Acireale", ind: "Piazza Giuseppe Garibaldi 16/17, Acireale", z: "Acireale", t: "pizza",
    d: "Pizza da asporto in piazza Garibaldi. Da Google Maps: 4,7 su 107 recensioni." },
  { n: "Pizzeria Regina Margherita", com: "Acireale", ind: "Viale Regina Margherita 9, Acireale", z: "Acireale", t: "pizza",
    d: "Pizzeria ad Acireale. Da Google Maps: 4,7 su 104 recensioni." },
  { n: "Pizzeria Vecchia Stazione", com: "Acireale", ind: "Viale Libertà 24, Acireale", z: "Acireale", t: "pizza",
    d: "Pizzeria ad Acireale. Da Google Maps: 4,4 su 184 recensioni." },

  // ACIREALE - dolci
  { n: "Andrea D'Anna Patissiere", com: "Acireale", ind: "Via Fabio 37, Acireale", z: "Acireale", t: "dolci",
    d: "Pasticceria e gelato ad Acireale, il voto più alto della zona su Google Maps: 5,0 su 121 recensioni." },
  { n: "Gelateria Siculastreet", com: "Acireale", ind: "Via Vittorio Emanuele III 174, Acireale", z: "Acireale", t: "dolci",
    d: "Gelateria ad Acireale. Da Google Maps: 4,7 su 185 recensioni." },
  { n: "Gelateria Siculastreet (Piazza Vigo)", com: "Acireale", ind: "P.zza Lionardo Vigo 12, Acireale", z: "Acireale", t: "dolci",
    d: "Seconda sede della gelateria, in piazza Vigo. Da Google Maps: 4,8 su 65 recensioni." },
  { n: "Très Noir Gelateria Pasticceria", com: "Acireale", ind: "Très Noir Gelateria Pasticceria, Acireale", z: "Acireale", t: "dolci",
    d: "Gelateria e pasticceria ad Acireale. Da Google Maps: 4,0 su 270 recensioni." },
  { n: "Pasticceria Massimo Cannavò", com: "Acireale", ind: "Corso Savoia 141, Acireale", z: "Acireale", t: "dolci",
    d: "Pasticceria ad Acireale. Da Google Maps: 4,6 su 329 recensioni." },
  { n: "Al San Domenico Bar", com: "Acireale", ind: "Via Musmeci 66/68, Acireale", z: "Acireale", t: "dolci",
    d: "Bar e granite ad Acireale. Da Google Maps: 4,4 su 1082 recensioni." },
  { n: "Gelateria Rococó", com: "Acireale", ind: "Corso Umberto 109/111, Acireale", z: "Acireale", t: "dolci",
    d: "Gelateria artigianale ad Acireale. Da Google Maps: 4,3 su 476 recensioni." },
  { n: "Condorelli Orazio Bar E Pasticceria", com: "Acireale", ind: "Via Dottor Oreste Scionti 24/26, Acireale", z: "Acireale", t: "dolci",
    d: "Bar e pasticceria ad Acireale. Da Google Maps: 4,4 su 910 recensioni." },
  { n: "Caffè Cipriani", com: "Acireale", ind: "P.zza Lionardo Vigo 3, Acireale", z: "Acireale", t: "dolci",
    d: "Storico caffè in piazza Vigo, quasi 2600 recensioni. Da Google Maps: 4,3 su 2550 recensioni." },

  // ACIREALE - street/gastronomia
  { n: "Il re dello Street Food", com: "Acireale", ind: "Viale Libertà 14, Acireale", z: "Acireale", t: "street",
    d: "Gastronomia e street food ad Acireale. Da Google Maps: 4,3 su 323 recensioni." },
  { n: "Bontà siciliane", com: "Acireale", ind: "Via Sciarelle 73, Acireale", z: "Acireale", t: "street",
    d: "Gastronomia tipica siciliana ad Acireale. Da Google Maps: 4,7 su 249 recensioni." },
  { n: "Gastronomia Aci E Galatea", com: "Acireale", ind: "Via Torquato Tasso 17, Acireale", z: "Acireale", t: "street",
    d: "Gastronomia ad Acireale. Da Google Maps: 4,7 su 87 recensioni." },

  // ACI CATENA - dolci
  { n: "Pasticceria Mignemi", com: "Aci Catena", ind: "Piano Umberto 46, Aci Catena", z: "Aci Catena", t: "dolci",
    d: "Pasticceria ad Aci Catena. Da Google Maps: 4,5 su 295 recensioni." },
  { n: "Pasticceria Caffè & Dolcezze", com: "Aci Catena", ind: "Via Re Martino 211, Aci Catena", z: "Aci Catena", t: "dolci",
    d: "Pasticceria e gelato ad Aci Catena. Da Google Maps: 4,5 su 979 recensioni." },
  // Questi due: la mappa li mostra vicino ai confini con Acireale/Aci San Filippo -
  // si inseriscono SOLO se il geocoding conferma il comune "Aci Catena", altrimenti si scartano.
  { n: "La pasticceria Pistone", com: "Aci Catena", ind: "Via Croce 115/117, Aci Catena", z: "Aci Catena", t: "dolci",
    d: "Pasticceria ad Aci Catena. Da Google Maps: 4,3 su 114 recensioni." },
  { n: "Gran Cafè Solaire", com: "Aci Catena", ind: "Via Provinciale 81, Aci Catena", z: "Aci Catena", t: "dolci",
    d: "Bar e granite ad Aci Catena, tra i più recensiti della zona. Da Google Maps: 4,5 su 1572 recensioni." },
];
