# Alimichu

[![CI/CD](https://github.com/arielnoob24/Alimichu/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/arielnoob24/Alimichu/actions/workflows/ci-cd.yml)

Sitio publicado en https://arielnoob24.github.io/Alimichu/

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run check    # lint + tests + build
```

## CI/CD

- **Pull requests a `main`**: lint, tests y build.
- **Push a `main`**: lo anterior y, si pasa, publica `dist/` en GitHub Pages.
