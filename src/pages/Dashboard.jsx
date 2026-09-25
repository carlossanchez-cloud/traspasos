import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { Icon } from '../lib/icons'
import { formatDate, formatKM, isExpired, STATUS_STYLE, todayISO } from '../lib/format'
import { useToast } from '../lib/useToast'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import MaintenancePanel from '../components/MaintenancePanel'

const EMPTY_FORM = {
  placa: '', modelo: '', tipo_vehiculo: 'Automóvil', ciudad: '', estado: 'Disponible',
  cliente: '', admin_flota: '', fecha_inicio: '', fecha_fin: '', novedades_asignacion: '', placa_sustituida: '',
  soat: '', rtm: '', seguro_activo: true, aseguradora: '',
  nivel_combustible: 'Lleno', km_actual: 0, km_ultimo_mto: 0, frecuencia_mto: 10000,
  observaciones: '', nombre_ubicacion: '', ubicacion: '',
}

function StatCard({ label, value, tone }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
      <p className={`text-2xl font-black mt-1 ${tone}`}>{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const { toast, notify, clear } = useToast()

  const [vehicles, setVehicles] = useState([])
  const [ciudades, setCiudades] = useState([])
  const [loading, setLoading] = useState(true)

  const [filterCity, setFilterCity] = useState('Todas')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [search, setSearch] = useState('')

  const [selected, setSelected] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [toDelete, setToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data: v, error: ve }, { data: c }] = await Promise.all([
      supabase.from('vehicles').select('*').order('placa'),
      supabase.from('ciudades').select('nombre').order('nombre'),
    ])
    if (ve) notify('Error cargando flota: ' + ve.message, 'error')
    setVehicles(v || [])
    setCiudades((c || []).map((r) => r.nombre))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => vehicles.filter((v) => {
    const matchCity = filterCity === 'Todas' || v.ciudad === filterCity
    const matchStatus = filterStatus === 'Todos' || v.estado === filterStatus
    const q = search.toLowerCase()
    const matchSearch = !q || v.placa.toLowerCase().includes(q) ||
      (v.cliente || '').toLowerCase().includes(q) || (v.admin_flota || '').toLowerCase().includes(q)
    return matchCity && matchStatus && matchSearch
  }), [vehicles, filterCity, filterStatus, search])

  const stats = useMemo(() => ({
    total: vehicles.length,
    disponibles: vehicles.filter((v) => v.estado === 'Disponible').length,
    asignados: vehicles.filter((v) => v.estado === 'Asignado').length,
    taller: vehicles.filter((v) => v.estado === 'Taller').length,
  }), [vehicles])

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, ciudad: ciudades[0] || '' })
    setIsAdding(true)
  }
  const openEdit = (v) => { setForm({ ...v }); setSelected(v); setIsEditing(true) }
  const closeForm = () => { setIsAdding(false); setIsEditing(false); setSelected(null) }

  const save = async () => {
    if (!form.placa || !form.modelo || !form.ciudad) {
      notify('Placa, modelo y ciudad son obligatorios.', 'error')
      return
    }
    setSaving(true)
    const payload = { ...form, placa: form.placa.toUpperCase() }
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.fecha_estado
    if (isAdding) delete payload.mto_detalle
    const { error } = isAdding
      ? await supabase.from('vehicles').insert(payload)
      : await supabase.from('vehicles').update(payload).eq('id', selected.id)
    setSaving(false)
    if (error) { notify('Error guardando: ' + error.message, 'error'); return }
    notify(isAdding ? 'Vehículo agregado.' : 'Vehículo actualizado.', 'success')
    closeForm()
    load()
  }

  const confirmDelete = async () => {
    const { error } = await supabase.from('vehicles').delete().eq('id', toDelete.id)
    setToDelete(null)
    if (error) { notify('Error eliminando: ' + error.message, 'error'); return }
    notify('Vehículo eliminado.', 'success')
    load()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800">Flota Sustitutos Renting</h1>
          <p className="text-sm text-slate-500">Gestión administrativa y asignación de vehículos.</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg">
            <Icon name="Plus" className="w-4 h-4" /> Nuevo vehículo
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total flota" value={stats.total} tone="text-slate-800" />
        <StatCard label="Disponibles" value={stats.disponibles} tone="text-emerald-600" />
        <StatCard label="Asignados" value={stats.asignados} tone="text-blue-600" />
        <StatCard label="En taller" value={stats.taller} tone="text-red-600" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Icon name="Search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar placa, cliente o admin..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
          <option>Todas</option>
          {ciudades.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
          <option>Todos</option>
          <option>Disponible</option>
          <option>Asignado</option>
          <option>Taller</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Cargando flota...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">Sin vehículos para este filtro.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((v) => {
            const style = STATUS_STYLE[v.estado]
            const overdue = v.estado === 'Asignado' && v.fecha_fin && isExpired(v.fecha_fin)
            return (
              <button key={v.id} onClick={() => openEdit(v)} className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono font-bold text-slate-800">{v.placa}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[180px]" title={v.modelo}>{v.modelo}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>{v.estado}</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon name="MapPin" className="w-3.5 h-3.5" /> {v.ciudad}
                </div>
                {v.estado === 'Asignado' && (
                  <div className="mt-1 text-xs text-slate-500">
                    <span className="font-medium">{v.cliente || 'Cliente sin nombre'}</span>
                    {overdue && <span className="ml-2 text-red-600 font-bold">vencido</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {(isAdding || isEditing) && (
        <Modal title={isAdding ? 'Nuevo vehículo' : `Editar ${form.placa}`} onClose={closeForm} wide>
          <VehicleForm form={form} setForm={setForm} ciudades={ciudades} readOnly={!isAdmin} />
          {isEditing && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <MaintenancePanel
                detalle={form.mto_detalle}
                kmActual={Number(form.km_actual) || 0}
                onChange={(next) => setForm((f) => ({ ...f, mto_detalle: next }))}
                readOnly={!isAdmin}
              />
            </div>
          )}
          {isAdmin && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              {isEditing ? (
                <button onClick={() => setToDelete(selected)} className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1">
                  <Icon name="Trash2" className="w-4 h-4" /> Eliminar
                </button>
              ) : <span />}
              <button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </Modal>
      )}

      {toDelete && (
        <Modal title="Confirmar eliminación" onClose={() => setToDelete(null)}>
          <p className="text-sm text-slate-600">¿Eliminar el vehículo <strong>{toDelete.placa}</strong>? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setToDelete(null)} className="text-sm font-bold px-4 py-2 rounded-lg border border-slate-200">Cancelar</button>
            <button onClick={confirmDelete} className="text-sm font-bold px-4 py-2 rounded-lg bg-red-600 text-white">Eliminar</button>
          </div>
        </Modal>
      )}

      <Toast {...toast} onClose={clear} />
    </div>
  )
}

function Field({ label, children }) {
  return <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}{children}</label>
}
const inputCls = 'w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60'

function VehicleForm({ form, setForm, ciudades, readOnly }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Field label="Placa"><input disabled={readOnly} value={form.placa} onChange={set('placa')} className={inputCls} /></Field>
      <Field label="Modelo"><input disabled={readOnly} value={form.modelo} onChange={set('modelo')} className={inputCls} /></Field>
      <Field label="Ciudad">
        <select disabled={readOnly} value={form.ciudad} onChange={set('ciudad')} className={inputCls}>
          {ciudades.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Estado">
        <select disabled={readOnly} value={form.estado} onChange={set('estado')} className={inputCls}>
          <option>Disponible</option><option>Asignado</option><option>Taller</option>
        </select>
      </Field>
      {form.estado === 'Asignado' && (
        <>
          <Field label="Cliente"><input disabled={readOnly} value={form.cliente || ''} onChange={set('cliente')} className={inputCls} /></Field>
          <Field label="Admin de flota"><input disabled={readOnly} value={form.admin_flota || ''} onChange={set('admin_flota')} className={inputCls} /></Field>
          <Field label="Placa sustituida"><input disabled={readOnly} value={form.placa_sustituida || ''} onChange={set('placa_sustituida')} className={inputCls} /></Field>
          <Field label="Fecha inicio"><input disabled={readOnly} type="date" value={form.fecha_inicio || ''} onChange={set('fecha_inicio')} className={inputCls} /></Field>
          <Field label="Fecha devolución"><input disabled={readOnly} type="date" value={form.fecha_fin || ''} onChange={set('fecha_fin')} className={inputCls} /></Field>
        </>
      )}
      <Field label="Kilometraje actual"><input disabled={readOnly} type="number" value={form.km_actual} onChange={set('km_actual')} className={inputCls} /></Field>
      <Field label="Nivel combustible">
        <select disabled={readOnly} value={form.nivel_combustible} onChange={set('nivel_combustible')} className={inputCls}>
          {['Lleno', '3/4', '1/2', '1/4', 'Reserva'].map((n) => <option key={n}>{n}</option>)}
        </select>
      </Field>
      <Field label="SOAT vence"><input disabled={readOnly} type="date" value={form.soat || ''} onChange={set('soat')} className={inputCls} /></Field>
      <Field label="RTM vence"><input disabled={readOnly} type="date" value={form.rtm || ''} onChange={set('rtm')} className={inputCls} /></Field>
      <div className="sm:col-span-2">
        <Field label="Observaciones"><textarea disabled={readOnly} value={form.observaciones || ''} onChange={set('observaciones')} rows={2} className={inputCls} /></Field>
      </div>
    </div>
  )
}
