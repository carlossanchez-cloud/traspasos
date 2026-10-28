import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { Icon } from '../lib/icons'
import { todayISO } from '../lib/format'
import { useToast } from '../lib/useToast'
import { avisarSolicitudes } from '../lib/usePendientes'
import Toast from '../components/Toast'
import { ButtonSpinner } from '../components/Spinner'

const EMPTY = { placa_contrato: '', tipo_vehiculo: 'Automóvil', ciudad: '', admin_flota: '', cliente_empresa: '', fecha_inicio: todayISO(), fecha_fin: '', observaciones: '' }

export default function Solicitudes() {
  const { isAdmin, puedeEditar } = useAuth()
  const { toast, notify, clear } = useToast()
  const [ciudades, setCiudades] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.from('ciudades').select('nombre').order('nombre').then(({ data }) => {
      setCiudades((data || []).map((r) => r.nombre))
      setForm((f) => ({ ...f, ciudad: data?.[0]?.nombre || '' }))
    })
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const enviar = async () => {
    if (!form.placa_contrato || !form.ciudad || !form.admin_flota || !form.cliente_empresa) {
      notify('Completa placa, ciudad, administrador y cliente.', 'error'); return
    }
    if (!form.fecha_inicio || !form.fecha_fin) {
      notify('La fecha requerida y la fecha estimada de devolución son obligatorias.', 'error'); return
    }
    if (form.fecha_fin < form.fecha_inicio) {
      notify('La fecha estimada de devolución no puede ser antes de la fecha requerida.', 'error'); return
    }
    setSending(true)
    const { error } = await supabase.from('solicitudes').insert({ ...form, placa_contrato: form.placa_contrato.toUpperCase() })
    setSending(false)
    if (error) { notify('Error enviando solicitud: ' + error.message, 'error'); return }
    notify(isAdmin ? 'Solicitud enviada. Queda en Asignaciones.' : 'Solicitud enviada. El administrador la revisará pronto.', 'success')
    setForm({ ...EMPTY, ciudad: ciudades[0] || '' })
    avisarSolicitudes()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-black text-slate-800 mb-1">Solicitar vehículo sustituto</h1>
      <p className="text-sm text-slate-500 mb-6">El administrador asigna un vehículo disponible según ciudad y tipo.</p>

      {!puedeEditar && (
        <p className="text-sm rounded-xl px-4 py-3 mb-4 bg-slate-50 text-slate-600 border border-slate-200">
          Tu usuario es de <strong>solo lectura</strong>: no puedes enviar solicitudes. Pide a un administrador que te cambie el rol.
        </p>
      )}
      {puedeEditar && (
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
        <Field label="Fecha requerida *"><input type="date" required value={form.fecha_inicio} onChange={set('fecha_inicio')} className={inputCls} /></Field>
        <Field label="Fecha estimada de devolución *"><input type="date" required min={form.fecha_inicio || undefined} value={form.fecha_fin} onChange={set('fecha_fin')} className={inputCls} /></Field>
        <p className="sm:col-span-2 flex items-start gap-2 text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200">
          <Icon name="AlertTriangle" className="w-4 h-4 shrink-0 mt-px" />
          Tener en cuenta pico y placa en la ciudad donde se recoja y entregue el vehículo antes de realizar alguna movilización.
        </p>
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
      )}

      <Toast {...toast} onClose={clear} />
    </div>
  )
}

function Field({ label, children }) { return <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}{children}</label> }
const inputCls = 'w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
