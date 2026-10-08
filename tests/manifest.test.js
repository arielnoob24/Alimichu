import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));

test('el manifest abre la app a pantalla completa y siempre en Inicio', () => {
  assert.equal(manifest.display, 'standalone');
  // Rutas relativas: el sitio vive bajo /Alimichu/.
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
});

test('los íconos del manifest existen y hay uno para Android (maskable)', () => {
  for (const icono of manifest.icons) {
    assert.ok(!icono.src.startsWith('/'), `${icono.src} debe ser relativa`);
    assert.ok(existsSync(new URL(`../${icono.src}`, import.meta.url)), `falta ${icono.src}`);
  }
  assert.ok(manifest.icons.some((icono) => icono.sizes === '512x512' && icono.purpose === 'any'));
  assert.ok(manifest.icons.some((icono) => icono.purpose === 'maskable'));
});

test('el workflow publica el manifest', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci-cd.yml', import.meta.url), 'utf8');
  assert.match(workflow, /cp .*manifest\.json/);
});
