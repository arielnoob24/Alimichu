// Pestaña Favoritos (outfits guardados) y vista "Nuevo outfit" (combinación hecha a mano).
import { borrarFavorito, guardarFavorito, listarFavoritos, listarPrendas } from './armario.js';
import { avisar } from './aviso.js';
import { CATEGORIAS } from './prendas.js';
import { LUGAR_DE_CATEGORIA, combinacionCompleta, favoritoDesdeOutfit, outfitDesdeFavorito, prendasDe } from './outfits.js';
import { abrirFavoritoEnOutfit, dibujarOutfit } from './vista-outfit.js';

const urlsLista = new Set();
const urlsCrear = new Set();
let favoritosPorId = new Map();
let seleccion = {};

// Qué categorías se eligen en cada fila de "Nuevo outfit".
const FILAS = {
  arriba: ['arriba', 'vestido'],
  abajo: ['abajo'],
  zapatos: ['zapatos'],
  extra: ['abrigo', 'accesorio'],
};

function liberar(urls) {
  for (const url of urls) URL.revokeObjectURL(url);
  urls.clear();
}

// ---------- Lista de favoritos ----------

export async function pintarFavoritos() {
  const [favoritos, prendas] = await Promise.all([listarFavoritos().catch(() => []), listarPrendas().catch(() => [])]);
  liberar(urlsLista);
  favoritosPorId = new Map();

  const tarjetas = favoritos
    .sort((a, b) => b.creado - a.creado)
    .map((favorito) => ({ favorito, outfit: outfitDesdeFavorito(favorito, prendas) }))
    // Si se borraron todas sus prendas del armario, ya no tiene sentido mostrarlo.
    .filter(({ outfit }) => prendasDe(outfit).length > 0)
    .map(({ favorito, outfit }) => {
      favoritosPorId.set(favorito.id, outfit);
      return tarjetaFavorito(favorito, outfit);
    });

  document.getElementById('lista-favoritos').replaceChildren(...tarjetas);
  document.getElementById('favoritos-vacio').hidden = tarjetas.length > 0;
}

function tarjetaFavorito(favorito, outfit) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tarjeta-favorito';
  tarjeta.dataset.id = favorito.id;

  const abrir = document.createElement('button');
  abrir.type = 'button';
  abrir.className = 'favorito-abrir';
  abrir.setAttribute('aria-label', 'Ver este outfit');
  const collage = document.createElement('div');
  collage.className = 'prendas collage';
  dibujarOutfit(collage, outfit, { urls: urlsLista });
  abrir.append(collage);

  const pie = document.createElement('div');
  pie.className = 'favorito-pie';
  const origen = document.createElement('span');
  origen.textContent = favorito.origen === 'propio' ? 'Hecho por ti' : 'Del botón Alina';
  const quitar = document.createElement('button');
  quitar.type = 'button';
  quitar.className = 'favorito-quitar';
  quitar.textContent = 'Quitar';
  pie.append(origen, quitar);

  tarjeta.append(abrir, pie);
  return tarjeta;
}

// ---------- Nuevo outfit (hecho a mano) ----------

export async function pintarCrear() {
  const prendas = await listarPrendas().catch(() => []);
  liberar(urlsCrear);
  seleccion = {};

  for (const [fila, categorias] of Object.entries(FILAS)) {
    const contenedor = document.querySelector(`.selector-prendas[data-fila="${fila}"]`);
    const deLaFila = prendas.filter((prenda) => categorias.includes(prenda.categoria)).sort((a, b) => b.creada - a.creada);
    if (!deLaFila.length) {
      const vacio = document.createElement('p');
      vacio.className = 'selector-vacio';
      vacio.textContent = 'Todavía no hay prendas de esta parte';
      contenedor.replaceChildren(vacio);
      continue;
    }
    contenedor.replaceChildren(...deLaFila.map(opcionPrenda));
  }
  actualizarCrear();
}

function opcionPrenda(prenda) {
  const opcion = document.createElement('button');
  opcion.type = 'button';
  opcion.className = 'opcion-prenda';
  opcion.dataset.id = prenda.id;
  opcion.setAttribute('aria-pressed', 'false');
  opcion.setAttribute('aria-label', CATEGORIAS[prenda.categoria]);
  opcion.prenda = prenda;
  const foto = document.createElement('img');
  const url = URL.createObjectURL(prenda.foto);
  urlsCrear.add(url);
  foto.src = url;
  foto.alt = '';
  opcion.append(foto);
  return opcion;
}

function elegir(prenda) {
  const lugar = LUGAR_DE_CATEGORIA[prenda.categoria];
  if (seleccion[lugar]?.id === prenda.id) {
    delete seleccion[lugar];
  } else {
    seleccion[lugar] = prenda;
    // Un vestido reemplaza arriba y abajo, y al revés.
    if (lugar === 'vestido') {
      delete seleccion.arriba;
      delete seleccion.abajo;
    }
    if (lugar === 'arriba' || lugar === 'abajo') delete seleccion.vestido;
  }
  actualizarCrear();
}

function actualizarCrear() {
  const elegidas = new Set(Object.values(seleccion).map((prenda) => prenda.id));
  for (const opcion of document.querySelectorAll('.opcion-prenda')) {
    opcion.setAttribute('aria-pressed', String(elegidas.has(opcion.dataset.id)));
  }
  document.querySelector('.selector-prendas[data-fila="abajo"]').classList.toggle('desactivada', Boolean(seleccion.vestido));
  document.getElementById('guardar-combinacion').disabled = !combinacionCompleta(seleccion);
}

export function iniciarFavoritos({ volver }) {
  document.getElementById('lista-favoritos').addEventListener('click', async (evento) => {
    const tarjeta = evento.target.closest('.tarjeta-favorito');
    if (!tarjeta) return;
    const { id } = tarjeta.dataset;

    if (evento.target.closest('.favorito-quitar')) {
      if (!confirm('¿Quitar este outfit de tus favoritos?')) return;
      try {
        await borrarFavorito(id);
        avisar('Quitado de favoritos');
      } catch {
        avisar('No se pudo quitar');
      }
      pintarFavoritos();
      return;
    }
    if (evento.target.closest('.favorito-abrir')) abrirFavoritoEnOutfit(favoritosPorId.get(id), id);
  });

  document.getElementById('pantalla-crear').addEventListener('click', (evento) => {
    const opcion = evento.target.closest('.opcion-prenda');
    if (opcion) elegir(opcion.prenda);
  });

  document.getElementById('guardar-combinacion').addEventListener('click', async () => {
    if (!combinacionCompleta(seleccion)) return;
    try {
      await guardarFavorito(favoritoDesdeOutfit(seleccion), 'propio');
      avisar('Guardado en favoritos 💖');
      volver();
    } catch {
      avisar('No se pudo guardar la combinación');
    }
  });
}
