/* Quinto giro (22 ago 2026): le sei zone con buchi seri trovate dall'audit
   su tutto il sito, non solo casa. Siracusa aveva zero carne E zero pizza,
   Ragusa era quasi vuota su tutti i tipi, Modica/Cefalù/Trapani/Messina
   zero carne. Stessa regola: niente tag "siciliani", voto e recensioni per
   esteso in ogni scheda. */
module.exports = [
  /* ---------- Siracusa: zero carne, zero pizza ---------- */
  {
    k: 'touchebeef', n: 'Touchè Beefstrò', com: 'Siracusa', z: 'Siracusa',
    ind: 'Via Nino Bixio 12, Siracusa, Siracusa', a: 'Via Nino Bixio 12',
    t: 'carne', voto: '4,6', rec: 512,
    d: 'Steakhouse nel centro di Siracusa, fra i più recensiti per la carne in città. Da Google Maps: 4,6 su 512 recensioni.'
  },
  {
    k: 'beefore', n: 'BEEFore Steak House', com: 'Siracusa', z: 'Siracusa',
    ind: 'Via Gemmellaro 28, Siracusa, Siracusa', a: 'Via Gemmellaro 28',
    t: 'carne', voto: '4,7', rec: 174,
    d: 'Steakhouse a Siracusa. Da Google Maps: 4,7 su 174 recensioni.'
  },
  {
    k: 'ilmatto', n: 'Il Matto', com: 'Siracusa', z: 'Siracusa',
    ind: 'Via Francesco Crispi 21, Siracusa, Siracusa', a: 'Via Francesco Crispi 21',
    t: 'pizza', voto: '4,7', rec: 976,
    d: 'Pizzeria molto recensita di Siracusa. Da Google Maps: 4,7 su 976 recensioni.'
  },
  {
    k: 'vabbepizza', n: 'Vabbè Pizza', com: 'Siracusa', z: 'Siracusa',
    ind: 'Viale Polibio 54, Siracusa, Siracusa', a: 'Viale Polibio 54',
    t: 'pizza', voto: '4,9', rec: 536,
    d: 'Il voto più alto fra le pizzerie di Siracusa su Google Maps: 4,9 su 536 recensioni.'
  },

  /* ---------- Ragusa: quasi vuota su tutti i tipi ---------- */
  {
    k: 'labettolaragusa', n: 'Trattoria La Bettola', com: 'Ragusa', z: 'Ragusa',
    ind: 'Largo Camerina 7, Ragusa, Ragusa', a: 'Largo Camerina 7',
    t: 'pasta', voto: '4,6', rec: 2709,
    d: 'Cucina classica siciliana, una delle trattorie più recensite di Ragusa. Da Google Maps: 4,6 su 2709 recensioni.'
  },
  {
    k: 'mamatrattoria', n: 'Mamà Trattoria', com: 'Ragusa', z: 'Ragusa',
    ind: 'Via Mariannina Coffa 24, Ragusa, Ragusa', a: 'Via Mariannina Coffa 24',
    t: 'pasta', voto: '4,7', rec: 401,
    d: 'Piccola trattoria ragusana. Da Google Maps: 4,7 su 401 recensioni.'
  },
  {
    k: 'daluigiragusa', n: 'Trattoria da Luigi', com: 'Ragusa', z: 'Ragusa',
    ind: 'Corso Vittorio Veneto 96, Ragusa, Ragusa', a: 'Corso Vittorio Veneto 96',
    t: 'pasta', voto: '4,5', rec: 1303,
    d: 'Trattoria nel centro di Ragusa. Da Google Maps: 4,5 su 1303 recensioni.'
  },
  {
    k: 'tavernalupo', n: 'La Taverna del Lupo', com: 'Ragusa', z: 'Ragusa',
    ind: 'Piazza dei Cappuccini 22, Ragusa, Ragusa', a: 'Piazza dei Cappuccini 22',
    t: 'pasta pesce', voto: '4,5', rec: 1354,
    d: 'Cucina siciliana con primi di pesce, a Ragusa. Da Google Maps: 4,5 su 1354 recensioni.'
  },
  {
    k: 'scaledelgusto', n: 'Scale del Gusto', com: 'Ragusa', z: 'Ragusa',
    ind: 'Largo Santa Maria 1, Ragusa, Ragusa', a: 'Largo Santa Maria 1',
    t: 'pasta', voto: '4,7', rec: 404,
    d: 'Piatti tipici ragusani rivisitati. Da Google Maps: 4,7 su 404 recensioni.'
  },

  /* ---------- Modica: zero carne ---------- */
  {
    k: 'lamerceria', n: 'La Merceria — Braceria', com: 'Modica', z: 'Modica',
    ind: 'Via Marchesa Tedeschi 14, Modica, Ragusa', a: 'Via Marchesa Tedeschi 14',
    t: 'carne', voto: '4,6', rec: 340,
    d: 'Hamburger, panini e braceria a Modica, la città del cioccolato che non aveva un solo posto per la carne. Da Google Maps: 4,6 su 340 recensioni.'
  },

  /* ---------- Cefalù: zero carne, zero dolci ---------- */
  {
    k: 'bifbraceria', n: 'B.I.F. Braceria Italiana Fuorimondo', com: 'Cefalù', z: 'Cefalù',
    ind: 'Via Madonna degli Angeli 12, Cefalù, Palermo', a: 'Via Madonna degli Angeli 12',
    t: 'carne', voto: '4,7', rec: 916,
    d: 'Steakhouse a Cefalù, dove prima non c’era un solo posto per la carne. Da Google Maps: 4,7 su 916 recensioni.'
  },
  {
    k: 'monchouchou', n: 'Mon Chou-Chou', com: 'Cefalù', z: 'Cefalù',
    ind: 'Via Giglio 29, Cefalù, Palermo', a: 'Via Giglio 29',
    t: 'dolci', voto: '4,9', rec: 584,
    d: 'Pasticceria a Cefalù, il voto più alto della zona su Google Maps: 4,9 su 584 recensioni.'
  },
  {
    k: 'saporedisale', n: 'Sapore di Sale', com: 'Cefalù', z: 'Cefalù',
    ind: 'Corso Ruggero 160, Cefalù, Palermo', a: 'Corso Ruggero 160',
    t: 'dolci', voto: '4,8', rec: 941,
    d: 'Gelateria sul corso principale di Cefalù. Da Google Maps: 4,8 su 941 recensioni.'
  },

  /* ---------- Trapani: zero carne ---------- */
  {
    k: 'camponorcineria', n: 'Ristorante Campo Norcineria con Cucina', com: 'Trapani', z: 'Trapani',
    ind: 'Lungomare Dante Alighieri 12, Trapani, Trapani', a: 'Lungomare Dante Alighieri 12',
    t: 'carne', voto: '4,6', rec: 1048,
    d: 'Norcineria con cucina sul lungomare di Trapani, che non aveva un solo posto per la carne. Da Google Maps: 4,6 su 1048 recensioni.'
  },
  {
    k: 'bbqsteakhouse', n: 'BBQ Steakhouse', com: 'Trapani', z: 'Trapani',
    ind: 'Via Nausica 1, Trapani, Trapani', a: 'Via Nausica 1',
    t: 'carne', voto: '4,5', rec: 533,
    d: 'Steakhouse a Trapani. Da Google Maps: 4,5 su 533 recensioni.'
  },

  /* ---------- Messina: zero carne ---------- */
  {
    k: 'smoksmokehouse', n: 'Smok Smokehouse', com: 'Messina', z: 'Messina',
    ind: 'Via Lepanto 21, Messina, Messina', a: 'Via Lepanto 21/25',
    t: 'carne', voto: '4,7', rec: 159,
    d: 'Carne affumicata a Messina, che non aveva un solo posto per la carne. Da Google Maps: 4,7 su 159 recensioni.'
  },
  {
    k: 'mannaia', n: 'Mannaia — La Braceria', com: 'Messina', z: 'Messina',
    ind: 'Via Giorgio La Pira 6, Messina, Messina', a: 'Via Giorgio La Pira 6',
    t: 'carne', voto: '4,6', rec: 119,
    d: 'Braceria a Messina. Da Google Maps: 4,6 su 119 recensioni.'
  }
];
