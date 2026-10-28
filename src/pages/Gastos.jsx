import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { STATUS_STYLE } from '../lib/format'
import { GASTOS, GASTOS_FUENTE, totalMes, totalDia, depreciacionMes } from '../lib/gastosSustitutos'
import Spinner from '../components/Spinner'

// Gastos mensuales de cada sustituto, en tabla como el Excel. La lista de vehiculos sale de la flota (base de
// datos); los gastos, del Excel de rentabilidad pegado en src/lib/gastosSustitutos.js. Solo consulta.

const num = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })
const pesos = (v) => (v == null ? '—' : num.format(v))

// Columnas de gasto, en el orden del Excel. Solo se ven en pantallas anchas (xl); en las demas van en el
// detalle que se abre al tocar la fila. Total mes y dia van primero, despues de la referencia: es lo que se busca.
const COLS = [
  ['poliza', 'Póliza', (g) => g.poliza],
  ['soat', 'SOAT', (g) => g.soat],
  ['rtm', 'RTM', (g) => g.rtm],
  ['impuesto', 'Impuesto', (g) => g.impuesto],
  ['parqueadero', 'Parq.', (g) => g.parqueadero],
  ['mtto', 'Mtto.', (g) => (g.mtto_anual == null ? null : g.mtto_anual / 12)], // proyeccion anual / 12
  ['otros', 'Otros', (g) => g.otros],
]

// "COLORADO LS 2023 MT DIESEL 2776 CC ..." -> "COLORADO LS 2023": hasta el año, que es lo que se reconoce.
const referencia = (linea) => {
  if (!linea) return null
  const m = linea.match(/^(.*?\b(19|20)\d{2})\b/)
  return (m ? m[1] : linea.split(' ').slice(0, 3).join(' ')).trim()
}

