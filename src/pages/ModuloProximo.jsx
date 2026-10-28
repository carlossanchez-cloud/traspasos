import { Link } from 'react-router-dom'
import { Icon } from '../lib/icons'

// Pagina de los modulos del menu principal que todavia no se construyen (por ahora, Recobros).
export default function ModuloProximo({ titulo, texto }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <img src="/rentandes-logo.png" alt="rentandes" className="h-6 w-auto mx-auto mb-5" />
        <p className="text-lg font-black text-slate-800">{titulo}</p>
        {texto && <p className="text-sm text-slate-500 mt-1">{texto}</p>}
        <p className="text-sm text-slate-400 mt-3 mb-6">Este módulo está en construcción. Muy pronto vas a poder usarlo desde aquí.</p>
        <Link to="/" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg">
          <Icon name="ArrowLeft" className="w-3.5 h-3.5" /> Volver al menú principal
        </Link>
      </div>
    </div>
  )
}
