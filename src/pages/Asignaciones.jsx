import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatDate, formatKM, diasRequeridos, isExpired } from '../lib/format'
import { datosVehiculoAsignado, resumenAsignacion, costoTercerizado, asignadoA } from '../lib/asignaciones'
import { formatCOP } from '../lib/inventario'
import { waTextUrl, gmailTextUrl } from '../lib/shareLink'
import { useToast } from '../lib/useToast'
import { avisarSolicitudes } from '../lib/usePendientes'
import { flotaParaSolicitud } from '../lib/matching'
import Modal from '../components/Modal'
import Row from '../components/Row'
import Toast from '../components/Toast'
import Spinner, { ButtonSpinner } from '../components/Spinner'
import AsignacionDocumento from '../components/AsignacionDocumento'
import { guardarPdf } from '../lib/pdf'
import { Icon } from '../lib/icons'

// Solicitudes de sustituto que esperan vehiculo (antes salian debajo del formulario de Solicitar). Solo
// administradores: asignar llama la RPC resolve_solicitud, que tambien lo exige.
export default function Asignaciones() {
  const { toast, notify, clear } = useToast()
  const [solicitudes, setSolicitudes] = useState([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)
  const [resolving, setResolving] = useState(null)
  const [flota, setFlota] = useState({ exactos: [], otroTipo: [], ocupados: {}, total: 0 })
  const candidatos = flota.exactos
  const [placaElegida, setPlacaElegida] = useState('')
  const [filtro, setFiltro] = useState('pendientes') // pendientes | completadas
  const [vehiculoActual, setVehiculoActual] = useState(null)
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false)
  const [tercero, setTercero] = useState(null) // { proveedor, tarifa } mientras se llena el arrendamiento tercerizado
  const [enviando, setEnviando] = useState(false)

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
    setFlota({ exactos: [], otroTipo: [], ocupados: {}, total: 0 })
    setVehiculoActual(null)
    setTercero(null)
    if (s.estado !== 'Pendiente') {
      // Completada: solo se consulta. Si no tiene la copia del vehiculo al asignar (paso SQL 27), se traen
      // los datos actuales del vehiculo.
      if (!s.vehiculo_al_asignar && s.vehiculo_asignado_placa) {
        const { data } = await supabase.from('vehicles').select('*').eq('placa', s.vehiculo_asignado_placa).maybeSingle()
        setVehiculoActual(data)
      }
      return
    }
    // Se trae toda la flota y se compara en el navegador (sin tildes, mayusculas ni espacios, ver
    // src/lib/matching.js): asi, si no hay del tipo pedido, se ve que hay en la ciudad y por que no esta libre.
    setCargandoCandidatos(true)
    const { data } = await supabase.from('vehicles').select('*')
    setFlota(flotaParaSolicitud(data || [], s))
    setCargandoCandidatos(false)
  }

  const resolver = async () => {
    if (!placaElegida) return
    // RPC atomica (supabase/steps/10_resolve_solicitud_rpc.sql): asigna el vehiculo y cierra
    // la solicitud en una sola transaccion, no en 2 updates separados desde el cliente.
    const { error } = await supabase.rpc('resolve_solicitud', {
      p_solicitud_id: resolving.id, p_placa: placaElegida,
    })
    if (error) notify('Error asignando: ' + error.message, 'error')
    else notify(`${placaElegida} asignado a ${resolving.cliente_empresa}. Sigue el acta de entrega: cuando el cliente la firme, el vehículo queda Asignado.`, 'success')
    setResolving(null)
    loadSolicitudes()
    avisarSolicitudes()
  }

  // Sin vehiculo propio disponible en la ciudad: se cierra con un vehiculo de un proveedor externo (paso SQL 28).
  const resolverTercerizado = async () => {
    const tarifa = Number(tercero.tarifa)
    if (!tercero.proveedor.trim() || !(tarifa > 0)) { notify('Escribe el proveedor y la tarifa diaria.', 'error'); return }
    setEnviando(true)
    const { error } = await supabase.rpc('resolve_solicitud_tercerizado', {
      p_solicitud_id: resolving.id, p_proveedor: tercero.proveedor.trim(), p_tarifa_diaria: tarifa,
    })
    setEnviando(false)
    if (error) {
      const falta = /resolve_solicitud_tercerizado|schema cache|could not find/i.test(error.message)
      notify(falta ? 'Falta un ajuste en la base de datos (paso SQL 28, pendiente de Carlos).' : 'Error asignando: ' + error.message, 'error')
      return
    }
    notify(`Asignado por arrendamiento tercerizado (${tercero.proveedor.trim()}) a ${resolving.cliente_empresa}.`, 'success')
    setResolving(null)
    loadSolicitudes()
    avisarSolicitudes()
  }

  const pendientes = solicitudes.filter((s) => s.estado === 'Pendiente')
  // Completadas: las ya asignadas, la ultima asignada primero.
  const completadas = solicitudes.filter((s) => s.estado === 'Resuelta')
    .sort((a, b) => (b.resuelta_at || '').localeCompare(a.resuelta_at || ''))
  const tab = (key, label, n) => (
    <button onClick={() => setFiltro(key)}
      className={`text-xs font-bold px-3 py-1.5 rounded-full border ${filtro === key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>
      {label} ({n})
    </button>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-black text-slate-800 mb-1">Asignaciones</h1>
      <p className="text-sm text-slate-500 mb-5">Solicitudes de vehículo sustituto: las que esperan vehículo y las ya asignadas.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tab('pendientes', 'Pendientes por asignar', pendientes.length)}
        {tab('completadas', 'Completadas', completadas.length)}
      </div>

      {loadingSolicitudes ? (
        <Spinner label="Cargando solicitudes..." className="py-6" />
      ) : filtro === 'pendientes' ? (
        pendientes.length === 0 ? (
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
        )
      ) : completadas.length === 0 ? (
        <p className="text-sm text-slate-400">Todavía no hay solicitudes completadas.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {completadas.map((s) => (
            <div key={s.id} className="bg-white border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 text-sm">{s.tipo_vehiculo} en {s.ciudad} — {s.cliente_empresa}</p>
                <p className="text-xs text-slate-500">Solicitado por {s.admin_flota} · sustituye a {s.placa_contrato} · desde {formatDate(s.fecha_inicio)}</p>
                <p className={`text-xs font-bold mt-0.5 ${s.tercerizado ? 'text-indigo-700' : 'text-emerald-700'}`}>
                  ✓ {s.tercerizado ? asignadoA(s) : <>Asignado <span className="font-mono">{s.vehiculo_asignado_placa || '—'}</span></>}
                  {s.resuelta_at ? ` · el ${formatDate(s.resuelta_at.slice(0, 10))}` : ''}
                </p>
              </div>
              <button onClick={() => abrirResolucion(s)} className="shrink-0 ml-3 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Ver</button>
            </div>
          ))}
        </div>
      )}

      {resolving && (
        <Modal title={`Solicitud${resolving.estado === 'Pendiente' ? '' : ' completada'} — ${resolving.cliente_empresa}`} onClose={() => setResolving(null)}>
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

          {resolving.estado !== 'Pendiente' ? (
            <VehiculoAsignado solicitud={resolving} v={datosVehiculoAsignado(resolving, vehiculoActual)} notify={notify} />
          ) : <>
          <p className="text-xs font-bold text-slate-500 uppercase mt-5 mb-2">Asignar vehículo: {resolving.tipo_vehiculo} disponible en {resolving.ciudad}</p>
          {cargandoCandidatos ? (
            <Spinner label="Buscando vehículos disponibles..." className="py-4" />
          ) : candidatos.length === 0 ? (
            <div>
              <p className="text-sm text-slate-500">
                No hay vehículos de tipo <strong>{resolving.tipo_vehiculo}</strong> disponibles en {resolving.ciudad} ahora.
                {' '}{flota.total === 0
                  ? `No hay vehículos registrados en ${resolving.ciudad}.`
                  : `En ${resolving.ciudad} hay ${flota.total} vehículo(s): ${[
                    flota.otroTipo.length && `${flota.otroTipo.length} disponible(s) de otro tipo`,
                    ...Object.entries(flota.ocupados).map(([estado, n]) => `${n} ${estado === 'Taller' ? 'en taller' : estado.toLowerCase() + '(s)'}`),
                  ].filter(Boolean).join(', ')}.`}
              </p>
              {flota.otroTipo.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Disponibles en {resolving.ciudad} de otro tipo</p>
                  <div className="flex flex-col gap-2">
                    {flota.otroTipo.map((v) => (
                      <label key={v.id} className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer ${placaElegida === v.placa ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                        <input type="radio" name="placa" checked={placaElegida === v.placa} onChange={() => { setPlacaElegida(v.placa); setTercero(null) }} />
                        <span className="font-mono font-bold text-sm">{v.placa}</span>
                        <span className="text-xs text-slate-500">{v.modelo}</span>
                        <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{v.tipo_vehiculo || 'Sin tipo'}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end mt-3">
                    <button onClick={resolver} disabled={!placaElegida} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50">Confirmar asignación</button>
                  </div>
                </div>
              )}
              {!tercero ? (
                <button onClick={() => { setTercero({ proveedor: '', tarifa: '' }); setPlacaElegida('') }}
                  className="mt-3 w-full text-sm font-bold px-4 py-2.5 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                  + Arrendamiento tercerizado
                </button>
              ) : (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-xs font-bold text-indigo-800 uppercase mb-2">Arrendamiento tercerizado</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Campo label="Proveedor">
                      <input value={tercero.proveedor} onChange={(e) => setTercero((t) => ({ ...t, proveedor: e.target.value }))}
                        placeholder="Ej.: Localiza, 4WD" className={inputCls} />
                    </Campo>
                    <Campo label="Tarifa diaria (COP)">
                      <input type="number" min="0" step="1000" value={tercero.tarifa} onChange={(e) => setTercero((t) => ({ ...t, tarifa: e.target.value }))}
                        placeholder="Ej.: 180000" className={inputCls} />
                    </Campo>
                  </div>
                  {costoTercerizado({ ...resolving, tarifa_diaria_tercerizado: tercero.tarifa }) && (
                    <p className="text-xs text-indigo-800 mt-2">
                      Costo estimado: <strong>{formatCOP(costoTercerizado({ ...resolving, tarifa_diaria_tercerizado: tercero.tarifa }))}</strong>
                      {' '}({diasRequeridos(resolving.fecha_inicio, resolving.fecha_fin)} días × {formatCOP(tercero.tarifa)})
                    </p>
                  )}
                  <div className="flex justify-end gap-2 mt-3">
                    <button onClick={() => setTercero(null)} disabled={enviando} className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700">Cancelar</button>
                    <button onClick={resolverTercerizado} disabled={enviando} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50">
                      {enviando && <ButtonSpinner />} Confirmar asignación tercerizada
                    </button>
                  </div>
                </div>
              )}
            </div>
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
          {!cargandoCandidatos && candidatos.length > 0 && <div className="flex justify-end mt-4">
            <button onClick={resolver} disabled={!placaElegida} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50">Confirmar asignación</button>
          </div>}
          </>}
        </Modal>
      )}

      <Toast {...toast} onClose={clear} />
    </div>
  )
}

// Vehiculo de una solicitud completada, para compartirlo con el gestor de flota y comparar despues con el
// acta de entrega.
function VehiculoAsignado({ solicitud, v, notify }) {
  const texto = resumenAsignacion(solicitud, v)
  const [generando, setGenerando] = useState(false)
  const docRef = useRef(null)
  const descargar = async () => {
    setGenerando(true)
    try {
      await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))
      const fecha = (solicitud.resuelta_at || '').slice(0, 10)
      await guardarPdf(docRef.current, `Asignacion_${solicitud.tercerizado ? `tercerizado_${solicitud.proveedor_tercerizado}` : solicitud.vehiculo_asignado_placa}_${solicitud.cliente_empresa}_${fecha}.pdf`.replace(/[^\w.-]+/g, '_'))
    } catch (err) {
      notify('No se pudo generar el PDF: ' + err.message, 'error')
    } finally {
      setGenerando(false)
    }
  }
  const btn = 'flex-1 text-center text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
  const vence = (fecha) => (fecha ? <span className={isExpired(fecha) ? 'text-red-600' : ''}>{formatDate(fecha)}{isExpired(fecha) ? ' (vencido)' : ''}</span> : '—')
  return (
    <div className="mt-5">
      {solicitud.tercerizado ? (
        <>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Arrendamiento tercerizado</p>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
            <Row label="Proveedor" value={solicitud.proveedor_tercerizado || '—'} />
            <Row label="Tarifa diaria" value={formatCOP(solicitud.tarifa_diaria_tercerizado)} />
            <Row label="Días requeridos" value={diasRequeridos(solicitud.fecha_inicio, solicitud.fecha_fin) ?? '—'} />
            <Row label="Costo estimado" value={formatCOP(costoTercerizado(solicitud))} />
            <Row label="Asignado el" value={solicitud.resuelta_at ? formatDate(solicitud.resuelta_at.slice(0, 10)) : '—'} />
          </div>
        </>
      ) : <>
      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Vehículo asignado</p>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
        <Row label="Placa" value={<span className="font-mono">{solicitud.vehiculo_asignado_placa || '—'}</span>} />
        <Row label="Asignado el" value={solicitud.resuelta_at ? formatDate(solicitud.resuelta_at.slice(0, 10)) : '—'} />
        {v ? (
          <>
            <Row label="Vehículo" value={v.modelo || '—'} />
            <Row label="Tipo" value={v.tipo_vehiculo || '—'} />
            <Row label="Ciudad" value={v.ciudad || '—'} />
            <Row label="Kilometraje" value={formatKM(v.km_actual)} />
            <Row label="Combustible" value={v.nivel_combustible || '—'} />
            <Row label="SOAT vence" value={vence(v.soat)} />
            <Row label="Tecnomecánica vence" value={vence(v.rtm)} />
            <Row label="Seguro" value={v.seguro_activo === false ? 'Sin seguro activo' : (v.aseguradora || 'Activo')} />
            {v.km_ultimo_mto != null && <Row label="Último mantenimiento" value={formatKM(v.km_ultimo_mto)} />}
            {v.observaciones && <Row label="Observaciones del vehículo" value={v.observaciones} />}
          </>
        ) : (
          <p className="text-sm text-slate-400 py-2">No se encontraron los datos del vehículo.</p>
        )}
      </div>
      {v && (
        <p className="text-[11px] text-slate-500 mt-1">
          {v.alAsignar
            ? 'Así estaba el vehículo en el momento de asignarlo.'
            : 'Datos actuales del vehículo: esta asignación se hizo antes de que la app guardara cómo estaba el vehículo al asignarlo.'}
        </p>
      )}
      </>}
      <p className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Compartir con el gestor de flota</p>
      <div className="flex gap-2">
        <a href={waTextUrl(texto)} target="_blank" rel="noreferrer" className={btn}>WhatsApp</a>
        <a href={gmailTextUrl(`Asignación de sustituto ${solicitud.tercerizado ? `tercerizado (${solicitud.proveedor_tercerizado})` : solicitud.vehiculo_asignado_placa} — ${solicitud.cliente_empresa}`, texto)} target="_blank" rel="noreferrer" className={btn}>Gmail</a>
        <button onClick={descargar} disabled={generando} className={`${btn} flex items-center justify-center gap-1.5 disabled:opacity-50`}>
          {generando ? <ButtonSpinner /> : <Icon name="Download" className="w-3.5 h-3.5" />} {generando ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>
      {/* El documento del PDF se dibuja fuera de la pantalla solo mientras se genera. */}
      {generando && (
        <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden="true">
          <div ref={docRef}><AsignacionDocumento solicitud={solicitud} v={v} /></div>
        </div>
      )}
    </div>
  )
}

function Campo({ label, children }) { return <label className="block text-xs font-bold text-slate-500 uppercase">{label}{children}</label> }
const inputCls = 'w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm normal-case font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400'
