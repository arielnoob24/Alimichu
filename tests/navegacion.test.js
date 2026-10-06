import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pantallaDesdeHash, pestanaDe } from '../js/navegacion.js';

test('reconoce las pantallas desde el hash', () => {
  assert.equal(pantallaDesdeHash('#armario'), 'armario');
  assert.equal(pantallaDesdeHash('#favoritos'), 'favoritos');
  assert.equal(pantallaDesdeHash('#agregar'), 'agregar');
});

test('vuelve a inicio con un hash vacío o desconocido', () => {
  assert.equal(pantallaDesdeHash(''), 'inicio');
  assert.equal(pantallaDesdeHash('#no-existe'), 'inicio');
  assert.equal(pantallaDesdeHash(undefined), 'inicio');
});

test('las hojas marcan la pestaña sobre la que se abren', () => {
  assert.equal(pestanaDe('agregar'), 'armario');
  assert.equal(pestanaDe('crear'), 'favoritos');
  assert.equal(pestanaDe('favoritos'), 'favoritos');
  assert.equal(pantallaDesdeHash('#crear'), 'crear');
});
