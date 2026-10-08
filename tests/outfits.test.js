import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  claveOutfit,
  combinacionCompleta,
  combinaciones,
  describirOutfit,
  favoritoDesdeOutfit,
  generarOutfit,
  outfitDesdeFavorito,
  puntuarOutfit,
  queFalta,
} from '../js/outfits.js';

let siguienteId = 0;
const prenda = (categoria, color, estilos = ['casual'], conjunto = null) => ({
  id: `p${++siguienteId}`,
  categoria,
  color,
  estilos,
  conjunto,
});

const NEGRO = '#111111';
const BLANCO = '#f4f4f4';
const MEZCLILLA = '#2a4f9e';
const ROSA = '#ff2fa8';
const ROSA_CLARO = '#ff86c8';
const AMARILLO = '#ffd400';
const VERDE = '#00b050';

test('dice qué falta si no alcanza para un outfit', () => {
  assert.match(queFalta([]), /arriba y una de abajo, o un vestido/);
  assert.match(queFalta([prenda('arriba', ROSA)]), /parte de abajo/);
  assert.match(queFalta([prenda('abajo', NEGRO)]), /parte de arriba/);
  assert.equal(queFalta([prenda('vestido', ROSA)]), null);
  assert.equal(queFalta([prenda('arriba', ROSA), prenda('abajo', NEGRO)]), null);
});

test('arma outfits de arriba + abajo o de vestido, nunca los dos', () => {
  const prendas = [prenda('arriba', ROSA), prenda('abajo', NEGRO), prenda('vestido', ROSA), prenda('zapatos', BLANCO)];
  const todas = combinaciones(prendas);
  assert.ok(todas.length > 0);
  for (const outfit of todas) {
    assert.ok(outfit.vestido ? !outfit.arriba && !outfit.abajo : outfit.arriba && outfit.abajo);
    assert.ok(outfit.zapatos, 'si hay zapatos, el outfit lleva zapatos');
  }
});

test('el extra es opcional y los zapatos pueden faltar si no hay', () => {
  const prendas = [prenda('arriba', ROSA), prenda('abajo', NEGRO), prenda('accesorio', BLANCO)];
  const todas = combinaciones(prendas);
  assert.equal(todas.length, 2);
  assert.ok(todas.some((outfit) => outfit.extra) && todas.some((outfit) => !outfit.extra));
  assert.ok(todas.every((outfit) => !outfit.zapatos));
});

test('los colores que combinan puntúan más que los que chocan', () => {
  const combina = { arriba: prenda('arriba', ROSA), abajo: prenda('abajo', MEZCLILLA), zapatos: prenda('zapatos', NEGRO) };
  const choca = { arriba: prenda('arriba', ROSA), abajo: prenda('abajo', AMARILLO), zapatos: prenda('zapatos', VERDE) };
  assert.ok(puntuarOutfit(combina) > puntuarOutfit(choca));
});

test('los estilos que chocan puntúan menos', () => {
  const igual = { arriba: prenda('arriba', ROSA, ['fiesta']), abajo: prenda('abajo', NEGRO, ['fiesta']) };
  const choca = { arriba: prenda('arriba', ROSA, ['fiesta']), abajo: prenda('abajo', NEGRO, ['deportivo']) };
  assert.ok(puntuarOutfit(igual) > puntuarOutfit(choca));
});

test('nunca elige un outfit que choca si hay uno que combina', () => {
  const rosa = prenda('arriba', ROSA);
  const prendas = [rosa, prenda('abajo', AMARILLO, ['deportivo']), prenda('abajo', MEZCLILLA)];
  for (let i = 0; i < 20; i++) {
    const { outfit } = generarOutfit(prendas, { azar: () => i / 20, cuantosMejores: 1 });
    assert.equal(outfit.abajo.color, MEZCLILLA);
  }
});

test('aunque haya pocas opciones, el sorteo no incluye las que chocan', () => {
  const prendas = [prenda('arriba', ROSA), prenda('abajo', AMARILLO, ['deportivo']), prenda('abajo', MEZCLILLA)];
  for (let i = 0; i < 20; i++) {
    const { outfit } = generarOutfit(prendas, { azar: () => i / 20 });
    assert.equal(outfit.abajo.color, MEZCLILLA);
  }
});

