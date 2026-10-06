import { PANTALLAS, PESTANAS, esVista, pantallaDesdeHash, pestanaDe } from './navegacion.js';
import { generarChispas } from './destellos.js';
import { saludo } from './saludo.js';

const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
const TITULOS = { armario: 'Mi armario', favoritos: 'Favoritos' };

// En iOS, :active solo se activa al tocar si la página escucha touchstart.
document.addEventListener('touchstart', () => {}, { passive: true });

let pantallaVisible = null;
let navegoDentroDeLaApp = false;

function mostrarPantalla({ enfocar = true } = {}) {
  const actual = pantallaDesdeHash(location.hash);
  const pestana = pestanaDe(actual);
  document.body.dataset.pantalla = actual;
  document.body.dataset.tipo = esVista(actual) ? 'vista' : 'pestana';

  for (const nombre of PANTALLAS) {
    document.getElementById(`pantalla-${nombre}`).hidden = nombre !== actual;
  }

  ponerTitulo(pestana);

  // La burbuja de vidrio se desliza hasta la pestaña activa.
  document.getElementById('barra').style.setProperty('--indice', PESTANAS.indexOf(pestana));
  for (const enlace of document.querySelectorAll('.barra-enlace')) {
    if (enlace.getAttribute('href') === `#${pestana}`) {
      enlace.setAttribute('aria-current', 'page');
    } else {
      enlace.removeAttribute('aria-current');
    }
  }

  // Como en iOS: la vista nueva entra desde la derecha y al volver la pestaña regresa desde la izquierda.
  if (pantallaVisible !== null && actual !== pantallaVisible) {
    if (esVista(actual)) animarEntrada(actual, 'entrar-adelante');
    else if (esVista(pantallaVisible) && pestanaDe(pantallaVisible) === actual) animarEntrada(actual, 'entrar-atras');
  }

  if (actual !== pantallaVisible) {
    window.scrollTo(0, 0);
    pantallaVisible = actual;
    if (actual === 'outfit') generarOutfit();
    if (enfocar && esVista(actual)) document.querySelector(`#pantalla-${actual} .titulo`)?.focus();
  }
}

// En Inicio, un saludo según la hora; en las otras pestañas, el nombre de la sección.
function ponerTitulo(pestana) {
  const texto = pestana === 'inicio' ? saludo(new Date()) : TITULOS[pestana];
  const titulo = document.getElementById('titulo-pagina');
  titulo.dataset.texto = texto;
  titulo.firstElementChild.textContent = texto;
}

function animarEntrada(nombre, clase) {
  if (sinMovimiento.matches) return;
  const seccion = document.getElementById(`pantalla-${nombre}`);
  seccion.classList.add(clase);
  seccion.addEventListener('animationend', () => seccion.classList.remove(clase), { once: true });
}

// Volver usa el historial, así también funciona el gesto de deslizar desde el borde en iPhone.
// Si se entró directo a una vista (por ejemplo, recargando), vuelve a su pestaña.
function volver() {
  if (navegoDentroDeLaApp) {
    history.back();
  } else {
    location.replace(`#${pestanaDe(pantallaDesdeHash(location.hash))}`);
  }
}

for (const boton of document.querySelectorAll('.volver')) {
  boton.addEventListener('click', volver);
}

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
  reiniciarAnimacion(document.getElementById('prendas-outfit'), 'barajando');
  // Hasta que exista el armario (fase 3) no hay prendas con qué armar el outfit.
  document.getElementById('outfit-pista').textContent =
    'Todavía no hay prendas en tu armario. ¡Agrega algunas y vuelve a apretar Alina!';
  document.getElementById('outfit-agregar').hidden = false;
}

const botonAlina = document.getElementById('boton-alina');
let temporizadorMariposas;
botonAlina.addEventListener('click', () => {
  reiniciarAnimacion(botonAlina, 'activo');
  lanzarDestellos(botonAlina);
  // Las mariposas posadas salen volando y vuelven a posarse.
  clearTimeout(temporizadorMariposas);
  temporizadorMariposas = setTimeout(() => botonAlina.classList.remove('activo'), 1800);
  // Se deja ver un momento la lluvia de mariposas y se pasa a la vista del outfit.
  setTimeout(() => {
    location.hash = '#outfit';
  }, sinMovimiento.matches ? 0 : 450);
});

document.getElementById('otra-combinacion').addEventListener('click', generarOutfit);

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

window.addEventListener('hashchange', () => {
  navegoDentroDeLaApp = true;
  mostrarPantalla();
});
// Si la app queda abierta, el saludo se actualiza al volver a ella.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) ponerTitulo(pestanaDe(pantallaDesdeHash(location.hash)));
});
mostrarPantalla({ enfocar: false });
