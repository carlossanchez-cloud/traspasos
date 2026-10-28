import { formatDate, formatKM, diasRequeridos } from './format.js'

// Datos del vehiculo de una solicitud completada: la copia guardada al asignarlo (paso SQL 27) o, si la
// asignacion es anterior a ese paso, los datos actuales del vehiculo. `alAsignar` dice cual de las dos es.
export const datosVehiculoAsignado = (solicitud, actual) => (
  solicitud?.vehiculo_al_asignar
    ? { ...solicitud.vehiculo_al_asignar, alAsignar: true }
    : actual ? { ...actual, alAsignar: false } : null
)

// Resumen en texto para compartirle la asignacion al gestor de flota (WhatsApp o Gmail).
export function resumenAsignacion(s, v) {
  const dias = diasRequeridos(s.fecha_inicio, s.fecha_fin)
  return [
    'Asignación de vehículo sustituto — Rentandes',
    '',
    `Cliente: ${s.cliente_empresa}`,
    `Sustituye a: ${s.placa_contrato} (entra a taller)`,
    `Ciudad: ${s.ciudad}`,
    `Desde ${formatDate(s.fecha_inicio)} hasta ${s.fecha_fin ? formatDate(s.fecha_fin) : 'sin fecha'}${dias ? ` (${dias} día${dias === 1 ? '' : 's'})` : ''}`,
    '',
    `Vehículo asignado: ${s.vehiculo_asignado_placa}${v?.modelo ? ` — ${v.modelo}` : ''}`,
    v?.tipo_vehiculo && `Tipo: ${v.tipo_vehiculo}`,
    v && `Kilometraje: ${formatKM(v.km_actual)}`,
    v?.nivel_combustible && `Combustible: ${v.nivel_combustible}`,
    v?.soat && `SOAT vence: ${formatDate(v.soat)}`,
    v?.rtm && `Tecnomecánica vence: ${formatDate(v.rtm)}`,
    ...(s.observaciones ? ['', `Observaciones: ${s.observaciones}`] : []),
    '',
    'Tener en cuenta pico y placa en la ciudad donde se recoja y entregue el vehículo antes de realizar alguna movilización.',
  ].filter((l) => typeof l === 'string').join('\n')
}
