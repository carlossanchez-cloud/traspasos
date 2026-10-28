import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthProvider'
import { Icon } from '../lib/icons'

// Pantalla de entrada despues del login: se escoge a que modulo entrar.
// Gestion de flota es solo para administradores.
const MODULOS = [
  { to: '/sustitutos', titulo: 'Sustitutos', icon: 'Car', texto: 'Flota de vehículos sustitutos: mapa, solicitudes, actas (entregado al cliente y recibido por Rentandes) e informes.' },
  { to: '/inventario', titulo: 'Inventario', icon: 'ClipboardList', texto: 'Activos recuperados en venta o recolocación: parte técnica y comercial.' },
  { to: '/gestion-flota', titulo: 'Gestión de flota', icon: 'Wrench', texto: 'Mantenimiento, kilometraje adicional, costos de repuestos, documentos, rentabilidad por vehículo y KPIs.', soloAdmin: true },
]

export default function MenuPrincipal() {
  const { profile, isAdmin, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-slate-100">
        <div className="px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
          <img src="/rentandes-logo.png" alt="rentandes" className="h-8 sm:h-9 w-auto" />
          <div className="flex items-center gap-3 text-xs text-slate-400 min-w-0">
            <span className="truncate hidden sm:inline">{profile?.email}</span>
            <button onClick={signOut} className="flex items-center gap-1.5 text-slate-300 hover:text-white shrink-0">
              <Icon name="LogOut" className="w-3.5 h-3.5" /> Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Flota Rentandes · Centro de gestión de activos</p>
        <h1 className="text-2xl font-black text-slate-800">Menú principal</h1>
        <p className="text-sm text-slate-500 mb-6">¿A qué módulo quieres entrar?</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {MODULOS.map((m) => {
            const bloqueado = m.soloAdmin && !isAdmin
            const contenido = (
              <>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${bloqueado ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700'}`}>
                  <Icon name={m.icon} className="w-6 h-6" />
                </div>
                <p className="font-black text-slate-800 text-lg">{m.titulo}</p>
                <p className="text-sm text-slate-500 mt-1 flex-1">{m.texto}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {m.soloAdmin && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Solo administradores</span>}
                  {m.proximamente && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Próximamente</span>}
                </div>
              </>
            )
            const cls = 'flex flex-col bg-white border rounded-2xl p-5 text-left min-h-48 transition-all'
            return bloqueado ? (
              <div key={m.to} className={`${cls} border-slate-200 opacity-60 cursor-not-allowed`} title="Solo para administradores de flota">{contenido}</div>
            ) : (
              <Link key={m.to} to={m.to} className={`${cls} border-slate-200 hover:border-emerald-400 hover:shadow-md`}>{contenido}</Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
