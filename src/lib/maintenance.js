// Mantenimiento detallado por ítem (idea del prototipo: aceite pesa más que el resto).
// mto_detalle en la tabla vehicles: { [item]: { km: numero, frecuencia: numero } }
// desgaste% de un ítem = km recorridos desde el último cambio / frecuencia del ítem.
export const MTO_ITEMS = [
  { key: 'aceite', label: 'Aceite de motor', defaultFrecuencia: 10000, peso: 0.4 },
  { key: 'llantas', label: 'Llantas', defaultFrecuencia: 40000, peso: 0.2 },
  { key: 'frenos', label: 'Pastillas de freno', defaultFrecuencia: 20000, peso: 0.2 },
  { key: 'filtros', label: 'Filtros', defaultFrecuencia: 10000, peso: 0.2 },
]

export function itemPct(item, detalle, kmActual) {
  const d = detalle?.[item.key]
  if (!d || !d.frecuencia) return 0
  const recorrido = Math.max(0, (kmActual || 0) - (d.km || 0))
  return Math.min(100, Math.round((recorrido / d.frecuencia) * 100))
}

export function overallMtoPct(detalle, kmActual) {
  if (!detalle) return 0
  const total = MTO_ITEMS.reduce((sum, item) => sum + itemPct(item, detalle, kmActual) * item.peso, 0)
  return Math.round(total)
}
