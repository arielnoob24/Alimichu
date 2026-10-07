// Motor de outfits: arma combinaciones que combinan (no al azar) y elige entre las mejores.
// Sin DOM ni base de datos, para poder testearlo.
import { armoniaColores, esNeutro } from './colores.js';

// Lugares del outfit. El vestido ocupa arriba y abajo a la vez.
export const LUGARES = ['arriba', 'abajo', 'vestido', 'zapatos', 'extra'];

// En qué lugar va cada categoría del armario.
export const LUGAR_DE_CATEGORIA = {
  arriba: 'arriba',
  abajo: 'abajo',
  vestido: 'vestido',
  zapatos: 'zapatos',
  abrigo: 'extra',
  accesorio: 'extra',
};

// Estilos que no comparten nada: cuánto suman o restan al juntarse.
const AFINIDAD_ESTILOS = {
  'casual|deportivo': 0.5,
  'casual|elegante': 0.5,
  'casual|fiesta': 0,
  'elegante|fiesta': 1,
  'deportivo|elegante': -1.5,
  'deportivo|fiesta': -2,
};

function afinidadEstilos(a, b) {
  if (a.estilos.some((estilo) => b.estilos.includes(estilo))) return 2;
  let mejor = -Infinity;
  for (const x of a.estilos) {
    for (const y of b.estilos) {
      mejor = Math.max(mejor, AFINIDAD_ESTILOS[[x, y].sort().join('|')] ?? 0);
    }
  }
  return mejor;
}

export function prendasDe(outfit) {
  return LUGARES.map((lugar) => outfit[lugar]).filter(Boolean);
}

// Identifica un outfit por sus prendas, sin importar el orden.
export function claveOutfit(outfit) {
  return prendasDe(outfit)
    .map((prenda) => prenda.id)
    .sort()
    .join('+');
}

// Puntaje de un outfit: más alto, mejor combina.
export function puntuarOutfit(outfit) {
  const prendas = prendasDe(outfit);
  let puntaje = 0;
  let pares = 0;
  for (let i = 0; i < prendas.length; i++) {
    for (let j = i + 1; j < prendas.length; j++) {
      puntaje += armoniaColores(prendas[i].color, prendas[j].color) + afinidadEstilos(prendas[i], prendas[j]);
      pares++;
    }
  }
  puntaje = pares ? puntaje / pares : 0;

  // Más de dos colores fuertes a la vez es demasiado.
  const fuertes = prendas.filter((prenda) => !esNeutro(prenda.color)).length;
  if (fuertes > 2) puntaje -= 2 * (fuertes - 2);

  // Un conjunto completo suma; un conjunto partido no vale.
  for (const prenda of prendas) {
    if (!prenda.conjunto) continue;
    const delConjunto = prendas.filter((otra) => otra.conjunto === prenda.conjunto).length;
    if (delConjunto > 1) puntaje += 1.5;
  }
  return puntaje;
}

// Si una prenda del outfit es parte de un conjunto, las demás del conjunto tienen que ir también
// (siempre que haya lugar para ellas).
function respetaConjuntos(outfit, todas) {
  for (const prenda of prendasDe(outfit)) {
    if (!prenda.conjunto) continue;
    for (const otra of todas) {
      if (otra.conjunto !== prenda.conjunto || otra.id === prenda.id) continue;
      const lugar = LUGAR_DE_CATEGORIA[otra.categoria];
      const hayLugar = !(lugar === 'vestido' && (outfit.arriba || outfit.abajo)) && !((lugar === 'arriba' || lugar === 'abajo') && outfit.vestido);
      if (hayLugar && outfit[lugar]?.id !== otra.id) return false;
    }
  }
  return true;
}

function agrupar(prendas) {
  const grupos = Object.fromEntries(LUGARES.map((lugar) => [lugar, []]));
  for (const prenda of prendas) {
    const lugar = LUGAR_DE_CATEGORIA[prenda.categoria];
    if (lugar) grupos[lugar].push(prenda);
  }
  return grupos;
}

