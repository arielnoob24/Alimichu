// Vista "Tu outfit": muestra la combinación del botón Alina, con candados y botón de favorito.
import { borrarFavorito, guardarFavorito, listarPrendas } from './armario.js';
import { avisar } from './aviso.js';
import { CATEGORIAS } from './prendas.js';
import { claveOutfit, favoritoDesdeOutfit, generarOutfit } from './outfits.js';

const VACIOS = {
  arriba: { icono: '👚', nombre: 'Arriba' },
  abajo: { icono: '👖', nombre: 'Abajo' },
  zapatos: { icono: '👟', nombre: 'Zapatos' },
  extra: { icono: '👜', nombre: 'Extra' },
};
const ICONO_CANDADO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

let outfitActual = null;
let fijas = {};
let recientes = [];
let favoritoId = null;
let outfitPreparado = false;
const urls = new Set();

// Dibuja los lugares de un outfit (arriba, abajo o vestido, zapatos y extra) en un contenedor.
// Con `candados`, cada prenda lleva un botón para dejarla fija.
export function dibujarOutfit(contenedor, outfit, { candados = false, fijas: bloqueadas = {}, urls: urlsUsadas }) {
  const lugares = outfit.vestido ? ['vestido', 'extra', 'zapatos'] : ['arriba', 'extra', 'abajo', 'zapatos'];
  contenedor.classList.toggle('con-vestido', Boolean(outfit.vestido));
  contenedor.replaceChildren(
    ...lugares.map((lugar) => {
      const prenda = outfit[lugar];
      const figura = document.createElement('figure');
      figura.className = `prenda prenda-${lugar}`;
      if (!prenda) {
        const { icono, nombre } = VACIOS[lugar];
        figura.innerHTML = `<span class="prenda-icono" aria-hidden="true">${icono}</span><figcaption>${nombre}</figcaption>`;
        figura.classList.add('sin-prenda');
        return figura;
      }

      const foto = document.createElement('img');
      const url = URL.createObjectURL(prenda.foto);
      urlsUsadas.add(url);
      foto.src = url;
      foto.alt = CATEGORIAS[prenda.categoria];
      figura.classList.add('llena');
      figura.append(foto);

      if (candados) {
        const candado = document.createElement('button');
        candado.type = 'button';
        candado.className = 'candado';
        candado.dataset.lugar = lugar;
        candado.setAttribute('aria-pressed', String(bloqueadas[lugar]?.id === prenda.id));
        candado.setAttribute('aria-label', `Dejar fija: ${CATEGORIAS[prenda.categoria]}`);
        candado.innerHTML = ICONO_CANDADO;
        figura.append(candado);
      }
      return figura;
    }),
  );
}

function liberarUrls() {
  for (const url of urls) URL.revokeObjectURL(url);
  urls.clear();
}

function pintar(pista = '') {
  liberarUrls();
  const contenedor = document.getElementById('prendas-outfit');
  dibujarOutfit(contenedor, outfitActual ?? {}, { candados: true, fijas, urls });
  document.getElementById('outfit-pista').textContent = pista;

  const hayOutfit = Boolean(outfitActual);
  document.getElementById('outfit-agregar').hidden = hayOutfit;
  document.getElementById('otra-combinacion').hidden = !hayOutfit;
  const favorito = document.getElementById('guardar-favorito');
  favorito.hidden = !hayOutfit;
  favorito.setAttribute('aria-pressed', String(Boolean(favoritoId)));
  document.getElementById('guardar-favorito-texto').textContent = favoritoId ? 'Guardado' : 'Guardar';
}

function animarEntrada() {
  const contenedor = document.getElementById('prendas-outfit');
  contenedor.classList.remove('barajando');
  void contenedor.offsetWidth;
  contenedor.classList.add('barajando');
}

async function generar() {
  const prendas = await listarPrendas().catch(() => []);
  // Si una prenda fija se borró del armario, se suelta el candado.
  const ids = new Set(prendas.map((prenda) => prenda.id));
  fijas = Object.fromEntries(Object.entries(fijas).filter(([, prenda]) => ids.has(prenda.id)));

  const resultado = generarOutfit(prendas, { fijas, recientes });
  favoritoId = null;
  if (resultado.falta) {
    outfitActual = null;
    pintar(resultado.falta);
    return;
  }
  outfitActual = resultado.outfit;
  recientes = [claveOutfit(outfitActual), ...recientes].slice(0, 5);
  pintar('¿Te gusta? Toca el corazón para guardarlo 💖 · El candado deja una prenda fija');
  animarEntrada();
}

// Al entrar a la vista: muestra el favorito que se abrió, o genera un outfit nuevo desde cero.
export function entrarAOutfit() {
  if (outfitPreparado) {
    outfitPreparado = false;
    pintar('Abriste un favorito. Toca "Otra combinación" para generar uno nuevo con los candados que quieras.');
    animarEntrada();
    return;
  }
  document.getElementById('volver-outfit-texto').textContent = 'Inicio';
  fijas = {};
  generar();
}

// Abre un favorito en la vista del outfit (desde la pestaña Favoritos).
export function abrirFavoritoEnOutfit(outfit, id) {
  outfitActual = outfit;
  favoritoId = id;
  fijas = {};
  outfitPreparado = true;
  document.getElementById('volver-outfit-texto').textContent = 'Favoritos';
  location.hash = '#outfit';
}

export function iniciarOutfit() {
  document.getElementById('otra-combinacion').addEventListener('click', generar);

  document.getElementById('prendas-outfit').addEventListener('click', (evento) => {
    const candado = evento.target.closest('.candado');
    if (!candado || !outfitActual) return;
    const { lugar } = candado.dataset;
    if (fijas[lugar]) {
      delete fijas[lugar];
    } else {
      fijas[lugar] = outfitActual[lugar];
    }
    candado.setAttribute('aria-pressed', String(Boolean(fijas[lugar])));
  });

  document.getElementById('guardar-favorito').addEventListener('click', async () => {
    if (!outfitActual) return;
    try {
      if (favoritoId) {
        await borrarFavorito(favoritoId);
        favoritoId = null;
        avisar('Quitado de favoritos');
      } else {
        favoritoId = (await guardarFavorito(favoritoDesdeOutfit(outfitActual), 'alina')).id;
        avisar('Guardado en favoritos 💖');
      }
    } catch {
      avisar('No se pudo guardar el favorito');
    }
    const boton = document.getElementById('guardar-favorito');
    boton.setAttribute('aria-pressed', String(Boolean(favoritoId)));
    document.getElementById('guardar-favorito-texto').textContent = favoritoId ? 'Guardado' : 'Guardar';
  });
}
