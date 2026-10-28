import { Link, NavLink } from 'react-router-dom'
import { Icon } from '../../lib/icons'
import { useAuth } from '../../lib/AuthProvider'
import { rolLabel } from '../../lib/roles'

import { SUBMODULOS } from '../../lib/gestionFlota'

// Modulo Gestion de flota (solo administradores): por ahora sus submodulos, todos en construccion.
const tabCls = ({ isActive }) => `text-sm font-bold px-3 py-2 rounded-lg whitespace-nowrap ${isActive ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'}`

function GestionFlotaLayout({ children }) {
  const { profile, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white">
              <Icon name="Menu" className="w-4 h-4" /> Menú principal
            </Link>
            <span className="text-slate-600">/</span>
            <span className="font-black">Gestión de flota</span>
          </div>
          <nav className="flex gap-1 bg-slate-800 rounded-xl p-1 overflow-x-auto max-w-full">
            <NavLink to="/gestion-flota" end className={tabCls}>Inicio</NavLink>
            {SUBMODULOS.map((m) => <NavLink key={m.to} to={m.to} className={tabCls}>{m.corto}</NavLink>)}
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

export default function GestionFlotaInicio() {
  return (
    <GestionFlotaLayout>
      <h1 className="text-2xl font-black text-slate-800">Gestión de flota</h1>
      <p className="text-sm text-slate-500 mb-5">Herramientas para los administradores de flota. Escoge un módulo:</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUBMODULOS.map((m) => (
          <Link key={m.to} to={m.to} className="flex flex-col bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4"><Icon name={m.icon} className="w-6 h-6" /></div>
            <p className="font-black text-lg text-slate-800">{m.titulo}</p>
            <p className="text-sm text-slate-500 mt-1 flex-1">{m.texto}</p>
            <span className="mt-4 self-start text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">En construcción</span>
          </Link>
        ))}
      </div>
    </GestionFlotaLayout>
  )
}

// Pagina de cada submodulo mientras se construye.
export function SubmoduloEnConstruccion({ ruta }) {
  const m = SUBMODULOS.find((s) => s.to === ruta)
  return (
    <GestionFlotaLayout>
      <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center mt-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4"><Icon name={m.icon} className="w-6 h-6" /></div>
        <p className="text-lg font-black text-slate-800">{m.titulo}</p>
        <p className="text-sm text-slate-500 mt-1">{m.texto}</p>
        <p className="text-sm text-slate-400 mt-4 mb-6">Este módulo está en construcción.</p>
        <Link to="/gestion-flota" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg">
          <Icon name="ArrowLeft" className="w-3.5 h-3.5" /> Volver a Gestión de flota
        </Link>
      </div>
    </GestionFlotaLayout>
  )
}
