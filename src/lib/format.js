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

export const STATUS_STYLE = {
  Disponible: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Asignado: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  Taller: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
}
