import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colorPrincipal, rgbAHex } from '../js/colores.js';

// Arma una imagen falsa con una función que da el color de cada pixel.
function imagen(ancho, alto, colorDe) {
  const data = new Uint8ClampedArray(ancho * alto * 4);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const [r, g, b, a = 255] = colorDe(x, y);
      data.set([r, g, b, a], (y * ancho + x) * 4);
    }
  }
  return { data, width: ancho, height: alto };
}

test('convierte rgb a hex', () => {
  assert.equal(rgbAHex(255, 134, 200), '#ff86c8');
  assert.equal(rgbAHex(0, 0, 0), '#000000');
});

test('una foto de un solo color devuelve ese color', () => {
  assert.equal(colorPrincipal(imagen(20, 20, () => [200, 30, 120])), '#c81e78');
});

test('ignora el fondo blanco y devuelve el color de la prenda', () => {
  const foto = imagen(20, 20, (x, y) => (x > 6 && x < 14 && y > 6 && y < 14 ? [20, 40, 160] : [250, 250, 250]));
  assert.equal(colorPrincipal(foto), '#1428a0');
});

test('mira el centro: el borde de la foto no cuenta', () => {
  // Borde rojo (fondo de la habitación) y centro verde (la prenda)
  const foto = imagen(20, 20, (x, y) => (x < 3 || x > 16 || y < 3 || y > 16 ? [220, 0, 0] : [0, 150, 60]));
  assert.equal(colorPrincipal(foto), '#00963c');
});

test('elige el color que más aparece', () => {
  const foto = imagen(20, 20, (x) => (x < 13 ? [0, 0, 0] : [255, 200, 0]));
  assert.equal(colorPrincipal(foto), '#000000');
});

test('si todo es blanco, la prenda es blanca', () => {
  assert.equal(colorPrincipal(imagen(10, 10, () => [255, 255, 255])), '#f4f4f4');
});

test('ignora los pixeles transparentes', () => {
  const foto = imagen(20, 20, (x) => (x < 12 ? [10, 10, 10, 0] : [255, 0, 128]));
  assert.equal(colorPrincipal(foto), '#ff0080');
});
