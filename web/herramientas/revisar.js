/* Comprueba que todos los src/href locales de las paginas existen en disco. */
'use strict';
const fs = require('fs');
const path = require('path');

const raiz = 'D:\\Descargas\\porfolio_web 2.0\\web';
const paginas = ['index.html', 'packaging.html', 'camins.html', 'onada.html', 'carteles.html'];

let total = 0, rotos = 0;
const idsPorPagina = {};

for (const p of paginas) {
  const ruta = path.join(raiz, p);
  if (!fs.existsSync(ruta)) { console.log('FALTA LA PAGINA: ' + p); rotos++; continue; }
  const html = fs.readFileSync(ruta, 'utf8');

  // src y href locales
  const refs = [];
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const v = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(v)) continue;
    refs.push(v);
  }
  for (const r of refs) {
    total++;
    const destino = path.join(raiz, decodeURIComponent(r.split('#')[0]));
    if (!fs.existsSync(destino)) { console.log('ROTO  ' + p + '  ->  ' + r); rotos++; }
  }

  // anclas internas: #algo dentro de la misma pagina
  const ids = new Set();
  for (const m of html.matchAll(/id="([^"]+)"/g)) ids.add(m[1]);
  idsPorPagina[p] = ids;

  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    total++;
    if (m[1] && !ids.has(m[1])) { console.log('ANCLA ROTA  ' + p + '  ->  #' + m[1]); rotos++; }
  }

  // alt presente en toda imagen
  let sinAlt = 0;
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(m[0])) { sinAlt++; console.log('IMG SIN ALT  ' + p + '  ' + m[0].slice(0, 90)); }
  }

  // un solo h1 por pagina
  const h1 = (html.match(/<h1\b/g) || []).length;
  if (h1 !== 1) console.log('AVISO  ' + p + ' tiene ' + h1 + ' <h1>');

  console.log('revisada ' + p + ': ' + refs.length + ' referencias locales, ' + sinAlt + ' img sin alt, ' + h1 + ' h1');
}

// enlaces entre paginas con ancla a otra pagina
for (const p of paginas) {
  const html = fs.readFileSync(path.join(raiz, p), 'utf8');
  for (const m of html.matchAll(/href="([a-z0-9\-]+\.html)#([^"]+)"/g)) {
    const ids = idsPorPagina[m[1]];
    total++;
    if (!ids) { console.log('ROTO destino ' + m[1] + ' desde ' + p); rotos++; }
    else if (!ids.has(m[2])) { console.log('ANCLA CRUZADA ROTA  ' + p + ' -> ' + m[1] + '#' + m[2]); rotos++; }
  }
}

console.log('');
console.log('Comprobaciones: ' + total + '   Problemas: ' + rotos);

// imagenes en disco que ninguna pagina usa
const usadas = new Set();
for (const p of paginas) {
  const html = fs.readFileSync(path.join(raiz, p), 'utf8');
  for (const m of html.matchAll(/src="(assets\/img\/[^"]+)"/g)) usadas.add(decodeURIComponent(m[1]));
}
const enDisco = [];
(function recorrer(d, pref) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) recorrer(path.join(d, e.name), pref + e.name + '/');
    else enDisco.push(pref + e.name);
  }
})(path.join(raiz, 'assets', 'img'), 'assets/img/');
const huerfanas = enDisco.filter(f => !usadas.has(f));
console.log('Imagenes en disco: ' + enDisco.length + '   usadas: ' + usadas.size + '   sin usar: ' + huerfanas.length);
huerfanas.forEach(f => console.log('  sin usar: ' + f));
