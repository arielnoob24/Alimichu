// Calcula hacia dónde sale cada chispa de la lluvia de destellos.
// `azar` se puede reemplazar en los tests para tener resultados fijos.
export function generarChispas(cantidad, { distancia = 120, azar = Math.random } = {}) {
  return Array.from({ length: cantidad }, (_, i) => {
    const angulo = (i / cantidad) * 2 * Math.PI + (azar() - 0.5) * 0.6;
    const alcance = distancia * (0.55 + azar() * 0.45);
    return {
      x: Math.round(Math.cos(angulo) * alcance),
      y: Math.round(Math.sin(angulo) * alcance),
      tamano: Math.round(10 + azar() * 14),
      giro: Math.round(90 + azar() * 180),
      retraso: Math.round(azar() * 120),
    };
  });
}
