import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esVista, pantallaDesdeHash, pestanaDe } from '../js/navegacion.js';

test('reconoce las pestañas y vistas desde el hash', () => {
  assert.equal(pantallaDesdeHash('#armario'), 'armario');
  assert.equal(pantallaDesdeHash('#favoritos'), 'favoritos');
  assert.equal(pantallaDesdeHash('#outfit'), 'outfit');
  assert.equal(pantallaDesdeHash('#crear'), 'crear');
});

test('vuelve a inicio con un hash vacío o desconocido', () => {
  assert.equal(pantallaDesdeHash(''), 'inicio');
  assert.equal(pantallaDesdeHash('#no-existe'), 'inicio');
  assert.equal(pantallaDesdeHash(undefined), 'inicio');
});

test('cada vista pertenece a su pestaña', () => {
  assert.equal(pestanaDe('outfit'), 'inicio');
  assert.equal(pestanaDe('agregar'), 'armario');
  assert.equal(pestanaDe('crear'), 'favoritos');
  assert.equal(pestanaDe('favoritos'), 'favoritos');
});

test('distingue vistas de pestañas', () => {
  assert.equal(esVista('crear'), true);
  assert.equal(esVista('inicio'), false);
});
