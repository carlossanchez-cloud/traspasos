import { STATUS_STYLE } from '../lib/format'

// Barra de estado: un solo bloque apilado (3 estados posibles, encoding de status
// no categórico) — colores ya usados en toda la app (badges, stat cards), sin
// inventar una paleta nueva. Gap de 2px entre segmentos (contraste sobre blanco).
const ESTADO_FILL = { Disponible: 'bg-emerald-500', Asignado: 'bg-blue-500', Taller: 'bg-red-500' }
const ESTADOS = ['Disponible', 'Asignado', 'Taller']

function EstadoBar({ vehicles }) {
  const total = vehicles.length || 1
  const counts = ESTADOS.map((e) => ({ estado: e, n: vehicles.filter((v) => v.estado === e).length }))
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Flota por estado</p>
      <div className="flex h-7 w-full rounded-full overflow-hidden bg-slate-100 gap-0.5">
        {counts.map(({ estado, n }) => n > 0 && (
          <div key={estado} title={`${estado}: ${n}`} className={`${ESTADO_FILL[estado]} h-full`} style={{ width: `${(n / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {counts.map(({ estado, n }) => (
          <div key={estado} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${ESTADO_FILL[estado]}`} />
            <span className="text-slate-500">{estado}</span>
            <span className="font-bold text-slate-800">{n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Barra ranqueada de una sola serie (magnitud): un solo hue de marca, sin leyenda
// (el título ya nombra la serie), etiqueta directa del conteo al final de la barra.
// Exportada: Informes.jsx la reusa para "top clientes" en vez de reimplementar el patrón.
export function RankedBars({ title, data }) {
  const max = Math.max(1, ...data.map((d) => d.n))
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">{title}</p>
      <div className="flex flex-col gap-2.5">
        {data.map(({ label, n }) => (
          <div key={label} className="flex items-center gap-2" title={`${label}: ${n}`}>
            <span className="text-xs text-slate-600 w-24 truncate shrink-0">{label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${(n / max) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-800 w-5 text-right shrink-0">{n}</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-xs text-slate-400">Sin datos.</p>}
      </div>
    </div>
  )
}

const rank = (vehicles, key) => {
  const counts = {}
  for (const v of vehicles) counts[v[key]] = (counts[v[key]] || 0) + 1
  return Object.entries(counts).map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n)
}

export default function FleetCharts({ vehicles }) {
  if (vehicles.length === 0) return null
  return (
    <div className="grid md:grid-cols-2 gap-3 mb-6">
      <div className="md:col-span-2"><EstadoBar vehicles={vehicles} /></div>
      <RankedBars title="Vehículos por ciudad" data={rank(vehicles, 'ciudad')} />
      <RankedBars title="Vehículos por tipo" data={rank(vehicles, 'tipo_vehiculo')} />
    </div>
  )
}
