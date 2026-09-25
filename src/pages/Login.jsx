import { useAuth } from '../lib/AuthProvider'
import { Icon } from '../lib/icons'

export default function Login() {
  const { signInWithGoogle } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4">
          <Icon name="Car" className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-800">Flota Sustitutos</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">Gestión de vehículos sustitutos de Rentandes.</p>
        <button
          onClick={signInWithGoogle}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          Entrar con Google
        </button>
        <p className="text-[11px] text-slate-400 mt-4">Solo correos @rentandes.com.</p>
      </div>
    </div>
  )
}
