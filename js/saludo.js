export function saludo(fecha) {
  const hora = fecha.getHours();
  if (hora >= 5 && hora < 12) return 'Buenos días';
  if (hora >= 12 && hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
}
