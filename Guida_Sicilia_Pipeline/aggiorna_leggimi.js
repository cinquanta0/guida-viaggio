/* Aggiorna il LEGGIMI: il paragrafo su Giarre e Riposto ora e' falso, e i
   dodici script del 22 agosto non sono documentati da nessuna parte.

   Uso: node aggiorna_leggimi.js  */

const fs = require('fs');
const F = 'LEGGIMI.md';

let s = fs.readFileSync(F, 'utf8');

/* 1. Giarre e Riposto non sono piu' scoperte */
const VECCHIO = `**Giarre e Riposto restano scoperte di proposito.** Cercando, uscivano solo
classifiche di TheFork e TripAdvisor, cioe' voti di chi prenota online: e'
esattamente la fonte che questo sito esiste per evitare. Meglio un buco
dichiarato che una lista da aggregatore.`;

const NUOVO = `**Giarre e Riposto sono state coperte il 22 ago 2026.** Erano rimaste
scoperte perche' cercando uscivano solo classifiche di TheFork e TripAdvisor,
cioe' voti di chi prenota online. Cercando su guide gastronomiche vere sono
saltati fuori **Casu Osteria Contemporanea** a Giarre (guida Michelin e premio
Best in Sicily come trattoria) e **Vico Astemio** a Riposto (selezione
Michelin). La regola non e' cambiata: e' cambiata la fonte.`;

if (s.indexOf(VECCHIO) >= 0) { s = s.replace(VECCHIO, NUOVO); console.log('aggiornato il paragrafo su Giarre e Riposto'); }
else if (s.indexOf('sono state coperte il 22 ago') >= 0) console.log('paragrafo Giarre/Riposto: gia aggiornato');
else console.log('ATTENZIONE: paragrafo Giarre/Riposto non trovato');

