import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarPorCategoria, normalizarConjunto, ordenarPrendas, validarPrenda } from '../js/prendas.js';

const foto = { tipo: 'blob falso' };

test('una prenda completa se puede guardar', () => {
  assert.equal(validarPrenda({ foto, categoria: 'arriba', estilos: ['casual'] }), null);
});

test('avisa qué falta para guardar', () => {
  assert.match(validarPrenda({ categoria: 'arriba', estilos: ['casual'] }), /foto/);
  assert.match(validarPrenda({ foto, categoria: '', estilos: ['casual'] }), /categoría/);
  assert.match(validarPrenda({ foto, categoria: 'pijama', estilos: ['casual'] }), /categoría/);
  assert.match(validarPrenda({ foto, categoria: 'abajo', estilos: [] }), /estilo/);
});

test('el conjunto se normaliza para agrupar bien', () => {
  assert.equal(normalizarConjunto('  Set   Rosado '), 'set rosado');
  assert.equal(normalizarConjunto(''), null);
  assert.equal(normalizarConjunto('   '), null);
  assert.equal(normalizarConjunto(undefined), null);
});

test('filtra por categoría, o devuelve todo sin filtro', () => {
  const prendas = [{ categoria: 'arriba' }, { categoria: 'zapatos' }, { categoria: 'arriba' }];
  assert.equal(filtrarPorCategoria(prendas, 'arriba').length, 2);
  assert.equal(filtrarPorCategoria(prendas, 'zapatos').length, 1);
  assert.equal(filtrarPorCategoria(prendas, '').length, 3);
});

test('ordena las más nuevas primero sin cambiar la lista original', () => {
  const prendas = [{ creada: 1 }, { creada: 3 }, { creada: 2 }];
  assert.deepEqual(ordenarPrendas(prendas).map((p) => p.creada), [3, 2, 1]);
  assert.deepEqual(prendas.map((p) => p.creada), [1, 3, 2]);
});
