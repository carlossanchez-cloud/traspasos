import { MTO_ITEMS, itemPct, overallMtoPct } from '../lib/maintenance'

export default function MaintenancePanel({ detalle, kmActual, onChange, readOnly }) {
  const set = (key, field, value) => onChange({
    ...detalle,
    [key]: { ...(detalle?.[key] || {}), [field]: value === '' ? '' : Number(value) },
  })

  const overall = overallMtoPct(detalle, kmActual)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-500 uppercase">Mantenimiento detallado</p>
        <span className={`text-xs font-black ${overall >= 90 ? 'text-red-600' : overall >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {overall}% desgaste general
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {MTO_ITEMS.map((item) => {
          const d = detalle?.[item.key] || {}
          const pct = itemPct(item, detalle, kmActual)
          return (
            <div key={item.key} className="border border-slate-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">{item.label} <span className="text-slate-400 font-normal">({Math.round(item.peso * 100)}%)</span></span>
                <span className="text-xs font-bold text-slate-500">{pct}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  KM último cambio
                  <input type="number" disabled={readOnly} value={d.km ?? ''} onChange={(e) => set(item.key, 'km', e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs disabled:opacity-60" />
                </label>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Frecuencia (km)
                  <input type="number" disabled={readOnly} value={d.frecuencia ?? item.defaultFrecuencia} onChange={(e) => set(item.key, 'frecuencia', e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs disabled:opacity-60" />
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
