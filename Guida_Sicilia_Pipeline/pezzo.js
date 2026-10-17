let corpo = '';
let totale = 0;

for (let b = 1; b <= 7; b++) {
  const lista = posti.filter(p => p.b === b).sort((x, y) => x.min - y.min);
  if (!lista.length) continue;
  const f = FASCE[b];

  corpo += '\n<details class="fascia"' + (b === 1 ? ' open' : '') + ' data-f="' + b + '">\n';
  corpo += '  <summary><span class="f-t">' + f.t + '</span>'
    + '<span class="f-s">' + f.s + '</span>'
    + '<span class="f-c"><b>' + lista.length + '</b> posti</span></summary>\n';
  corpo += '  <div class="f-in">\n';

  for (const p of lista) {
    totale++;
    const tipi = p.t.split(' ');
    const tags = (p.g || '').split(' ').filter(Boolean);
    const cerca = senzaAccenti(p.n + ' ' + p.z + ' ' + (p.a || '') + ' ' + p.t + ' '
      + (p.fo || '') + ' ' + p.d).replace(/[^a-z0-9 ]/g, ' ').replace(/[ ]+/g, ' ');
    const mappa = 'https://www.google.com/maps/search/?api=1&query='
      + encodeURIComponent(p.n + ', ' + p.z + ', Sicilia');

    corpo += '    <div class="p" data-t="' + p.t + '" data-g="' + (p.g || '') + '"'
      + ' data-fo="' + (p.fo || '') + '" data-n="' + e(p.n) + '" data-s="' + e(cerca) + '">\n';
    if (p.img) corpo += '      <img src="assets/img/' + p.img + '" alt="' + e(p.n) + '" loading="lazy">\n';
    corpo += '      <div class="p-in">\n';
    corpo += '        <p class="p-km"><span class="km-n">' + tempo(p.min) + '</span> '
      + e(p.piedi || p.z) + (p.km != null ? ' <span class="km-d">' + p.km + ' km</span>' : '') + '</p>\n';
    corpo += '        <h3>' + e(p.n) + '</h3>\n';
    if (p.a) corpo += '        <p class="p-a">' + e(p.a) + '</p>\n';
    corpo += '        <p class="p-tag">';
    for (const t of tipi) if (TIPI[t]) corpo += '<span class="ti ti-' + t + '">' + TIPI[t] + '</span>';
    if (p.fo && FONDO[p.fo]) corpo += '<span class="tg fo-' + p.fo + '">' + FONDO[p.fo] + '</span>';
    for (const g of tags) if (TAG[g]) corpo += '<span class="tg ' + TAG[g][1] + '">' + TAG[g][0] + '</span>';
    corpo += '</p>\n';
    corpo += '        <p class="p-d">' + e(p.d) + '</p>\n';
    corpo += '        <p class="p-map"><a href="' + mappa + '" target="_blank" rel="noopener">'
      + 'Apri in mappa &rarr;</a></p>\n';
    corpo += '      </div>\n    </div>\n';
  }
  corpo += '  </div>\n</details>\n';
}

const bottoniTipo = Object.keys(TIPI)
  .map(k => '<button type="button" class="fb ti-' + k + '" data-k="t" data-v="' + k + '">' + TIPI[k] + '</button>')
  .join('\n      ');
const bottoniTag = Object.keys(TAG)
  .map(k => '<button type="button" class="fb ' + TAG[k][1] + '" data-k="g" data-v="' + k + '">' + TAG[k][0] + '</button>')
  .join('\n      ');
const bottoniFondo = Object.keys(FONDO)
  .map(k => '<button type="button" class="fb fo-' + k + '" data-k="fo" data-v="' + k + '">' + FONDO[k] + '</button>')
  .join('\n      ');
