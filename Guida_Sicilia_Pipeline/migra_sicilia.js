// migra_sicilia.js — aggiunge dest/id/aff/fonte a ogni scheda di dati.js
// Lavora riga per riga (un oggetto = una riga) per NON toccare nient'altro.
// Idempotente: salta le righe che hanno gia' aff:"".
// L'affidabilita' e' dedotta dalla FONTE gia' scritta nella descrizione, non inventata.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'dati.js');
const txt = fs.readFileSync(FILE, 'utf8');
const lines = txt.split(/\r?\n/);

function slug(s) {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // togli accenti
    .replace(/[’'`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
function field(line, key) {
  const m = line.match(new RegExp(key + ':"((?:[^"\\\\]|\\\\.)*)"'));
  return m ? m[1] : '';
}

const idSeen = Object.create(null);
let nSel = 0, nVer = 0, nAuto = 0, nSkip = 0, nObj = 0;
const esempi = { sel: [], ver: [], auto: [] };

const out = lines.map(line => {
  if (!/^\{/.test(line)) return line;          // non e' un oggetto
  nObj++;
  if (/\baff:"/.test(line)) { nSkip++; return line; } // gia' migrato

  const d = field(line, 'd');
  const n = field(line, 'n');
  const z = field(line, 'z');

  let aff, fonte;
  if (/Overture Maps/.test(d))        { aff = 'auto'; fonte = 'overture'; }
  else if (/Da Google Maps/.test(d))  { aff = 'ver';  fonte = 'google-maps'; }
  else if (/Fonte:/.test(d))          { aff = 'sel';  fonte = 'guida'; }
  else                                { aff = 'ver';  fonte = 'curato'; }

  if (aff === 'sel') nSel++; else if (aff === 'auto') nAuto++; else nVer++;

  // id univoco
  let base = 'sicilia-' + (slug(z) || 'zona') + '-' + (slug(n) || 'posto');
  let id = base, k = 2;
  while (idSeen[id]) id = base + '-' + (k++);
  idSeen[id] = 1;

  if (esempi[aff].length < 2) esempi[aff].push(n + '  [' + z + ']');

  // inietta i campi nuovi subito dopo la graffa di apertura
  return line.replace(/^\{/, '{dest:"sicilia", id:"' + id + '", aff:"' + aff + '", fonte:"' + fonte + '", ');
});

// salvataggio di sicurezza della versione pre-migrazione (oltre al backup gia' fatto)
if (!fs.existsSync(FILE + '.pre-migra')) fs.copyFileSync(FILE, FILE + '.pre-migra');
fs.writeFileSync(FILE, out.join('\n'), 'utf8');

console.log('Oggetti totali:', nObj);
console.log('Gia\' migrati (saltati):', nSkip);
console.log('--- assegnati ora ---');
console.log('sel :', nSel, '  es:', esempi.sel.join('  |  '));
console.log('ver :', nVer, '  es:', esempi.ver.join('  |  '));
console.log('auto:', nAuto, '  es:', esempi.auto.join('  |  '));
