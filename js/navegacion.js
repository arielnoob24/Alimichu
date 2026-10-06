// Las hojas suben desde abajo encima de la pestaña indicada.
export const HOJAS = { agregar: 'armario', crear: 'favoritos' };

// Las vistas entran desde la derecha en lugar de la pestaña indicada, con botón para volver.
export const VISTAS = { outfit: 'inicio' };

export const PANTALLAS = ['inicio', 'armario', 'favoritos', ...Object.keys(VISTAS), ...Object.keys(HOJAS)];

export function pantallaDesdeHash(hash) {
  const nombre = (hash ?? '').replace(/^#/, '');
  return PANTALLAS.includes(nombre) ? nombre : 'inicio';
}

export function pestanaDe(pantalla) {
  return HOJAS[pantalla] ?? VISTAS[pantalla] ?? pantalla;
}
