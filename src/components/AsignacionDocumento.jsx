import { formatDate, formatKM, diasRequeridos, isExpired } from '../lib/format'
import { formatCOP } from '../lib/inventario'
import { costoTercerizado } from '../lib/asignaciones'

// Soporte de una asignacion de sustituto, para el PDF: logo, titulo con la placa asignada, la solicitud, las
// observaciones y el vehiculo asignado tal como estaba al asignarlo (o sus datos actuales, si la asignacion es
// anterior al paso SQL 27). Se dibuja fuera de la pantalla y se captura con guardarPdf.
export default function AsignacionDocumento({ solicitud: s, v }) {
  const dias = diasRequeridos(s.fecha_inicio, s.fecha_fin)
  const vence = (fecha) => (fecha ? `${formatDate(fecha)}${isExpired(fecha) ? ' (vencido)' : ''}` : null)
  return (
    <div style={{ width: 760 }} className="bg-white text-slate-800 px-10 py-9 font-sans">
      <div className="flex items-start justify-between gap-6 pb-5 border-b-2 border-emerald-500" data-corte>
        <div>
          <img src="/rentandes-logo.png" alt="rentandes" className="h-9 w-auto mb-4" />
          <p className="text-2xl font-black leading-tight">Asignación de vehículo sustituto</p>
          {s.tercerizado ? (
            <>
              <p className="text-3xl font-black tracking-wide mt-1">{s.proveedor_tercerizado}</p>
              <p className="text-sm text-slate-500 mt-0.5">Arrendamiento tercerizado</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-black font-mono tracking-wide mt-1">{s.vehiculo_asignado_placa || '—'}</p>
              {v?.modelo && <p className="text-sm text-slate-500 mt-0.5">{v.modelo}</p>}
            </>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] font-bold uppercase text-slate-500">Asignado el</p>
          <p className="text-base font-bold">{s.resuelta_at ? formatDate(s.resuelta_at.slice(0, 10)) : '—'}</p>
          <p className="text-[11px] font-bold uppercase text-slate-500 mt-2">Cliente</p>
          <p className="text-base font-bold">{s.cliente_empresa}</p>
        </div>
      </div>

      <Seccion titulo="Solicitud">
        <Dato label="Vehículo que entra a taller">{s.placa_contrato}</Dato>
        <Dato label="Tipo requerido">{s.tipo_vehiculo}</Dato>
        <Dato label="Ciudad">{s.ciudad}</Dato>
        <Dato label="Administrador de flota">{s.admin_flota}</Dato>
        <Dato label="Fecha requerida">{formatDate(s.fecha_inicio)}</Dato>
        <Dato label="Devolución estimada">{s.fecha_fin ? formatDate(s.fecha_fin) : null}</Dato>
        <Dato label="Días requeridos">{dias}</Dato>
        <Dato label="Solicitud enviada">{s.created_at ? formatDate(s.created_at.slice(0, 10)) : null}</Dato>
      </Seccion>

      <div className="pb-5 border-b border-slate-200" data-corte>
        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Observaciones</p>
        <p className="text-sm whitespace-pre-line">{s.observaciones || 'Sin observaciones.'}</p>
      </div>

      {s.tercerizado ? (
        <Seccion titulo="Arrendamiento tercerizado">
          <Dato label="Proveedor">{s.proveedor_tercerizado}</Dato>
          <Dato label="Tarifa diaria">{formatCOP(s.tarifa_diaria_tercerizado)}</Dato>
          <Dato label="Costo estimado">{costoTercerizado(s) ? `${formatCOP(costoTercerizado(s))} (${dias} días)` : null}</Dato>
        </Seccion>
      ) : <>
      <Seccion titulo={v?.alAsignar === false ? 'Vehículo asignado (datos actuales)' : 'Vehículo asignado (al momento de asignarlo)'}>
        <Dato label="Placa">{s.vehiculo_asignado_placa}</Dato>
        <Dato label="Vehículo">{v?.modelo}</Dato>
        <Dato label="Tipo">{v?.tipo_vehiculo}</Dato>
        <Dato label="Ciudad">{v?.ciudad}</Dato>
        <Dato label="Kilometraje">{v ? formatKM(v.km_actual) : null}</Dato>
        <Dato label="Combustible">{v?.nivel_combustible}</Dato>
        <Dato label="SOAT vence">{vence(v?.soat)}</Dato>
        <Dato label="Tecnomecánica vence">{vence(v?.rtm)}</Dato>
        <Dato label="Seguro">{v ? (v.seguro_activo === false ? 'Sin seguro activo' : (v.aseguradora || 'Activo')) : null}</Dato>
        <Dato label="Último mantenimiento">{v?.km_ultimo_mto != null ? formatKM(v.km_ultimo_mto) : null}</Dato>
      </Seccion>
      {v?.observaciones && (
        <div className="pb-5" data-corte>
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Observaciones del vehículo</p>
          <p className="text-sm">{v.observaciones}</p>
        </div>
      )}

      </>}

      <p className="text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200" data-corte>
        Tener en cuenta pico y placa en la ciudad donde se recoja y entregue el vehículo antes de realizar alguna movilización.
      </p>

      <p className="text-[10px] text-slate-400 mt-8 pt-3 border-t border-slate-100" data-corte>
        Flota Rentandes · Centro de gestión de activos · Asignación {s.tercerizado ? `tercerizada (${s.proveedor_tercerizado})` : s.vehiculo_asignado_placa} · Documento generado el {formatDate(new Date().toISOString().slice(0, 10))}
      </p>
    </div>
  )
}

function Seccion({ titulo, children }) {
  return (
    <div className="py-5 border-b border-slate-200" data-corte>
      <p className="text-xs font-bold text-slate-500 uppercase mb-3">{titulo}</p>
      <div className="grid grid-cols-3 gap-x-6 gap-y-3">{children}</div>
    </div>
  )
}

function Dato({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="text-sm font-semibold">{children ?? '—'}</p>
    </div>
  )
}
