import { CHECK_ITEMS, emptyChecklist } from './actaChecklist.js'
import { novedadesActa } from './recepcion.js'
import { formatDate } from './format.js'

// Estado actual del vehiculo (paso SQL 31): el checklist guardado sobre uno vacio, para poder editarlo aunque
// la lista de partes haya cambiado desde que se guardo (las partes nuevas arrancan en Bueno).
export function checklistDesde(guardado) {
  const base = emptyChecklist()
  for (const item of CHECK_ITEMS) {
    const g = guardado?.[item]
    if (!g) continue
    if (base[item].partes) {
      for (const parte of Object.keys(base[item].partes)) {
        if (g.partes?.[parte]) base[item].partes[parte] = { ...base[item].partes[parte], ...g.partes[parte] }
      }
    } else {
      base[item] = { ...base[item], ...g }
    }
  }
  return base
}

// Texto para avisarle al cliente (o al taller) que detalles tiene el vehiculo hoy.
export function textoEstadoActual(vehiculo, version) {
  const novedades = novedadesActa(version.checklist)
  return [
    `Estado actual del vehículo ${vehiculo.placa}${vehiculo.modelo ? ` — ${vehiculo.modelo}` : ''} (Rentandes)`,
    `Revisado el ${formatDate(version.created_at.slice(0, 10))}`,
    '',
    novedades.length ? `Detalles que tiene hoy (${novedades.length}):` : 'Sin novedades: todo en buen estado.',
    ...novedades.map((n) => `- ${n.item} › ${n.parte}: ${n.estado}${n.obs ? ` (${n.obs})` : ''}`),
    ...(version.observaciones ? ['', `Observaciones: ${version.observaciones}`] : []),
  ].join('\n')
}
