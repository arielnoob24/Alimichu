export const PANTALLAS = ['inicio', 'armario', 'agregar', 'favoritos'];

export function pantallaDesdeHash(hash) {
  const nombre = (hash ?? '').replace(/^#/, '');
  return PANTALLAS.includes(nombre) ? nombre : 'inicio';
}

// "Agregar prenda" no tiene pestaña propia: se marca la del armario.
export function pestanaDe(pantalla) {
  return pantalla === 'agregar' ? 'armario' : pantalla;
}
