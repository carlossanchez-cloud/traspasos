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

// Partes cuyo estado u observacion cambio entre dos checklists (p. ej. estado actual vs ultima acta).
export function diferenciasChecklist(antes, despues) {
  const a = checklistDesde(antes)
  const d = checklistDesde(despues)
  const cambios = []
  for (const item of CHECK_ITEMS) {
    for (const parte of Object.keys(a[item].partes || {})) {
      const x = a[item].partes[parte]
      const y = d[item].partes[parte]
      if (x.estado !== y.estado || (x.obs || '') !== (y.obs || '')) cambios.push({ item, parte, antes: x, despues: y })
    }
  }
  return cambios
}

// Todas las fotos de un acta (recorrido, novedades y adicionales), sin repetir.
export const fotosDeActa = (acta) => [...new Set([
  ...Object.values(acta?.checklist?.fotos_recorrido || {}),
  ...(acta?.fotos_urls || []),
  ...CHECK_ITEMS.flatMap((item) => Object.values(acta?.checklist?.[item]?.partes || {}).map((p) => p.foto)),
].filter(Boolean))]

// Acta (no eliminada) de la placa mas nueva que el estado actual: se ofrece para actualizarlo. Si no hay estado
// actual, cualquier acta sirve. null si no hay ninguna mas reciente.
export const actaMasReciente = (actas, estado) => actas
  .filter((a) => !a.eliminada_en && (!estado || (a.created_at || '') > estado.created_at))
  .sort((x, y) => (y.created_at || '').localeCompare(x.created_at || ''))[0] || null
