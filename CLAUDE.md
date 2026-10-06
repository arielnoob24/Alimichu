# Alimichu

Sitio estático con Vite publicado en GitHub Pages: https://arielnoob24.github.io/Alimichu/

## Comandos

- `npm run dev` – servidor local
- `npm run check` – lint + tests + build (lo mismo que corre el CI)

## Flujo de trabajo

- `main` se publica automáticamente vía `.github/workflows/ci-cd.yml`. Los cambios entran por rama + PR.
- Agente `codificador` para implementar; agente `auditor` para revisar antes de hacer merge.
- `vite.config.js` usa `base: '/Alimichu/'`: los assets deben referenciarse con imports o rutas relativas.
