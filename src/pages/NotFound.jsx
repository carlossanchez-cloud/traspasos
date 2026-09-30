import { Link } from 'react-router-dom'

// Antes de esto una URL sin ruta (dentro de la app autenticada) dejaba <main> vacio
// - nav/sidebar puestos, contenido en blanco, sin texto ni boton (bug real,
// confirmado en vivo con Playwright).
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-5xl font-bold text-emerald-600 mb-2">404</p>
      <p className="text-sm font-bold text-slate-700 mb-1">Esta página no existe</p>
      <p className="text-xs text-slate-500 mb-6">Revisa el link o vuelve a la flota.</p>
      <Link
        to="/"
        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
      >
        Volver a la flota
      </Link>
    </div>
  )
}
