import sedanFrente from '../assets/siluetas/sedan-frente.png'
import sedanTrasera from '../assets/siluetas/sedan-trasera.png'

// Siluetas de referencia que se dibujan encima de la camara en el recorrido guiado, para mostrar mas o
// menos como debe quedar encuadrada cada foto. No salen en la foto (la captura lee solo el video).
// Las diagonales usan el trazo de un sedan real en vista 3/4 (sacado del render src/assets/vehicles/automovil.png):
// tal cual para las delanteras y, para las traseras, el mismo costado con la cara trasera dibujada encima
// (stops, baul, placa); se espeja segun el lado. Habitaculo y tablero siguen siendo un esquema dibujado.
const STROKE = { fill: 'none', stroke: 'white', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' }

function Habitaculo() {
  return (
    <g {...STROKE}>
      {/* espaldares delanteros y banca trasera, vistos desde la puerta */}
      <path d="M70 190 L76 70 Q80 50 110 50 L150 50 Q172 50 172 72 L168 190" />
      <path d="M96 50 L100 30 L138 30 L144 50" strokeWidth="2" />
      <path d="M228 190 L232 72 Q234 50 258 50 L298 50 Q326 50 328 72 L332 190" />
      <path d="M252 50 L256 30 L294 30 L300 50" strokeWidth="2" />
      <path d="M20 200 L380 200" strokeWidth="2" strokeDasharray="6 8" />
    </g>
  )
}

function Tablero() {
  return (
    <g {...STROKE}>
      <path d="M20 150 Q200 40 380 150" />
      {/* tacometro y velocimetro */}
      <circle cx="150" cy="112" r="34" />
      <circle cx="250" cy="112" r="34" />
      <path d="M150 112 L170 92 M250 112 L230 94" strokeWidth="2" />
      {/* timon */}
      <circle cx="200" cy="170" r="70" />
      <circle cx="200" cy="170" r="16" />
      <path d="M130 170 L184 170 M216 170 L270 170 M200 186 L200 240" strokeWidth="2" />
    </g>
  )
}

export default function Silueta({ tipo }) {
  const estilo = { opacity: 0.8, filter: 'drop-shadow(0 0 2px rgba(0,0,0,.9))' }
  if (tipo !== 'habitaculo' && tipo !== 'tablero') {
    // El render tiene la cara visible (frente) a la izquierda: tal cual es la diagonal delantera izquierda.
    // Para la trasera derecha la cara visible (trasera) tambien queda a la izquierda; las otras dos, espejo.
    const espejo = tipo === 'delantera-derecha' || tipo === 'trasera-izquierda'
    return (
      <img src={tipo.startsWith('delantera') ? sedanFrente : sedanTrasera} alt="" aria-hidden="true"
        className="w-full h-full object-contain" style={{ ...estilo, transform: espejo ? 'scaleX(-1)' : undefined }} />
    )
  }
  return (
    <svg viewBox="0 0 400 230" className="w-full h-full" style={estilo} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {tipo === 'habitaculo' ? <Habitaculo /> : <Tablero />}
    </svg>
  )
}
