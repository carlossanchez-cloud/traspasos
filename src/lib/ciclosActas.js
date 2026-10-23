// Ciclo de un sustituto: un acta de Entrega y el acta de Recibido que la cierra (acta_entrega_id, paso SQL
// 21). La base de datos valida el ciclo al guardar; esto solo lo arma para mostrarlo y para que el
// formulario sugiera la entrega correcta antes de enviar.

export const numActa = (a) => (a?.consecutivo != null ? `N.º ${String(a.consecutivo).padStart(4, '0')}` : 'Sin N.º')

const porFechaDesc = (x, y) => (y.created_at || '').localeCompare(x.created_at || '')

// { ciclos: [{ entrega, recibido|null }], sueltas: [recibidos sin entrega] }, lo mas reciente primero.
export function agruparActas(actas) {
  const recibidoDe = new Map(actas.filter((a) => a.tipo === 'Recibido' && a.acta_entrega_id).map((r) => [r.acta_entrega_id, r]))
  const ciclos = actas.filter((a) => a.tipo === 'Entrega').sort(porFechaDesc)
    .map((entrega) => ({ entrega, recibido: recibidoDe.get(entrega.id) || null }))
  const idsEntrega = new Set(ciclos.map((c) => c.entrega.id))
  const sueltas = actas.filter((a) => a.tipo === 'Recibido' && !idsEntrega.has(a.acta_entrega_id)).sort(porFechaDesc)
  return { ciclos, sueltas }
}

// Entrega de esa placa que todavia no tiene su acta de recibido (a lo sumo una, por la regla del ciclo).
export const entregaAbierta = (actas, placa) =>
  agruparActas(actas).ciclos.find((c) => c.entrega.placa === placa && !c.recibido)?.entrega || null
