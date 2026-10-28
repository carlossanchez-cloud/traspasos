import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatDate, diasRequeridos } from '../lib/format'
import { useToast } from '../lib/useToast'
import { avisarSolicitudes } from '../lib/usePendientes'
import { matchesSolicitud } from '../lib/matching'
import Modal from '../components/Modal'
import Row from '../components/Row'
import Toast from '../components/Toast'
import Spinner from '../components/Spinner'

// Solicitudes de sustituto que esperan vehiculo (antes salian debajo del formulario de Solicitar). Solo
// administradores: asignar llama la RPC resolve_solicitud, que tambien lo exige.
export default function Asignaciones() {
  const { toast, notify, clear } = useToast()
  const [solicitudes, setSolicitudes] = useState([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)
  const [resolving, setResolving] = useState(null)
  const [candidatos, setCandidatos] = useState([])
  const [placaElegida, setPlacaElegida] = useState('')

  const loadSolicitudes = async () => {
    setLoadingSolicitudes(true)
    const { data } = await supabase.from('solicitudes').select('*').order('created_at', { ascending: false })
    setSolicitudes(data || [])
    setLoadingSolicitudes(false)
  }
  useEffect(() => { loadSolicitudes() }, [])

  const abrirResolucion = async (s) => {
    setResolving(s)
    setPlacaElegida('')
    // Solo 'estado' se filtra exacto en el servidor (es un enum controlado). ciudad/tipo_vehiculo
    // se comparan en el cliente con matchesSolicitud (case/espacios-insensible): datos reales
    // (seed cargado a mano, ciudades agregadas en momentos distintos) traen inconsistencias de
    // mayusculas/espacios que hacian que el .eq() exacto de antes no encontrara vehiculos que
    // en realidad si aplicaban (ver src/lib/matching.js).
    const { data } = await supabase.from('vehicles').select('*').eq('estado', 'Disponible')
    setCandidatos((data || []).filter((v) => matchesSolicitud(v, s)))
  }

  const resolver = async () => {
    if (!placaElegida) return
    // RPC atomica (supabase/steps/10_resolve_solicitud_rpc.sql): asigna el vehiculo y cierra
    // la solicitud en una sola transaccion, no en 2 updates separados desde el cliente.
    const { error } = await supabase.rpc('resolve_solicitud', {
      p_solicitud_id: resolving.id, p_placa: placaElegida,
    })
    if (error) notify('Error asignando: ' + error.message, 'error')
    else notify(`${placaElegida} asignado a ${resolving.cliente_empresa}.`, 'success')
    setResolving(null)
    loadSolicitudes()
    avisarSolicitudes()
  }

  const pendientes = solicitudes.filter((s) => s.estado === 'Pendiente')

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-black text-slate-800 mb-1">Asignaciones</h1>
      <p className="text-sm text-slate-500 mb-6">Solicitudes de vehículo sustituto que esperan un vehículo disponible.</p>

      <div>
        <h2 className="text-sm font-black text-slate-500 uppercase mb-3">Solicitudes pendientes de asignar ({pendientes.length})</h2>
        {loadingSolicitudes ? (
          <Spinner label="Cargando solicitudes..." className="py-6" />
        ) : pendientes.length === 0 ? (
          <p className="text-sm text-slate-400">No hay solicitudes pendientes.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendientes.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{s.tipo_vehiculo} en {s.ciudad} — {s.cliente_empresa}</p>
                  <p className="text-xs text-slate-500">Solicitado por {s.admin_flota} · sustituye a {s.placa_contrato} · desde {formatDate(s.fecha_inicio)}</p>
                  {s.observaciones && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md" title={s.observaciones}>Obs.: {s.observaciones}</p>}
                </div>
                <button onClick={() => abrirResolucion(s)} className="shrink-0 ml-3 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">Ver y asignar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {resolving && (
        <Modal title={`Solicitud — ${resolving.cliente_empresa}`} onClose={() => setResolving(null)}>
          {/* Primero la solicitud completa, tal como se lleno en Solicitar; abajo, el vehiculo a asignar. */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
            <Row label="Cliente" value={resolving.cliente_empresa} />
            <Row label="Vehículo que entra a taller" value={<span className="font-mono">{resolving.placa_contrato}</span>} />
            <Row label="Tipo requerido" value={resolving.tipo_vehiculo} />
            <Row label="Ciudad" value={resolving.ciudad} />
            <Row label="Administrador de flota" value={resolving.admin_flota} />
            <Row label="Fecha requerida" value={formatDate(resolving.fecha_inicio)} />
            <Row label="Devolución estimada" value={resolving.fecha_fin ? formatDate(resolving.fecha_fin) : 'Sin fecha'} />
            <Row label="Días requeridos" value={diasRequeridos(resolving.fecha_inicio, resolving.fecha_fin) ?? '—'} />
            {resolving.created_at && <Row label="Solicitud enviada" value={formatDate(resolving.created_at.slice(0, 10))} />}
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Observaciones</p>
            <p className={`text-sm whitespace-pre-line rounded-lg px-3 py-2 border ${resolving.observaciones ? 'bg-amber-50 border-amber-200 text-slate-700' : 'bg-white border-slate-200 text-slate-400'}`}>
              {resolving.observaciones || 'Sin observaciones.'}
            </p>
          </div>

          <p className="text-xs font-bold text-slate-500 uppercase mt-5 mb-2">Asignar vehículo: {resolving.tipo_vehiculo} disponible en {resolving.ciudad}</p>
          {candidatos.length === 0 ? (
            <p className="text-sm text-slate-400">No hay vehículos disponibles de ese tipo en esa ciudad ahora.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {candidatos.map((v) => (
                <label key={v.id} className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer ${placaElegida === v.placa ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                  <input type="radio" name="placa" checked={placaElegida === v.placa} onChange={() => setPlacaElegida(v.placa)} />
                  <span className="font-mono font-bold text-sm">{v.placa}</span>
                  <span className="text-xs text-slate-500">{v.modelo}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button onClick={resolver} disabled={!placaElegida} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50">Confirmar asignación</button>
          </div>
        </Modal>
      )}

      <Toast {...toast} onClose={clear} />
    </div>
  )
}