export default function Gastos() {
  const [vehiculos, setVehiculos] = useState(null)
  const [q, setQ] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [orden, setOrden] = useState({ col: 'total', desc: true })
  const [abierta, setAbierta] = useState(null)
  const [verFuera, setVerFuera] = useState(false)
  const { asignar: tablaRef, medir, mover, izq, der, visible } = useDesplazamiento()
  useEffect(() => {
    supabase.from('vehicles').select('placa, modelo, estado, ciudad').order('placa').then(({ data }) => setVehiculos(data || []))
  }, [])

  const { filas, fueraDeFlota, ciudades } = useMemo(() => {
    const porPlaca = new Map(GASTOS.map((g) => [g.placa, g]))
    const enFlota = new Set((vehiculos || []).map((v) => v.placa))
    const qq = q.trim().toLowerCase()
    const todas = (vehiculos || []).map((v) => ({ ...v, g: porPlaca.get(v.placa) || null }))
    const lista = todas.filter((f) => (!ciudad || f.ciudad === ciudad)
      && (!qq || [f.placa, f.ciudad, f.g?.linea, f.modelo].some((x) => String(x || '').toLowerCase().includes(qq))))
    const clave = (f) => {
      if (orden.col === 'placa') return f.placa
      if (orden.col === 'ciudad') return f.ciudad || ''
      if (!f.g) return -1
      if (orden.col === 'total') return totalMes(f.g)
      return COLS.find(([k]) => k === orden.col)[2](f.g) ?? -1
    }
    lista.sort((a, b) => {
      const x = clave(a), y = clave(b)
      const c = typeof x === 'string' ? x.localeCompare(y) : x - y
      return orden.desc ? -c : c
    })
    return {
      filas: lista,
      fueraDeFlota: GASTOS.filter((g) => !enFlota.has(g.placa)),
      ciudades: [...new Set(todas.map((f) => f.ciudad).filter(Boolean))].sort(),
    }
  }, [vehiculos, q, ciudad, orden])

  if (!vehiculos) return <Spinner label="Cargando flota..." />
  const conGastos = filas.filter((f) => f.g)
  const suma = (fn) => conGastos.reduce((s, f) => s + (fn(f.g) || 0), 0)
  const sumaMes = suma(totalMes)
  const ordenar = (col) => setOrden((o) => ({ col, desc: o.col === col ? !o.desc : col !== 'placa' && col !== 'ciudad' }))

  const th = 'px-2 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap select-none cursor-pointer hover:text-slate-800'
  const flecha = (col) => (orden.col === col ? (orden.desc ? ' ↓' : ' ↑') : '')

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800">Gastos de la flota</h1>
          <p className="text-sm text-slate-500">Gasto mensual por vehículo, en pesos. Fuente: {GASTOS_FUENTE}.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Resumen label="Total mes" valor={`$ ${pesos(sumaMes)}`} fuerte />
          <Resumen label="Total día" valor={`$ ${pesos(sumaMes / 30)}`} />
          <Resumen label="Vehículos" valor={`${conGastos.length} / ${filas.length}`} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar placa o referencia…"
          className="flex-1 min-w-40 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
        <select value={ciudad} onChange={(e) => setCiudad(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
          <option value="">Todas las ciudades</option>
          {ciudades.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div ref={tablaRef} onScroll={medir} className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-[13px] tabular-nums">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th onClick={() => ordenar('placa')} className={`${th} text-left sticky left-0 z-10 bg-slate-50`}>Placa{flecha('placa')}</th>
              <th onClick={() => ordenar('ciudad')} className={`${th} text-left`}>Ciudad{flecha('ciudad')}</th>
              <th className={`${th} text-left cursor-default hover:text-slate-500 hidden md:table-cell`}>Referencia</th>
              <th onClick={() => ordenar('total')} className={`${th} text-right text-slate-800 bg-emerald-50`}>Total mes{flecha('total')}</th>
              <th className={`${th} text-right cursor-default hover:text-slate-500 hidden sm:table-cell border-r border-slate-200`}>Día</th>
              {COLS.map(([k, l]) => <th key={k} onClick={() => ordenar(k)} title={k === 'mtto' ? 'Mantenimiento: proyección anual ÷ 12' : k === 'parqueadero' ? 'Parqueadero' : undefined} className={`${th} text-right hidden xl:table-cell`}>{l}{flecha(k)}</th>)}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const g = f.g
              const estilo = STATUS_STYLE[f.estado]
              const abiertaEsta = abierta === f.placa
              return (
                <Fragment key={f.placa}>
                  <tr onClick={() => g && setAbierta(abiertaEsta ? null : f.placa)}
                    className={`border-b border-slate-100 ${g ? 'cursor-pointer hover:bg-slate-50 xl:cursor-default xl:hover:bg-transparent' : 'text-slate-400'}`}>
                    <td className="px-2 py-2.5 font-mono font-bold text-slate-800 whitespace-nowrap sticky left-0 z-10 bg-white">
                      {estilo && <span className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${estilo.dot}`} title={f.estado} />}{f.placa}
                    </td>
                    <td className="px-2 py-2.5 text-slate-600 whitespace-nowrap">{f.ciudad || '—'}</td>
                    <td className="px-2 py-2.5 text-slate-600 hidden md:table-cell max-w-56 truncate" title={g?.linea}>{referencia(g?.linea) || f.modelo || '—'}</td>
                    <td className="px-2 py-2.5 text-right font-bold text-slate-900 bg-emerald-50/50 whitespace-nowrap">
                      {g ? pesos(totalMes(g)) : <span className="text-xs font-normal text-amber-700">Sin datos</span>}
                    </td>
                    <td className="px-2 py-2.5 text-right text-slate-600 hidden sm:table-cell border-r border-slate-200">{g ? pesos(totalDia(g)) : ''}</td>
                    {COLS.map(([k, , fn]) => <td key={k} className="px-2 py-2.5 text-right text-slate-500 hidden xl:table-cell">{g ? pesos(fn(g)) : ''}</td>)}
                  </tr>
                  {abiertaEsta && g && (
                    <tr className="xl:hidden bg-slate-50 border-b border-slate-200">
                      <td colSpan={12} className="px-3 py-3">
                        <p className="text-xs text-slate-500 mb-2 md:hidden">{referencia(g.linea)}</p>
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                          {COLS.map(([k, l, fn]) => (
                            <div key={k} className="flex justify-between gap-2"><dt className="text-slate-500">{l}</dt><dd className="font-semibold text-slate-800">{pesos(fn(g))}</dd></div>
                          ))}
                          <div className="flex justify-between gap-2 sm:hidden"><dt className="text-slate-500">Total día</dt><dd className="font-semibold text-slate-800">{pesos(totalDia(g))}</dd></div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
            <tr>
              <td className="px-2 py-2.5 sticky left-0 z-10 bg-slate-50 whitespace-nowrap">Total ({conGastos.length})</td>
              <td />
              <td className="hidden md:table-cell" />
              <td className="px-2 py-2.5 text-right bg-emerald-100/60 whitespace-nowrap">{pesos(sumaMes)}</td>
              <td className="px-2 py-2.5 text-right hidden sm:table-cell border-r border-slate-200">{pesos(sumaMes / 30)}</td>
              {COLS.map(([k, , fn]) => <td key={k} className="px-2 py-2.5 text-right hidden xl:table-cell">{pesos(suma(fn))}</td>)}
            </tr>
          </tfoot>
        </table>
      </div>
      {(izq || der) && visible && (
        // Botones flotantes para moverse a los lados de la tabla sin bajar hasta su barra de desplazamiento.
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-1 bg-slate-900/90 text-white rounded-full p-1 shadow-lg">
          <button onClick={() => mover(-1)} disabled={!izq} aria-label="Ver columnas de la izquierda"
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg hover:bg-white/15 disabled:opacity-30">◀</button>
          <button onClick={() => mover(1)} disabled={!der} aria-label="Ver columnas de la derecha"
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg hover:bg-white/15 disabled:opacity-30">▶</button>
        </div>
      )}
      <p className="text-[11px] text-slate-400 mt-2 xl:hidden">Toca una fila para ver el detalle de sus gastos.</p>

      {fueraDeFlota.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setVerFuera((v) => !v)} className="text-xs font-bold text-slate-600 hover:text-slate-900">
            {verFuera ? '▲' : '▼'} {fueraDeFlota.length} placa(s) del Excel que no están en la flota de la app
          </button>
          {verFuera && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-[13px] tabular-nums">
                <tbody>
                  {fueraDeFlota.map((g) => (
                    <tr key={g.placa} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2 font-mono font-bold text-slate-700">{g.placa}</td>
                      <td className="px-3 py-2 text-slate-600">{referencia(g.linea)}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-800">{pesos(totalMes(g))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-6">
        Total mes = póliza + SOAT + RTM + impuesto + parqueadero + mantenimiento (proyección anual ÷ 12) + otros, igual que el Excel.
        No incluye la depreciación (0,5 % mensual del valor del activo; para toda la flota serían $ {pesos(suma(depreciacionMes))} al mes) ni las movilizaciones.
      </p>
    </div>
  )
}

// Sabe si la tabla tiene columnas ocultas a la izquierda o a la derecha y si esta a la vista, y la mueve
// de a 60 % de su ancho visible. `ref` es un callback ref: la tabla aparece despues de cargar la flota.
function useDesplazamiento() {
  const [el, setEl] = useState(null)
  const [estado, setEstado] = useState({ izq: false, der: false, visible: false })
  const medir = useCallback(() => {
    if (!el) return
    setEstado((e) => ({ ...e, izq: el.scrollLeft > 2, der: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 }))
  }, [el])
  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => setEstado((s) => ({ ...s, visible: e.isIntersecting })))
    io.observe(el)
    return () => { ro.disconnect(); io.disconnect() }
  }, [el, medir])
  const mover = (dir) => el?.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: 'smooth' })
  return { asignar: setEl, medir, mover, ...estado }
}

function Resumen({ label, valor, fuerte }) {
  return (
    <div className={`rounded-lg border px-3 py-1.5 ${fuerte ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className={`font-black ${fuerte ? 'text-emerald-800' : 'text-slate-800'}`}>{valor}</p>
    </div>
  )
}
