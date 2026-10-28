import { Link, NavLink } from 'react-router-dom'
import { Icon } from '../../lib/icons'
import { useAuth } from '../../lib/AuthProvider'
import { rolLabel } from '../../lib/roles'
import { formatMeses, mesesEnInventario, semaforo } from '../../lib/inventario'
import Spinner from '../../components/Spinner'

// Piezas compartidas por Inicio, Tecnico y Comercial del modulo Inventario.

const tabCls = ({ isActive }) => `text-sm font-bold px-3 py-2 rounded-lg ${isActive ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'}`

export function InventarioLayout({ children }) {
  const { profile, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-slate-100">
        <div className="px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white">
              <Icon name="Menu" className="w-4 h-4" /> Menú principal
            </Link>
            <span className="text-slate-600">/</span>
            <span className="font-black">Inventario</span>
          </div>
          <nav className="flex gap-1 bg-slate-800 rounded-xl p-1">
            <NavLink to="/inventario" end className={tabCls}>Inicio</NavLink>
            <NavLink to="/inventario/tecnico" className={tabCls}>Técnico</NavLink>
            <NavLink to="/inventario/comercial" className={tabCls}>Comercial</NavLink>
          </nav>
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span>{profile?.email} · {rolLabel(profile?.role)}</span>
            <button onClick={signOut} className="flex items-center gap-1 text-slate-300 hover:text-white"><Icon name="LogOut" className="w-3.5 h-3.5" /> Salir</button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

// Carga / error / falta el paso SQL 23.
export function EstadoCarga({ inv, children }) {
  if (inv.loading) return <Spinner label="Cargando inventario..." />
  if (inv.faltaSql) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-5 text-sm">
        <p className="font-bold mb-1">El inventario todavía no está en la base de datos.</p>
        <p>Falta que se corra el paso SQL <code>supabase/steps/23_inventario.sql</code> y la carga inicial del Excel. Está en la lista de pendientes (PENDIENTES_CARLOS.md).</p>
      </div>
    )
  }
  if (inv.error) return <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">Error cargando el inventario: {inv.error}</p>
  return children
}

const TONO = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  slate: 'bg-slate-50 text-slate-500 border-slate-200',
}
export function ChipMeses({ ing }) {
  const m = mesesEnInventario(ing)
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${TONO[semaforo(ing.en_inventario ? m : null)]}`}>{formatMeses(m)}</span>
}
export const Chip = ({ children, tono = 'slate' }) => (
  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${TONO[tono]}`}>{children}</span>
)

// Busqueda + filtros comunes a Tecnico y Comercial. `vista` = 'en' (en inventario) | 'salieron'.
export function Filtros({ f, setF, ingresos, etiquetaSalieron = 'Ya salieron' }) {
  const opciones = (k) => [...new Set(ingresos.map((i) => (k === 'categoria' ? i.activo?.categoria : i[k])).filter(Boolean))].sort()
  const sel = 'px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm'
  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex flex-wrap gap-2">
        {[['en', 'En inventario'], ['salieron', etiquetaSalieron]].map(([k, l]) => (
          <button key={k} onClick={() => setF({ ...f, vista: k })}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border ${f.vista === k ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Buscar placa, marca, línea…" className={`${sel} col-span-2`} />
        {[['situacion', 'Estado'], ['categoria', 'Categoría'], ['ciudad', 'Ciudad']].map(([k, l]) => (
          <select key={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={sel}>
            <option value="">{l}: todas</option>
            {opciones(k).map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>
    </div>
  )
}

// Formulario generico: campos = [[clave, etiqueta, tipo, opciones?]]. tipo: text | num | money | date | select | area | docsel.
export function Campos({ campos, valores, set, listas = {} }) {
  const inp = 'w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {campos.map(([k, label, tipo, opts]) => {
        const v = valores[k] ?? ''
        const on = (e) => set(k, e.target.value)
        let control
        if (tipo === 'select' || tipo === 'docsel') {
          const lista = tipo === 'docsel' ? [['OK', 'OK'], ['NO', 'NO']] : opts
          control = (
            <select value={v} onChange={on} className={inp}>
              <option value="">—</option>
              {lista.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>))}
            </select>
          )
        } else if (tipo === 'area') {
          control = <textarea value={v} onChange={on} rows={2} className={inp} />
        } else {
          const listId = listas[k] ? `lista-${k}` : undefined
          control = (
            <>
              <input value={v} onChange={on} list={listId} className={inp}
                type={tipo === 'date' ? 'date' : tipo === 'num' || tipo === 'money' ? 'number' : 'text'} step={tipo === 'num' ? 'any' : undefined} />
              {listId && <datalist id={listId}>{listas[k].map((o) => <option key={o} value={o} />)}</datalist>}
            </>
          )
        }
        return (
          <label key={k} className={`block text-xs font-bold text-slate-500 uppercase ${tipo === 'area' ? 'sm:col-span-2' : ''}`}>
            {label}{control}
          </label>
        )
      })}
    </div>
  )
}


export function Seccion({ titulo, children, accion }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-500 uppercase">{titulo}</p>
        {accion}
      </div>
      {children}
    </div>
  )
}
export function Dato({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 text-right break-words min-w-0">{children ?? '—'}</span>
    </div>
  )
}
