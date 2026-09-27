// Ilustración por tipo de vehículo, vista 3/4 con color y sombra de piso (como la tarjeta
// de vehículo de Uber). Base: emoji de coche/todoterreno/pickup de Twemoji (Twitter, Inc.,
// licencia CC-BY 4.0 — https://github.com/twitter/twemoji), recoloreado a la paleta neutra
// de la app (antes rojo/azul/rosa de Twitter) para que las 3 siluetas se vean como una
// familia y no compitan con los colores de estado (Disponible/Asignado/Taller).
const BODIES = {
  'Automóvil': (
    <>
      <path fill="#64748b" d="M13 32h20s3 0 3-4c0-2 0-6-1-7s-8-7-11-7h-6c-3 0-10 7-10 7l-4 1s-3 1-3 3v3s-1 .338-1 1.957C0 32 2 32 2 32h11z" />
      <path fill="#bfdbfe" d="M20 16h-2c-2 0-8 6-8 6s4.997-.263 10-.519V16zm10 3c-1-1-5-3-7-3h-1v5.379c4.011-.204 7.582-.379 8-.379 1 0 1-1 0-2z" />
      <circle fill="#1e293b" cx="10" cy="31" r="4" /><circle fill="#cbd5e1" cx="10" cy="31" r="2" />
      <circle fill="#1e293b" cx="27" cy="31" r="4" /><circle fill="#cbd5e1" cx="27" cy="31" r="2" />
    </>
  ),
  'Camioneta': (
    <>
      <path fill="#1e293b" d="M36 24c0 .553-.447 1-1 1h-1c-.553 0-1-.447-1-1v-6c0-.553.447-1 1-1h1c.553 0 1 .447 1 1v6z" />
      <path fill="#64748b" d="M5 31h26c1 0 3-1 3-4 0-2 0-8-1-9s0-7-4-7H15c-3 0-6 7-6 7l-4 1s-4 1-4 4v3s-1 .338-1 1.957S1 30 1 30l4 1z" />
      <circle fill="#1e293b" cx="9" cy="31" r="4" /><circle fill="#cbd5e1" cx="9" cy="31" r="2" />
      <circle fill="#1e293b" cx="27" cy="31" r="4" /><circle fill="#cbd5e1" cx="27" cy="31" r="2" />
      <path fill="#bfdbfe" d="M24 17c0 .552.447 1 1 1h4c.553 0 1-.448 1-1v-3c0-.552-.447-1-1-1h-4c-.553 0-1 .448-1 1v3zm-11 0c0 1 .448 1 1 1h7c.553 0 1-.448 1-1v-3c0-.552-.447-1-1-1h-5c-1 0-3 3-3 4z" />
      <path fill="#94a3b8" d="M32 23.5c0 .828-.672 1.5-1.5 1.5h-22c-.829 0-1.5-.672-1.5-1.5 0-.829.671-1.5 1.5-1.5h22c.828 0 1.5.671 1.5 1.5z" />
    </>
  ),
  'Pickup': (
    <>
      <path fill="#64748b" d="M33 31c1 0 1-1 1-4 0-.692 0-3.862-.041-5.138C33.939 21.258 33.149 20 32 20H20v-6c0-1.058-.235-2-2-2h-5c-3 0-6 8-6 8s-6 0-6 3v4s-1 .338-1 1.957S1 31 2 31h31z" />
      <circle fill="#1e293b" cx="9" cy="31" r="4" /><circle fill="#cbd5e1" cx="9" cy="31" r="2" />
      <circle fill="#1e293b" cx="27" cy="31" r="4" /><circle fill="#cbd5e1" cx="27" cy="31" r="2" />
      <path fill="#bfdbfe" d="M10 19c0 1 .448 1 1 1h5c.553 0 1-.448 1-1v-4c0-.552-.447-1-1-1h-3c-1 0-3 4-3 5z" />
      <path fill="#94a3b8" d="M36 21.5c0 .828-.672 1.5-1.5 1.5H20v-3h14.5c.828 0 1.5.671 1.5 1.5z" />
      <path fill="#94a3b8" d="M1 23h1v5H1z" />
      <path fill="#cbd5e1" d="M2 31H1c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1h1c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1zm32 0h-1c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1h1c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1z" />
    </>
  ),
}

export default function VehicleTypeIcon({ tipo, className = 'w-10 h-8' }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-label={tipo}>
      <ellipse cx="18" cy="34" rx="16" ry="1.8" fill="#0f172a" opacity="0.1" />
      {BODIES[tipo] || BODIES['Automóvil']}
    </svg>
  )
}
