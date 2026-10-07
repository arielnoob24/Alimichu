// Página temporal de letras: el botón Alina hace su animación al tocarlo.
import { generarChispas } from './destellos.js';

const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

for (const boton of document.querySelectorAll('.boton-alina')) {
  boton.addEventListener('click', () => {
    boton.classList.remove('activo');
    void boton.offsetWidth;
    boton.classList.add('activo');
    clearTimeout(boton.temporizador);
    boton.temporizador = setTimeout(() => boton.classList.remove('activo'), 1800);
    if (sinMovimiento.matches) return;

    const { left, top, width, height } = boton.getBoundingClientRect();
    generarChispas(16, { distancia: 160 }).forEach(({ x, y, tamano, retraso }, i) => {
      const chispa = document.createElement('span');
      chispa.className = i % 2 === 0 ? 'chispa' : 'chispa chispa-plata';
      chispa.style.left = `${left + width / 2}px`;
      chispa.style.top = `${top + height / 2}px`;
      chispa.style.width = `${tamano + 10}px`;
      chispa.style.setProperty('--x', `${x}px`);
      chispa.style.setProperty('--y', `${y - 70}px`);
      chispa.style.setProperty('--giro', `${Math.round(x / 6)}deg`);
      chispa.style.setProperty('--retraso', `${retraso}ms`);
      chispa.addEventListener('animationend', () => chispa.remove());
      document.body.append(chispa);
    });
  });
}
