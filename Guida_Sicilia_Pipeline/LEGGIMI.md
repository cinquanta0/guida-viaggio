# Pipeline della Guida Sicilia

Il sito in `..\Guida_Sicilia_Sito\` **e' generato, non scritto a mano**.
Non modificare `index.html` direttamente: la prossima build cancella tutto.

- Sito online: https://guida-sicilia-2026.web.app
- Progetto Firebase: `guida-sicilia-2026`

## Come si rigenera

```
cd C:\Users\lucad\Downloads\Guida_Sicilia_Pipeline
node build.js        # legge dati.js, scrive ..\Guida_Sicilia_Sito\index.html
node crediti.js      # OBBLIGATORIO SUBITO DOPO: riempie il segnaposto <!--CREDITI-->
node check.js        # confronta i tempi mostrati con quelli calcolati
```

Poi il deploy:

```
cd C:\Users\lucad\Downloads\Guida_Sicilia_Sito
firebase deploy
```

### Perche' `crediti.js` non e' opzionale

`build.js` lascia il commento `<!--CREDITI-->` al posto dell'elenco delle
licenze. Se si pubblica senza aver eseguito `crediti.js`, il sito va online
senza i crediti fotografici — cioe' fuori dalle licenze Creative Commons delle
138 foto. `node crediti.js --check` risponde con exit 1 se il segnaposto e'
ancora li': si puo' usare come ultimo controllo prima del deploy.

## I file

| file | a cosa serve |
|---|---|
| `dati.js` | i 309 posti, array di oggetti. **La sorgente di verita'.** |
| `build.js` | genera `index.html` da `dati.js` |
| `crediti.js` | inserisce i crediti fotografici da `credits.json` |
| `credits.json` | autore / licenza / fonte di ogni foto (143 voci, 138 usate) |
| `check.js` | rilegge l'HTML e verifica i tempi contro `testo.txt` |
| `tempi.js` | geocoding Nominatim + percorsi reali OSRM da Aci Catena |
| `search.js`, `categorie.js` | ricerca foto su Wikimedia Commons |
| `scarica_*.js`, `ultime*.js` | scaricatori usati una volta sola, tenuti come storico |

I campi di un posto: `b, n, z, min, km, piedi, t, g, fo, img, a, d`.
**Ogni script che riscrive `dati.js` deve riemetterli tutti**: una volta un
refactor ha perso `fo` (il fondo delle spiagge) e ha rotto in produzione il
filtro Sabbia/Ciottoli/Scogli senza che nessun test se ne accorgesse.

## Se si aggiungono posti o foto

I numeri in `..\Guida_Sicilia_Sito\come-e-fatto.html` (309 posti, 138 foto,
129 percorsi, 82 zone) sono **scritti a mano nell'HTML, non generati**:
vanno riallineati li' dentro.

## Stato

Verificato il 21 agosto 2026: `node build.js && node crediti.js` riproduce
`index.html` **byte per byte identico** alla versione online.

## Test del sito (cartella `test\`)

Girano su Chrome headless con eventi touch veri. Servono una volta sola:

```
cd C:\Users\lucad\Downloads\Guida_Sicilia_Pipeline\test
npm init -y && npm install puppeteer-core
```

Poi, con il sito servito in locale (`npx http-server C:\Users\lucad\Downloads\Guida_Sicilia_Sito -p 8899 -c-1`):

```
node test_tendina.js     # la tendina dei suggerimenti sul telefono
node test_completo.js    # tendina + filtri + link mappa + errori in console
node test_filtri.js      # ogni filtro si distingue da acceso a spento?
```

Con `SITO=https://guida-sicilia-2026.web.app/` puntano al sito pubblicato
invece che a quello locale.

**Perche' i test toccano lo schermo davvero:** simulare un click non basta.
Un tocco sul telefono chiude la tastiera, la pagina si ridimensiona e la
tendina si sposta da sotto il dito: con i click andava tutto bene nei test
e sul telefono non funzionava niente. Servono `page.touchscreen.*`.

**Attenzione leggendo i colori nei test:** i bottoni hanno una transizione
CSS, quindi `getComputedStyle` subito dopo il click restituisce ancora il
colore di partenza e sembra che non cambi niente. Aspettare ~300ms.

## Le gallerie di foto (carosello)

Una scheda con piu' foto mostra le freccette. Nei dati:

```
{ ..., img:"tindari.jpg", piu:["tindari-2.jpg","tindari-3.jpg"], ... }
```

