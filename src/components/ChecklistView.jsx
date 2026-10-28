import { CHECK_ITEMS, SUB_ITEMS, ESTADO_COLOR } from '../lib/actaChecklist'

// Checklist de solo lectura, compartido entre el detalle del gestor (Actas.jsx) y la vista publica (ActaPublica.jsx).
export default function ChecklistView({ checklist }) {
  return (
    <div className="flex flex-col gap-1.5">
      {CHECK_ITEMS.map((item) => {
        const c = checklist?.[item]
        if (!c) return null
        const guardadas = Object.keys(c.partes || {})
        // Orden de la lista actual primero; despues partes de actas viejas que ya no estan en la lista.
        const partes = [...(SUB_ITEMS[item] || []).filter((p) => c.partes?.[p]), ...guardadas.filter((p) => !SUB_ITEMS[item]?.includes(p))]
        return (
          <div key={item} className="border-b border-slate-100 pb-1.5" data-corte>
            <EstadoRow label={item} entry={c} />
            {partes.length > 0 && (
              <div className="ml-3 mt-1 pl-3 border-l border-slate-200 flex flex-col gap-1">
                {partes.map((p) => <EstadoRow key={p} label={p} entry={c.partes[p]} small />)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EstadoRow({ label, entry, small }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={small ? 'text-xs text-slate-500' : 'text-sm text-slate-600'}>{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ESTADO_COLOR[entry.estado]}`}>
        {entry.estado}{entry.obs ? ` — ${entry.obs}` : ''}{entry.foto ? ' · 📷' : ''}
      </span>
    </div>
  )
}
