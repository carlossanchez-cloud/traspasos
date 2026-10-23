// Modulo Inventario: listas y calculos, tomados de BD_INVENTARIO_V2_4.xlsx (hojas INVENTARIO, ESTADOS y
// Listas). Cada "ingreso" es un paso de un activo por el inventario: un mismo activo puede entrar, salir
// (vendido o recolocado) y volver a entrar.

export const SITUACIONES = [
  'En Avalúo', 'Disponible Venta o Recolocación', 'Solo venta', 'Solo renting', 'En Mantenimiento - Reparación',
  'Autorizada Venta Pendiente de Pago', 'En Proceso de Recolocación', 'En prestamo rentandes', 'Sustituto',
  'Arreglando proceso doble locatario', 'Retenido por parqueadero de terceros', 'Parqueadero Judicial',
  'Bloqueo Juridico', 'Ubicación Desconocida', 'Perdida Total',
  'Recolocado', 'Vendido Entregado', 'Vendido sin entregar', 'Entregado', 'Devuelto a Cliente',
]
// Situaciones con que se registra la salida desde Comercial.
export const SALIDAS = ['Vendido Entregado', 'Vendido sin entregar', 'Recolocado']

export const CATEGORIAS = ['Automoviles', 'Camiones', 'Maquinaria y Equipos', 'Terreno']
export const ORIGENES = [
  'Contrato Terminado', 'Terminación Anticipada', 'Recuperado', 'Retoma', 'Dación En Pago', 'Prórroga Premium',
  'Negocio no ejecutado', 'No entregado', 'Devolución anticipada', 'Cliente desiste Negocio', 'Sustituto', 'Sin Identificar',
]
export const FUENTES_VENTA = ['Página Web', 'Fuerza Comercial', 'Mercado Libre', 'Meta', 'Flash', 'Intermediarios (comision)']
export const CIUDADES = [
  'Barranquilla', 'Bogotá', 'Bucaramanga', 'Cali', 'Cartagena', 'Chía', 'Cúcuta', 'Medellín', 'Montelibano', 'Neiva',
  'Puerto Wilches', 'Riohacha', 'Santa Marta', 'Valledupar', 'Villavicencio', 'Yumbo',
]
export const ESTADOS_OFERTA = [
  'EN COMITÉ', 'APROBADA', 'APROBADA EN PROCESO', 'REOFERTAR', 'NEGADA', 'CLIENTE DESISTE', 'EN CONSIGNACION',
  'VENTA FINALIZADA Y ACTIVO ENTREGADO', 'RECOLOCADO',
]
export const CALIFICACIONES = [
  [1, 'En buenas condiciones, no necesita reparaciones de pintura, ni intervenciones mecánicas'],
  [0.9, 'En buenas condiciones, necesita reparaciones menores de latonería'],
  [0.8, 'En buenas condiciones, necesita reparaciones menores mecánicas'],
  [0.7, 'En buenas condiciones, necesita reparación menores de latonería e intervenciones mecánicas'],
  [0.6, 'En condiciones aceptables, necesita reparaciones medias de latonería /o/ intervenciones mecánicas'],
  [0.5, 'En condiciones aceptables, necesita reparaciones medias de latonería e intervenciones mecánicas'],
  [0.4, 'En condiciones regulares, necesita reparaciones mayores de latonería /o/ intervenciones mecánicas'],
  [0.3, 'En condiciones regulares, necesita reparaciones mayores de latonería e intervenciones mecánicas'],
  [0.2, 'En condiciones regulares, necesita reparaciones altas de latonería, e intervenciones mecánicas'],
  [0.1, 'Sin motor / o / sin carrocería / o / solamente chasis y cabina en pésimo estado'],
]
export const DOCUMENTOS = [
  ['doc_fotos', 'Fotos'], ['doc_video', 'Video'], ['doc_avaluo', 'Avalúo'], ['doc_acta_valor', 'Acta de valor'],
  ['doc_tarjeta', 'Tarjeta de propiedad'], ['doc_improntas', 'Improntas (3 juegos)'],
]

const DIA = 24 * 3600 * 1000
const fecha = (s) => (s ? new Date(`${String(s).slice(0, 10)}T00:00:00`) : null)

// Igual que el Excel: (fecha de salida o hoy - fecha de ingreso) / 30.
export const mesesEnInventario = (ing, hoy = new Date()) => {
  const ini = fecha(ing.fecha_ingreso)
  if (!ini) return null
  const fin = fecha(ing.fecha_salida) || hoy
  return Math.max(0, (fin - ini) / DIA / 30)
}

// Carga: cuanto pesa un activo en el inventario, valor x tiempo. Ordena cuales conviene mover primero.
export const carga = (ing, hoy) => (Number(ing.valor_venta_propuesto) || 0) * (mesesEnInventario(ing, hoy) || 0)

// Tiempo promedio en inventario ponderado por valor: sum(meses x valor) / sum(valor). En el Excel la
// columna "Promedio ponderado" multiplicaba y dividia por el mismo valor, asi que solo repetia los meses.
export const promedioPonderado = (ingresos, hoy) => {
  let num = 0
  let den = 0
  for (const i of ingresos) {
    const v = Number(i.valor_venta_propuesto) || 0
    const m = mesesEnInventario(i, hoy)
    if (!v || m == null) continue
    num += v * m
    den += v
  }
  return den ? num / den : null
}

export const pctVenta = (ing) => (ing.valor_vendido && ing.valor_venta_propuesto ? ing.valor_vendido / ing.valor_venta_propuesto : null)
export const saldoFavor = (ing) => (ing.valor_vendido != null && ing.valor_vpn ? ing.valor_vendido - ing.valor_vpn : null)
export const docsOk = (ing) => DOCUMENTOS.filter(([k]) => String(ing[k] || '').toUpperCase() === 'OK').length

// Verde hasta 3 meses, amarillo hasta 6, rojo despues.
export const semaforo = (meses) => (meses == null ? 'slate' : meses <= 3 ? 'emerald' : meses <= 6 ? 'amber' : 'red')

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
export const formatCOP = (v) => (v == null || v === '' ? '—' : cop.format(Number(v)))
export const formatMeses = (m) => (m == null ? '—' : `${m.toFixed(1)} m`)
export const formatPct = (p) => (p == null ? '—' : `${Math.round(p * 1000) / 10} %`)