/* 2. la sezione nuova, in fondo */
const SEZIONE = `

## Il tag «Ci vanno i siciliani» (22 ago 2026)

Quarantuno schede portano questo segno. E' l'affermazione piu' forte del sito,
quindi ha una regola stretta:

**Ci entra solo un locale segnalato per la cucina da una guida gastronomica, e
ogni scheda dice quale**, dentro il testo (\`Fonte: ...\`). Le classifiche di
prenotazione online non contano: sono i voti di chi prenota su internet, cioe'
il pubblico da cui il tag vorrebbe distinguersi.

Fonti usate, in ordine di resa:

| Fonte | Cosa da |
|---|---|
| **Cronache di Gusto** | due elenchi da 10 trattorie (Sicilia orientale e occidentale) **con indirizzo e telefono**. La migliore: 11 locali nuovi. Da consultare per prima |
| Chiocciole Slow Food 2026 | le 20 siciliane; 19 sono nel sito (Le Macine e' a Lipari, vedi sotto) |
| Bib Gourmand Michelin | Veneziano, dai Pennisi, Palazzaccio... |
| 50 Top Italy trattorie | I Banchi (20esima d'Italia), Fattoria Borrello (42esima) |
| Alleanza Slow Food dei cuochi | Giannavi', e conferme |

**Non ci entrano gli stellati** (Shalai, Zash, Dodici Fontane): si mangia
benissimo, ma a 120 euro non e' la domanda a cui il tag risponde.

**Non ci entrano i locali sulle isole** (Le Macine a Lipari, Villa Carla a
Salina): tutto il sito ordina per minuti di auto da Aci Catena, e un posto che
richiede il traghetto avrebbe un numero senza senso accanto agli altri.

### Gli script, nell'ordine

1. \`candidati_veri.js\` — l'elenco, con la \`fonte\` di ognuno. Un candidato con
   il campo \`fuori: 'motivo'\` e' stato escluso a mano e **non va ripescato**:
   gli script lo saltano. Senza quel campo tornavano dentro a ogni giro, perche'
   non avere coordinate li faceva sembrare solo "non ancora fatti".
2. \`verifica_veri.js\` — cerca ognuno su OpenStreetMap (Overpass) e calcola il
   percorso con OSRM. Scrive \`veri_verificati.json\`.
3. \`recupera_veri.js\` — secondo giro sui mancanti, con raggio piu' largo, e
   **stampa i 5 nomi piu' vicini** per ogni candidato.
4. \`ispeziona_dubbi.js\` — mostra un POI per esteso, con tutti i tag e
   l'indirizzo, per decidere a mano.
5. \`aggancia_mano.js\` / \`aggancia_indirizzi.js\` — per chi non si trova
   automaticamente: coordinate messe a mano, o geocodifica dell'indirizzo
   dichiarato dalla fonte.
6. \`aggiungi_veri.js\` — inserisce in \`dati.js\`. **Appende**, non riscrive.
7. \`verifica_indirizzi.js\` / \`correggi_indirizzi.js\` — vedi sotto.

### Confrontare due insegne sbaglia in tutti e due i versi

Non esiste una soglia che vada bene:

- \`"Angio', macelleria di mare"\` ha preso **1.00** contro \`"Trattoria Il Mare"\`,
  perche' la parola *mare* c'e' in tutte e due.
- \`"Agricolab"\` si e' agganciato a \`"Pasticceria G"\`: normalizzando restava la
  sola lettera \`g\`, che sta dentro qualunque parola.
- \`"U Sulicce'nti"\` dava **0.00** contro \`"Antica Osteria U Suliccenti"\`, che e'
  lo stesso locale: l'apostrofo spezzava la parola.

Quello che funziona e' **stampare i cinque nomi piu' vicini e guardarli**.
Serve anche normalizzare i numeri (\`Quattro Archi\` = \`4 Archi\`).

### Overpass risponde 0 per stanchezza, non perche' non c'e' niente

Dopo molte richieste comincia a restituire \`0 esercizi\` per comuni interi:
Riposto, Taormina, Sinagra, e poi una dozzina di fila. Sono **falsi negativi**.
Uno 0 secco va sempre ritentato, o aggirato geocodificando l'indirizzo.

### Gli indirizzi: non scriverli se la fonte non li da'

Errore fatto e corretto il 22 ago. Scrivendo le schede avevo messo il civico
anche dove la guida dava solo nome e paese: **18 indirizzi inventati**. Scoperti
quando Cronache di Gusto li ha pubblicati per esteso e due non combaciavano
(Fratelli Borrello e' in contrada Forte, non Fiumara; Andrea e' sul corso, non
in via Machiavelli). \`correggi_indirizzi.js\` li ha tolti tutti.

**Togliere non rompe niente**: il link "Apri in mappa" si costruisce con nome +
zona, non con l'indirizzo.

\`verifica_indirizzi.js\` fa il reverse geocoding delle coordinate e confronta la
via. **Non e' una prova**: in un centro storico restituisce quasi sempre il
vicolo accanto, quindi da' decine di falsi allarmi. Serve solo a tirare fuori i
casi da guardare.

## Il filtro «Dove si mangia»

Primo bottone di CHE COSA. **Non e' un tipo scritto in \`dati.js\`**: e' la somma
dei sei tipi di cibo (\`pizza pesce carne pasta dolci street\`), aggiunta al
\`data-t\` da \`tipiFiltro()\` dentro \`build.js\`. Non produce chip sulle schede.

Serve perche' i bottoni di uno stesso gruppo **si escludono a vicenda**: prima,
per vedere tutti i posti dove si mangia, bisognava premerne sei uno alla volta.
Lo protegge \`test/test_mangiare.js\`.
`;

if (s.indexOf('## Il tag «Ci vanno i siciliani»') >= 0) console.log('sezione sul tag: gia presente');
else { s = s.trimEnd() + SEZIONE; console.log('aggiunta la sezione sul tag e sugli script'); }

fs.writeFileSync(F, s, 'utf8');
console.log('LEGGIMI.md: ' + s.split('\n').length + ' righe');
