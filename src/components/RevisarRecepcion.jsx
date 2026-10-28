import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatDate, formatKM } from '../lib/format'
import { numActa } from '../lib/ciclosActas'
import { cicloPorRevisar, novedadesActa, novedadesNuevas } from '../lib/recepcion'
import Modal from './Modal'
import { ButtonSpinner } from './Spinner'

// El Administrador general compara el acta de entrega con la de recibido de un vehiculo En proceso de
// recepción y decide: lo acepta (Disponible) o pasa a taller por una novedad (revisar_recepcion, paso SQL 29).
export default function RevisarRecepcion({ vehiculo, actas, notify, onClose, onListo }) {
  const ciclo = cicloPorRevisar(vehiculo.placa, actas)
  const nuevas = ciclo ? novedadesNuevas(ciclo.entrega, ciclo.recibido) : []
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(null) // 'Disponible' | 'Taller' mientras se guarda

  const decidir = async (destino) => {
    if (destino === 'Taller' && !nota.trim()) { notify('Describe la novedad por la que pasa a taller.', 'error'); return }
    setEnviando(destino)
    const { error } = await supabase.rpc('revisar_recepcion', { p_placa: vehiculo.placa, p_destino: destino, p_nota: nota.trim() || null })
    setEnviando(null)
    if (error) {
      const falta = /revisar_recepcion|schema cache|could not find/i.test(error.message)
      notify(falta ? 'Falta un ajuste en la base de datos (paso SQL 29, pendiente de Carlos).' : error.message, 'error')
      return
    }
    notify(destino === 'Disponible' ? `${vehiculo.placa} quedó Disponible.` : `${vehiculo.placa} pasó a Taller.`, 'success')
    onListo()
  }

  const dato = (acta, campo) => (acta ? acta[campo] : null)
  const fila = (label, a, b, distinto) => (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 pr-3 text-xs font-bold text-slate-400 uppercase">{label}</td>
      <td className="py-2 pr-3 text-sm font-semibold text-slate-700">{a ?? '—'}</td>
      <td className={`py-2 text-sm font-semibold ${distinto ? 'text-amber-700' : 'text-slate-700'}`}>{b ?? '—'}</td>
    </tr>
  )

  return (
    <Modal title={`Revisar recepción — ${vehiculo.placa}`} onClose={onClose} wide>
      {!ciclo ? (
        <p className="text-sm text-slate-500">
          No se encontró el acta de recibido de {vehiculo.placa} en la app. Revisa en <Link to="/actas" className="font-bold text-emerald-700 underline">Actas</Link>.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-3">Compara cómo se entregó y cómo volvió el vehículo antes de decidir.</p>
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <th className="pb-2" />
                <th className="pb-2 pr-3">Entrega {numActa(ciclo.entrega)}</th>
                <th className="pb-2">Recibido {numActa(ciclo.recibido)}</th>
              </tr>
            </thead>
            <tbody>
              {fila('Fecha', formatDate(ciclo.entrega.fecha), formatDate(ciclo.recibido.fecha))}
              {fila('Cliente', dato(ciclo.entrega, 'cliente'), dato(ciclo.recibido, 'cliente'))}
              {fila('Kilometraje', ciclo.entrega.kilometraje ? formatKM(ciclo.entrega.kilometraje) : null,
                ciclo.recibido.kilometraje ? formatKM(ciclo.recibido.kilometraje) : null)}
              {fila('Combustible', ciclo.entrega.nivel_combustible, ciclo.recibido.nivel_combustible,
                ciclo.entrega.nivel_combustible !== ciclo.recibido.nivel_combustible)}
              {fila('Novedades', novedadesActa(ciclo.entrega.checklist).length, novedadesActa(ciclo.recibido.checklist).length, nuevas.length > 0)}
            </tbody>
          </table>
          {ciclo.entrega.kilometraje && ciclo.recibido.kilometraje && (
            <p className="text-xs text-slate-500 mt-1">Recorrió {formatKM(ciclo.recibido.kilometraje - ciclo.entrega.kilometraje)} con el cliente.</p>
          )}

          <div className={`mt-4 rounded-xl border px-4 py-3 ${nuevas.length ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            {nuevas.length === 0 ? (
              <p className="text-sm text-emerald-800"><strong>Sin novedades nuevas:</strong> el checklist del recibido no tiene nada que no estuviera ya en la entrega.</p>
            ) : (
              <>
                <p className="text-sm font-bold text-amber-800 mb-1">Novedades nuevas en el recibido ({nuevas.length})</p>
                <ul className="text-sm text-amber-900 list-disc pl-5">
                  {nuevas.map((n) => <li key={`${n.item}|${n.parte}`}>{n.item} › {n.parte}: <strong>{n.estado}</strong>{n.obs ? ` — ${n.obs}` : ''}</li>)}
                </ul>
              </>
            )}
            {(ciclo.recibido.observaciones || ciclo.recibido.observaciones_cliente) && (
              <p className="text-xs text-slate-600 mt-2">
                {ciclo.recibido.observaciones && <>Gestor: {ciclo.recibido.observaciones} </>}
                {ciclo.recibido.observaciones_cliente && <>· Cliente: {ciclo.recibido.observaciones_cliente}</>}
              </p>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Las fotos y el checklist completo están en <Link to="/actas" className="font-bold text-emerald-700 underline">Actas</Link>.
          </p>
        </>
      )}

      <label className="block text-xs font-bold text-slate-500 uppercase mt-5">
        Nota de la revisión (obligatoria si pasa a taller)
        <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} placeholder="Ej.: golpe en el capó, requiere latonería"
          className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm normal-case font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </label>
      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
        <button onClick={() => decidir('Taller')} disabled={!!enviando}
          className="flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50">
          {enviando === 'Taller' && <ButtonSpinner />} Hay novedad: pasa a taller
        </button>
        <button onClick={() => decidir('Disponible')} disabled={!!enviando}
          className="flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">
          {enviando === 'Disponible' && <ButtonSpinner />} Aceptar: queda Disponible
        </button>
      </div>
    </Modal>
  )
}
