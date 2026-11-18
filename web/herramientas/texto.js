/* Extrae el texto de un PDF en orden de aparición.
   Uso: node texto.js "ruta.pdf" */
'use strict';
const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync(process.argv[2]);
const lat = buf.toString('latin1');

/* ---- 1. Mapas ToUnicode por objeto de fuente ---- */
const cmaps = {};   // numObj fuente -> {codigoHex: caracter}

function leerStream(posStream) {
  let ini = posStream + 'stream'.length;
  if (lat[ini] === '\r') ini++;
  if (lat[ini] === '\n') ini++;
  const fin = lat.indexOf('endstream', ini);
  if (fin < 0) return null;
  return buf.subarray(ini, fin);
}

/* Recorre todos los objetos una vez */
const reObj = /(\d+)\s+(\d+)\s+obj\b/g;
const objs = [];
let m;
while ((m = reObj.exec(lat)) !== null) {
  objs.push({ num: Number(m[1]), tras: reObj.lastIndex });
}

function dicYStream(tras) {
  const s = lat.indexOf('stream', tras);
  const e = lat.indexOf('endobj', tras);
  const hayStream = s >= 0 && (e < 0 || s < e);
  const fin = hayStream ? s : (e >= 0 ? e : tras + 4000);
  return { dic: lat.slice(tras, fin), posStream: hayStream ? s : -1 };
}

/* Construye los ToUnicode */
for (const o of objs) {
  const { dic, posStream } = dicYStream(o.tras);
  if (posStream < 0) continue;
  if (!/\/ToUnicode|beginbfchar|beginbfrange/.test(dic) && !/\/CMapName/.test(dic)) {
    // Puede ser un ToUnicode sin marcas en el diccionario: se comprueba al inflar
  }
  let datos = leerStream(posStream);
  if (!datos) continue;
  if (/\/FlateDecode/.test(dic)) {
    try { datos = zlib.inflateSync(datos); } catch (e) { continue; }
  }
  const txt = datos.toString('latin1');
  if (!/beginbfchar|beginbfrange/.test(txt)) continue;

  const mapa = {};
  // bfchar: <src> <dst>
  const reChar = /beginbfchar([\s\S]*?)endbfchar/g;
  let b;
  while ((b = reChar.exec(txt)) !== null) {
    const pares = b[1].match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || [];
    for (const p of pares) {
      const mm = p.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      mapa[mm[1].toUpperCase()] = hexAChar(mm[2]);
    }
  }
  // bfrange: <ini> <fin> <dstIni>
  const reRange = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((b = reRange.exec(txt)) !== null) {
    const lineas = b[1].match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || [];
    for (const l of lineas) {
      const mm = l.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      const a = parseInt(mm[1], 16), z = parseInt(mm[2], 16), d = parseInt(mm[3], 16);
      const anchura = mm[1].length;
      for (let i = a; i <= z && i - a < 65536; i++) {
        mapa[i.toString(16).toUpperCase().padStart(anchura, '0')] = String.fromCodePoint(d + (i - a));
      }
    }
  }
  cmaps[o.num] = mapa;
}

function hexAChar(h) {
  let s = '';
  for (let i = 0; i + 4 <= h.length; i += 4) { s += String.fromCharCode(parseInt(h.substr(i, 4), 16)); }
  if (!s && h.length) { s = String.fromCharCode(parseInt(h, 16)); }
  return s;
}

/* ---- 2. Contenido de páginas ---- */
const unico = new Set(Object.keys(cmaps));
const todosLosMapas = {};
for (const k of unico) { Object.assign(todosLosMapas, cmaps[k]); }

function decodificaLiteral(s) {
  // Deshace escapes PDF de cadena literal
  return s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (x, g) => {
    const simples = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' };
    if (simples[g] !== undefined) return simples[g];
    return String.fromCharCode(parseInt(g, 8));
  });
}

const salida = [];

for (const o of objs) {
  const { dic, posStream } = dicYStream(o.tras);
  if (posStream < 0) continue;
  // Los streams de contenido no llevan /Subtype /Image ni /Type
  if (/\/Subtype\s*\/Image|\/Type\s*\/(Font|XObject|Metadata|ObjStm)/.test(dic)) continue;

  let datos = leerStream(posStream);
  if (!datos) continue;
  if (/\/FlateDecode/.test(dic)) {
    try { datos = zlib.inflateSync(datos); } catch (e) { continue; }
  }
  const txt = datos.toString('latin1');
  if (!/\bTj\b|\bTJ\b/.test(txt)) continue;

  const trozos = [];
  // Operadores de texto en orden
  const reTexto = /\((?:[^()\\]|\\.)*\)|<[0-9A-Fa-f\s]+>|\bTJ\b|\bTj\b|\bTD\b|\bTd\b|\bT\*\b|\bET\b/g;
  let t;
  let pendiente = [];
  while ((t = reTexto.exec(txt)) !== null) {
    const v = t[0];
    if (v.startsWith('(')) {
      pendiente.push(decodificaLiteral(v.slice(1, -1)));
    } else if (v.startsWith('<')) {
      const hex = v.slice(1, -1).replace(/\s+/g, '').toUpperCase();
      let s = '';
      let usado = false;
      for (let i = 0; i + 4 <= hex.length; i += 4) {
        const c = hex.substr(i, 4);
        if (todosLosMapas[c] !== undefined) { s += todosLosMapas[c]; usado = true; }
      }
      if (!usado) {
        for (let i = 0; i + 2 <= hex.length; i += 2) {
          const c = hex.substr(i, 2);
          s += (todosLosMapas[c] !== undefined) ? todosLosMapas[c] : String.fromCharCode(parseInt(c, 16));
        }
      }
      pendiente.push(s);
    } else if (v === 'Tj' || v === 'TJ') {
      trozos.push(pendiente.join(''));
      pendiente = [];
    } else if (v === 'TD' || v === 'Td' || v === 'T*') {
      if (pendiente.length) { trozos.push(pendiente.join('')); pendiente = []; }
      trozos.push('\n');
    }
  }
  if (pendiente.length) trozos.push(pendiente.join(''));

  const limpio = trozos.join('').replace(/\n{3,}/g, '\n\n').trim();
  if (limpio.length > 2) { salida.push('----- objeto ' + o.num + ' -----\n' + limpio); }
}

console.log(salida.join('\n\n'));
