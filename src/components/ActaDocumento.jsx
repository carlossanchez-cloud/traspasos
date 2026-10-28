import { formatDate, formatKM } from '../lib/format'
import { numActa, tipoActa } from '../lib/ciclosActas'
import ChecklistView from './ChecklistView'
import ActaPhotos from './ActaPhotos'

// El acta como documento, para el PDF: ancho fijo de hoja, logo de Rentandes, titulo con la placa y el N.º,
// datos, checklist, observaciones y, al final, fotos y firmas. Se dibuja fuera de la pantalla y se captura;
// los elementos con data-corte marcan donde se puede partir de una pagina a la siguiente.
export const ANCHO_DOCUMENTO = 760

export default function ActaDocumento({ acta, vehiculo, entrega, onCargado }) {
  const titulo = `Acta: ${tipoActa(acta)}`
  return (
    <div style={{ width: ANCHO_DOCUMENTO }} className="bg-white text-slate-800 px-10 py-9 font-sans">
      <div className="flex items-start justify-between gap-6 pb-5 border-b-2 border-emerald-500" data-corte>
        <div>
          <img src="/rentandes-logo.png" alt="rentandes" className="h-9 w-auto mb-4" />
          <p className="text-2xl font-black leading-tight">{titulo}</p>
          <p className="text-3xl font-black font-mono tracking-wide mt-1">{acta.placa}</p>
          {vehiculo?.modelo && <p className="text-sm text-slate-500 mt-0.5">{vehiculo.modelo}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] font-bold uppercase text-slate-500">Acta</p>
          <p className="text-xl font-black font-mono">{numActa(acta)}</p>
          <p className="text-[11px] font-bold uppercase text-slate-500 mt-2">Fecha</p>
          <p className="text-base font-bold">{formatDate(acta.fecha)}</p>
          <p className={`inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-full border ${acta.bloqueada ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {acta.bloqueada ? 'Firmada por el cliente' : 'Pendiente de firma del cliente'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-x-6 gap-y-3 py-5 border-b border-slate-200" data-corte>
        <Dato label="Cliente">{acta.cliente}</Dato>
        <Dato label="Conductor">{acta.conductor}</Dato>
        <Dato label="Ciudad">{vehiculo?.ciudad}</Dato>
        <Dato label="Kilometraje">{acta.kilometraje ? formatKM(acta.kilometraje) : null}</Dato>
        <Dato label="Combustible">{acta.nivel_combustible}</Dato>
        {acta.tipo === 'Recibido' && <Dato label="Cierra el acta entregado al cliente">{entrega ? `${numActa(entrega)} del ${formatDate(entrega.fecha)}` : null}</Dato>}
      </div>

      <div className="py-5">
        <p className="text-xs font-bold text-slate-500 uppercase mb-2" data-corte>Checklist del vehículo</p>
        <ChecklistView checklist={acta.checklist} />
      </div>

      {acta.observaciones && (
        <div className="pb-5" data-corte>
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Observaciones del gestor</p>
          <p className="text-sm">{acta.observaciones}</p>
        </div>
      )}
      {acta.bloqueada && (
        <div className="pb-5" data-corte>
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Confirmación del cliente</p>
          <p className="text-sm"><strong>{acta.nombre_cliente}</strong>{acta.observaciones_cliente ? ` — ${acta.observaciones_cliente}` : ''}</p>
        </div>
      )}

      <div className="pt-5 border-t border-slate-200">
        <ActaPhotos acta={acta} onCargado={onCargado} documento />
      </div>

      <p className="text-[10px] text-slate-400 mt-8 pt-3 border-t border-slate-100" data-corte>
        Flota Rentandes · Centro de gestión de activos · {numActa(acta)} · Documento generado el {formatDate(new Date().toISOString().slice(0, 10))}
      </p>
    </div>
  )
}

function Dato({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="text-sm font-semibold">{children || '—'}</p>
    </div>
  )
}