`img` e' la prima foto, `piu` le successive. Una foto sola resta un `<img>`
semplice, senza impianto attorno. I nomi dei file seguono la chiave dei
crediti: `chiave.jpg`, `chiave-2.jpg`, `chiave-3.jpg`, ognuno con la sua
versione da 480px.

Lo scorrimento e' quello nativo del browser (`scroll-snap`), non scritto a
mano: cosi' e' il browser a decidere se il dito sta scorrendo le foto in
orizzontale o la pagina in verticale. Scriverlo a mano significa toglierglielo
di mano e bloccare la pagina sotto le dita.

Le foto in piu' sono tutte `loading="lazy"`: aprendo la pagina non pesano
niente, si scaricano solo se qualcuno le sfoglia. Misurato: la pagina passa
da 1,59 a 1,63 MB, e le foto scaricate all'apertura restano le stesse 17.

### Aggiungere foto

```
node proponi_extra.js proposta.json --tipo mare   # cerca candidate su Commons
node filtra_proposta.js proposta.json scarica.json # toglie doppioni e strisce
node scarica_gallerie.js scarica.json              # scarica, ridimensiona, crediti
node applica_gallerie.js                           # aggancia "piu" a dati.js
node build.js && node crediti.js
```

`proponi_extra.js` parte dalle categorie della foto gia' in uso e tiene solo
quelle che nominano il posto. **Non basta.** Le categorie di Commons
contengono di tutto: sulla prima passata sono uscite un'eruzione dell'Etna
per il porto di Riposto, dei fichi d'india per Cefalu' e una scritta
mussoliniana per Fondachello. La lista scritta a mano dentro
`filtra_proposta.js` esiste per questo.

**E anche i titoli non bastano.** Vanno guardate: `test/provino.js` fa un
foglio a contatto di tutte le foto nuove con l'etichetta sotto. Cosi' sono
saltate fuori una foto mezza nera, una che inquadra la faccia di sconosciuti
e una in cui il soggetto e' il cane di qualcuno davanti alla Scala dei
Turchi. Si tolgono con `node togli_foto.js nome-2.jpg` (file, crediti e
riferimento in dati.js in un colpo solo).

### Attenzione ai nomi che si ripetono

Una spiaggia chiamata "Praiola" esiste sia a Giarre sia a Terrasini, a 250 km
di distanza. `verifica_luogo.js` legge coordinate, categorie e descrizione di
un file e dice quanto dista da Aci Catena: e' cosi' che si e' evitato di
mettere la Praiola sbagliata sulla scheda di Giarre.

## La sezione del cibo

Dal 21 ago 2026 non e' piu' HTML scritto a mano dentro `build.js`: sta in
**`cibo.js`**, generata come tutto il resto. 38 voci.

```
{ n:"Pane cunzato", zona:"Trapani e Scopello", img:"panecunzato.jpg",
  p:"6&ndash;10 &euro;", d:"Pane caldo aperto e ..." }
```

`d` contiene HTML gia' pronto (entita' accentate e `<b>`), non passa
dall'escape. Per rigenerare dopo una modifica basta `node build.js`.

`componi_cibo.js` e' lo script che ha costruito `cibo.js` la prima volta
(estraendo le 16 schede originali con `estrai_cibo.js` invece di ricopiarle
a mano). Serve solo se si vuole rifare l'operazione da capo: **per aggiungere
un piatto si modifica direttamente `cibo.js`.**

### I prezzi sono stime, e lo dicono

Il campo `p` e' una **fascia indicativa**, non un dato verificato come i
tempi di percorrenza calcolati con OSRM. Per questo nel sito ogni prezzo ha
la parola "indicativo" accanto e in cima alla sezione c'e' un avviso.
Un numero stimato messo accanto a numeri veri, senza dirlo, sembra altrettanto
certo: e a fine agosto in un lido di Taormina sarebbe sbagliato di brutto.

### 13 voci senza foto

Cartocciata, cipollina, iris, minne di Sant'Agata, schiacciata, pidone,
pignolata, pesce spada alla ghiotta, stigghiola, patacalzone, cassatelle
trapanesi, rianata, vini. Su Commons non ci sono immagini libere utilizzabili:
cercate per titolo e per categoria, senza risultato. Restano schede di solo
testo, come le 161 dei ristoranti. **Non mettere una foto generica al loro
posto.**

Attenzione ai nomi che si somigliano: cercando "cassatelle" escono quelle
**di Agira** (ripiene di cioccolato, provincia di Enna), che non sono le
cassatelle trapanesi con la ricotta. Per questo quella scheda e' senza foto.

### Trovare le foto dei piatti: passare da Wikipedia

