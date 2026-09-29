import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatDate, formatKM } from '../lib/format'
import { CHECK_ITEMS, ESTADO_COLOR, isValidImage } from '../lib/actaChecklist'
import { useToast } from '../lib/useToast'
import Row from '../components/Row'
import Toast from '../components/Toast'
import SignaturePad from '../components/SignaturePad'
import Spinner, { ButtonSpinner } from '../components/Spinner'

// Vista publica, SIN login, de un acta (bug/feature "acta cliente"): el cliente entra con
// el enlace que le comparte el gestor (token = id del acta, ver src/lib/shareLink.js),
// ve de solo-lectura lo que el gestor ya lleno, y agrega su nombre/observaciones/fotos/firma.
// Vive fuera del <Gate> de App.jsx a proposito: no requiere sesion de Google.
export default function ActaPublica() {
  const { token } = useParams()
  const { toast, notify, clear } = useToast()
  const [acta, setActa] = useState(undefined) // undefined = cargando, null = no encontrada
  const [nombreCliente, setNombreCliente] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [fotos, setFotos] = useState([])
  const [firma, setFirma] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.rpc('get_acta_publica', { p_token: token }).then(({ data, error }) => {
      if (error || !data || data.length === 0) { setActa(null); return }
      setActa(data[0])
    })
  }, [token])

  const uploadFiles = async (files, prefix) => {
    const paths = []
    for (const file of files) {
      const path = `publicas/${token}/${prefix}-${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('actas').upload(path, file)
      if (error) throw error
      paths.push(path)
    }
    return paths
  }

  const enviar = async () => {
    if (!nombreCliente.trim()) { notify('Escribe tu nombre.', 'error'); return }
    if (fotos.length === 0) { notify('Sube al menos una foto de evidencia.', 'error'); return }
    if (!firma) { notify('Falta la firma.', 'error'); return }
    setSubmitting(true)
    try {
      const fotos_urls_cliente = await uploadFiles(fotos, 'foto')
      const [firma_url] = await uploadFiles([firma], 'firma')
      const { error } = await supabase.rpc('submit_acta_publica', {
        p_token: token,
        p_nombre_cliente: nombreCliente.trim(),
        p_observaciones_cliente: observaciones,
        p_fotos_urls_cliente: fotos_urls_cliente,
        p_firma_url: firma_url,
      })
      if (error) throw error
      setDone(true)
    } catch (err) {
      notify('Error enviando: ' + err.message, 'error')
    }
    setSubmitting(false)
  }

  if (acta === undefined) return <div className="min-h-screen flex items-center justify-center"><Spinner label="Cargando acta..." /></div>

  if (acta === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-slate-500 text-center max-w-sm">Este enlace no es válido. Pide al administrador de flota que te comparta el enlace del acta nuevamente.</p>
      </div>
    )
  }

  const yaFirmada = acta.bloqueada || done

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6">
        <img src="/rentandes-logo.png" alt="rentandes" className="h-6 w-auto mb-4" />
        <h1 className="text-lg font-black text-slate-800">Acta de {acta.tipo.toLowerCase()} — {acta.placa}</h1>
        <p className="text-sm text-slate-500 mb-4">{formatDate(acta.fecha)}</p>

        <Row label="Cliente" value={acta.cliente || '-'} />
        <Row label="Conductor" value={acta.conductor || '-'} />
        <Row label="Kilometraje" value={acta.kilometraje ? formatKM(acta.kilometraje) : '-'} />
        <Row label="Combustible" value={acta.nivel_combustible || '-'} />

        <div className="mt-4">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Checklist del gestor</p>
          <div className="flex flex-col gap-1.5">
            {CHECK_ITEMS.map((item) => {
              const c = acta.checklist?.[item]
              if (!c) return null
              return (
                <div key={item} className="flex items-center justify-between text-sm border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">{item}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ESTADO_COLOR[c.estado]}`}>
                    {c.estado}{c.obs ? ` — ${c.obs}` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        {acta.observaciones && (
          <p className="text-sm text-slate-600 mt-4"><strong>Observaciones del gestor:</strong> {acta.observaciones}</p>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100">
          {yaFirmada ? (
            <div className="text-center py-6">
              <p className="font-bold text-emerald-700">Este acta ya fue firmada. ¡Gracias{acta.nombre_cliente ? `, ${acta.nombre_cliente}` : ''}!</p>
              <p className="text-sm text-slate-500 mt-1">No se necesitan más acciones.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tu confirmación</p>
              <Field label="Tu nombre completo">
                <input value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} className={inputCls} />
              </Field>
              <div className="mt-2">
                <Field label="Observaciones (ej. golpe en la puerta)">
                  <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className={inputCls} />
                </Field>
              </div>
              <div className="mt-2">
                <Field label="Fotos de evidencia (imagen, max 8MB c/u)">
                  <input type="file" accept="image/*" multiple onChange={(e) => {
                    const files = [...e.target.files]
                    const valid = files.filter(isValidImage)
                    if (valid.length < files.length) notify('Algunas fotos no son imágenes válidas o pesan más de 8MB — se omitieron.', 'error')
                    setFotos(valid)
                  }} className="text-xs mt-1" />
                </Field>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tu firma</p>
                <SignaturePad onChange={setFirma} />
              </div>
              <div className="flex justify-end mt-5">
                <button onClick={enviar} disabled={submitting} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">
                  {submitting && <ButtonSpinner />}
                  {submitting ? 'Enviando...' : 'Firmar y enviar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Toast {...toast} onClose={clear} />
    </div>
  )
}

function Field({ label, children }) { return <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}{children}</label> }
const inputCls = 'w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
