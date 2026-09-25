// Silueta simple por tipo de vehículo (estilo Uber: un ícono, no una foto real del modelo).
// Solo 3 tipos hoy (ver Tipo Vehículo en Solicitudes/Dashboard) — agregar aquí si se suma uno nuevo.
const SHAPES = {
  'Automóvil': (
    <path d="M3 42c0 2 1.5 3.5 3.5 3.5H9c1 3 3.8 5 7 5s6-2 7-5h6c3.2 0 6-2 7-5h2.5c2 0 3.5-1.5 3.5-3.5v-6c0-1.5-1-3-2.5-3.4l-4-1.1-5-8C29.5 15 27 14 24 14H14c-3 0-5.5 1-7.5 4.5l-3.8 6.8L3 32.5V42z" />
  ),
  'Camioneta': (
    <path d="M3 40c0 2.2 1.8 4 4 4h2c1 3 3.8 5 7 5s6-2 7-5h5c1 3 3.8 5 7 5s6-2 7-5h1c1.7 0 3-1.3 3-3v-9c0-1.3-.7-2.5-1.8-3.1l-6.2-3.4-4-7C33 16 30 15 27 15H12c-3 0-5.5 1-7.5 4.5L2 26v14z" />
  ),
  'Pickup': (
    <path d="M3 41c0 1.9 1.6 3.5 3.5 3.5H8c1 3 3.8 5 7 5s6-2 7-5h6v-16h9c2.5 0 4.5 1.5 5.5 3.5l2.5 6c1.2.4 2.5 1.6 2.5 3.5v3c0 1.7-1.3 3-3 3h-1c-1 3-3.8 5-7 5s-6-2-7-5H22V22H10c-3 0-5.5 1-7 4l-1.5 3L3 33v8z" />
  ),
}

export default function VehicleTypeIcon({ tipo, className = 'w-10 h-6' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor" aria-label={tipo}>
      {SHAPES[tipo] || SHAPES['Automóvil']}
    </svg>
  )
}