Su Commons bisogna indovinare come si chiama il file, e per i piatti
regionali il nome puo' essere qualsiasi cosa: cercando "pidone" non esce
niente, il file si chiama `Pidoni-Wikipedia.jpg`. Cercando "minne di
Sant'Agata" nemmeno: si chiama `Minnuzze di sant'aita.jpg`.

`foto_da_wikipedia.js` fa il giro giusto: cerca la voce su it.wikipedia,
guarda che immagini usa, e solo dopo chiede a Commons misure e licenza.
Su tredici piatti rimasti scoperti ne ha risolti sette in un colpo, dove
due giri di ricerca per titolo su Commons ne avevano trovato uno.

```
node foto_da_wikipedia.js piatti.json risultato.json
```

Restano senza foto sei voci: cipollina, schiacciata catanese, pignolata,
pesce spada alla ghiotta, patacalzone, rianata. Su Commons non c'e' niente
di utilizzabile nemmeno passando dalle voci di Wikipedia.

## La ricerca e la sezione cibo

Fino al 21 ago 2026 la sezione dei piatti **stava fuori dalla ricerca**: il
filtro raccoglieva solo `.fascia[data-f] .p`, e la fascia del cibo quel
`data-f` non ce l'ha. Risultato: cercando "cannolo" restavano 11 posti dove
mangiarlo, ma le 38 schede dei piatti restavano tutte visibili e la scheda
"Cannolo" non veniva ne' isolata ne' evidenziata. Il campo di ricerca dice
«per esempio: Pachino, arancini, granita»: prometteva una cosa che non
faceva.

Adesso ogni scheda di piatto ha `data-cibo="1"`, `data-n` e `data-s`, e la
fascia ha `data-cibo="1"`. In `app.js` i piatti sono una lista a parte.

**I piatti rispondono al testo cercato e al TIPO, non alla caratteristica ne'
al fondo.** Ogni voce di `cibo.js` ha un campo `t` con lo stesso vocabolario
dei posti (street, dolci, pasta, pesce, carne, pizza, spesa), che diventa il
chip colorato sulla scheda e la fa rispondere al filtro CHE COSA: "Dolci e
granita" tira su 12 piatti, "Street food" 15. Caratteristica e fondo invece
li lasciano stare, perche' sono proprieta' che solo i posti hanno: un
arancino non ha un fondo di sabbia. Ci sono due test che lo verificano,
perche' e' una decisione e non un caso.

I nomi dei piatti sono anche in `window.SUGG`, in coda: se una parola e'
insieme un posto e un piatto vincono i posti. `vaiAiRisultati` cerca il nome
prima fra i posti e poi fra i piatti, cosi' scegliendo "Patacalzone" dalla
tendina si finisce sulla sua scheda, evidenziata come un posto qualsiasi.

**Attenzione agli apostrofi**: `data-n` non passa da `e()`. Quella funzione
trasforma l'apostrofo dritto in `&rsquo;` e le vocali accentate in entita',
e il valore letto dal DOM non combacerebbe piu' con la stringa dentro
`window.SUGG` — la tendina proporrebbe "Minne di Sant'Agata" e poi non
troverebbe la scheda. Per gli attributi c'e' `attr()`, che scappa solo
`& < > "`.

### Trovare le foto: svuotare le categorie invece di indovinare

`pesca_cucina.js` scarica l'elenco di **tutti** i file dentro le categorie di
Commons sulla cucina siciliana e le loro sottocategorie (474 file), e lo
salva. Poi si cercano le parole chiave dentro quell'elenco.

E' il metodo che funziona meglio dei tre provati, perche' i nomi dei file non
seguono nessuna regola: cercando "cipollina" per titolo non usciva niente,
ma dentro la categoria il file si chiama esattamente `Cipollina.jpg`.

```
node pesca_cucina.js elenco_cucina.json
node -e "const e=require('./elenco_cucina.json'); console.log(e.filter(f=>/rollo/i.test(f)))"
```

### Il rollò: due cose con lo stesso nome

Cercando il rollò catanese (wurstel nella pasta brioche) escono **12 foto**
su Commons, tutte di un'altra cosa: il **rollò nisseno**, un dolce di
marzapane di Caltanissetta. Le categorie lo dicono: "Cuisine of
Caltanissetta", "Marzipan in Italy". Metterle sulla scheda catanese sarebbe
stata una foto falsa, come la Praiola di Terrasini.

La scheda resta senza foto e avvisa del doppio nome. **Prima di usare una
foto trovata per nome, guardare le categorie del file.**

