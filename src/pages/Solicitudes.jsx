import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { Icon } from '../lib/icons'
import { formatDate, todayISO } from '../lib/format'
import { useToast } from '../lib/useToast'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Spinner, { ButtonSpinner } from '../components/Spinner'

const EMPTY = { placa_contrato: '', tipo_vehiculo: 'Automóvil', ciudad: '', admin_flota: '', cliente_empresa: '', fecha_inicio: todayISO(), fecha_fin: '', observaciones: '' }

export default function Solicitudes() {
  const { isAdmin } = useAuth()
  const { toast, notify, clear } = useToast()
  const [ciudades, setCiudades] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [sending, setSending] = useState(false)

  const [solicitudes, setSolicitudes] = useState([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)
  const [resolving, setResolving] = useState(null)
  const [candidatos, setCandidatos] = useState([])
  const [placaElegida, setPlacaElegida] = useState('')

  useEffect(() => {
    supabase.from('ciudades').select('nombre').order('nombre').then(({ data }) => {
      setCiudades((data || []).map((r) => r.nombre))
      setForm((f) => ({ ...f, ciudad: data?.[0]?.nombre || '' }))
    })
    if (isAdmin) loadSolicitudes()
    else setLoadingSolicitudes(false)
  }, [isAdmin])

  const loadSolicitudes = async () => {
    setLoadingSolicitudes(true)
    const { data } = await supabase.from('solicitudes').select('*').order('created_at', { ascending: false })
    setSolicitudes(data || [])
    setLoadingSolicitudes(false)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const enviar = async () => {
    if (!form.placa_contrato || !form.ciudad || !form.admin_flota || !form.cliente_empresa) {
      notify('Completa placa, ciudad, administrador y cliente.', 'error'); return
    }
    setSending(true)
    const { error } = await supabase.from('solicitudes').insert({ ...form, placa_contrato: form.placa_contrato.toUpperCase() })
    setSending(false)
    if (error) { notify('Error enviando solicitud: ' + error.message, 'error'); return }
    notify('Solicitud enviada. El administrador la revisará pronto.', 'success')
    setForm({ ...EMPTY, ciudad: ciudades[0] || '' })
    if (isAdmin) loadSolicitudes()
  }

  const abrirResolucion = async (s) => {
    setResolving(s)
    setPlacaElegida('')
    const { data } = await supabase.from('vehicles').select('*').eq('ciudad', s.ciudad).eq('tipo_vehiculo', s.tipo_vehiculo).eq('estado', 'Disponible')
    setCandidatos(data || [])
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
  }

  const pendientes = solicitudes.filter((s) => s.estado === 'Pendiente')

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-black text-slate-800 mb-1">Solicitar vehículo sustituto</h1>
      <p className="text-sm text-slate-500 mb-6">El administrador asigna un vehículo disponible según ciudad y tipo.</p>

      <div className="bg-white border border-slate-200 rounded-xl p-5 grid sm:grid-cols-2 gap-3">
        <Field label="Placa de tu vehículo (entra a taller)"><input value={form.placa_contrato} onChange={set('placa_contrato')} className={inputCls} /></Field>
        <Field label="Tipo de vehículo requerido">
          <select value={form.tipo_vehiculo} onChange={set('tipo_vehiculo')} className={inputCls}>
            <option>Automóvil</option><option>Camioneta</option><option>Pickup</option>
          </select>
        </Field>
        <Field label="Ciudad">
          <select value={form.ciudad} onChange={set('ciudad')} className={inputCls}>
            {ciudades.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Administrador de flota"><input value={form.admin_flota} onChange={set('admin_flota')} className={inputCls} /></Field>
        <Field label="Cliente"><input value={form.cliente_empresa} onChange={set('cliente_empresa')} className={inputCls} /></Field>
        <Field label="Fecha requerida"><input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} className={inputCls} /></Field>
        <Field label="Fecha estimada de devolución"><input type="date" value={form.fecha_fin} onChange={set('fecha_fin')} className={inputCls} /></Field>
        <div className="sm:col-span-2">
          <Field label="Observaciones"><textarea value={form.observaciones} onChange={set('observaciones')} rows={2} className={inputCls} /></Field>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button onClick={enviar} disabled={sending} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">
            {sending && <ButtonSpinner />}
            {sending ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-10">
          <h2 className="text-sm font-black text-slate-500 uppercase mb-3">Solicitudes pendientes ({pendientes.length})</h2>
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
                  </div>
                  <button onClick={() => abrirResolucion(s)} className="text-sm font-bold text-emerald-700 hover:underline shrink-0 ml-3">Asignar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {resolving && (
        <Modal title={`Asignar vehículo — ${resolving.cliente_empresa}`} onClose={() => setResolving(null)}>
          <p className="text-xs text-slate-500 mb-3">{resolving.tipo_vehiculo} disponible en {resolving.ciudad}:</p>
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
          <div className="flex justify-end mt-5">
            <button onClick={resolver} disabled={!placaElegida} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">Confirmar asignación</button>
          </div>
        </Modal>
      )}

      <Toast {...toast} onClose={clear} />
    </div>
  )
}

function Field({ label, children }) { return <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}{children}</label> }
const inputCls = 'w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
