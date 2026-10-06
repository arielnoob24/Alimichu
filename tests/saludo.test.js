import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saludo } from '../js/saludo.js';

test('saluda según la hora', () => {
  assert.equal(saludo(new Date(2026, 0, 1, 9)), 'Buenos días');
  assert.equal(saludo(new Date(2026, 0, 1, 15)), 'Buenas tardes');
  assert.equal(saludo(new Date(2026, 0, 1, 22)), 'Buenas noches');
});
