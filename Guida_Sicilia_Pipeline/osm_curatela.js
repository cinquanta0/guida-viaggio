// Confronta i risultati grezzi OSM (osm_raw/*.json) con dati.js e produce
// la lista di candidati nuovi per comune/categoria, con dedup migliorato
// (per token del nome, non solo sottostringa) e una lista separata di
// "possibili duplicati" da controllare a mano.

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, 'osm_raw');
const dati = require('./dati.js');
const comuni = require('./osm_comuni_vicini.json');

const STOPWORD = new Set([
  'il','lo','la','i','gli','le','di','del','dello','della','dei','degli','delle',
  'da','al','allo','alla','ai','agli','alle','e','ed','o','u','a',
  'ristorante','ristorantino','trattoria','trattorina','pizzeria','pizzeria-trattoria',
  'bar','caffe','caffetteria','osteria','hotel','residence','gelateria','pasticceria',
  'panificio','panetteria','locanda','taverna','pub','sicilia','sicilian','siciliano',
  'antico','antica','nuovo','nuova','da','di','ristoro','food','shop','store'
]);

function norm(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // rimuove accenti
    .replace(/[‘’']/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function tokenSignificativi(nome) {
  return norm(nome).filter(t => !STOPWORD.has(t) && t.length > 2);
}

// mappa: per ogni comune, quali zone di dati.js sono rilevanti
function zoneDiComune(comune) {
  const c = norm(comune).join(' ');
  const zoneUniche = [...new Set(dati.map(p => p.z))];
  return zoneUniche.filter(z => {
    const zn = norm(z).join(' ');
    return zn.includes(c) || c.includes(zn);
  });
}

function main() {
  const comuniEntro70 = comuni.filter(c => c.km <= 70);
  const risultato = {}; // comune -> { nuovi: [...], possibiliDuplicati: [...] }
  let totNuovi = 0, totDup = 0, comuniConDati = 0;

  for (const c of comuniEntro70) {
    const file = path.join(RAW_DIR, c.nome.replace(/[^a-zA-Z0-9]/g, '_') + '.json');
    if (!fs.existsSync(file)) continue; // non ancora scaricato
    const grezzi = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (grezzi.length === 0) continue;
    comuniConDati++;

    const zoneRilevanti = zoneDiComune(c.nome);
    const esistenti = dati.filter(p => zoneRilevanti.includes(p.z));
    const esistentiTok = esistenti.map(p => ({ p, tok: new Set(tokenSignificativi(p.n)) }));

    // dedup interno ai risultati grezzi (stesso comune, stesso nome)
    const visti = new Map();
    for (const el of grezzi) {
      const chiave = tokenSignificativi(el.nome).join('_') || el.nome.toLowerCase();
      if (!visti.has(chiave)) visti.set(chiave, el);
    }
    const unici = [...visti.values()];

    const nuovi = [];
    const possibiliDup = [];

    for (const el of unici) {
      const tokEl = new Set(tokenSignificativi(el.nome));
      if (tokEl.size === 0) continue; // nome troppo generico (es. solo stopword)
      let match = null;
      for (const e of esistentiTok) {
        for (const t of tokEl) {
          if (e.tok.has(t)) { match = e.p; break; }
        }
        if (match) break;
      }
      if (match) {
        possibiliDup.push({ ...el, sospettoDuplicatoDi: match.n });
      } else {
        nuovi.push(el);
      }
    }

    if (nuovi.length || possibiliDup.length) {
      risultato[c.nome] = {
        km: c.km,
        esistentiInGuida: esistenti.length,
        nuovi,
        possibiliDuplicati: possibiliDup,
      };
      totNuovi += nuovi.length;
      totDup += possibiliDup.length;
    }
  }

  fs.writeFileSync('osm_candidati_curati.json', JSON.stringify(risultato, null, 2));
  console.log(`Comuni con dati scaricati: ${comuniConDati}`);
  console.log(`Comuni con almeno un candidato: ${Object.keys(risultato).length}`);
  console.log(`Totale candidati NUOVI: ${totNuovi}`);
  console.log(`Totale possibili duplicati (da controllare a mano): ${totDup}`);
}

main();
