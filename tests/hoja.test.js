import { test } from 'node:test';
import assert from 'node:assert/strict';
import { debeCerrarHoja, elastico, proyectar, velocidadDe } from '../js/hoja.js';

test('el impulso proyecta más lejos cuanto más rápido es el gesto', () => {
  assert.equal(proyectar(0), 0);
  assert.ok(Math.abs(proyectar(1000) - 99) < 0.001);
  assert.ok(proyectar(2000) > proyectar(1000));
  assert.ok(proyectar(-1000) < 0);
});

test('la resistencia elástica nunca supera lo arrastrado', () => {
  assert.equal(elastico(0, 800), 0);
  assert.ok(elastico(100, 800) < 100);
  assert.ok(elastico(400, 800) - elastico(300, 800) < elastico(100, 800) - elastico(0, 800));
  assert.ok(elastico(-100, 800) < 0);
});

test('calcula la velocidad del dedo en px/s', () => {
  assert.equal(velocidadDe([]), 0);
  assert.equal(velocidadDe([{ y: 10, t: 0 }]), 0);
  assert.equal(velocidadDe([{ y: 0, t: 0 }, { y: 50, t: 50 }, { y: 100, t: 100 }]), 1000);
});

test('se cierra si se arrastra lejos o con un movimiento rápido', () => {
  const alto = 900;
  assert.equal(debeCerrarHoja({ desplazamiento: 50, velocidad: 0, alto }), false);
  assert.equal(debeCerrarHoja({ desplazamiento: 400, velocidad: 0, alto }), true);
  assert.equal(debeCerrarHoja({ desplazamiento: 80, velocidad: 2500, alto }), true);
  assert.equal(debeCerrarHoja({ desplazamiento: 400, velocidad: -3000, alto }), false);
});