### Otto voci restano senza foto

Schiacciata catanese, carne di cavallo, rollò, pignolata
messinese, pasta 'ncasciata, pesce spada alla ghiotta, maccu di fave,
patacalzone. Cercate in quattro modi: titolo su Commons, voci di Wikipedia,
enumerazione delle categorie, ricerca a testo pieno. Su Commons non esistono.

Provato anche **Openverse** (`cerca_openverse.js`), che indicizza Flickr e
altri archivi tenendo solo licenze aperte: per questi piatti non ha niente.
L'unica foto di carne di cavallo che esiste e' una ricetta **matinese**,
cioe' pugliese, e da 598px: scartata perche' la scheda parla di Catania.

L'arrusti e mangia invece la foto ce l'ha, trovata dentro
`Category:Food in Catania`: `Butchers Sicily 1-10-21.jpg`, il banco di una
macelleria in provincia di Catania. La descrizione del file lo dice.

### Mettere una foto tua

Per gli otto piatti che nessun archivio libero ha, c'e' `foto_mia.js`:

```
node foto_mia.js "Carne di cavallo" C:\percorso\foto.jpg --autore "Luca"
node componi_cibo.js && node build.js && node crediti.js
```

Ridimensiona nelle due misure (ritagliando in orizzontale se la foto e'
verticale), scrive il credito come foto propria invece che come licenza
Commons, e aggancia il file alla scheda giusta. Il nome della scheda si puo'
scrivere senza accenti: "rollo", "carne di cavallo", "patacalzone". Con un
nome sbagliato stampa l'elenco delle schede ancora senza foto.

Provato davvero, non solo scritto.

## Posti aggiunti dal web, non dal PDF

Il PDF di partenza copriva Catania, Palermo e Taormina, e altrove elencava
solo monumenti e spiagge. Restavano zone dove il sito manda a vedere qualcosa
e poi non dice dove mangiare. Il 21 ago 2026 ne sono state chiuse tre:

- **Aci Trezza** (11 min, 0 posti da mangiare): Trattoria Il Nespolo,
  A putia di Colapesce
- **Noto** (89 min, 0 posti): Caffe' Sicilia, Caffe' Costanzo
- **Ragusa e Ibla** (117 min, 0 posti): La Bettola, Panificio Giummarra

`aggiungi_posti.js` li ha inseriti. **I tempi non sono stimati**: passano da
`tempi.js` come tutti gli altri, e le coordinate sono state controllate
contro il centro del paese giusto — una geocodifica restituiva
"Via Marina, Barriera" ma il punto cadeva davvero ad Aci Trezza.

**Ogni scheda dice da dove viene**, con una riga finale: «dalla stampa
gastronomica, non dal documento di partenza». Non hanno l'etichetta
"Da locali", perche' non ho di che sostenerla.

**Giarre e Riposto sono state coperte il 22 ago 2026.** Erano rimaste
scoperte perche' cercando uscivano solo classifiche di TheFork e TripAdvisor,
cioe' voti di chi prenota online. Cercando su guide gastronomiche vere sono
saltati fuori **Casu Osteria Contemporanea** a Giarre (guida Michelin e premio
Best in Sicily come trattoria) e **Vico Astemio** a Riposto (selezione
Michelin). La regola non e' cambiata: e' cambiata la fonte.

### Attenzione scrivendo dentro dati.js

Le schede dei posti passano da `e()`, che scappa `&` e `<`. Quindi nei nomi e
nelle descrizioni servono **lettere accentate vere** (à, è, ì) e **niente tag
HTML**: scrivendo `&egrave;` esce `&amp;egrave;` e il lettore vede la scritta
`&egrave;`. Solo `cibo.js` accetta HTML gia' pronto.

E l'ultima scheda del file puo' non avere la virgola finale: inserendo dopo
di lei senza aggiungerla, l'array si spacca.

### Un test intermittente

`test_carosello.js` e `test_completo.js` ogni tanto (circa 1 volta su 7)
falliscono un controllo sullo scorrimento, e passano rifacendoli subito.
Aspettano un tempo fisso dopo uno scorrimento animato, e a volte
l'animazione non ha ancora finito. **Non e' un difetto del sito.** Se
capita, rifare il giro: se fallisce due volte di fila allora e' vero.

## Il tag «Ci vanno i siciliani» (22 ago 2026)

Quarantuno schede portano questo segno. E' l'affermazione piu' forte del sito,
quindi ha una regola stretta:

**Ci entra solo un locale segnalato per la cucina da una guida gastronomica, e
ogni scheda dice quale**, dentro il testo (`Fonte: ...`). Le classifiche di
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

