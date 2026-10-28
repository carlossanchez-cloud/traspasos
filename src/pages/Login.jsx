import { useAuth } from '../lib/AuthProvider'

export default function Login() {
  const { signInWithGoogle } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-800 via-slate-900 to-slate-950 p-6">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl shadow-black/30 p-8 text-center">
        <img src="/rentandes-icon.png" alt="rentandes" className="h-14 w-auto mx-auto mb-4" />
        <h1 className="text-lg font-bold text-slate-800">Flota Rentandes</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">Centro de gestión de activos Rentandes.</p>
        <button
          onClick={signInWithGoogle}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          Entrar con Google
        </button>
        <p className="text-[11px] text-slate-400 mt-4">Solo correos @rentandes.com.</p>
      </div>
    </div>
  )
}
