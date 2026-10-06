import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarChispas } from '../js/destellos.js';

test('genera la cantidad pedida de chispas', () => {
  assert.equal(generarChispas(14).length, 14);
});

test('las chispas salen hacia todos lados y dentro del alcance', () => {
  const chispas = generarChispas(8, { distancia: 100, azar: () => 0.5 });

  for (const { x, y } of chispas) {
    const alcance = Math.hypot(x, y);
    assert.ok(alcance >= 54 && alcance <= 101, `alcance fuera de rango: ${alcance}`);
  }
  assert.ok(chispas.some(({ x }) => x > 0) && chispas.some(({ x }) => x < 0));
  assert.ok(chispas.some(({ y }) => y > 0) && chispas.some(({ y }) => y < 0));
});
