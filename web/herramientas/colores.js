/* Saca los colores (operadores rg/RG) y las fuentes de un PDF.
   Uso: node colores.js "ruta.pdf" */
'use strict';
const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync(process.argv[2]);
const lat = buf.toString('latin1');

/* ---- fuentes ---- */
const fuentes = new Set();
for (const m of lat.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+#\-_,.]+)/g)) {
  fuentes.add(m[1].replace(/^[A-Z]{6}\+/, ''));
}

/* ---- colores de los streams de contenido ---- */
const reObj = /(\d+)\s+(\d+)\s+obj\b/g;
const colores = new Map();   // hex -> veces
let m;
while ((m = reObj.exec(lat)) !== null) {
  const tras = reObj.lastIndex;
  const s = lat.indexOf('stream', tras);
  const e = lat.indexOf('endobj', tras);
  if (s < 0 || (e >= 0 && e < s)) continue;
  const dic = lat.slice(tras, s);
  if (/\/Subtype\s*\/Image/.test(dic)) continue;

  let ini = s + 6;
  if (lat[ini] === '\r') ini++;
  if (lat[ini] === '\n') ini++;
  const fin = lat.indexOf('endstream', ini);
  if (fin < 0) continue;

  let datos = buf.subarray(ini, fin);
  if (/\/FlateDecode/.test(dic)) {
    try { datos = zlib.inflateSync(datos); } catch (err) { continue; }
  }
  const txt = datos.toString('latin1');
  if (!/\brg\b|\bRG\b|\bsc\b|\bscn\b/.test(txt)) continue;

  // RGB directo
  for (const c of txt.matchAll(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(rg|RG)\b/g)) {
    const hex = aHex([c[1], c[2], c[3]].map(Number));
    colores.set(hex, (colores.get(hex) || 0) + 1);
  }
  // CMYK -> aproximacion
  for (const c of txt.matchAll(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(k|K)\b/g)) {
    const [cy, mg, ye, kk] = [c[1], c[2], c[3], c[4]].map(Number);
    const hex = aHex([(1 - cy) * (1 - kk), (1 - mg) * (1 - kk), (1 - ye) * (1 - kk)]);
    colores.set(hex + ' (cmyk)', (colores.get(hex + ' (cmyk)') || 0) + 1);
  }
}

function aHex(rgb) {
  return '#' + rgb.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255)
    .toString(16).padStart(2, '0')).join('').toUpperCase();
}

console.log('FUENTES:');
for (const f of [...fuentes].sort()) console.log('  ' + f);
console.log('COLORES (hex : veces):');
const orden = [...colores.entries()].sort((a, b) => b[1] - a[1]);
for (const [hex, n] of orden.slice(0, 25)) console.log('  ' + hex + ' : ' + n);
