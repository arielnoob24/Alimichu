export const PESTANAS = ['armario', 'inicio', 'favoritos'];

// Cada vista entra desde la derecha encima de su pestaña, con ‹ Volver y sin barra de abajo.
export const VISTAS = {
  outfit: 'inicio',
  agregar: 'armario',
  prenda: 'armario',
  crear: 'favoritos',
};

export const PANTALLAS = [...PESTANAS, ...Object.keys(VISTAS)];

export function pantallaDesdeHash(hash) {
  const nombre = (hash ?? '').replace(/^#/, '');
  return PANTALLAS.includes(nombre) ? nombre : 'inicio';
}

export function pestanaDe(pantalla) {
  return VISTAS[pantalla] ?? pantalla;
}

export function esVista(pantalla) {
  return pantalla in VISTAS;
}
