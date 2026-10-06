# Alimichu

Armario digital para Alina: fotografía su ropa (guardada con fondo blanco) y genera outfits que combinan con un botón grande "Alina". Estética Y2K de los 2000 tipo Bratz: cromo rosa y plata sobre negro, con mariposas (nunca estrellas), sin puntitos de glitter (ver sección 3 de PLAN.md). Para el texto de cromo se usa la clase `.cromo` con `data-texto`. Hecha con HTML, CSS y JavaScript puros (sin frameworks ni build), publicada en GitHub Pages: https://arielnoob24.github.io/Alimichu/

Pensada para celular. Los datos (prendas, fotos, favoritos) se guardan en IndexedDB, solo en el navegador; no hay servidor.

El plan del proyecto está en [PLAN.md](PLAN.md). Léelo antes de empezar una tarea.

## Estructura

- `index.html` y otras páginas `.html` en la raíz.
- `css/` estilos, `js/` scripts (ES modules), `assets/` imágenes e íconos.
- `tests/` pruebas con el test runner de Node (`node --test`) para la lógica de `js/`.
- `package.json` solo contiene herramientas de validación; el sitio no depende de nada.

## Comandos

- `npm run check`: ESLint + html-validate + tests (lo mismo que corre el CI).
- Para ver el sitio en local, abre `index.html` con la extensión Live Server de VS Code (los ES modules no cargan con `file://`).

## Reglas

- **Mobile first para iPhone** (ver "Regla principal" en PLAN.md):
  - Alina usa un iPhone 15 o más nuevo con Safari: ancho de 390 a 440 px, Dynamic Island y barra de inicio.
  - Los estilos base son para 390 px y las pantallas grandes se agregan con `@media (min-width: …)`.
  - Usa `viewport-fit=cover`, `env(safe-area-inset-*)` y `100dvh`.
  - Zonas táctiles de 44 px o más, inputs con letra de 16 px o más, y nada que dependa del hover.
  - Safari no tiene Vibration API; agrega prefijos `-webkit-` donde haga falta.
  - Lo que use cámara, fotos o instalación se verifica en el iPhone real.

- **Todo cambio se publica:** se trabaja directo en `main`. Después de cada cambio, corre `npm run check`, haz commit y `git push` a `main`. El workflow `.github/workflows/ci-cd.yml` vuelve a validar y publica en GitHub Pages. Después, confirma que el workflow pasó.
- El paso "Preparar sitio" del workflow copia `*.html`, `css/`, `js/` y `assets/`. Si creas otra carpeta pública, agrégala ahí.
- Usa rutas relativas (`css/styles.css`, no `/css/styles.css`): el sitio vive bajo `/Alimichu/`.
- Separa la lógica pura (sin DOM) en módulos de `js/` para poder testearla.
