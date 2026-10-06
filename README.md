# Alimichu

[![CI/CD](https://github.com/arielnoob24/Alimichu/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/arielnoob24/Alimichu/actions/workflows/ci-cd.yml)

App web hecha con HTML, CSS y JavaScript. Publicada en https://arielnoob24.github.io/Alimichu/

Plan del proyecto: [PLAN.md](PLAN.md)

## Desarrollo

1. Abre la carpeta en VS Code y lanza `index.html` con la extensión **Live Server**.
2. Antes de subir cambios, valida igual que el CI:

```bash
npm install
npm run check
```

## CI/CD

- **Pull requests a `main`**: valida el HTML, revisa el JavaScript y corre los tests.
- **Push a `main`**: lo anterior y, si pasa, publica el sitio en GitHub Pages.
