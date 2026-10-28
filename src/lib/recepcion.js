import { CHECK_ITEMS, esNovedad } from './actaChecklist.js'
import { agruparActas } from './ciclosActas.js'

// Estados del vehiculo, en el orden del ciclo (paso SQL 29): se asigna (En proceso de entrega), el cliente firma
// la entrega (Asignado), el cliente firma el recibido (En proceso de recepción) y el Administrador general revisa
// las dos actas: Disponible o Taller.
export const ESTADOS_VEHICULO = ['Disponible', 'En proceso de entrega', 'Asignado', 'En proceso de recepción', 'Taller']

// Partes del checklist con novedad (no Bueno / Vigente / No aplica).
export const novedadesActa = (checklist) => CHECK_ITEMS.flatMap((item) => Object.entries(checklist?.[item]?.partes || {})
  .filter(([, p]) => esNovedad(p.estado))
  .map(([parte, p]) => ({ item, parte, estado: p.estado, obs: p.obs || '' })))

// Ultimo ciclo de la placa que ya tiene recibido: el que revisa el administrador. `actas`, las no eliminadas.
export const cicloPorRevisar = (placa, actas) =>
  agruparActas(actas).ciclos.find((c) => c.entrega.placa === placa && c.recibido) || null

// Novedades del recibido que no estaban (con el mismo estado) en la entrega: lo que cambio mientras el cliente
// tuvo el vehiculo.
export function novedadesNuevas(entrega, recibido) {
  const antes = new Set(novedadesActa(entrega?.checklist).map((n) => `${n.item}|${n.parte}|${n.estado}`))
  return novedadesActa(recibido?.checklist).filter((n) => !antes.has(`${n.item}|${n.parte}|${n.estado}`))
}
