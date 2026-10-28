// Ciclo de un sustituto: un acta de Entrega y el acta de Recibido que la cierra (acta_entrega_id, paso SQL
// 21; mientras ese paso no este corrido, el id viaja en checklist.acta_entrega_id). La base de datos valida el ciclo al guardar; esto solo lo arma para mostrarlo y para que el
// formulario sugiera la entrega correcta antes de enviar.

const entregaDe = (r) => r.acta_entrega_id || r.checklist?.acta_entrega_id || null

// En la base de datos el tipo sigue siendo 'Entrega' o 'Recibido'; en pantalla y en el PDF se nombra por quien
// queda con el vehiculo, para que no haya duda de cual es cual.
export const TIPO_ACTA = { Entrega: 'Entregado al cliente', Recibido: 'Recibido por Rentandes' }
export const tipoActa = (a) => TIPO_ACTA[a?.tipo] || a?.tipo || ''

export const numActa = (a) => (a?.consecutivo != null ? `N.º ${String(a.consecutivo).padStart(4, '0')}` : 'Sin N.º')

const porFechaDesc = (x, y) => (y.created_at || '').localeCompare(x.created_at || '')

// { ciclos: [{ entrega, recibido|null }], sueltas: [recibidos sin entrega] }, lo mas reciente primero.
export function agruparActas(actas) {
  const recibidoDe = new Map(actas.filter((a) => a.tipo === 'Recibido' && entregaDe(a)).map((r) => [entregaDe(r), r]))
  const ciclos = actas.filter((a) => a.tipo === 'Entrega').sort(porFechaDesc)
    .map((entrega) => ({ entrega, recibido: recibidoDe.get(entrega.id) || null }))
  const idsEntrega = new Set(ciclos.map((c) => c.entrega.id))
  const sueltas = actas.filter((a) => a.tipo === 'Recibido' && !idsEntrega.has(entregaDe(a))).sort(porFechaDesc)
  return { ciclos, sueltas }
}

// Solo se eliminan actas incompletas (sin firma del cliente) y, si es una entrega, que no tenga su recibido. La
// base de datos lo vuelve a validar (paso SQL 25) y exige que quien elimine sea Administrador general.
// `activas` son las actas no eliminadas.
export const puedeEliminarActa = (acta, activas) => !acta.eliminada_en && !acta.bloqueada
  && !(acta.tipo === 'Entrega' && agruparActas(activas).ciclos.some((c) => c.entrega.id === acta.id && c.recibido))

// Entrega de esa placa que todavia no tiene su acta de recibido (a lo sumo una, por la regla del ciclo).
export const entregaAbierta = (actas, placa) =>
  agruparActas(actas).ciclos.find((c) => c.entrega.placa === placa && !c.recibido)?.entrega || null

// Actas de la asignacion actual de un vehiculo, para el control en la tarjeta de Flota: { entrega, recibido }
// (true si ya se hizo). Si hay una entrega abierta (sin recibido) de la placa, la entrega esta hecha y el
// recibido no. Si no, cuenta la ultima entrega de la placa hecha desde que empezo la asignacion (fecha de
// inicio o del cambio de estado, la mas antigua): si existe ya tiene su recibido. Sin eso, ninguna esta hecha.
// `actas` deben ser las no eliminadas.
export function actasDeAsignacion(vehiculo, actas) {
  const abierta = entregaAbierta(actas, vehiculo.placa)
  if (abierta) return { entrega: true, recibido: false }
  const desde = [vehiculo.fecha_inicio, vehiculo.fecha_estado].filter(Boolean).sort()[0] || ''
  const cerrada = agruparActas(actas).ciclos.find((c) => c.entrega.placa === vehiculo.placa && (c.entrega.fecha || '') >= desde)
  return cerrada ? { entrega: true, recibido: true } : { entrega: false, recibido: false }
}
