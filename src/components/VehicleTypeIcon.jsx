// Ilustración por tipo de vehículo (estilo Uber ride-select: silueta coloreada con
// sombra de piso y ventanas, no una foto real del modelo). Misma familia de formas
// para los 3 tipos que maneja el negocio: Automóvil = techo bajo curvo, Camioneta =
// techo alto y recto, Pickup = cabina corta + platón abierto atrás.
const Wheel = ({ cx }) => (
  <>
    <circle cx={cx} cy="26" r="4.4" fill="currentColor" />
    <circle cx={cx} cy="26" r="1.6" fill="white" fillOpacity="0.85" />
  </>
)

const BODIES = {
  'Automóvil': 'M4 24 Q4 17 12 16 Q17 9 24 9 Q31 9 34 16 L42 17 Q46 18 46 22 L46 24 Z',
  'Camioneta': 'M4 24 L4 18 Q4 11 12 11 L34 11 Q42 11 42 18 L46 20 Q46 24 46 24 Z',
  'Pickup': 'M4 24 L4 20 Q4 12 12 12 L20 12 Q24 12 24 17 L24 20 L40 20 L40 24 Z',
}

const WINDOWS = {
  'Automóvil': 'M14 16 Q18 11.5 24 11.5 Q30 11.5 33 16.5 Z',
  'Camioneta': 'M11 18 L11 13 Q11 13.5 13 13.5 L33 13.5 Q39 13.5 40 18 Z',
  'Pickup': 'M11 19 L11 14.5 Q11 14.5 13 14.5 L20 14.5 Q22 14.5 22 17 L22 19 Z',
}

export default function VehicleTypeIcon({ tipo, className = 'w-10 h-6' }) {
  const body = BODIES[tipo] || BODIES['Automóvil']
  const windows = WINDOWS[tipo] || WINDOWS['Automóvil']
  return (
    <svg viewBox="0 0 50 32" className={className} aria-label={tipo}>
      <ellipse cx="25" cy="27.5" rx="21" ry="2.6" fill="currentColor" opacity="0.12" />
      <path d={body} fill="currentColor" stroke="currentColor" strokeWidth="0.75" strokeLinejoin="round" />
      <path d={windows} fill="white" fillOpacity="0.6" />
      {tipo === 'Pickup' && <path d="M26 20 L26 15 L38 15 Q40 15 40 18 L40 20 Z" fill="currentColor" opacity="0.5" />}
      <Wheel cx="14" />
      <Wheel cx="34" />
    </svg>
  )
}
