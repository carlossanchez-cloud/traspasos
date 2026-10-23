import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatDate, formatKM } from '../lib/format'
import { useToast } from '../lib/useToast'
import { numActa } from '../lib/ciclosActas'
import { TERMINOS, TERMINOS_TITULO, TERMINOS_ENCABEZADO } from '../lib/terminos'
import Row from '../components/Row'
import ChecklistView from '../components/ChecklistView'
import PhotoPicker from '../components/PhotoPicker'
import Toast from '../components/Toast'
import SignaturePad from '../components/SignaturePad'
import Spinner, { ButtonSpinner } from '../components/Spinner'
import Modal from '../components/Modal'

// Vista publica, SIN login, de un acta (bug/feature "acta cliente"): el cliente entra con
// el enlace que le comparte el gestor (token = id del acta, ver src/lib/shareLink.js),
// ve de solo-lectura lo que el gestor ya lleno y firmo (incluidas las fotos, via las URLs firmadas que el
// gestor dejo en checklist.fotos_publicas al guardar), y agrega su nombre, observaciones, fotos opcionales y
// su firma.
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
  const [confirmando, setConfirmando] = useState(false)
  const [acepta, setAcepta] = useState(false)
  const [verTerminos, setVerTerminos] = useState(false)

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

  // Antes esto enviaba directo al primer clic (bug real: un cliente sin cuenta
  // firmando un documento legal no tenia paso de revision). Ahora "Firmar y enviar"
  // solo valida y abre confirmacion; enviar() (el envio real) corre desde el modal.
  const pedirConfirmacion = () => {
    if (!nombreCliente.trim()) { notify('Escribe tu nombre.', 'error'); return }
    if (!firma) { notify('Falta la firma.', 'error'); return }
    if (TERMINOS.length && !acepta) { notify(`Debes aceptar los ${TERMINOS_TITULO.toLowerCase()} para firmar.`, 'error'); return }
    setConfirmando(true)
  }

  const enviar = async () => {
    setSubmitting(true)
    try {
      const fotos_urls_cliente = fotos.length ? await uploadFiles(fotos, 'foto') : []
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
      // No mostrar el error tecnico crudo a un cliente sin cuenta (bug real,
      // encontrado en la revision) - el detalle queda en consola para soporte.
      console.error('[ActaPublica] error al enviar', err)
      // Se agrega un detalle corto para que el gestor pueda reportarlo (antes solo quedaba en consola y el
      // mensaje culpaba a la conexion aunque el fallo fuera de permisos en la base de datos).
      notify(`No se pudo enviar. Inténtalo de nuevo; si sigue fallando, contacta a tu gestor de flota (detalle: ${err?.message || err}).`, 'error')
    } finally {
      setSubmitting(false)
      setConfirmando(false)
    }
  }

  if (acta === undefined) return <div className="min-h-screen flex items-center justify-center"><Spinner label="Cargando acta..." /></div>

  if (acta === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <img src="/rentandes-logo.png" alt="rentandes" className="h-6 w-auto mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-800 mb-1">Este enlace no es válido</p>
          <p className="text-xs text-slate-500">Pide al administrador de flota que te comparta el enlace del acta nuevamente.</p>
        </div>
      </div>
    )
  }

  const yaFirmada = acta.bloqueada || done

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6">
        <img src="/rentandes-logo.png" alt="rentandes" className="h-6 w-auto mb-4" />
        <h1 className="text-lg font-black text-slate-800">Acta de {acta.tipo.toLowerCase()} — {acta.placa}</h1>
        {acta.consecutivo != null && <p className="text-sm font-bold text-slate-600 font-mono">{numActa(acta)}</p>}
        <p className="text-sm text-slate-500 mb-4">{formatDate(acta.fecha)}</p>

        <Row label="Cliente" value={acta.cliente || '-'} />
        <Row label="Conductor" value={acta.conductor || '-'} />
        <Row label="Kilometraje" value={acta.kilometraje ? formatKM(acta.kilometraje) : '-'} />
        <Row label="Combustible" value={acta.nivel_combustible || '-'} />

        <div className="mt-4">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Checklist del gestor</p>
          <ChecklistView checklist={acta.checklist} />
        </div>
        {acta.observaciones && (
          <p className="text-sm text-slate-600 mt-4"><strong>Observaciones del gestor:</strong> {acta.observaciones}</p>
        )}

        {acta.checklist?.fotos_publicas?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fotos tomadas por el gestor ({acta.checklist.fotos_publicas.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {acta.checklist.fotos_publicas.map((f) => (
                <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="block">
                  <img src={f.url} alt={f.label} className="w-full h-24 object-cover rounded-lg border border-slate-200 bg-slate-100" />
                  <p className="text-[11px] text-slate-600 mt-1 leading-tight">{f.label}</p>
                </a>
              ))}
            </div>
          </div>
        )}
        {acta.checklist?.firma_gestor_publica && (
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Firma del gestor de flota</p>
            <img src={acta.checklist.firma_gestor_publica} alt="Firma del gestor" className="max-h-28 border border-slate-200 rounded-lg bg-white" />
          </div>
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
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fotos adicionales (opcional, max 8MB c/u)</p>
                <PhotoPicker fotos={fotos} onChange={setFotos} onError={(msg) => notify(msg, 'error')} />
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tu firma</p>
                <SignaturePad onChange={setFirma} />
              </div>
              {/* Aceptacion obligatoria: la casilla habilita "Firmar y enviar"; tocar el texto despliega las
                  condiciones del contrato de sustitutos (src/lib/terminos.js). */}
              {TERMINOS.length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-200">
                <div className="flex items-start gap-2.5 p-3">
                  <button type="button" role="checkbox" aria-checked={acepta} onClick={() => setAcepta((a) => !a)}
                    className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center text-white text-xs font-black ${acepta ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300'}`}>
                    {acepta ? '✓' : ''}
                  </button>
                  <p className="text-sm text-slate-700">
                    Acepto los{' '}
                    <button type="button" onClick={() => setVerTerminos((v) => !v)} className="font-bold text-emerald-700 underline">
                      {TERMINOS_TITULO.toLowerCase()}
                    </button>
                  </p>
                </div>
                {verTerminos && (
                  <div className="border-t border-slate-200 bg-slate-50 px-3 py-3 max-h-72 overflow-y-auto text-xs text-slate-700 leading-relaxed flex flex-col gap-2">
                    <p className="font-bold text-slate-800 text-sm">{TERMINOS_TITULO}</p>
                    {TERMINOS_ENCABEZADO && <p className="font-semibold text-slate-800">{TERMINOS_ENCABEZADO}</p>}
                    {TERMINOS.map((t, i) => <p key={i} className="whitespace-pre-line">{t}</p>)}
                  </div>
                )}
              </div>
              )}
              <div className="flex justify-end mt-5">
                <button onClick={pedirConfirmacion} disabled={submitting || (TERMINOS.length > 0 && !acepta)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">
                  {submitting && <ButtonSpinner />}
                  {submitting ? 'Enviando...' : 'Firmar y enviar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {confirmando && (
        <Modal title="Confirmar envío" onClose={() => !submitting && setConfirmando(false)}>
          <p className="text-sm text-slate-600">
            Vas a firmar el acta de {acta.tipo.toLowerCase()} de <strong>{acta.placa}</strong> con tu nombre{fotos.length ? ', tus fotos' : ''} y tu firma.
            Una vez enviada, esta acta queda cerrada y no se puede editar.
          </p>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setConfirmando(false)} disabled={submitting} className="text-sm font-bold px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50">Cancelar</button>
            <button onClick={enviar} disabled={submitting} className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">
              {submitting && <ButtonSpinner />}
              {submitting ? 'Enviando...' : 'Sí, firmar y enviar'}
            </button>
          </div>
        </Modal>
      )}
      <Toast {...toast} onClose={clear} />
    </div>
  )
}

function Field({ label, children }) { return <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}{children}</label> }
const inputCls = 'w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
