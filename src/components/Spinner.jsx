// Spinner chico inline para botones en estado "guardando/enviando".
export function ButtonSpinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function Spinner({ label, className = 'py-10' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-slate-400 ${className}`}>
      <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
