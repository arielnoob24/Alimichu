import { PANTALLAS, PESTANAS, esVista, pantallaDesdeHash, pestanaDe } from './navegacion.js';
import { generarChispas } from './destellos.js';
import { listarPrendas } from './armario.js';
import { iniciarArmario, pintarArmario, pintarDetalle } from './vista-armario.js';

const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
const TITULOS = { inicio: 'Inicio', armario: 'Mi armario', favoritos: 'Favoritos' };

// En iOS, :active solo se activa al tocar si la página escucha touchstart.
document.addEventListener('touchstart', () => {}, { passive: true });

// El service worker hace que siempre se cargue la versión más nueva, completa y sin mezclas.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

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
    if (actual === 'armario') pintarArmario();
    if (actual === 'prenda') {
      pintarDetalle().then((hayPrenda) => {
        if (!hayPrenda) location.replace('#armario');
      });
    }
    if (enfocar && esVista(actual)) document.querySelector(`#pantalla-${actual} .titulo`)?.focus();
  }
}

// El nombre de la sección, para lectores de pantalla (arriba solo se ven mariposas).
function ponerTitulo(pestana) {
  const texto = TITULOS[pestana];
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

async function generarOutfit() {
  reiniciarAnimacion(document.getElementById('prendas-outfit'), 'barajando');
  const total = (await listarPrendas().catch(() => [])).length;
  const pista = document.getElementById('outfit-pista');
  // El generador de combinaciones llega en la fase 5; por ahora se avisa cuántas prendas hay.
  pista.textContent = total
    ? `Ya tienes ${total} ${total === 1 ? 'prenda' : 'prendas'} en tu armario 💖 Muy pronto Alina va a armar outfits con ellas.`
    : 'Todavía no hay prendas en tu armario. ¡Agrega algunas y vuelve a apretar Alina!';
  document.getElementById('outfit-agregar').hidden = total > 0;
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

iniciarArmario({ volver });

window.addEventListener('hashchange', () => {
  navegoDentroDeLaApp = true;
  mostrarPantalla();
});
mostrarPantalla({ enfocar: false });
