import { RankedBars } from './FleetCharts'
import { rankBy, prestamosPorMes } from '../lib/informesCharts'

// 3 gráficas pedidas para Informes (reunión "PLATAFORMA SUSTITUTOS" 2026-09-29): mismo estilo
// visual de barras que ya usa el Dashboard (FleetCharts) para no inventar una paleta/librería
// nueva, pero calculadas sobre `historial` (préstamos), no sobre la foto actual de la flota.

function MonthlyBar({ data }) {
  const max = Math.max(1, ...data.map((d) => d.n))
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Préstamos por mes (últimos 6 meses)</p>
      <div className="flex items-end gap-2 h-24">
        {data.map(({ label, n }) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1" title={`${label}: ${n}`}>
            <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${(n / max) * 100}%`, minHeight: n > 0 ? '4px' : 0 }} />
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EstadoHistorialBar({ rows }) {
  const activos = rows.filter((r) => !r.fecha_devolucion_real).length
  const cerrados = rows.length - activos
  const total = rows.length || 1
  const segmentos = [
    { label: 'Activos', n: activos, fill: 'bg-blue-500' },
    { label: 'Cerrados', n: cerrados, fill: 'bg-emerald-500' },
  ]
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Préstamos por estado</p>
      <div className="flex h-7 w-full rounded-full overflow-hidden bg-slate-100 gap-0.5">
        {segmentos.map(({ label, n, fill }) => n > 0 && (
          <div key={label} title={`${label}: ${n}`} className={`${fill} h-full`} style={{ width: `${(n / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {segmentos.map(({ label, n, fill }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${fill}`} />
            <span className="text-slate-500">{label}</span>
            <span className="font-bold text-slate-800">{n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InformesCharts({ rows }) {
  if (rows.length === 0) return null
  return (
    <div className="grid md:grid-cols-2 gap-3 mb-6">
      <EstadoHistorialBar rows={rows} />
      <MonthlyBar data={prestamosPorMes(rows)} />
      <div className="md:col-span-2"><RankedBars title="Top clientes por préstamos" data={rankBy(rows, 'cliente').slice(0, 8)} /></div>
    </div>
  )
}
