const fs = require('fs');
let b = fs.readFileSync('build.js', 'utf8');
const problemi = [];

/* 1. meta per l'anteprima quando si condivide il link, e favicon */
const testa = '<link rel="stylesheet" href="assets/style.css">';
const nuovaTesta = `<link rel="stylesheet" href="assets/style.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%232b2320'/%3E%3Ctext x='32' y='46' font-size='40' text-anchor='middle' fill='%23f0c94b' font-family='Georgia,serif'%3ES%3C/text%3E%3C/svg%3E">
<meta property="og:type" content="website">
<meta property="og:title" content="Sicilia — i posti">
<meta property="og:description" content="\${totale} posti dove mangiare, fare il bagno e girare, ordinati per distanza reale in auto da Aci Catena. 25–29 agosto 2026.">
<meta property="og:image" content="https://guida-sicilia-2026.web.app/assets/anteprima.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://guida-sicilia-2026.web.app/">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">`;
if (!b.includes('og:image')) b = b.replace(testa, nuovaTesta);
else problemi.push('og gia presenti');

/* 2. immagini responsive: il telefono scarica la versione da 480px */
const vecchiaImg = `if (p.img) corpo += '      <img src="assets/img/' + p.img + '" alt="' + e(p.n) + '" loading="lazy">\\n';`;
const nuovaImg = `if (p.img) {
      const piccola = p.img.replace(/\\.jpg$/, '-480.jpg');
      corpo += '      <img src="assets/img/' + p.img + '"'
        + ' srcset="assets/img/' + piccola + ' 480w, assets/img/' + p.img + ' 900w"'
        + ' sizes="(max-width: 700px) 100vw, 672px"'
        + ' alt="' + e(p.n) + '" loading="lazy" decoding="async">\\n';
    }`;
if (b.includes(vecchiaImg)) b = b.replace(vecchiaImg, nuovaImg);
else problemi.push('non trovato il punto per srcset');

/* 3. anche la foto di testata */
const vecchioHero = '<img src="assets/img/hero.jpg" alt="La costa di Taormina">';
const nuovoHero = '<img src="assets/img/hero.jpg" '
  + 'srcset="assets/img/hero-480.jpg 480w, assets/img/hero.jpg 900w" '
  + 'sizes="(max-width: 700px) 100vw, 700px" alt="La costa di Taormina" fetchpriority="high">';
if (b.includes(vecchioHero)) b = b.replace(vecchioHero, nuovoHero);
else problemi.push('hero non aggiornato');

fs.writeFileSync('build.js', b);
console.log(problemi.length ? 'PROBLEMI: ' + problemi.join(' | ') : 'build.js aggiornato');
