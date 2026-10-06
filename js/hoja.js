// Física de la hoja que se arrastra, con las fórmulas que usa Apple.

// Hasta dónde llegaría el gesto con su impulso (desaceleración exponencial).
export function proyectar(velocidad, desaceleracion = 0.99) {
  return ((velocidad / 1000) * desaceleracion) / (1 - desaceleracion);
}

// Resistencia elástica al arrastrar más allá del borde: cuanto más se pasa, menos sigue al dedo.
export function elastico(exceso, dimension, constante = 0.55) {
  return (exceso * dimension * constante) / (dimension + constante * Math.abs(exceso));
}

// Velocidad en px/s a partir de los últimos puntos del dedo ({ y, t } con t en ms).
export function velocidadDe(historial) {
  if (historial.length < 2) return 0;
  const primero = historial[0];
  const ultimo = historial[historial.length - 1];
  const tiempo = ultimo.t - primero.t;
  return tiempo > 0 ? ((ultimo.y - primero.y) / tiempo) * 1000 : 0;
}

// Se cierra si, contando el impulso, la hoja terminaría más abajo de un tercio de su alto.
export function debeCerrarHoja({ desplazamiento, velocidad, alto }) {
  return desplazamiento + proyectar(velocidad) > alto / 3;
}
