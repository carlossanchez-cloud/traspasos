import diagonalDelantera from '../assets/siluetas/diagonal-delantera.png'
import diagonalTrasera from '../assets/siluetas/diagonal-trasera.png'
import habitaculo from '../assets/siluetas/habitaculo.png'
import tablero from '../assets/siluetas/tablero.png'

// Siluetas de referencia que se dibujan encima de la camara en el recorrido guiado, para mostrar mas o
// menos como debe quedar encuadrada cada foto. No salen en la foto (la captura lee solo el video).
// Son calcos en trazo blanco de fotos de catalogo de un mismo carro: una diagonal delantera (frente a la
// izquierda), una diagonal trasera (trasera a la izquierda), el interior visto desde el asiento trasero y
// el tablero de instrumentos.
// Las diagonales del otro lado son las mismas espejadas.
export const IMAGEN = {
  'delantera-izquierda': [diagonalDelantera, false],
  'delantera-derecha': [diagonalDelantera, true],
  'trasera-derecha': [diagonalTrasera, false],
  'trasera-izquierda': [diagonalTrasera, true],
  habitaculo: [habitaculo, false],
  tablero: [tablero, false],
}

// Se descargan apenas se abre la camara, no cuando se llega a cada paso: con datos moviles lentos la
// silueta del ultimo paso (tablero) alcanzaba a no aparecer.
export const precargarSiluetas = () => Object.values(IMAGEN).forEach(([src]) => { new Image().src = src })
