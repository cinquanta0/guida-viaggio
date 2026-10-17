const fs = require('fs');
const d = JSON.parse(fs.readFileSync('candidati_overture.json', 'utf8'));

function pulisciNome(n) {
  return n
    .replace(/#\S+/g, '')                    // hashtag incollati nel nome
    .replace(/[""]/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

let modificati = 0;
d.forEach(x => {
  const pulito = pulisciNome(x.nome);
  if (pulito !== x.nome) { modificati++; x.nomeOriginale = x.nome; x.nome = pulito; }
});

fs.writeFileSync('candidati_overture.json', JSON.stringify(d, null, 1), 'utf8');
console.log('nomi puliti:', modificati, '/', d.length);
