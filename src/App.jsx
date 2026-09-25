import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthProvider'
import { Icon } from './lib/icons'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Mapa from './pages/Mapa'
import Solicitudes from './pages/Solicitudes'
import Admin from './pages/Admin'
import Actas from './pages/Actas'
import Informes from './pages/Informes'

const NAV = [
  { to: '/', label: 'Flota', icon: 'Car', end: true },
  { to: '/mapa', label: 'Mapa', icon: 'Map' },
  { to: '/solicitudes', label: 'Solicitar', icon: 'ClipboardList' },
  { to: '/actas', label: 'Actas', icon: 'FileText' },
  { to: '/informes', label: 'Informes', icon: 'Download' },
]

function navClass({ isActive }) {
  return `flex items-center gap-2 px-4 py-3 text-sm font-medium shrink-0 border-b border-white/5 md:border-b-0 ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/5'}`
}

function Shell({ children }) {
  const { profile, isAdmin, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <nav className="md:w-56 shrink-0 bg-slate-900 text-slate-100 flex md:flex-col justify-between">
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible">
          <div className="hidden md:block px-4 py-5">
            <p className="font-bold text-sm text-white">Flota Sustitutos</p>
            <p className="text-xs text-slate-400">Renting</p>
          </div>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              <Icon name={item.icon} className="w-4 h-4" /> {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={navClass}>
              <Icon name="Shield" className="w-4 h-4" /> Administrador
            </NavLink>
          )}
        </div>
        <div className="hidden md:flex flex-col gap-2 px-4 py-4 border-t border-white/10 text-xs text-slate-400">
          <span className="truncate">{profile?.email}</span>
          <button onClick={signOut} className="flex items-center gap-1.5 text-slate-300 hover:text-white">
            <Icon name="LogOut" className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      </nav>
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
    </div>
  )
}

function Gate({ children }) {
  const { session, profile, profileError, loading, signOut } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>
  if (!session) return <Login />
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <Icon name="AlertTriangle" className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="font-bold text-slate-800">{profileError ? 'Error consultando tu perfil' : 'Acceso no autorizado'}</p>
          <p className="text-sm text-slate-500 mt-1">
            {profileError ? profileError : 'Este portal es solo para correos @rentandes.com.'}
          </p>
          <button onClick={signOut} className="mt-4 text-sm font-bold text-emerald-700 hover:underline">Volver a intentar</button>
        </div>
      </div>
    )
  }
  return <Shell>{children}</Shell>
}

function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/solicitudes" element={<Solicitudes />} />
            <Route path="/actas" element={<Actas />} />
            <Route path="/informes" element={<Informes />} />
            <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
          </Routes>
        </Gate>
      </BrowserRouter>
    </AuthProvider>
  )
}
