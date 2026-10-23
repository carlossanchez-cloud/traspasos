import diagonalDelantera from '../assets/siluetas/diagonal-delantera.png'
import diagonalTrasera from '../assets/siluetas/diagonal-trasera.png'
import habitaculo from '../assets/siluetas/habitaculo.png'
import tablero from '../assets/siluetas/tablero.png'

// Siluetas de referencia que se dibujan encima de la camara en el recorrido guiado, para mostrar mas o
// menos como debe quedar encuadrada cada foto. No salen en la foto (la captura lee solo el video).
// Son calcos en trazo blanco de fotos de catalogo de un mismo carro: una diagonal delantera (frente a la
// izquierda), una diagonal trasera (trasera a la izquierda) y el interior visto desde el asiento trasero.
// Las diagonales del otro lado son las mismas espejadas.
const IMAGEN = {
  'delantera-izquierda': [diagonalDelantera, false],
  'delantera-derecha': [diagonalDelantera, true],
  'trasera-derecha': [diagonalTrasera, false],
  'trasera-izquierda': [diagonalTrasera, true],
  habitaculo: [habitaculo, false],
  tablero: [tablero, false],
}

export default function Silueta({ tipo }) {
  const [src, espejo] = IMAGEN[tipo] || []
  if (!src) return null
  return (
    <img src={src} alt="" aria-hidden="true" className="max-w-full max-h-full object-contain"
      style={{ opacity: 0.8, filter: 'drop-shadow(0 0 2px rgba(0,0,0,.9))', transform: espejo ? 'scaleX(-1)' : undefined }} />
  )
}