1. `candidati_veri.js` — l'elenco, con la `fonte` di ognuno. Un candidato con
   il campo `fuori: 'motivo'` e' stato escluso a mano e **non va ripescato**:
   gli script lo saltano. Senza quel campo tornavano dentro a ogni giro, perche'
   non avere coordinate li faceva sembrare solo "non ancora fatti".
2. `verifica_veri.js` — cerca ognuno su OpenStreetMap (Overpass) e calcola il
   percorso con OSRM. Scrive `veri_verificati.json`.
3. `recupera_veri.js` — secondo giro sui mancanti, con raggio piu' largo, e
   **stampa i 5 nomi piu' vicini** per ogni candidato.
4. `ispeziona_dubbi.js` — mostra un POI per esteso, con tutti i tag e
   l'indirizzo, per decidere a mano.
5. `aggancia_mano.js` / `aggancia_indirizzi.js` — per chi non si trova
   automaticamente: coordinate messe a mano, o geocodifica dell'indirizzo
   dichiarato dalla fonte.
6. `aggiungi_veri.js` — inserisce in `dati.js`. **Appende**, non riscrive.
7. `verifica_indirizzi.js` / `correggi_indirizzi.js` — vedi sotto.

### Confrontare due insegne sbaglia in tutti e due i versi

Non esiste una soglia che vada bene:

- `"Angio', macelleria di mare"` ha preso **1.00** contro `"Trattoria Il Mare"`,
  perche' la parola *mare* c'e' in tutte e due.
- `"Agricolab"` si e' agganciato a `"Pasticceria G"`: normalizzando restava la
  sola lettera `g`, che sta dentro qualunque parola.
- `"U Sulicce'nti"` dava **0.00** contro `"Antica Osteria U Suliccenti"`, che e'
  lo stesso locale: l'apostrofo spezzava la parola.

Quello che funziona e' **stampare i cinque nomi piu' vicini e guardarli**.
Serve anche normalizzare i numeri (`Quattro Archi` = `4 Archi`).

### Overpass risponde 0 per stanchezza, non perche' non c'e' niente

Dopo molte richieste comincia a restituire `0 esercizi` per comuni interi:
Riposto, Taormina, Sinagra, e poi una dozzina di fila. Sono **falsi negativi**.
Uno 0 secco va sempre ritentato, o aggirato geocodificando l'indirizzo.

### Gli indirizzi: non scriverli se la fonte non li da'

Errore fatto e corretto il 22 ago. Scrivendo le schede avevo messo il civico
anche dove la guida dava solo nome e paese: **18 indirizzi inventati**. Scoperti
quando Cronache di Gusto li ha pubblicati per esteso e due non combaciavano
(Fratelli Borrello e' in contrada Forte, non Fiumara; Andrea e' sul corso, non
in via Machiavelli). `correggi_indirizzi.js` li ha tolti tutti.

**Togliere non rompe niente**: il link "Apri in mappa" si costruisce con nome +
zona, non con l'indirizzo.

`verifica_indirizzi.js` fa il reverse geocoding delle coordinate e confronta la
via. **Non e' una prova**: in un centro storico restituisce quasi sempre il
vicolo accanto, quindi da' decine di falsi allarmi. Serve solo a tirare fuori i
casi da guardare.

## I due filtri sul mangiare

Primi due bottoni di CHE COSA. **Non sono tipi scritti in `dati.js`**: li
aggiunge `tipiFiltro()` dentro `build.js` al valore di `data-t`,
e non producono chip sulle schede.

| Bottone | Regola | Quanti |
|---|---|---|
| **Ristoranti** | `pasta` / `pesce` / `carne`: ci si siede e si fa un pasto | 114 |
| **Dove si mangia** | tutti e sei i tipi di cibo, pasticcerie e friggitorie comprese | 208 |

Una **pizzeria-trattoria** (`pizza pasta`) sta dentro *Ristoranti*: c'e' il
primo e ci si siede. Sono 11. Restano fuori le pizzerie pure, le 42 pasticcerie
e gelaterie e le 15 friggitorie.

Servono perche' i bottoni di uno stesso gruppo **si escludono a vicenda**:
premendo *Pesce* si spegne *Pizza*, quindi senza questi due non c'era modo di
vedere i ristoranti tutti insieme.

Li protegge `test/test_mangiare.js` (13 verifiche), che controlla anche che
nessuna pasticceria entri fra i ristoranti e che le pizzerie-trattorie invece
ci restino.
