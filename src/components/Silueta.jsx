// Siluetas de referencia que se dibujan encima de la camara en el recorrido guiado, para mostrar mas o
// menos como debe quedar encuadrada cada foto. Son trazos blancos semitransparentes, no salen en la foto
// (la captura lee solo el video). Una sola vista 3/4 del carro con la cara visible a la izquierda: se
// decora con farolas (frente) o stops (trasera) y se espeja para el lado contrario.
const STROKE = { fill: 'none', stroke: 'white', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' }

function Carro34({ trasera }) {
  return (
    <g {...STROKE}>
      {/* cara visible (frente o trasera) */}
      <path d="M40 112 L132 124 L132 182 L40 168 Z" />
      {/* capo / baul y techo */}
      <path d="M40 112 L92 96 L176 104 L132 124" />
      <path d="M176 104 L208 64 L312 60 L346 100" />
      <path d="M132 124 L160 84 L208 64" />
      <path d="M160 84 L176 104" />
      {/* costado */}
      <path d="M132 124 L176 104 L346 100 L372 104 L372 152 L132 182" />
      <path d="M166 120 L190 88 L250 84 L250 118 Z" strokeWidth="2" />
      <path d="M260 117 L260 83 L306 80 L332 112 Z" strokeWidth="2" />
      <path d="M255 120 L255 170" strokeWidth="2" />
      {/* ruedas */}
      <ellipse cx="190" cy="176" rx="24" ry="26" />
      <ellipse cx="322" cy="160" rx="22" ry="24" />
      {/* detalles de la cara visible */}
      {trasera ? (
        <>
          <path d="M48 124 L74 128 L74 144 L48 140 Z" strokeWidth="2" />
          <path d="M98 132 L124 136 L124 152 L98 148 Z" strokeWidth="2" />
          <path d="M64 152 L108 158" strokeWidth="2" />
        </>
      ) : (
        <>
          <ellipse cx="60" cy="130" rx="12" ry="8" strokeWidth="2" />
          <ellipse cx="114" cy="139" rx="12" ry="8" strokeWidth="2" />
          <path d="M72 146 L102 150 L102 164 L72 160 Z" strokeWidth="2" />
        </>
      )}
    </g>
  )
}

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
  const espejo = tipo === 'delantera-derecha' || tipo === 'trasera-izquierda'
  return (
    <svg viewBox="0 0 400 230" className="w-full h-full" style={{ opacity: 0.75, filter: 'drop-shadow(0 0 2px rgba(0,0,0,.8))' }}
      preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g transform={espejo ? 'translate(400 0) scale(-1 1)' : undefined}>
        {tipo === 'habitaculo' ? <Habitaculo /> : tipo === 'tablero' ? <Tablero />
          : <Carro34 trasera={tipo.startsWith('trasera')} />}
      </g>
    </svg>
  )
}
