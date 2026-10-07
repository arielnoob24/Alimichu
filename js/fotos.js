import { colorPrincipal } from './colores.js';

// Achica la foto apenas se toma (las de iPhone Pro pueden ser de 48 MP y Safari limita
// la memoria de los canvas), la guarda como JPEG y detecta su color principal.
export async function prepararFoto(archivo, { lado = 800, calidad = 0.85 } = {}) {
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = new Image();
    imagen.src = url;
    await imagen.decode();

    const escala = Math.min(1, lado / Math.max(imagen.naturalWidth, imagen.naturalHeight));
    const ancho = Math.max(1, Math.round(imagen.naturalWidth * escala));
    const alto = Math.max(1, Math.round(imagen.naturalHeight * escala));
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    lienzo.getContext('2d').drawImage(imagen, 0, 0, ancho, alto);

    const foto = await new Promise((resolver, rechazar) => {
      lienzo.toBlob((blob) => (blob ? resolver(blob) : rechazar(new Error('No se pudo guardar la foto'))), 'image/jpeg', calidad);
    });

    // Una copia chiquita alcanza para encontrar el color principal.
    const muestra = document.createElement('canvas');
    muestra.width = 48;
    muestra.height = Math.max(1, Math.round((48 * alto) / ancho));
    const contexto = muestra.getContext('2d', { willReadFrequently: true });
    contexto.drawImage(lienzo, 0, 0, muestra.width, muestra.height);
    const color = colorPrincipal(contexto.getImageData(0, 0, muestra.width, muestra.height));

    return { foto, color };
  } finally {
    URL.revokeObjectURL(url);
  }
}
