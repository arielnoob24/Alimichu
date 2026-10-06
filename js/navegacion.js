// Las hojas no tienen pestaña propia: se abren encima de la pestaña indicada.
export const HOJAS = { agregar: 'armario', crear: 'favoritos' };

export const PANTALLAS = ['inicio', 'armario', 'favoritos', ...Object.keys(HOJAS)];

export function pantallaDesdeHash(hash) {
  const nombre = (hash ?? '').replace(/^#/, '');
  return PANTALLAS.includes(nombre) ? nombre : 'inicio';
}

export function pestanaDe(pantalla) {
  return HOJAS[pantalla] ?? pantalla;
}
