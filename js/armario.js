// Guarda las prendas en IndexedDB, dentro del navegador de Alina. No hay servidor.
// Cada prenda: { id, foto (Blob), categoria, estilos[], color, conjunto, creada }

const BASE = 'alimichu';
const VERSION = 1;
const PRENDAS = 'prendas';

let conexion = null;

function abrirBase() {
  conexion ??= new Promise((resolver, rechazar) => {
    const pedido = indexedDB.open(BASE, VERSION);
    pedido.onupgradeneeded = () => {
      const base = pedido.result;
      if (!base.objectStoreNames.contains(PRENDAS)) {
        base.createObjectStore(PRENDAS, { keyPath: 'id' }).createIndex('categoria', 'categoria');
      }
    };
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => {
      conexion = null;
      rechazar(pedido.error);
    };
  });
  return conexion;
}

// Ejecuta una operación sobre el almacén de prendas y espera a que termine.
async function conPrendas(modo, operacion) {
  const base = await abrirBase();
  return new Promise((resolver, rechazar) => {
    const transaccion = base.transaction(PRENDAS, modo);
    const pedido = operacion(transaccion.objectStore(PRENDAS));
    transaccion.oncomplete = () => resolver(pedido?.result);
    transaccion.onerror = () => rechazar(transaccion.error);
    transaccion.onabort = () => rechazar(transaccion.error);
  });
}

export async function guardarPrenda(datos) {
  const prenda = { ...datos, id: crypto.randomUUID(), creada: Date.now() };
  await conPrendas('readwrite', (almacen) => almacen.add(prenda));
  pedirAlmacenamientoPersistente();
  return prenda;
}

export function listarPrendas() {
  return conPrendas('readonly', (almacen) => almacen.getAll());
}

export function obtenerPrenda(id) {
  return conPrendas('readonly', (almacen) => almacen.get(id));
}

export function borrarPrenda(id) {
  return conPrendas('readwrite', (almacen) => almacen.delete(id));
}

// Le pide al navegador que no borre el armario cuando necesite espacio.
function pedirAlmacenamientoPersistente() {
  navigator.storage?.persist?.().catch(() => {});
}
