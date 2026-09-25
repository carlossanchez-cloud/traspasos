// Reemplaza los alert()/prompt() nativos del prototipo (bloquean el hilo, feos, no accesibles en mobile).
export default function Toast({ message, kind = 'info', onClose }) {
  if (!message) return null
  const styles = {
    info: 'bg-slate-900 text-white',
    error: 'bg-red-600 text-white',
    success: 'bg-emerald-600 text-white',
  }
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[500] fade-in">
      <div className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-3 ${styles[kind]}`}>
        <span>{message}</span>
        <button onClick={onClose} className="opacity-70 hover:opacity-100">✕</button>
      </div>
    </div>
  )
}
