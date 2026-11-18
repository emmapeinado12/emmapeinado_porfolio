/* Extrae imágenes con espacio de color Indexed y las guarda como PNG en color real.
   Uso: node extraer-indexado.js "ruta.pdf" "carpeta_salida" */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdfPath = process.argv[2];
const outDir = process.argv[3];
fs.mkdirSync(outDir, { recursive: true });

const buf = fs.readFileSync(pdfPath);
const lat = buf.toString('latin1');

/* --- índice de objetos --- */
const posObj = {};
for (const m of lat.matchAll(/(\d+)\s+(\d+)\s+obj\b/g)) { posObj[Number(m[1])] = m.index + m[0].length; }

function cuerpoDe(num) {
  const ini = posObj[num];
  if (ini === undefined) return null;
  const s = lat.indexOf('stream', ini);
  const e = lat.indexOf('endobj', ini);
  const hayStream = s >= 0 && (e < 0 || s < e);
  return { dic: lat.slice(ini, hayStream ? s : (e >= 0 ? e : ini + 4000)), posStream: hayStream ? s : -1 };
}

function streamDe(posStream, dic) {
  let ini = posStream + 6;
  if (lat[ini] === '\r') ini++;
  if (lat[ini] === '\n') ini++;
  const fin = lat.indexOf('endstream', ini);
  if (fin < 0) return null;
  let d = buf.subarray(ini, fin);
  if (/FlateDecode/.test(dic)) { try { d = zlib.inflateSync(d); } catch (e) { return null; } }
  return d;
}

/* --- resuelve una paleta Indexed --- */
function paletaDe(spec) {
  // spec puede ser "[/Indexed /DeviceRGB 255 N 0 R]" o "N 0 R"
  let texto = spec;
  const ref = spec.match(/^(\d+)\s+\d+\s+R$/);
  if (ref) {
    const c = cuerpoDe(Number(ref[1]));
    if (!c) return null;
    texto = c.dic;
  }
  const mi = texto.match(/\/Indexed\s*(\/\w+|\[[^\]]*\])\s*(\d+)\s*(\d+\s+\d+\s+R|\([\s\S]*?\)|<[0-9A-Fa-f\s]*>)/);
  if (!mi) return null;
  const base = mi[1];
  const datos = mi[3];
  let tabla;

  const r2 = datos.match(/^(\d+)\s+\d+\s+R$/);
  if (r2) {
    const c = cuerpoDe(Number(r2[1]));
    if (!c || c.posStream < 0) return null;
    tabla = streamDe(c.posStream, c.dic);
  } else if (datos.startsWith('<')) {
    const hex = datos.slice(1, -1).replace(/\s+/g, '');
    tabla = Buffer.from(hex, 'hex');
  } else {
    const lit = datos.slice(1, -1).replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (x, g) => {
      const s = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' };
      return s[g] !== undefined ? s[g] : String.fromCharCode(parseInt(g, 8));
    });
    tabla = Buffer.from(lit, 'latin1');
  }
  if (!tabla) return null;
  const comps = /CMYK/.test(base) ? 4 : (/Gray/.test(base) ? 1 : 3);
  return { tabla, comps };
}

/* --- PNG --- */
function crc32(b) {
  let c, t = [];
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < b.length; i++) crc = t[(crc ^ b[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function trozo(tipo, d) {
  const l = Buffer.alloc(4); l.writeUInt32BE(d.length);
  const c = Buffer.concat([Buffer.from(tipo, 'latin1'), d]);
  const k = Buffer.alloc(4); k.writeUInt32BE(crc32(c));
  return Buffer.concat([l, c, k]);
}
function png(w, h, rgb) {
  const filas = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { filas[y * (w * 3 + 1)] = 0; rgb.copy(filas, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    trozo('IHDR', ih), trozo('IDAT', zlib.deflateSync(filas, { level: 9 })), trozo('IEND', Buffer.alloc(0))]);
}

let n = 0;
for (const numStr of Object.keys(posObj)) {
  const num = Number(numStr);
  const c = cuerpoDe(num);
  if (!c || c.posStream < 0) continue;
  if (!/\/Subtype\s*\/Image/.test(c.dic)) continue;
  if (/DCTDecode/.test(c.dic)) continue;

  const csM = c.dic.match(/\/ColorSpace\s*(\[[^\]]*\]|\d+\s+\d+\s+R|\/\w+)/);
  if (!csM) continue;
  const pal = paletaDe(csM[1].trim());
  if (!pal) continue;

  const w = Number((c.dic.match(/\/Width\s+(\d+)/) || [])[1]);
  const h = Number((c.dic.match(/\/Height\s+(\d+)/) || [])[1]);
  const bpc = Number((c.dic.match(/\/BitsPerComponent\s+(\d+)/) || [])[1] || 8);
  if (!w || !h || bpc !== 8) continue;

  const d = streamDe(c.posStream, c.dic);
  if (!d || d.length < w * h) continue;

  const rgb = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const idx = d[i] * pal.comps;
    if (pal.comps === 3) {
      rgb[i * 3] = pal.tabla[idx] || 0; rgb[i * 3 + 1] = pal.tabla[idx + 1] || 0; rgb[i * 3 + 2] = pal.tabla[idx + 2] || 0;
    } else if (pal.comps === 1) {
      const g = pal.tabla[idx] || 0; rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = g;
    } else {
      const cc = (pal.tabla[idx] || 0) / 255, mm = (pal.tabla[idx + 1] || 0) / 255,
            yy = (pal.tabla[idx + 2] || 0) / 255, kk = (pal.tabla[idx + 3] || 0) / 255;
      rgb[i * 3] = Math.round(255 * (1 - Math.min(1, cc + kk)));
      rgb[i * 3 + 1] = Math.round(255 * (1 - Math.min(1, mm + kk)));
      rgb[i * 3 + 2] = Math.round(255 * (1 - Math.min(1, yy + kk)));
    }
  }
  n++;
  const nombre = 'idx_obj' + num + '_' + w + 'x' + h + '.png';
  fs.writeFileSync(path.join(outDir, nombre), png(w, h, rgb));
  console.log('  OK  ' + nombre + '  paleta ' + pal.comps + ' comps, ' + pal.tabla.length + ' bytes');
}
console.log('Indexadas escritas: ' + n);
