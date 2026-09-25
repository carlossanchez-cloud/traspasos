import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { Icon } from '../lib/icons'
import { formatDate, todayISO } from '../lib/format'
import { useToast } from '../lib/useToast'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import SignaturePad from '../components/SignaturePad'
import ActaPhotos from '../components/ActaPhotos'
import Spinner, { ButtonSpinner } from '../components/Spinner'

const CHECK_ITEMS = ['Carrocería', 'Llantas', 'Interior', 'Luces', 'Documentos en el vehículo']
const ESTADOS = ['Bueno', 'Regular', 'Malo']
const ESTADO_COLOR = {
  Bueno: 'bg-emerald-600 text-white border-emerald-600',
  Regular: 'bg-amber-500 text-white border-amber-500',
  Malo: 'bg-red-600 text-white border-red-600',
}

const emptyChecklist = () => Object.fromEntries(CHECK_ITEMS.map((k) => [k, { estado: 'Bueno', obs: '' }]))
const EMPTY = { tipo: 'Entrega', placa: '', fecha: todayISO(), cliente: '', conductor: '', kilometraje: '', nivel_combustible: 'Lleno', observaciones: '' }

const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8MB — fotos de celular normales caben, evita subir cualquier cosa gigante
const isValidImage = (file) => file.type.startsWith('image/') && file.size <= MAX_FILE_BYTES

export default function Actas() {
  const { profile } = useAuth()
  const { toast, notify, clear } = useToast()
  const [placas, setPlacas] = useState([])
  const [actas, setActas] = useState([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [checklist, setChecklist] = useState(emptyChecklist())
  const [fotos, setFotos] = useState([])
  const [firma, setFirma] = useState(null)
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [{ data: v }, { data: a }] = await Promise.all([
      supabase.from('vehicles').select('placa').order('placa'),
      supabase.from('actas').select('*').order('created_at', { ascending: false }).limit(30),
    ])
    setPlacas((v || []).map((r) => r.placa))
    setActas(a || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ ...EMPTY, placa: placas[0] || '' })
    setChecklist(emptyChecklist())
    setFotos([]); setFirma(null)
    setCreating(true)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setCheck = (item, field, value) => setChecklist((c) => ({ ...c, [item]: { ...c[item], [field]: value } }))

  // Bucket 'actas' es privado (fotos de vehiculos/clientes) -> se guarda el PATH, no una URL publica.
  // Para mostrar una foto despues: supabase.storage.from('actas').createSignedUrl(path, 3600).
  const uploadFiles = async (files, prefix) => {
    const paths = []
    for (const file of files) {
      const path = `${prefix}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('actas').upload(path, file)
      if (error) throw error
      paths.push(path)
    }
    return paths
  }

  const guardar = async () => {
    if (!form.placa || !form.cliente) { notify('Placa y cliente son obligatorios.', 'error'); return }
    setSaving(true)
    try {
      const fotos_urls = fotos.length ? await uploadFiles(fotos, `${form.placa}/fotos`) : []
      const firma_url = firma ? (await uploadFiles([firma], `${form.placa}/firma`))[0] : null
      const { error } = await supabase.from('actas').insert({
        ...form, kilometraje: form.kilometraje ? Number(form.kilometraje) : null,
        checklist, fotos_urls, firma_url,
      })
      if (error) throw error
      notify('Acta guardada.', 'success')
      setCreating(false)
      load()
    } catch (err) {
      notify('Error guardando acta: ' + err.message, 'error')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800">Actas de entrega y recibido</h1>
          <p className="text-sm text-slate-500">Registro de estado del vehículo al entregar o recibir.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg">
          <Icon name="Plus" className="w-4 h-4" /> Nueva acta
        </button>
      </div>

      {loading ? (
        <Spinner label="Cargando actas..." />
      ) : actas.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">Sin actas registradas todavía.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {actas.map((a) => (
            <button key={a.id} onClick={() => setViewing(a)} className="text-left bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 hover:shadow-sm transition-all">
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  <span className="font-mono">{a.placa}</span> — {a.tipo} — {a.cliente}
                </p>
                <p className="text-xs text-slate-500">{formatDate(a.fecha)} · {a.conductor || 'sin conductor registrado'} · {a.fotos_urls?.length || 0} foto(s){a.firma_url ? ' · con firma' : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <Modal title="Nueva acta" onClose={() => setCreating(false)} wide>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Tipo">
              <select value={form.tipo} onChange={set('tipo')} className={inputCls}><option>Entrega</option><option>Recibido</option></select>
            </Field>
            <Field label="Placa del vehículo (solo sustitutos registrados)">
              <select value={form.placa} onChange={set('placa')} className={inputCls}>
                {placas.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Cliente"><input value={form.cliente} onChange={set('cliente')} className={inputCls} /></Field>
            <Field label="Conductor"><input value={form.conductor} onChange={set('conductor')} className={inputCls} /></Field>
            <Field label="Fecha"><input type="date" value={form.fecha} onChange={set('fecha')} className={inputCls} /></Field>
            <Field label="Kilometraje"><input type="number" value={form.kilometraje} onChange={set('kilometraje')} className={inputCls} /></Field>
            <Field label="Nivel de combustible">
              <select value={form.nivel_combustible} onChange={set('nivel_combustible')} className={inputCls}>
                {['Lleno', '3/4', '1/2', '1/4', 'Reserva'].map((n) => <option key={n}>{n}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Checklist</p>
            <div className="flex flex-col gap-2">
              {CHECK_ITEMS.map((item) => (
                <div key={item} className="border border-slate-200 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                    <div className="flex gap-1">
                      {ESTADOS.map((e) => (
                        <button key={e} onClick={() => setCheck(item, 'estado', e)}
                          className={`text-xs font-bold px-2 py-1 rounded-md border transition-colors ${checklist[item].estado === e ? ESTADO_COLOR[e] : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  {checklist[item].estado !== 'Bueno' && (
                    <input placeholder="Observación..." value={checklist[item].obs} onChange={(e) => setCheck(item, 'obs', e.target.value)}
                      className="w-full mt-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <Field label="Fotos (4-6, imagen, max 8MB c/u)">
              <input type="file" accept="image/*" multiple onChange={(e) => {
                const files = [...e.target.files]
                const valid = files.filter(isValidImage)
                if (valid.length < files.length) notify('Algunas fotos no son imágenes válidas o pesan más de 8MB — se omitieron.', 'error')
                setFotos(valid)
              }} className="text-xs mt-1" />
            </Field>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Firma del cliente</p>
            <SignaturePad onChange={setFirma} />
          </div>
          <div className="mt-2">
            <Field label="Observaciones generales"><textarea value={form.observaciones} onChange={set('observaciones')} rows={2} className={inputCls} /></Field>
          </div>

          <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
            <button onClick={guardar} disabled={saving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">
              {saving && <ButtonSpinner />}
              {saving ? 'Guardando...' : 'Guardar acta'}
            </button>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal title={`${viewing.placa} — ${viewing.tipo} — ${formatDate(viewing.fecha)}`} onClose={() => setViewing(null)}>
          <ActaPhotos acta={viewing} />
        </Modal>
      )}

      <Toast {...toast} onClose={clear} />
    </div>
  )
}

function Field({ label, children }) { return <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}{children}</label> }
const inputCls = 'w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
