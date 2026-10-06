import { generarChispas } from './destellos.js';

const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

function soltarMariposas(boton) {
  if (sinMovimiento.matches) return;
  const { left, top, width, height } = boton.getBoundingClientRect();

  for (const { x, y, tamano, retraso } of generarChispas(10, { distancia: 150 })) {
    const mariposa = document.createElement('span');
    mariposa.className = 'mariposita';
    mariposa.style.left = `${left + width / 2}px`;
    mariposa.style.top = `${top + height / 2}px`;
    mariposa.style.width = `${tamano + 12}px`;
    mariposa.style.setProperty('--x', `${x}px`);
    mariposa.style.setProperty('--y', `${y - 60}px`);
    mariposa.style.setProperty('--giro', `${Math.round(x / 6)}deg`);
    mariposa.style.setProperty('--retraso', `${retraso}ms`);
    mariposa.addEventListener('animationend', () => mariposa.remove());
    document.body.append(mariposa);
  }
}

for (const boton of document.querySelectorAll('.boton-mariposa, .boton-pildora, .boton-corazon')) {
  boton.addEventListener('click', () => {
    boton.classList.remove('activo');
    void boton.offsetWidth;
    boton.classList.add('activo');
    soltarMariposas(boton);
    // Las mariposas posadas de la píldora vuelven después de volar.
    clearTimeout(boton.temporizador);
    boton.temporizador = setTimeout(() => boton.classList.remove('activo'), 1800);
  });
}