test('un conjunto siempre sale completo', () => {
  const top = prenda('arriba', ROSA, ['casual'], 'set rosado');
  const falda = prenda('abajo', ROSA_CLARO, ['casual'], 'set rosado');
  const prendas = [top, falda, prenda('arriba', BLANCO), prenda('abajo', NEGRO)];
  for (const outfit of combinaciones(prendas)) {
    const tieneTop = outfit.arriba?.id === top.id;
    const tieneFalda = outfit.abajo?.id === falda.id;
    assert.equal(tieneTop, tieneFalda, 'el top y la falda del set van juntos');
  }
});

test('el candado deja fija una prenda', () => {
  const fija = prenda('arriba', BLANCO);
  const prendas = [fija, prenda('arriba', ROSA), prenda('abajo', NEGRO), prenda('abajo', MEZCLILLA), prenda('vestido', ROSA)];
  for (let i = 0; i < 10; i++) {
    const { outfit } = generarOutfit(prendas, { fijas: { arriba: fija }, azar: () => i / 10 });
    assert.equal(outfit.arriba.id, fija.id);
    assert.equal(outfit.vestido, undefined);
  }
});

test('evita repetir el outfit que acaba de salir', () => {
  const prendas = [prenda('arriba', NEGRO), prenda('arriba', BLANCO), prenda('abajo', MEZCLILLA)];
  const primero = generarOutfit(prendas, { azar: () => 0, cuantosMejores: 1 }).outfit;
  const segundo = generarOutfit(prendas, { azar: () => 0, cuantosMejores: 1, recientes: [claveOutfit(primero)] }).outfit;
  assert.notEqual(claveOutfit(segundo), claveOutfit(primero));
});

test('la clave del outfit no depende del orden', () => {
  const a = prenda('arriba', ROSA);
  const b = prenda('abajo', NEGRO);
  assert.equal(claveOutfit({ arriba: a, abajo: b }), claveOutfit({ abajo: b, arriba: a }));
});

test('avisa si los candados no dejan armar nada', () => {
  const vestido = prenda('vestido', ROSA);
  const prendas = [vestido, prenda('arriba', ROSA)];
  assert.match(generarOutfit(prendas, { fijas: { arriba: prendas[1] } }).falta, /candado/);
});

test('sin candados, no culpa a los candados si un conjunto no deja armar nada', () => {
  // Dos accesorios del mismo conjunto no caben juntos en el único lugar de extra.
  const prendas = [prenda('arriba', ROSA, ['casual'], 'set'), prenda('abajo', NEGRO), prenda('accesorio', BLANCO, ['casual'], 'set'), prenda('accesorio', NEGRO, ['casual'], 'set')];
  const { falta } = generarOutfit(prendas);
  assert.doesNotMatch(falta, /candado/);
  assert.match(falta, /conjunto/);
});

test('describe el outfit para lectores de pantalla', () => {
  assert.equal(describirOutfit({ arriba: prenda('arriba', ROSA), abajo: prenda('abajo', NEGRO), zapatos: prenda('zapatos', BLANCO) }), 'Parte de arriba, Parte de abajo y Zapatos');
  assert.equal(describirOutfit({ vestido: prenda('vestido', ROSA) }), 'Vestido / enterito');
});

test('un favorito guarda los ids y se vuelve a armar con las prendas que quedan', () => {
  const arriba = prenda('arriba', ROSA);
  const abajo = prenda('abajo', NEGRO);
  const zapatos = prenda('zapatos', BLANCO);
  const favorito = { prendas: favoritoDesdeOutfit({ arriba, abajo, zapatos }) };
  assert.deepEqual(favorito.prendas, { arriba: arriba.id, abajo: abajo.id, zapatos: zapatos.id });

  // Si se borró los zapatos del armario, el favorito queda sin ellos
  const outfit = outfitDesdeFavorito(favorito, [arriba, abajo]);
  assert.equal(outfit.arriba, arriba);
  assert.equal(outfit.zapatos, undefined);
});

test('una combinación a mano necesita arriba + abajo, o un vestido', () => {
  assert.equal(combinacionCompleta({}), false);
  assert.equal(combinacionCompleta({ arriba: 'a' }), false);
  assert.equal(combinacionCompleta({ arriba: 'a', abajo: 'b' }), true);
  assert.equal(combinacionCompleta({ vestido: 'v', zapatos: 'z' }), true);
});
