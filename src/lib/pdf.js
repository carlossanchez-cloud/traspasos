// jsPDF reorders a custom [w, h] page format to match `orientation` (default "p" = portrait),
// silently swapping width/height when the content is landscape. Pass orientation explicitly,
// computed from the actual capture size, or the page and the image end up mismatched.
export const pdfOrientation = (width, height) => (width >= height ? 'l' : 'p')

// html2canvas snapshots the DOM as soon as it's called - it does not wait for <img> tags
// still loading (e.g. a Supabase signed URL fetched over the network) to finish. Race that
// and the photo comes out blank/broken in the PDF even though it renders fine on screen a
// moment later. Call this right before html2canvas so every image is decoded first.
export const waitForImages = (root) => Promise.all(
  Array.from(root.querySelectorAll('img')).map((img) => (
    img.complete && img.naturalWidth > 0
      ? Promise.resolve()
      : new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
      })
  )),
)

// Parte un documento alto en paginas sin cortar por la mitad un bloque: cada pagina termina en el ultimo
// limite (inicio de un bloque marcado con data-corte) que quepa; si ningun limite cabe, corta en el alto
// maximo. Devuelve [[inicio, fin], ...] en px del documento.
export function cortesPagina(altoTotal, altoPagina, limites) {
  const orden = [...new Set(limites)].filter((y) => y > 0 && y < altoTotal).sort((a, b) => a - b)
  const paginas = []
  let inicio = 0
  while (inicio < altoTotal - 1) {
    const maximo = inicio + altoPagina
    if (maximo >= altoTotal) { paginas.push([inicio, altoTotal]); break }
    // Un limite muy cerca del inicio dejaria una pagina casi vacia: se exige al menos un tercio de pagina.
    const fin = orden.filter((y) => y > inicio + altoPagina / 3 && y <= maximo).pop() ?? maximo
    paginas.push([inicio, fin])
    inicio = fin
  }
  return paginas
}

// html2canvas dibuja una copia de la pagina en un iframe que vuelve a pedir la hoja de estilos por la red; si
// esa peticion falla (p. ej. el preview de Vercel la bloquea), el PDF sale sin estilos: letra Times, logo
// gigante. Se copian al iframe las reglas que la pagina ya tiene cargadas, sin depender de la red.
function copiarEstilos(doc) {
  const css = Array.from(document.styleSheets).map((hoja) => {
    try { return Array.from(hoja.cssRules).map((regla) => regla.cssText).join('\n') } catch { return '' }
  }).join('\n')
  const estilo = doc.createElement('style')
  estilo.textContent = css
  doc.head.appendChild(estilo)
}

// Captura `root` y lo guarda como PDF tamaño carta con margenes, partido en paginas por los data-corte y con
// el numero de pagina abajo.
export async function guardarPdf(root, nombreArchivo) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')])
  await waitForImages(root)
  const ESCALA = 2
  const canvas = await html2canvas(root, { scale: ESCALA, backgroundColor: '#ffffff', useCORS: true, onclone: copiarEstilos })
  const pdf = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'p' })
  const anchoPag = pdf.internal.pageSize.getWidth()
  const altoPag = pdf.internal.pageSize.getHeight()
  const margen = 28
  const pie = 18
  const ptPorPx = (anchoPag - 2 * margen) / root.offsetWidth
  const altoUtilPx = (altoPag - 2 * margen - pie) / ptPorPx
  const top = root.getBoundingClientRect().top
  const limites = Array.from(root.querySelectorAll('[data-corte]')).map((el) => el.getBoundingClientRect().top - top)
  const paginas = cortesPagina(root.offsetHeight, altoUtilPx, limites)
  paginas.forEach(([ini, fin], n) => {
    const trozo = document.createElement('canvas')
    trozo.width = canvas.width
    trozo.height = Math.ceil((fin - ini) * ESCALA)
    trozo.getContext('2d').drawImage(canvas, 0, -ini * ESCALA)
    if (n > 0) pdf.addPage()
    pdf.addImage(trozo.toDataURL('image/jpeg', 0.92), 'JPEG', margen, margen, anchoPag - 2 * margen, (fin - ini) * ptPorPx)
    pdf.setFontSize(8)
    pdf.setTextColor(140)
    pdf.text(`Página ${n + 1} de ${paginas.length}`, anchoPag - margen, altoPag - margen / 2, { align: 'right' })
  })
  pdf.save(nombreArchivo)
}
