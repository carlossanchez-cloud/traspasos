// La firma se guarda del tamaño del recuadro donde se dibujo: el gestor firma en un recuadro ancho (computador o
// modal ancho) y el cliente en uno angosto (celular). Al mostrarlas en recuadros iguales, la del gestor salia
// mucho mas pequeña. Por eso, antes de mostrarla, se recorta al trazo: asi las dos ocupan su recuadro igual.

// Rectangulo que encierra los pixeles dibujados (alfa > 0) de una imagen RGBA, o null si esta vacia.
export function bordesTrazo(data, ancho, alto) {
  let x0 = ancho, y0 = alto, x1 = -1, y1 = -1
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (data[(y * ancho + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 }
}

// Devuelve la firma recortada al trazo (con un margen) como data URL. Si algo falla, la URL original.
export async function recortarFirma(url) {
  if (!url) return url
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    await img.decode()
    const lienzo = document.createElement('canvas')
    lienzo.width = img.naturalWidth
    lienzo.height = img.naturalHeight
    const ctx = lienzo.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const caja = bordesTrazo(ctx.getImageData(0, 0, lienzo.width, lienzo.height).data, lienzo.width, lienzo.height)
    if (!caja) return url
    const margen = Math.round(Math.max(caja.ancho, caja.alto) * 0.06)
    const salida = document.createElement('canvas')
    salida.width = caja.ancho + 2 * margen
    salida.height = caja.alto + 2 * margen
    salida.getContext('2d').drawImage(lienzo, caja.x, caja.y, caja.ancho, caja.alto, margen, margen, caja.ancho, caja.alto)
    return salida.toDataURL('image/png')
  } catch {
    return url
  }
}
