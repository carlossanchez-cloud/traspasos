import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../lib/icons'
import { useInventario } from '../../lib/useInventario'
import { carga, formatCOP, formatMeses, formatPct, mesesEnInventario, pctVenta, promedioPonderado } from '../../lib/inventario'
import {
  InventarioLayout, EstadoCarga, ChipMeses,
} from './comun'
import { nombreActivo } from '../../lib/inventarioVista'

// Entrada del modulo: las dos areas (Tecnico y Comercial) y un resumen del inventario actual.
export default function InventarioInicio() {
  const inv = useInventario()
  return (
    <InventarioLayout>
      <h1 className="text-2xl font-black text-slate-800">Inventario</h1>
      <p className="text-sm text-slate-500 mb-5">Activos recuperados, en venta o recolocación. Escoge tu área:</p>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Entrada to="/inventario/tecnico" icon="Wrench" titulo="Técnico"
          texto="Estado de los activos, ubicación, kilometraje, documentos, reparaciones, precios de venta y recolocación." />
        <Entrada to="/inventario/comercial" icon="ClipboardList" titulo="Comercial"
          texto="Ofertas recibidas, ventas y recolocaciones, % de venta y a quién se vendió." />
      </div>
      <EstadoCarga inv={inv}><Resumen ingresos={inv.ingresos} /></EstadoCarga>
    </InventarioLayout>
  )
}

function Entrada({ to, icon, titulo, texto }) {
  return (
    <Link to={to} className="flex gap-4 bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-md transition-all">
      <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><Icon name={icon} className="w-6 h-6" /></div>
      <div>
        <p className="font-black text-lg text-slate-800">{titulo}</p>
        <p className="text-sm text-slate-500">{texto}</p>
      </div>
    </Link>
  )
}

function Resumen({ ingresos }) {
  const en = ingresos.filter((i) => i.en_inventario)
  const valorTotal = en.reduce((s, i) => s + (Number(i.valor_venta_propuesto) || 0), 0)
  const [hace90] = useState(() => new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().slice(0, 10))
  const salidas90 = ingresos.filter((i) => !i.en_inventario && i.fecha_salida && i.fecha_salida >= hace90)
  const pcts = salidas90.map(pctVenta).filter((p) => p != null)
  const porSituacion = Object.entries(en.reduce((m, i) => ({ ...m, [i.situacion]: (m[i.situacion] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])
  const mayorCarga = [...en].sort((a, b) => carga(b) - carga(a)).slice(0, 10)
  const cargaTotal = en.reduce((s, i) => s + carga(i), 0)
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi label="En inventario" valor={en.length} />
        <Kpi label="Valor de venta propuesto" valor={formatCOP(valorTotal)} />
        <Kpi label="Tiempo promedio ponderado" valor={formatMeses(promedioPonderado(en))}
          ayuda={`Simple: ${formatMeses(en.length ? en.reduce((s, i) => s + (mesesEnInventario(i) || 0), 0) / en.length : null)}`} />
        <Kpi label="Salidas últimos 90 días" valor={salidas90.length} ayuda={`% de venta promedio: ${formatPct(pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null)}`} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Por estado</p>
          {porSituacion.map(([s, n]) => (
            <div key={s} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
              <span className="text-slate-600">{s}</span><span className="font-bold text-slate-800">{n}</span>
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 lg:col-span-2">
          <p className="text-xs font-bold text-slate-500 uppercase">Mayor carga (valor × meses en inventario)</p>
          <p className="text-[11px] text-slate-400 mb-2">Los que más pesan en el inventario: conviene moverlos primero.</p>
          {mayorCarga.map((i) => (
            <div key={i.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-100 last:border-0">
              <span className="font-mono font-bold text-slate-800 w-28 shrink-0 truncate" title={i.activo_id}>{i.activo_id}</span>
              <span className="text-slate-600 flex-1 min-w-0 truncate">{nombreActivo(i.activo)}</span>
              <ChipMeses ing={i} />
              <span className="text-slate-700 w-28 text-right shrink-0 hidden sm:block">{formatCOP(i.valor_venta_propuesto)}</span>
              <span className="text-[11px] font-bold text-slate-500 w-12 text-right shrink-0">{cargaTotal ? Math.round((carga(i) / cargaTotal) * 100) : 0} %</span>
            </div>
          ))}
        </div>
      </div>
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
