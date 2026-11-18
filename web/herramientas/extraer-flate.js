/* Extrae las imágenes FlateDecode (mapas de bits crudos) de un PDF y las guarda como PNG.
   Uso: node extraer-flate.js "ruta.pdf" "carpeta_salida" */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdfPath = process.argv[2];
const outDir = process.argv[3];
fs.mkdirSync(outDir, { recursive: true });

const buf = fs.readFileSync(pdfPath);
const lat = buf.toString('latin1');

function crc32(b) {
  let c, tabla = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    tabla[n] = c >>> 0;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < b.length; i++) crc = tabla[(crc ^ b[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function trozo(tipo, datos) {
  const len = Buffer.alloc(4); len.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'latin1'), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([len, cuerpo, crc]);
}

function png(ancho, alto, rgb) {           // rgb: Buffer de 3*ancho*alto
  const filas = Buffer.alloc((ancho * 3 + 1) * alto);
  for (let y = 0; y < alto; y++) {
    filas[y * (ancho * 3 + 1)] = 0;        // filtro "none"
    rgb.copy(filas, y * (ancho * 3 + 1) + 1, y * ancho * 3, (y + 1) * ancho * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    trozo('IHDR', ihdr),
    trozo('IDAT', zlib.deflateSync(filas, { level: 9 })),
    trozo('IEND', Buffer.alloc(0))
  ]);
}

const reObj = /(\d+)\s+(\d+)\s+obj\b/g;
let m, n = 0;
while ((m = reObj.exec(lat)) !== null) {
  const num = Number(m[1]);
  const tras = reObj.lastIndex;
  const s = lat.indexOf('stream', tras);
  const e = lat.indexOf('endobj', tras);
  if (s < 0 || (e >= 0 && e < s)) continue;
  const dic = lat.slice(tras, s);
  if (!/\/Subtype\s*\/Image/.test(dic)) continue;
  if (/DCTDecode/.test(dic)) continue;
  if (!/FlateDecode/.test(dic)) continue;

  const ancho = Number((dic.match(/\/Width\s+(\d+)/) || [])[1]);
  const alto = Number((dic.match(/\/Height\s+(\d+)/) || [])[1]);
  const bpc = Number((dic.match(/\/BitsPerComponent\s+(\d+)/) || [])[1] || 8);
  const csM = dic.match(/\/ColorSpace\s*(\/\w+|\[[^\]]*\]|\d+\s+\d+\s+R)/);
  const cs = csM ? csM[1] : '?';
  if (!ancho || !alto) continue;

  let ini = s + 6;
  if (lat[ini] === '\r') ini++;
  if (lat[ini] === '\n') ini++;
  const fin = lat.indexOf('endstream', ini);
  if (fin < 0) continue;

  let d;
  try { d = zlib.inflateSync(buf.subarray(ini, fin)); } catch (err) {
    console.log('  --  obj ' + num + ' inflate fallo'); continue;
  }

  const px = ancho * alto;
  let comps = Math.round(d.length / px / (bpc / 8));
  let rgb;

  if (bpc === 8 && comps === 3) {
    rgb = d.subarray(0, px * 3);
  } else if (bpc === 8 && comps === 1) {
    rgb = Buffer.alloc(px * 3);
    for (let i = 0; i < px; i++) { rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = d[i]; }
  } else if (bpc === 8 && comps === 4) {
    rgb = Buffer.alloc(px * 3);
    for (let i = 0; i < px; i++) {
      const c = d[i * 4] / 255, mg = d[i * 4 + 1] / 255, y = d[i * 4 + 2] / 255, k = d[i * 4 + 3] / 255;
      rgb[i * 3] = Math.round(255 * (1 - Math.min(1, c + k)));
      rgb[i * 3 + 1] = Math.round(255 * (1 - Math.min(1, mg + k)));
      rgb[i * 3 + 2] = Math.round(255 * (1 - Math.min(1, y + k)));
    }
  } else {
    console.log('  --  obj ' + num + '  ' + ancho + 'x' + alto + ' bpc=' + bpc +
                ' comps=' + comps + ' cs=' + cs + ' bytes=' + d.length + ' (no soportado)');
    continue;
  }

  n++;
  const nombre = 'flate_obj' + num + '_' + ancho + 'x' + alto + '.png';
  fs.writeFileSync(path.join(outDir, nombre), png(ancho, alto, rgb));
  console.log('  OK  ' + nombre + '  comps=' + comps + ' cs=' + cs);
}
console.log('PNG escritos: ' + n);
