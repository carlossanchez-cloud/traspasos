export const todayISO = () => new Date().toISOString().slice(0, 10)

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const formatKM = (km) => new Intl.NumberFormat('es-CO').format(km || 0) + ' km'

export const isExpired = (dateString) => {
  if (!dateString) return true
  const d = new Date(dateString + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return d < today
}

export const daysDiff = (fromISO, toISO = todayISO()) => {
  const a = new Date(fromISO + 'T00:00:00')
  const b = new Date(toISO + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}

// dot: punto/barra; badge: etiqueta suave; solid: etiqueta llena (tarjetas de Flota); top: franja de color arriba de
// la tarjeta; tint: fondo de la foto del vehiculo.
export const STATUS_STYLE = {
  Disponible: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', solid: 'bg-emerald-500 text-white', top: 'border-t-emerald-500', tint: 'from-emerald-50 to-emerald-100/70' },
  'En proceso de entrega': { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', solid: 'bg-amber-500 text-white', top: 'border-t-amber-500', tint: 'from-amber-50 to-amber-100/70' },
  Asignado: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200', solid: 'bg-blue-600 text-white', top: 'border-t-blue-600', tint: 'from-blue-50 to-blue-100/70' },
  'En proceso de recepción': { dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 border-violet-200', solid: 'bg-violet-600 text-white', top: 'border-t-violet-600', tint: 'from-violet-50 to-violet-100/70' },
  Taller: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200', solid: 'bg-red-600 text-white', top: 'border-t-red-600', tint: 'from-red-50 to-red-100/70' },
}

// Dias que se necesita el sustituto: de la fecha requerida a la devolucion estimada (la diferencia entre las
// dos fechas); si sale y vuelve el mismo dia cuenta 1. null si falta alguna o la devolucion es antes de la
// salida. Sale de las dos fechas, asi que los informes lo pueden calcular igual sin guardarlo aparte.
export const diasRequeridos = (inicioISO, finISO) => {
  if (!inicioISO || !finISO) return null
  const d = daysDiff(inicioISO, finISO)
  return d < 0 ? null : Math.max(d, 1)
}
