// Detecta el color principal de una foto de ropa (sin tocar el DOM, para poder testearlo).

export function rgbAHex(r, g, b) {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

// Casi blanco: el fondo de una foto de producto. No cuenta como color de la prenda.
function esFondoBlanco(r, g, b) {
  return r > 232 && g > 232 && b > 232;
}

// Recibe datos como los de un ImageData ({ data, width, height }).
// Mira solo el centro de la foto (donde suele estar la prenda), agrupa colores parecidos
// y devuelve el promedio del grupo más grande.
export function colorPrincipal({ data, width, height }, { margen = 0.15 } = {}) {
  const grupos = new Map();
  const x0 = Math.floor(width * margen);
  const x1 = Math.ceil(width * (1 - margen));
  const y0 = Math.floor(height * margen);
  const y1 = Math.ceil(height * (1 - margen));

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 128 || esFondoBlanco(r, g, b)) continue;
      // 8 niveles por canal: colores parecidos caen en el mismo grupo
      const clave = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
      const grupo = grupos.get(clave) ?? { n: 0, r: 0, g: 0, b: 0 };
      grupo.n++;
      grupo.r += r;
      grupo.g += g;
      grupo.b += b;
      grupos.set(clave, grupo);
    }
  }

  let mayor = null;
  for (const grupo of grupos.values()) {
    if (!mayor || grupo.n > mayor.n) mayor = grupo;
  }
  // Si todo era fondo blanco, la prenda probablemente es blanca.
  if (!mayor) return '#f4f4f4';
  return rgbAHex(mayor.r / mayor.n, mayor.g / mayor.n, mayor.b / mayor.n);
}
