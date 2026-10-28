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

// Entrega de esa placa que todavia no tiene su acta de recibido (a lo sumo una, por la regla del ciclo).
export const entregaAbierta = (actas, placa) =>
  agruparActas(actas).ciclos.find((c) => c.entrega.placa === placa && !c.recibido)?.entrega || null
