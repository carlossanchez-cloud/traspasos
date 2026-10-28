import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { STATUS_STYLE } from '../lib/format'
import { formatCOP } from '../lib/inventario'
import { GASTOS, GASTOS_FUENTE, totalMes, totalDia, depreciacionMes } from '../lib/gastosSustitutos'
import Spinner from '../components/Spinner'

// Gastos mensuales de cada sustituto. La lista de vehiculos sale de la flota (base de datos); los gastos, del
// Excel de rentabilidad pegado en src/lib/gastosSustitutos.js. Solo consulta: no se editan desde la app.

const COLUMNAS = [
  ['valor_activo', 'Valor activo (Fasecolda)'], ['poliza', 'Póliza'], ['soat', 'SOAT'], ['rtm', 'RTM'],
  ['impuesto', 'Impuesto'], ['parqueadero', 'Parqueadero'], ['mtto', 'Mantenimiento (proy. anual / 12)'],
  ['otros', 'Otros gastos'], ['movilizaciones', 'Movilizaciones'],
]
const valor = (g, k) => (k === 'mtto' ? (g.mtto_anual == null ? null : g.mtto_anual / 12) : g[k])

export default function Gastos() {
  const [vehiculos, setVehiculos] = useState(null)
  const [q, setQ] = useState('')
  const [orden, setOrden] = useState('total')
  useEffect(() => {
    supabase.from('vehicles').select('placa, modelo, estado, ciudad').order('placa').then(({ data }) => setVehiculos(data || []))
  }, [])

  const { filas, fueraDeFlota } = useMemo(() => {
    const porPlaca = new Map(GASTOS.map((g) => [g.placa, g]))
    const enFlota = new Set((vehiculos || []).map((v) => v.placa))
    const qq = q.trim().toLowerCase()
    const coincide = (x) => !qq || [x.placa, x.modelo, x.linea, x.ciudad].some((v) => String(v || '').toLowerCase().includes(qq))
    const clave = { total: (f) => (f.g ? totalMes(f.g) : -1), placa: null, valor: (f) => f.g?.valor_activo ?? -1 }[orden]
    const lista = (vehiculos || []).map((v) => ({ ...v, g: porPlaca.get(v.placa) || null })).filter((f) => coincide({ ...f, linea: f.g?.linea }))
    if (clave) lista.sort((a, b) => clave(b) - clave(a))
    return { filas: lista, fueraDeFlota: GASTOS.filter((g) => !enFlota.has(g.placa) && coincide(g)) }
  }, [vehiculos, q, orden])

  if (!vehiculos) return <Spinner label="Cargando flota..." />
  const conGastos = filas.filter((f) => f.g)
  const sumaMes = conGastos.reduce((s, f) => s + totalMes(f.g), 0)

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-black text-slate-800">Gastos de la flota de sustitutos</h1>
      <p className="text-sm text-slate-500 mb-5">Gasto mensual de cada vehículo según <strong>{GASTOS_FUENTE}</strong>. Solo consulta: para actualizarlo se carga el Excel nuevo.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Kpi label="Vehículos en la flota" valor={filas.length} ayuda={`${conGastos.length} con gastos en el Excel`} />
        <Kpi label="Gasto total mes" valor={formatCOP(sumaMes)} />
        <Kpi label="Gasto total día" valor={formatCOP(sumaMes / 30)} />
        <Kpi label="Gasto promedio por vehículo" valor={formatCOP(conGastos.length ? sumaMes / conGastos.length : null)} ayuda="al mes" />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar placa, línea o ciudad…"
          className="flex-1 min-w-48 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
        <select value={orden} onChange={(e) => setOrden(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
          <option value="total">Mayor gasto al mes</option><option value="valor">Mayor valor del activo</option><option value="placa">Placa</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {filas.map((f) => <Fila key={f.placa} f={f} />)}
      </div>

      {fueraDeFlota.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-bold text-slate-500 uppercase">En el Excel pero no en la flota de la app ({fueraDeFlota.length})</p>
          <p className="text-xs text-slate-400 mb-2">Placas con gastos en el Excel que no están registradas como sustitutos en la app.</p>
          <div className="flex flex-col gap-2">
            {fueraDeFlota.map((g) => <Fila key={g.placa} f={{ placa: g.placa, g }} />)}
          </div>
        </div>
      )}
      <p className="text-[11px] text-slate-400 mt-6">
        Total mes = póliza + SOAT + RTM + impuesto + parqueadero + otros gastos + mantenimiento (proyección anual / 12), igual que el
        Excel. La depreciación (0,5 % mensual del valor) y las movilizaciones no suman en el total del Excel; se muestran aparte.
      </p>
    </div>
  )
}

function Fila({ f }) {
  const [abierto, setAbierto] = useState(false)
  const { g } = f
  const estilo = STATUS_STYLE[f.estado]
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => g && setAbierto((a) => !a)} disabled={!g}
        className="w-full text-left px-4 py-3 grid grid-cols-[1fr_auto] sm:grid-cols-[6.5rem_1fr_9rem_9rem_1.5rem] gap-x-3 gap-y-1 items-center disabled:cursor-default">
        <span className="font-mono font-bold text-slate-800 flex items-center gap-2">
          {estilo && <span className={`w-2 h-2 rounded-full ${estilo.dot}`} title={f.estado} />}{f.placa}
        </span>
        <span className="order-first sm:order-none col-span-2 sm:col-span-1 text-sm text-slate-600 truncate">{g?.linea || f.modelo || '—'}{f.ciudad ? <span className="text-slate-400"> · {f.ciudad}</span> : null}</span>
        {g ? (
          <>
            <span className="text-right sm:text-right"><span className="block text-[10px] font-bold text-slate-400 uppercase">Mes</span><span className="text-sm font-bold text-slate-800">{formatCOP(totalMes(g))}</span></span>
            <span className="text-right hidden sm:block"><span className="block text-[10px] font-bold text-slate-400 uppercase">Día</span><span className="text-sm text-slate-700">{formatCOP(totalDia(g))}</span></span>
            <span className={`hidden sm:block text-slate-400 text-xs transition-transform ${abierto ? 'rotate-180' : ''}`}>▼</span>
          </>
        ) : (
          <span className="sm:col-span-3 text-right text-xs text-amber-700">Sin gastos en el Excel</span>
        )}
      </button>
      {abierto && g && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-2">
          {COLUMNAS.map(([k, l]) => (
            <div key={k}><p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">{l}</p><p className="text-sm text-slate-800">{formatCOP(valor(g, k))}</p></div>
          ))}
          <div><p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Depreciación mes (no suma)</p><p className="text-sm text-slate-800">{formatCOP(depreciacionMes(g))}</p></div>
          <div className="col-span-2 sm:col-span-5"><p className="text-[10px] font-bold text-slate-400 uppercase">Línea (Excel)</p><p className="text-xs text-slate-600">{g.linea}</p></div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, valor, ayuda }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-[11px] font-bold text-slate-500 uppercase">{label}</p>
      <p className="text-xl font-black text-slate-800 mt-1">{valor}</p>
      {ayuda && <p className="text-[11px] text-slate-400 mt-0.5">{ayuda}</p>}
    </div>
  )
}
