import { PANTALLAS, PESTANAS, esVista, pantallaDesdeHash, pestanaDe } from './navegacion.js';
import { generarChispas } from './destellos.js';
import { pedirAlmacenamientoPersistente } from './armario.js';
import { iniciarArmario, pintarArmario, pintarDetalle } from './vista-armario.js';
import { entrarAOutfit, iniciarOutfit } from './vista-outfit.js';
import { iniciarFavoritos, pintarCrear, pintarFavoritos } from './vista-favoritos.js';

const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
const TITULOS = { inicio: 'Inicio', armario: 'Mi armario', favoritos: 'Favoritos' };

// En iOS, :active solo se activa al tocar si la página escucha touchstart.
document.addEventListener('touchstart', () => {}, { passive: true });

// El service worker hace que siempre se cargue la versión más nueva, completa y sin mezclas.
if ('serviceWorker' in navigator) {
  // Si el service worker que controla la app ya existía y se actualiza, se recarga una vez
  // para mostrar la versión nueva sin que Alina tenga que hacer nada.
  const yaHabiaUno = Boolean(navigator.serviceWorker.controller);
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!yaHabiaUno || recargando) return;
    recargando = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Si se publicó una versión nueva mientras la app estaba abierta (o guardada en el navegador),
// se recarga sola al abrirla o al volver a ella. Solo una vez por versión, para no quedar en bucle.
const versionCargada = document.querySelector('meta[name="version"]').content;

async function revisarVersion() {
  if (versionCargada === 'dev') return;
  try {
    const { version } = await (await fetch('version.json', { cache: 'no-store' })).json();
    if (version === versionCargada || sessionStorage.getItem('recargadoPara') === version) return;
    sessionStorage.setItem('recargadoPara', version);
    location.reload();
  } catch {
    // Sin internet o sin sessionStorage: se sigue con la versión que hay.
  }
}

revisarVersion();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) revisarVersion();
});

// Para que iOS no borre el armario si Alina pasa un tiempo sin abrir la app.
pedirAlmacenamientoPersistente();

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
  const barra = document.getElementById('barra');
  barra.style.setProperty('--indice', PESTANAS.indexOf(pestana));
  // En las vistas la barra se esconde: tampoco se puede tocar ni la leen los lectores de pantalla.
  barra.inert = esVista(actual);
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
    if (actual === 'outfit') entrarAOutfit();
    if (actual === 'armario') pintarArmario();
    if (actual === 'favoritos') pintarFavoritos();
    if (actual === 'crear') pintarCrear();
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

iniciarArmario({ volver });
iniciarOutfit();
iniciarFavoritos({ volver });

window.addEventListener('hashchange', () => {
  navegoDentroDeLaApp = true;
  mostrarPantalla();
});
mostrarPantalla({ enfocar: false });
