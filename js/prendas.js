// Reglas de las prendas, sin DOM ni base de datos (para poder testearlas).

export const CATEGORIAS = {
  arriba: 'Parte de arriba',
  abajo: 'Parte de abajo',
  vestido: 'Vestido / enterito',
  zapatos: 'Zapatos',
  abrigo: 'Abrigo',
  accesorio: 'Accesorio',
};

export const ESTILOS = {
  casual: 'Casual',
  elegante: 'Elegante',
  deportivo: 'Deportivo',
  fiesta: 'Fiesta',
};

// Devuelve el mensaje para Alina si falta algo, o null si la prenda se puede guardar.
export function validarPrenda({ foto, categoria, estilos }) {
  if (!foto) return 'Falta la foto de la prenda 📸';
  if (!(categoria in CATEGORIAS)) return 'Elige la categoría de la prenda';
  if (!estilos?.length) return 'Elige al menos un estilo';
  return null;
}

// Normaliza el nombre del conjunto para que "Set Rosado " y "set rosado" sean el mismo.
export function normalizarConjunto(texto) {
  const limpio = (texto ?? '').trim().replace(/\s+/g, ' ');
  return limpio ? limpio.toLowerCase() : null;
}

export function filtrarPorCategoria(prendas, categoria) {
  return categoria ? prendas.filter((prenda) => prenda.categoria === categoria) : prendas;
}

// Texto para lectores de pantalla: "Parte de arriba, casual y fiesta, del conjunto set rosado".
export function describirPrenda({ categoria, estilos = [], conjunto }) {
  const nombres = estilos.map((estilo) => (ESTILOS[estilo] ?? estilo).toLowerCase());
  const partes = [CATEGORIAS[categoria] ?? categoria];
  if (nombres.length) partes.push(nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres[0]);
  if (conjunto) partes.push(`del conjunto ${conjunto}`);
  return partes.join(', ');
}

// Las más nuevas primero.
export function ordenarPrendas(prendas) {
  return [...prendas].sort((a, b) => b.creada - a.creada);
}
