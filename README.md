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

Se trabaja directo en `main`. Cada push valida el HTML, revisa el JavaScript y corre los tests. Si todo pasa, publica el sitio en GitHub Pages; si algo falla, sigue en línea la versión anterior.
