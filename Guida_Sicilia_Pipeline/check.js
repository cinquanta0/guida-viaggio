const fs = require('fs');
const pdf = fs.readFileSync('testo.txt', 'utf8');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'Guida_Sicilia_Sito', 'index.html'), 'utf8');

// normalizza l'HTML: togli tag ed entita', abbassa tutto
html = html.replace(/<[^>]+>/g, ' ')
  .replace(/&egrave;/g, 'e').replace(/&agrave;/g, 'a').replace(/&ugrave;/g, 'u')
  .replace(/&igrave;/g, 'i').replace(/&ograve;/g, 'o').replace(/&eacute;/g, 'e')
  .replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ');
const norm = s => s.toLowerCase()
  .replace(/[àá]/g, 'a').replace(/[èé]/g, 'e').replace(/[ìí]/g, 'i')
  .replace(/[òó]/g, 'o').replace(/[ùú]/g, 'u')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const H = norm(html);

// righe del PDF che sembrano NOMI di posti: iniziano maiuscolo, corte, senza punto finale
const righe = pdf.split('\n').map(r => r.trim());
const nomi = [];
for (const r of righe) {
  if (r.length < 4 || r.length > 62) continue;
  if (/^-+ PAGINA/.test(r)) continue;
  if (!/^[A-ZÀÈÉÌÒÙ"'”]/.test(r)) continue;
  if (/[.:,;]$/.test(r)) continue;
  if (r.split(' ').length > 7) continue;
  if (/^(Mattina|Pomeriggio|Sera|Pranzo|Colazione|Giorno|Criterio|Palermo$|Catania$|Mare$|Dolci$|Shopping$|Budget)/.test(r)) continue;
  nomi.push(r);
}

const uniq = [...new Set(nomi)];
const mancanti = [];
for (const n of uniq) {
  const k = norm(n);
  if (!k) continue;
  // token significativi: parole > 3 lettere
  const tok = k.split(' ').filter(w => w.length > 3);
  if (!tok.length) continue;
  const trovati = tok.filter(w => H.indexOf(w) >= 0).length;
  if (trovati / tok.length < 0.6) mancanti.push(n);
}

console.log('nomi estratti dal PDF: ' + uniq.length);
console.log('non trovati nel sito: ' + mancanti.length + '\n');
mancanti.forEach(m => console.log('  - ' + m));
