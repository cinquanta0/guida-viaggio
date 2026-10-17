const fs = require('fs');
const raw = fs.readFileSync('raw.txt', 'latin1');
const pages = raw.split('===STREAM===');
const out = [];
pages.forEach((p, i) => {
  const lines = [];
  const re = /\((?:\\.|[^\\()])*\)\s*Tj/g;
  let m;
  while ((m = re.exec(p))) {
    let t = m[0].replace(/\s*Tj$/, '');
    t = t.slice(1, -1);
    t = t.replace(/\\(\d{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)));
    t = t.replace(/\\([()\\])/g, '$1');
    lines.push(t);
  }
  if (lines.length) out.push('--- PAGINA ' + (i + 1) + ' ---\n' + lines.join('\n'));
});
fs.writeFileSync('testo.txt', out.join('\n\n'), 'utf8');
console.log(out.length + ' pagine');
