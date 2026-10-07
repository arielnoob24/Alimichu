// Aviso flotante arriba de la pantalla ("Prenda guardada 💖") que se va solo.
let temporizador;

export function avisar(texto) {
  const aviso = document.getElementById('aviso-flotante');
  aviso.textContent = texto;
  aviso.classList.add('visible');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => aviso.classList.remove('visible'), 2200);
}
