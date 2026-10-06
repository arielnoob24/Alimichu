import { pantallaDesdeHash, pestanaDe } from './navegacion.js';
import { generarChispas } from './destellos.js';
import { debeCerrarHoja, elastico, velocidadDe } from './hoja.js';

const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
const PESTANAS = ['armario', 'inicio', 'favoritos'];

// En iOS, :active solo se activa al tocar si la página escucha touchstart.
document.addEventListener('touchstart', () => {}, { passive: true });

const hoja = document.getElementById('pantalla-agregar');
const velo = document.getElementById('velo');
let pestanaVisible = null;

function mostrarPantalla({ enfocar = true } = {}) {
  const actual = pantallaDesdeHash(location.hash);
  const pestana = pestanaDe(actual);
  document.body.dataset.pantalla = pestana;

  for (const nombre of PESTANAS) {
    document.getElementById(`pantalla-${nombre}`).hidden = nombre !== pestana;
  }

  // La burbuja de vidrio se desliza hasta la pestaña activa.
  document.getElementById('barra').style.setProperty('--indice', PESTANAS.indexOf(pestana));
  for (const enlace of document.querySelectorAll('.barra-enlace')) {
    if (enlace.getAttribute('href') === `#${pestana}`) {
      enlace.setAttribute('aria-current', 'page');
    } else {
      enlace.removeAttribute('aria-current');
    }
  }

  if (pestana !== pestanaVisible) {
    window.scrollTo(0, 0);
    pestanaVisible = pestana;
    if (enfocar && actual !== 'agregar') document.querySelector(`#pantalla-${pestana} .titulo`)?.focus();
  }

  mostrarHoja(actual === 'agregar', { enfocar });
}

function mostrarHoja(abierta, { enfocar }) {
  hoja.classList.toggle('abierta', abierta);
  hoja.inert = !abierta;
  velo.classList.toggle('visible', abierta);
  document.body.classList.toggle('hoja-abierta', abierta);
  if (abierta && enfocar) document.getElementById('titulo-agregar').focus({ preventScroll: true });
}

function cerrarHoja() {
  location.replace('#armario');
}

// Arrastrar la hoja desde el asa: sigue al dedo 1:1 y al soltar decide con el impulso.
const asa = document.getElementById('hoja-asa');
let arrastre = null;

asa.addEventListener('pointerdown', (evento) => {
  asa.setPointerCapture(evento.pointerId);
  arrastre = { inicioY: evento.clientY, alto: hoja.offsetHeight, historial: [] };
  hoja.classList.add('arrastrando');
});

asa.addEventListener('pointermove', (evento) => {
  if (!arrastre) return;
  const desplazamiento = evento.clientY - arrastre.inicioY;
  const y = desplazamiento < 0 ? elastico(desplazamiento, arrastre.alto) : desplazamiento;
  hoja.style.transform = `translateY(${y}px)`;
  arrastre.historial.push({ y: evento.clientY, t: evento.timeStamp });
  arrastre.historial = arrastre.historial.filter(({ t }) => evento.timeStamp - t < 100);
});

function soltarHoja(evento) {
  if (!arrastre) return;
  const desplazamiento = evento.clientY - arrastre.inicioY;
  const velocidad = velocidadDe(arrastre.historial);
  const { alto } = arrastre;
  arrastre = null;
  // Al quitar el transform en línea, la transición parte desde donde quedó el dedo.
  hoja.classList.remove('arrastrando');
  hoja.style.removeProperty('transform');
  if (debeCerrarHoja({ desplazamiento, velocidad, alto })) cerrarHoja();
}

asa.addEventListener('pointerup', soltarHoja);
asa.addEventListener('pointercancel', soltarHoja);
velo.addEventListener('click', cerrarHoja);
document.getElementById('cerrar-hoja').addEventListener('click', cerrarHoja);
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && hoja.classList.contains('abierta')) cerrarHoja();
});

function lanzarDestellos(boton) {
  if (sinMovimiento.matches) return;
  const { left, top, width, height } = boton.getBoundingClientRect();

  const chispas = generarChispas(16, { distancia: 160 });
  chispas.forEach(({ x, y, tamano, retraso }, i) => {
    const chispa = document.createElement('span');
    chispa.className = i % 2 === 0 ? 'chispa' : 'chispa chispa-plata';
    chispa.style.left = `${left + width / 2}px`;
    chispa.style.top = `${top + height / 2}px`;
    chispa.style.width = `${tamano + 10}px`;
    chispa.style.setProperty('--x', `${x}px`);
    // Las mariposas vuelan hacia arriba y casi sin girar.
    chispa.style.setProperty('--y', `${y - 70}px`);
    chispa.style.setProperty('--giro', `${Math.round(x / 6)}deg`);
    chispa.style.setProperty('--retraso', `${retraso}ms`);
    chispa.addEventListener('animationend', () => chispa.remove());
    document.body.append(chispa);
  });
}

function reiniciarAnimacion(elemento, clase) {
  elemento.classList.remove(clase);
  void elemento.offsetWidth;
  elemento.classList.add(clase);
}

const botonAlina = document.getElementById('boton-alina');
let temporizadorMariposas;
botonAlina.addEventListener('click', () => {
  reiniciarAnimacion(botonAlina, 'activo');
  lanzarDestellos(botonAlina);
  // Las mariposas posadas salen volando y vuelven a posarse.
  clearTimeout(temporizadorMariposas);
  temporizadorMariposas = setTimeout(() => botonAlina.classList.remove('activo'), 1800);
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
  document.getElementById('aviso-prenda').textContent = 'Muy pronto vas a poder guardar tus prendas 💖';
});

window.addEventListener('hashchange', () => mostrarPantalla());
mostrarPantalla({ enfocar: false });
