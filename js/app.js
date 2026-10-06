import { PANTALLAS, pantallaDesdeHash, pestanaDe } from './navegacion.js';
import { generarChispas } from './destellos.js';

const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

function mostrarPantalla({ enfocar = true } = {}) {
  const actual = pantallaDesdeHash(location.hash);
  document.body.dataset.pantalla = actual;

  for (const nombre of PANTALLAS) {
    document.getElementById(`pantalla-${nombre}`).hidden = nombre !== actual;
  }

  for (const enlace of document.querySelectorAll('.barra-enlace')) {
    if (enlace.getAttribute('href') === `#${pestanaDe(actual)}`) {
      enlace.setAttribute('aria-current', 'page');
    } else {
      enlace.removeAttribute('aria-current');
    }
  }

  window.scrollTo(0, 0);
  if (enfocar) document.querySelector(`#pantalla-${actual} .titulo`)?.focus();
}

function lanzarDestellos(boton) {
  if (sinMovimiento.matches) return;
  const { left, top, width, height } = boton.getBoundingClientRect();

  for (const { x, y, tamano, giro, retraso } of generarChispas(14)) {
    const chispa = document.createElement('span');
    chispa.className = 'chispa';
    chispa.style.left = `${left + width / 2}px`;
    chispa.style.top = `${top + height / 2}px`;
    chispa.style.width = `${tamano}px`;
    chispa.style.setProperty('--x', `${x}px`);
    chispa.style.setProperty('--y', `${y}px`);
    chispa.style.setProperty('--giro', `${giro}deg`);
    chispa.style.setProperty('--retraso', `${retraso}ms`);
    chispa.addEventListener('animationend', () => chispa.remove());
    document.body.append(chispa);
  }
}

function reiniciarAnimacion(elemento, clase) {
  elemento.classList.remove(clase);
  void elemento.offsetWidth;
  elemento.classList.add(clase);
}

const botonAlina = document.getElementById('boton-alina');
botonAlina.addEventListener('click', () => {
  reiniciarAnimacion(botonAlina, 'rebote');
  lanzarDestellos(botonAlina);
  reiniciarAnimacion(document.getElementById('prendas'), 'barajando');
  // Hasta que exista el armario (fase 3) no hay prendas con qué armar el outfit.
  document.getElementById('outfit-pista').textContent =
    'Todavía no hay prendas en tu armario. ¡Agrega algunas y vuelve a apretar Alina!';
  document.getElementById('outfit-agregar').hidden = false;
});

const inputFoto = document.getElementById('foto-prenda');
const vistaFoto = document.createElement('img');
vistaFoto.className = 'foto-vista';
vistaFoto.alt = 'Vista previa de la prenda';
inputFoto.addEventListener('change', () => {
  const [archivo] = inputFoto.files;
  if (!archivo) return;
  if (vistaFoto.src) URL.revokeObjectURL(vistaFoto.src);
  vistaFoto.src = URL.createObjectURL(archivo);
  document.getElementById('foto').replaceChildren(vistaFoto);
});

document.getElementById('form-prenda').addEventListener('submit', (evento) => {
  evento.preventDefault();
  document.getElementById('aviso-prenda').textContent = 'Muy pronto vas a poder guardar tus prendas ✦';
});

window.addEventListener('hashchange', () => mostrarPantalla());
mostrarPantalla({ enfocar: false });
