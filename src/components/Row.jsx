export default function Row({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold text-slate-400 uppercase">{label}</span>
      <span className={`text-sm font-semibold ${warn ? 'text-red-600' : 'text-slate-700'}`}>{value}</span>
    </div>
  )
}
