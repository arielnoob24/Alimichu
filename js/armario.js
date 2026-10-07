// Guarda las prendas y los outfits favoritos en IndexedDB, dentro del navegador de Alina. No hay servidor.
// Cada prenda: { id, foto (Blob), categoria, estilos[], color, conjunto, creada }
// Cada favorito: { id, prendas: { lugar: idDePrenda }, origen: 'alina' | 'propio', creado }

const BASE = 'alimichu';
const VERSION = 2;
const PRENDAS = 'prendas';
const FAVORITOS = 'favoritos';

let conexion = null;

function abrirBase() {
  conexion ??= new Promise((resolver, rechazar) => {
    const pedido = indexedDB.open(BASE, VERSION);
    pedido.onupgradeneeded = () => {
      const base = pedido.result;
      if (!base.objectStoreNames.contains(PRENDAS)) {
        base.createObjectStore(PRENDAS, { keyPath: 'id' }).createIndex('categoria', 'categoria');
      }
      if (!base.objectStoreNames.contains(FAVORITOS)) {
        base.createObjectStore(FAVORITOS, { keyPath: 'id' });
      }
    };
    pedido.onsuccess = () => {
      // Si otra pestaña con una versión nueva necesita actualizar la base, esta la suelta.
      pedido.result.onversionchange = () => {
        pedido.result.close();
        conexion = null;
      };
      resolver(pedido.result);
    };
    pedido.onerror = () => {
      conexion = null;
      rechazar(pedido.error);
    };
  });
  return conexion;
}

// Ejecuta una operación sobre un almacén y espera a que termine.
async function con(almacen, modo, operacion) {
  const base = await abrirBase();
  return new Promise((resolver, rechazar) => {
    const transaccion = base.transaction(almacen, modo);
    const pedido = operacion(transaccion.objectStore(almacen));
    transaccion.oncomplete = () => resolver(pedido?.result);
    transaccion.onerror = () => rechazar(transaccion.error);
    transaccion.onabort = () => rechazar(transaccion.error);
  });
}

export async function guardarPrenda(datos) {
  const prenda = { ...datos, id: crypto.randomUUID(), creada: Date.now() };
  await con(PRENDAS, 'readwrite', (almacen) => almacen.add(prenda));
  pedirAlmacenamientoPersistente();
  return prenda;
}

export function listarPrendas() {
  return con(PRENDAS, 'readonly', (almacen) => almacen.getAll());
}

export function obtenerPrenda(id) {
  return con(PRENDAS, 'readonly', (almacen) => almacen.get(id));
}

export function borrarPrenda(id) {
  return con(PRENDAS, 'readwrite', (almacen) => almacen.delete(id));
}

export async function guardarFavorito(prendas, origen) {
  const favorito = { id: crypto.randomUUID(), prendas, origen, creado: Date.now() };
  await con(FAVORITOS, 'readwrite', (almacen) => almacen.add(favorito));
  pedirAlmacenamientoPersistente();
  return favorito;
}

export function listarFavoritos() {
  return con(FAVORITOS, 'readonly', (almacen) => almacen.getAll());
}

export function borrarFavorito(id) {
  return con(FAVORITOS, 'readwrite', (almacen) => almacen.delete(id));
}

// Le pide al navegador que no borre el armario cuando necesite espacio.
function pedirAlmacenamientoPersistente() {
  navigator.storage?.persist?.().catch(() => {});
}
