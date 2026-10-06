import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saludo } from '../js/saludo.js';

const a = (hora) => new Date(2026, 9, 6, hora, 30);

test('saluda según la hora del día', () => {
  assert.equal(saludo(a(5)), 'Buenos días');
  assert.equal(saludo(a(11)), 'Buenos días');
  assert.equal(saludo(a(12)), 'Buenas tardes');
  assert.equal(saludo(a(19)), 'Buenas tardes');
  assert.equal(saludo(a(20)), 'Buenas noches');
  assert.equal(saludo(a(2)), 'Buenas noches');
});
