/* Terzo giro (22 ago 2026), dopo che l'utente ha fatto notare che Aci Catena
   restava con un solo posto di pesce/carne — lo stesso locale contato due
   volte perché fa entrambi i tipi insieme (Al Peschereccio).

   Cercando "pesce Aci Catena" da sola (prima non l'avevo mai fatto, solo
   una ricerca combinata "carne pesce") sono usciti soprattutto pescherie —
   negozi di pesce, non ristoranti — e locali di Aci Sant'Antonio, il paese
   letteralmente confinante con Aci Catena, mai cercato prima.

   Scartate le pescherie pure (Risto pesce europa, Pianeta Mare): vendono
   pesce, non lo cucinano per essere mangiato lì. Un negozio non è un
   ristorante, anche se Google lo mette nella stessa lista. */
module.exports = [
  {
    /* Viale della Regione non si geocodifica: uso il centro del paese,
       che essendo Aci Sant'Antonio a soli 5 minuti da casa lascia comunque
       un margine di errore piccolo */
    k: 'gastropescheria', n: 'Gastropescheria La Regina del Mare', com: 'Aci Sant\'Antonio', z: 'Aci Sant’Antonio',
    ind: 'Aci Sant\'Antonio, Catania, Sicilia', a: 'Viale della Regione 13',
    t: 'pesce', voto: '4,5', rec: 279,
    d: 'Ristorante di pesce ad Aci Sant’Antonio, il paese confinante con Aci Catena. Da Google Maps: 4,5 su 279 recensioni.'
  },
  {
    k: 'streetbyruderi', n: 'Street Food by Ruderi', com: 'Aci Sant\'Antonio', z: 'Aci Sant’Antonio',
    ind: 'Via Aldo Moro 37, Aci Sant\'Antonio, Catania', a: 'Via Aldo Moro 37',
    t: 'pesce street', voto: '4,3', rec: 133,
    d: 'Cucina di pesce in versione street food, sempre ad Aci Sant’Antonio. Da Google Maps: 4,3 su 133 recensioni.'
  }
];
