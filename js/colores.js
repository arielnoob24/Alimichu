// Detecta el color principal de una foto de ropa (sin tocar el DOM, para poder testearlo).

export function rgbAHex(r, g, b) {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

// Tono (0–360), saturación (0–1) y luminosidad (0–1) de un color "#rrggbb".
export function hexAHsl(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

// Neutros: combinan con todo (blanco, negro, gris, beige, café y mezclilla).
export function esNeutro(hex) {
  const { h, s, l } = hexAHsl(hex);
  if (s < 0.18 || l < 0.15 || l > 0.9) return true;
  const beigeOCafe = h >= 15 && h <= 50 && s < 0.5;
  const mezclilla = h >= 195 && h <= 230 && s < 0.6 && l < 0.55;
  return beigeOCafe || mezclilla;
}

// Qué tan bien combinan dos colores: positivo combina, negativo choca.
export function armoniaColores(hexA, hexB) {
  if (esNeutro(hexA) || esNeutro(hexB)) return 2;
  const a = hexAHsl(hexA);
  const b = hexAHsl(hexB);
  const diferencia = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h));
  if (diferencia <= 35) return 2; // análogos o el mismo tono (por ejemplo, todo rosa)
  if (diferencia >= 150) return 1.5; // complementarios
  if (diferencia >= 105 && diferencia <= 135) return 0.5; // tríada
  return -1.5; // chocan
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
