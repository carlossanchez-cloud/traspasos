// Silueta simple por tipo de vehículo (estilo Uber: un ícono, no una foto real del modelo).
// Construido con formas simples (no un solo path a mano) para que cada tipo se distinga
// de verdad: Automóvil = techo bajo curvo, Camioneta = techo alto y recto, Pickup = cabina
// corta + platón abierto atrás. Los 3 comparten el mismo cuerpo/ruedas para que se vean
// como una familia de íconos, no dibujos sueltos.
const Wheels = () => (
  <>
    <circle cx="14" cy="26" r="4" />
    <circle cx="34" cy="26" r="4" />
  </>
)

const SHAPES = {
  'Automóvil': (
    <>
      <path d="M4 24 Q4 17 12 16 Q17 9 24 9 Q31 9 34 16 L42 17 Q46 18 46 22 L46 24 Z" />
      <Wheels />
    </>
  ),
  'Camioneta': (
    <>
      <path d="M4 24 L4 18 Q4 11 12 11 L34 11 Q42 11 42 18 L46 20 Q46 24 46 24 Z" />
      <Wheels />
    </>
  ),
  'Pickup': (
    <>
      <path d="M4 24 L4 20 Q4 12 12 12 L20 12 Q24 12 24 17 L24 20 L40 20 L40 24 Z" />
      <path d="M26 20 L26 15 L38 15 Q40 15 40 18 L40 20 Z" opacity="0.55" />
      <Wheels />
    </>
  ),
}

export default function VehicleTypeIcon({ tipo, className = 'w-10 h-6' }) {
  return (
    <svg viewBox="0 0 50 32" className={className} fill="currentColor" aria-label={tipo}>
      {SHAPES[tipo] || SHAPES['Automóvil']}
    </svg>
  )
}
