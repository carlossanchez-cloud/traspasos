import { CHECK_ITEMS, SUB_ITEMS, ESTADOS, ESTADO_COLOR, esNovedad, estadosParte } from '../lib/actaChecklist'

// Checklist editable por grupos (carroceria, llantas...): cada grupo se despliega con Detalle y cada parte se
// marca Bueno / Regular / Malo (o el estado del documento), con observacion si tiene novedad. Lo usan el acta
// de entrega/recibido y el estado actual del vehiculo. `setParte(item, parte, campo, valor)`.
export default function ChecklistEditor({ checklist, setParte, expanded, setExpanded }) {
  return (
    <div className="flex flex-col gap-3">
      {CHECK_ITEMS.map((item) => {
        const partes = SUB_ITEMS[item]
        const malas = partes.filter((p) => esNovedad(checklist[item].partes[p].estado)).length
        const abierto = expanded[item]
        const toggle = () => setExpanded((x) => ({ ...x, [item]: !x[item] }))
        return (
          // Cada item es un bloque: encabezado gris y sus partes en un fondo gris mas claro, para
          // que con todo desplegado se distinga donde termina un grupo y empieza el siguiente.
          // El estado del grupo no se elige aqui: se resume de sus partes al guardar (conResumen).
          <div key={item} className={`rounded-lg border overflow-hidden ${abierto ? 'border-slate-400 shadow-sm' : 'border-slate-300'}`}>
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-200">
              <button type="button" onClick={toggle} className="flex items-center gap-2 text-sm font-semibold text-slate-800 text-left">
                {item}
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${malas ? 'bg-amber-100 text-amber-800' : 'bg-white/70 text-slate-500'}`}>
                  {malas ? `${malas} con novedad` : `${partes.length} partes`}
                </span>
              </button>
              <button type="button" onClick={toggle}
                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-md border shrink-0 transition-colors ${abierto ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                {abierto ? 'Cerrar' : 'Detalle'}
                <span className={`text-[10px] transition-transform ${abierto ? 'rotate-180' : ''}`}>▼</span>
              </button>
            </div>
            {abierto && (
              <div className="bg-slate-100 border-t border-slate-300 px-3 py-1 divide-y divide-slate-300/60">
                {partes.map((p) => (
                  <div key={p} className="py-1.5">
                    <EstadoInput label={p} estados={estadosParte(item)} entry={checklist[item].partes[p]}
                      onChange={(field, value) => setParte(item, p, field, value)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EstadoInput({ label, entry, onChange, estados = ESTADOS }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-700">{label}</span>
        <div className="flex flex-wrap justify-end gap-1">
          {estados.map((e) => (
            <button key={e} type="button" onClick={() => onChange('estado', e)}
              className={`text-xs font-bold px-2 py-1 rounded-md border transition-colors ${entry.estado === e ? ESTADO_COLOR[e] : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      {esNovedad(entry.estado) && (
        <input placeholder="Observación..." value={entry.obs} onChange={(e) => onChange('obs', e.target.value)}
          className="w-full mt-2 px-2 py-1.5 bg-white border border-slate-200 rounded text-xs" />
      )}
    </div>
  )
}
