/* Rasteriza la primera página de un PDF a PNG, a la resolución que se le
   pida, usando el motor de PDF del propio navegador (pdf.js).

   Hace falta para las planimetrías del packaging: dentro del PDF no son
   una imagen que se pueda sacar con extraer-flate.js, sino dibujo
   vectorial. Lo único que trae de imagen es la silueta del troquel.

   Uso:
     node herramientas/rasterizar.js "ruta.pdf" "salida.png" [ancho]
     ...y abrir http://localhost:8123/ en el navegador. En cuanto termina,
     el PNG queda escrito y el servidor se cierra solo.

   Necesita conexión: pdf.js se carga desde un CDN. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const pdfPath = process.argv[2];
const salida = process.argv[3];
const ancho = Number(process.argv[4]) || 2200;
const PUERTO = 8123;

if (!pdfPath || !salida) {
  console.error('Uso: node rasterizar.js "ruta.pdf" "salida.png" [ancho]');
  process.exit(1);
}

const pdf = fs.readFileSync(pdfPath);
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

const pagina = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>rasterizando…</title></head>
<body style="font:16px system-ui;padding:2rem">
<p id="estado">Rasterizando ${path.basename(pdfPath)} a ${ancho} px…</p>
<script src="${PDFJS}/pdf.min.js"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS}/pdf.worker.min.js';
(async () => {
  const doc = await pdfjsLib.getDocument('/doc.pdf').promise;
  const page = await doc.getPage(1);
  const escala = ${ancho} / page.getViewport({ scale: 1 }).width;
  const vista = page.getViewport({ scale: escala });
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(vista.width);
  lienzo.height = Math.round(vista.height);
  await page.render({ canvasContext: lienzo.getContext('2d'), viewport: vista }).promise;
  const blob = await new Promise(r => lienzo.toBlob(r, 'image/png'));
  await fetch('/guardar', { method: 'POST', body: blob });
  document.getElementById('estado').textContent =
    'LISTO: ' + lienzo.width + ' x ' + lienzo.height;
  document.title = 'LISTO';
})().catch(e => {
  document.getElementById('estado').textContent = 'ERROR: ' + e.message;
  document.title = 'ERROR';
});
</script></body></html>`;

const servidor = http.createServer((pet, res) => {
  if (pet.method === 'POST' && pet.url === '/guardar') {
    const trozos = [];
    pet.on('data', t => trozos.push(t));
    pet.on('end', () => {
      const png = Buffer.concat(trozos);
      fs.mkdirSync(path.dirname(salida), { recursive: true });
      fs.writeFileSync(salida, png);
      res.writeHead(204).end();
      console.log(`escrito ${salida} (${(png.length / 1024).toFixed(0)} KB)`);
      setTimeout(() => { servidor.close(); process.exit(0); }, 150);
    });
    return;
  }
  if (pet.url === '/doc.pdf') {
    res.writeHead(200, { 'Content-Type': 'application/pdf' }).end(pdf);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(pagina);
});

servidor.listen(PUERTO, () => {
  console.log(`Abre http://localhost:${PUERTO}/ para rasterizar ${path.basename(pdfPath)}`);
});