// Qué falta en el armario para poder armar un outfit (o null si alcanza).
export function queFalta(prendas) {
  const g = agrupar(prendas);
  if (g.vestido.length || (g.arriba.length && g.abajo.length)) return null;
  if (!g.arriba.length && !g.abajo.length) return 'Agrega una parte de arriba y una de abajo, o un vestido';
  return g.arriba.length ? 'Agrega una parte de abajo (o un vestido)' : 'Agrega una parte de arriba (o un vestido)';
}

// Todas las combinaciones posibles, respetando las prendas fijas (candado) y los conjuntos.
export function combinaciones(prendas, fijas = {}) {
  const g = agrupar(prendas);
  const opciones = (lugar, opcional) => {
    if (fijas[lugar]) return [fijas[lugar]];
    return opcional ? [null, ...g[lugar]] : g[lugar];
  };
  const zapatos = g.zapatos.length || fijas.zapatos ? opciones('zapatos', false) : [null];
  const extras = opciones('extra', !fijas.extra);
  const bases = [];

  if (!fijas.vestido) {
    for (const arriba of opciones('arriba', false)) {
      for (const abajo of opciones('abajo', false)) bases.push({ arriba, abajo });
    }
  }
  if (!fijas.arriba && !fijas.abajo) {
    for (const vestido of opciones('vestido', false)) bases.push({ vestido });
  }

  const resultado = [];
  for (const base of bases) {
    for (const zapato of zapatos) {
      for (const extra of extras) {
        const outfit = { ...base };
        if (zapato) outfit.zapatos = zapato;
        if (extra) outfit.extra = extra;
        if (respetaConjuntos(outfit, prendas)) resultado.push(outfit);
      }
    }
  }
  return resultado;
}

// Elige un outfit al azar entre los que mejor combinan, evitando repetir los recientes.
export function generarOutfit(prendas, { fijas = {}, recientes = [], azar = Math.random, cuantosMejores = 5 } = {}) {
  const falta = queFalta(prendas);
  if (falta) return { falta };

  const candidatos = combinaciones(prendas, fijas).map((outfit) => {
    let puntaje = puntuarOutfit(outfit);
    if (recientes.includes(claveOutfit(outfit))) puntaje -= 3;
    return { outfit, puntaje };
  });
  if (!candidatos.length) return { falta: 'No hay combinaciones con las prendas fijas. Quita algún candado.' };

  // Se sortea solo entre los que están cerca del mejor: variedad, pero siempre algo que combina.
  candidatos.sort((a, b) => b.puntaje - a.puntaje);
  const mejores = candidatos.filter(({ puntaje }) => puntaje >= candidatos[0].puntaje - 1.5).slice(0, cuantosMejores);
  const elegido = mejores[Math.floor(azar() * mejores.length)];
  return { outfit: elegido.outfit, puntaje: elegido.puntaje };
}

// ---------- Favoritos ----------

// Un favorito guarda solo los ids de las prendas de cada lugar.
export function favoritoDesdeOutfit(outfit) {
  return Object.fromEntries(LUGARES.filter((lugar) => outfit[lugar]).map((lugar) => [lugar, outfit[lugar].id]));
}

// Vuelve a armar el outfit con las prendas que siguen en el armario (alguna pudo borrarse).
export function outfitDesdeFavorito(favorito, prendas) {
  const porId = new Map(prendas.map((prenda) => [prenda.id, prenda]));
  const outfit = {};
  for (const [lugar, id] of Object.entries(favorito.prendas)) {
    if (porId.has(id)) outfit[lugar] = porId.get(id);
  }
  return outfit;
}

// Una combinación hecha a mano necesita arriba + abajo, o un vestido.
export function combinacionCompleta(seleccion) {
  return Boolean(seleccion.vestido || (seleccion.arriba && seleccion.abajo));
}
