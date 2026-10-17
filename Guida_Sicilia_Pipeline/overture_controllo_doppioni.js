/* Controllo doppioni su tutto dati.js dopo l'inserimento Overture, stesso
   metodo del 23 agosto: token del nome (senza parole generiche) +
   indirizzo esatto/prefisso, confrontati solo dentro la stessa zona. */
const fs = require('fs');
const src = fs.readFileSync('dati.js', 'utf8');
const arr = eval(src.replace('module.exports', 'var POSTI') + ';POSTI');

const GENERICHE = /\b(ristorante|pizzeria|trattoria|osteria|bar|caffe|cafe|di|da|dei|del|della|srl|snc|sas)\b/g;
function tokenNome(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '').replace(GENERICHE, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function normIndirizzo(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

const perZona = {};
arr.forEach((p, i) => { (perZona[p.z] = perZona[p.z] || []).push({ ...p, idx: i }); });

const trovati = [];
Object.values(perZona).forEach(lista => {
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i], b = lista[j];
      const ta = tokenNome(a.n), tb = tokenNome(b.n);
      const ia = normIndirizzo(a.a), ib = normIndirizzo(b.a);
      const nomeSimile = ta.length >= 4 && tb.length >= 4 && (ta === tb || ta.includes(tb) || tb.includes(ta));
      const indirizzoUguale = ia.length >= 6 && ib.length >= 6 && (ia === ib || ia.startsWith(ib) || ib.startsWith(ia));
      if (nomeSimile && indirizzoUguale) trovati.push([a.n, a.z, a.t, a.a, b.n, b.z, b.t, b.a]);
      else if (nomeSimile && !a.a && !b.a) trovati.push([a.n, a.z, a.t, '(no indirizzo)', b.n, b.z, b.t, '(no indirizzo)']);
    }
  }
});

console.log('coppie sospette trovate:', trovati.length);
trovati.forEach(([n1, z1, t1, a1, n2, z2, t2, a2]) => {
  console.log('---');
  console.log(' ', n1, '|', z1, '|', t1, '|', a1);
  console.log(' ', n2, '|', z2, '|', t2, '|', a2);
});
