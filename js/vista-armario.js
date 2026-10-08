// Pantallas del armario: la cuadrícula con filtros, agregar prenda y el detalle de una prenda.
import { borrarPrenda, guardarPrenda, listarPrendas, obtenerPrenda } from './armario.js';
import { avisar } from './aviso.js';
import { prepararFoto } from './fotos.js';
import { CATEGORIAS, ESTILOS, describirPrenda, filtrarPorCategoria, normalizarConjunto, ordenarPrendas, validarPrenda } from './prendas.js';

let filtro = '';
let prendaSeleccionada = null;
let fotoPreparada = null;
let preparando = null;
const urlsCuadricula = new Set();
let urlDetalle = null;
let urlVistaPrevia = null;

// ---------- Cuadrícula del armario ----------

export async function pintarArmario() {
  let prendas = [];
  let fallo = false;
  try {
    prendas = ordenarPrendas(await listarPrendas());
  } catch {
    // No es lo mismo que un armario vacío: las prendas siguen guardadas.
    fallo = true;
  }
  const visibles = filtrarPorCategoria(prendas, filtro);

  for (const url of urlsCuadricula) URL.revokeObjectURL(url);
  urlsCuadricula.clear();
  document.getElementById('lista-prendas').replaceChildren(...visibles.map(tarjetaPrenda));
  document.getElementById('armario-error').hidden = !fallo;
  document.getElementById('armario-vacio').hidden = fallo || prendas.length > 0;
  document.getElementById('filtro-vacio').hidden = fallo || prendas.length === 0 || visibles.length > 0;
}

function tarjetaPrenda(prenda) {
  const tarjeta = document.createElement('button');
  tarjeta.type = 'button';
  tarjeta.className = 'tarjeta-prenda';
  tarjeta.dataset.id = prenda.id;
  tarjeta.setAttribute('aria-label', describirPrenda(prenda));

  const foto = document.createElement('img');
  const url = URL.createObjectURL(prenda.foto);
  urlsCuadricula.add(url);
  foto.src = url;
  foto.alt = '';
  foto.decoding = 'async';

  const punto = document.createElement('span');
  punto.className = 'punto-color';
  punto.style.background = prenda.color;

  tarjeta.append(foto, punto);
  return tarjeta;
}

function textoEstilos(estilos) {
  return estilos.map((estilo) => ESTILOS[estilo] ?? estilo).join(', ');
}

// ---------- Detalle de una prenda ----------

// Devuelve false si no hay una prenda para mostrar (por ejemplo, al recargar en el detalle).
export async function pintarDetalle() {
  const prenda = prendaSeleccionada && (await obtenerPrenda(prendaSeleccionada).catch(() => null));
  if (!prenda) return false;

  if (urlDetalle) URL.revokeObjectURL(urlDetalle);
  urlDetalle = URL.createObjectURL(prenda.foto);
  const foto = document.createElement('img');
  foto.src = urlDetalle;
  foto.alt = `Foto de la prenda: ${CATEGORIAS[prenda.categoria]}`;
  document.getElementById('detalle-foto').replaceChildren(foto);

  document.getElementById('detalle-categoria').textContent = CATEGORIAS[prenda.categoria];
  document.getElementById('detalle-estilos').textContent = textoEstilos(prenda.estilos);
  document.getElementById('detalle-color').style.background = prenda.color;
  document.getElementById('detalle-conjunto').textContent = prenda.conjunto ?? '';
  document.getElementById('detalle-conjunto-fila').hidden = !prenda.conjunto;
  return true;
}

// ---------- Agregar prenda ----------

function mostrarFotoTexto(texto) {
  const etiqueta = document.createElement('span');
  etiqueta.className = 'foto-texto';
  etiqueta.textContent = texto;
  document.getElementById('foto').replaceChildren(etiqueta);
}

function limpiarFormulario() {
  document.getElementById('form-prenda').reset();
  fotoPreparada = null;
  preparando = null;
  if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
  urlVistaPrevia = null;
  mostrarFotoTexto('Tocar para tomar una foto');
  document.getElementById('aviso-prenda').textContent = '';
}

async function alElegirFoto(evento) {
  const [archivo] = evento.target.files;
  if (!archivo) return;
  const aviso = document.getElementById('aviso-prenda');
  aviso.textContent = '';
  mostrarFotoTexto('Preparando foto…');
  fotoPreparada = null;

  preparando = prepararFoto(archivo);
  try {
    fotoPreparada = await preparando;
    if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
    urlVistaPrevia = URL.createObjectURL(fotoPreparada.foto);
    const vista = document.createElement('img');
    vista.className = 'foto-vista';
    vista.src = urlVistaPrevia;
    vista.alt = 'Vista previa de la prenda';
    document.getElementById('foto').replaceChildren(vista);
    // El color detectado queda puesto; Alina lo puede corregir.
    document.querySelector('#form-prenda [name="color"]').value = fotoPreparada.color;
  } catch {
    mostrarFotoTexto('Tocar para tomar una foto');
    aviso.textContent = 'No se pudo leer esa foto. Prueba con otra 📸';
  }
}

async function alGuardar(evento, volver) {
  evento.preventDefault();
  const formulario = evento.target;
  const aviso = document.getElementById('aviso-prenda');
  const boton = formulario.querySelector('[type="submit"]');

  await preparando?.catch(() => {});
  const datos = {
    foto: fotoPreparada?.foto,
    categoria: formulario.categoria.value,
    estilos: [...formulario.querySelectorAll('[name="estilo"]:checked')].map((casilla) => casilla.value),
    color: formulario.color.value,
    conjunto: normalizarConjunto(formulario.conjunto.value),
  };
  const error = validarPrenda(datos);
  if (error) {
    // También arriba: el mensaje de abajo puede quedar fuera de la pantalla.
    aviso.textContent = error;
    avisar(error);
    return;
  }

  boton.disabled = true;
  try {
    await guardarPrenda(datos);
    limpiarFormulario();
    avisar('Prenda guardada 💖');
    volver();
  } catch {
    aviso.textContent = 'No se pudo guardar la prenda. Intenta de nuevo.';
  } finally {
    boton.disabled = false;
  }
}

// ---------- Conexión con la página ----------

export function iniciarArmario({ volver }) {
  document.getElementById('filtros').addEventListener('click', (evento) => {
    const chip = evento.target.closest('.chip');
    if (!chip) return;
    filtro = chip.dataset.categoria;
    for (const otro of document.querySelectorAll('#filtros .chip')) {
      otro.setAttribute('aria-pressed', String(otro === chip));
    }
    pintarArmario();
  });

  document.getElementById('lista-prendas').addEventListener('click', (evento) => {
    const tarjeta = evento.target.closest('.tarjeta-prenda');
    if (!tarjeta) return;
    prendaSeleccionada = tarjeta.dataset.id;
    location.hash = '#prenda';
  });

  document.querySelector('[data-reintentar="armario"]').addEventListener('click', pintarArmario);

  document.getElementById('foto-prenda').addEventListener('change', alElegirFoto);
  document.getElementById('form-prenda').addEventListener('submit', (evento) => alGuardar(evento, volver));

  document.getElementById('eliminar-prenda').addEventListener('click', async () => {
    if (!prendaSeleccionada || !confirm('¿Eliminar esta prenda de tu armario?')) return;
    try {
      await borrarPrenda(prendaSeleccionada);
      prendaSeleccionada = null;
      avisar('Prenda eliminada');
      volver();
    } catch {
      avisar('No se pudo eliminar la prenda');
    }
  });
}
