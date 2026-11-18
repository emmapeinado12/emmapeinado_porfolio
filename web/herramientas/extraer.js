/* Extrae las imágenes incrustadas de un PDF.
   Uso: node extraer.js "ruta.pdf" "carpeta_salida" */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdfPath = process.argv[2];
const outDir = process.argv[3];
fs.mkdirSync(outDir, { recursive: true });

const buf = fs.readFileSync(pdfPath);
const lat = buf.toString('latin1');

// Localiza todos los objetos "N G obj"
const reObj = /(\d+)\s+(\d+)\s+obj\b/g;
const objetos = [];
let m;
while ((m = reObj.exec(lat)) !== null) {
  objetos.push({ num: Number(m[1]), ini: m.index, trasCabecera: reObj.lastIndex });
}

function dicDe(inicio) {
  // Devuelve el texto del diccionario hasta "stream" o "endobj"
  const s = lat.indexOf('stream', inicio);
  const e = lat.indexOf('endobj', inicio);
  const fin = (s >= 0 && (e < 0 || s < e)) ? s : (e >= 0 ? e : inicio + 2000);
  return { texto: lat.slice(inicio, fin), posStream: (s >= 0 && (e < 0 || s < e)) ? s : -1 };
}

function valor(dic, clave) {
  const r = new RegExp('\\/' + clave + '\\s*([^\\/\\>\\]\\s][^\\/\\>\\]]*)');
  const x = dic.match(r);
  return x ? x[1].trim() : null;
}

let n = 0;
const informe = [];

for (const o of objetos) {
  const { texto, posStream } = dicDe(o.trasCabecera);
  if (posStream < 0) continue;
  if (!/\/Subtype\s*\/Image/.test(texto)) continue;

  // Cadena de filtros, en orden de aplicación
  const mf = texto.match(/\/Filter\s*(\[[^\]]*\]|\/\w+)/);
  const filtros = mf ? (mf[1].match(/\/(\w+)/g) || []).map(s => s.slice(1)) : [];

  const w = valor(texto, 'Width');
  const h = valor(texto, 'Height');
  const cs = valor(texto, 'ColorSpace');

  // Datos del stream
  let ini = posStream + 'stream'.length;
  if (lat[ini] === '\r') ini++;
  if (lat[ini] === '\n') ini++;
  const fin = lat.indexOf('endstream', ini);
  if (fin < 0) continue;

  let datos = buf.subarray(ini, fin);

  // Deshace Flate si va antes del DCT
  try {
    for (const f of filtros) {
      if (f === 'FlateDecode') { datos = zlib.inflateSync(datos); }
      else if (f === 'DCTDecode') { break; }
    }
  } catch (e) {
    informe.push({ obj: o.num, error: 'inflate: ' + e.message, filtros });
    continue;
  }

  const esJpeg = datos.length > 3 && datos[0] === 0xFF && datos[1] === 0xD8 && datos[2] === 0xFF;
  if (!esJpeg) {
    informe.push({ obj: o.num, error: 'no es JPEG tras descomprimir', filtros, w, h, cs,
                   primeros: Array.from(datos.subarray(0, 4)).map(b => b.toString(16)).join(' ') });
    continue;
  }

  n++;
  const nombre = 'img' + String(n).padStart(2, '0') + '_obj' + o.num + '_' + (w || '?') + 'x' + (h || '?') + '.jpg';
  fs.writeFileSync(path.join(outDir, nombre), datos);
  informe.push({ obj: o.num, archivo: nombre, bytes: datos.length, w, h, cs, filtros });
}

console.log('PDF: ' + path.basename(pdfPath));
console.log('JPEG extraidos: ' + n);
for (const r of informe) {
  if (r.archivo) {
    console.log('  OK   ' + r.archivo + '  ' + Math.round(r.bytes / 1024) + ' KB  cs=' + r.cs + '  [' + r.filtros.join('+') + ']');
  } else {
    console.log('  --   obj ' + r.obj + '  ' + r.error + '  [' + (r.filtros || []).join('+') + ']  ' + (r.w || '') + 'x' + (r.h || '') + ' ' + (r.primeros || ''));
  }
}
