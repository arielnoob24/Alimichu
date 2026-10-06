import { HOJAS, VISTAS, pantallaDesdeHash, pestanaDe } from './navegacion.js';
import { generarChispas } from './destellos.js';
import { debeCerrarHoja, elastico, velocidadDe } from './hoja.js';

const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
const PESTANAS = ['armario', 'inicio', 'favoritos'];
const SECCIONES = [...PESTANAS, ...Object.keys(VISTAS)];

// En iOS, :active solo se activa al tocar si la página escucha touchstart.
document.addEventListener('touchstart', () => {}, { passive: true });

const velo = document.getElementById('velo');
let vistaVisible = null;

function mostrarPantalla({ enfocar = true } = {}) {
  const actual = pantallaDesdeHash(location.hash);
  const pestana = pestanaDe(actual);
  // Las hojas se abren encima: debajo sigue la pestaña. Las vistas reemplazan a su pestaña.
  const vista = actual in HOJAS ? pestana : actual;
  document.body.dataset.pantalla = vista;

  for (const nombre of SECCIONES) {
    document.getElementById(`pantalla-${nombre}`).hidden = nombre !== vista;
  }

  // Como en iOS: la vista nueva entra desde la derecha y al volver se regresa por el mismo camino.
  if (VISTAS[vista] === vistaVisible) animarEntrada(vista, 'entrar-adelante');
  if (VISTAS[vistaVisible] === vista) animarEntrada(vista, 'entrar-atras');

  // La burbuja de vidrio se desliza hasta la pestaña activa.
  document.getElementById('barra').style.setProperty('--indice', PESTANAS.indexOf(pestana));
  for (const enlace of document.querySelectorAll('.barra-enlace')) {
    if (enlace.getAttribute('href') === `#${pestana}`) {
      enlace.setAttribute('aria-current', 'page');
    } else {
      enlace.removeAttribute('aria-current');
    }
  }

  if (vista !== vistaVisible) {
    window.scrollTo(0, 0);
    vistaVisible = vista;
    if (vista === 'outfit') generarOutfit();
    if (enfocar && !(actual in HOJAS)) document.querySelector(`#pantalla-${vista} .titulo`)?.focus();
  }

  mostrarHojas(actual, { enfocar });
}

function animarEntrada(nombre, clase) {
  if (sinMovimiento.matches) return;
  const seccion = document.getElementById(`pantalla-${nombre}`);
  seccion.classList.add(clase);
  seccion.addEventListener('animationend', () => seccion.classList.remove(clase), { once: true });
}

function mostrarHojas(actual, { enfocar }) {
  for (const nombre of Object.keys(HOJAS)) {
    const hoja = document.getElementById(`pantalla-${nombre}`);
    const abierta = nombre === actual;
    hoja.classList.toggle('abierta', abierta);
    hoja.inert = !abierta;
    if (abierta && enfocar) document.getElementById(`titulo-${nombre}`).focus({ preventScroll: true });
  }
  const hayHoja = actual in HOJAS;
  velo.classList.toggle('visible', hayHoja);
  document.body.classList.toggle('hoja-abierta', hayHoja);
}

// Al cerrar una hoja se vuelve a la pestaña sobre la que estaba abierta.
function cerrarHoja() {
  location.replace(`#${pestanaDe(pantallaDesdeHash(location.hash))}`);
}

// Arrastrar una hoja desde su asa: sigue al dedo 1:1 y al soltar decide con el impulso.
for (const asa of document.querySelectorAll('.hoja-asa')) {
  const hoja = asa.closest('.hoja');
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

  const soltar = (evento) => {
    if (!arrastre) return;
    const desplazamiento = evento.clientY - arrastre.inicioY;
    const velocidad = velocidadDe(arrastre.historial);
    const { alto } = arrastre;
    arrastre = null;
    // Al quitar el transform en línea, la transición parte desde donde quedó el dedo.
    hoja.classList.remove('arrastrando');
    hoja.style.removeProperty('transform');
    if (debeCerrarHoja({ desplazamiento, velocidad, alto })) cerrarHoja();
  };

  asa.addEventListener('pointerup', soltar);
  asa.addEventListener('pointercancel', soltar);
}

velo.addEventListener('click', cerrarHoja);
for (const boton of document.querySelectorAll('.cerrar-hoja')) {
  boton.addEventListener('click', cerrarHoja);
}
document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && document.body.classList.contains('hoja-abierta')) cerrarHoja();
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

function generarOutfit() {
  reiniciarAnimacion(document.getElementById('prendas'), 'barajando');
  // Hasta que exista el armario (fase 3) no hay prendas con qué armar el outfit.
  document.getElementById('outfit-pista').textContent =
    'Todavía no hay prendas en tu armario. ¡Agrega algunas y vuelve a apretar Alina!';
  document.getElementById('outfit-agregar').hidden = false;
}

const botonAlina = document.getElementById('boton-alina');
let temporizadorMariposas;
let llegoDesdeInicio = false;
botonAlina.addEventListener('click', () => {
  reiniciarAnimacion(botonAlina, 'activo');
  lanzarDestellos(botonAlina);
  // Las mariposas posadas salen volando y vuelven a posarse.
  clearTimeout(temporizadorMariposas);
  temporizadorMariposas = setTimeout(() => botonAlina.classList.remove('activo'), 1800);
  // Se deja ver un momento la lluvia de mariposas y se pasa a la vista del outfit.
  setTimeout(() => {
    llegoDesdeInicio = true;
    location.hash = '#outfit';
  }, sinMovimiento.matches ? 0 : 450);
});

document.getElementById('otra-combinacion').addEventListener('click', generarOutfit);

// Volver usa el historial, así también funciona el gesto de deslizar desde el borde en iPhone.
document.getElementById('volver').addEventListener('click', () => {
  if (llegoDesdeInicio) {
    history.back();
  } else {
    location.replace('#inicio');
  }
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
