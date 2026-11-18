/* =========================================================
   Servidor estático mínimo para ver el portfolio en local.
   Uso:  node servidor.js            (puerto 8080)
         node servidor.js 3000       (otro puerto)
   ========================================================= */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const RAIZ = __dirname;
const PUERTO = Number(process.argv[2]) || 8080;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

const servidor = http.createServer((req, res) => {
  let ruta;
  try {
    ruta = decodeURIComponent(url.parse(req.url).pathname);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Ruta mal codificada');
  }

  if (ruta === '/' || ruta.endsWith('/')) { ruta += 'index.html'; }

  // Normaliza y bloquea cualquier salida de la carpeta raíz
  const destino = path.normalize(path.join(RAIZ, ruta));
  if (!destino.startsWith(RAIZ)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Acceso denegado');
  }

  fs.stat(destino, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 — no encontrado: ' + ruta);
    }

    const tipo = TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': tipo,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(destino).pipe(res);
  });
});

servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log('');
  console.log('  Portfolio servido en:  http://localhost:' + PUERTO + '/');
  console.log('  Carpeta:               ' + RAIZ);
  console.log('  Para detenerlo:        Ctrl + C');
  console.log('');
});

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('El puerto ' + PUERTO + ' está ocupado. Prueba: node servidor.js 8081');
  } else {
    console.error(e.message);
  }
  process.exit(1);
});
