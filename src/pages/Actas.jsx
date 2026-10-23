import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { Icon } from '../lib/icons'
import { formatDate, formatKM, todayISO } from '../lib/format'
import { pdfOrientation, waitForImages } from '../lib/pdf'
import { useToast } from '../lib/useToast'
import { CHECK_ITEMS, SUB_ITEMS, ESTADOS, ESTADO_COLOR, emptyChecklist, esNovedad, estadosParte, conResumen, novedadesConFoto, FOTOS_RECORRIDO } from '../lib/actaChecklist'
import { numActa, agruparActas, entregaAbierta } from '../lib/ciclosActas'
import { publicActaUrl, waShareUrl, gmailShareUrl } from '../lib/shareLink'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Row from '../components/Row'
import SignaturePad from '../components/SignaturePad'
import ActaPhotos from '../components/ActaPhotos'
import ChecklistView from '../components/ChecklistView'
import PhotoPicker from '../components/PhotoPicker'
import FotoRecorrido from '../components/FotoRecorrido'
import Spinner, { ButtonSpinner } from '../components/Spinner'

// Las URLs firmadas que ve el cliente en el enlace duran 90 dias.
const LINK_PUBLICO_SEGUNDOS = 90 * 24 * 3600

const EMPTY = { tipo: 'Entrega', placa: '', acta_entrega_id: '', fecha: todayISO(), cliente: '', conductor: '', kilometraje: '', nivel_combustible: 'Lleno', observaciones: '' }

export default function Actas() {
  const { puedeEditar } = useAuth()
  const { toast, notify, clear } = useToast()
  const [placas, setPlacas] = useState([])
  const [actas, setActas] = useState([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [checklist, setChecklist] = useState(emptyChecklist())
  const [fotos, setFotos] = useState([])
  const [fotosRecorrido, setFotosRecorrido] = useState({}) // FOTOS_RECORRIDO key -> File
  const [fotosNovedad, setFotosNovedad] = useState({}) // fotoKey(item, parte) -> File
  const [firma, setFirma] = useState(null)
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [compartiendo, setCompartiendo] = useState(null)
  const [filtro, setFiltro] = useState('pendientes') // pendientes | completas | todas
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const printRef = useRef(null)

  const load = async () => {
    setLoading(true)
    const [{ data: v }, { data: a }] = await Promise.all([
      supabase.from('vehicles').select('placa').order('placa'),
      // Se traen mas actas que antes (30) para poder emparejar cada entrega con su recibido.
      supabase.from('actas').select('*').order('created_at', { ascending: false }).limit(300),
    ])
    setPlacas((v || []).map((r) => r.placa))
    setActas(a || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Al elegir tipo o placa, un Recibido queda apuntando a la entrega abierta de esa placa y toma de ella el
  // cliente y el conductor (se pueden cambiar).
  const conCiclo = (f) => {
    if (f.tipo !== 'Recibido') return { ...f, acta_entrega_id: '' }
    const e = entregaAbierta(actas, f.placa)
    return e ? { ...f, acta_entrega_id: e.id, cliente: f.cliente || e.cliente || '', conductor: f.conductor || e.conductor || '' } : { ...f, acta_entrega_id: '' }
  }
  const openCreate = (preset = {}) => {
    setForm(conCiclo({ ...EMPTY, placa: placas[0] || '', ...preset }))
    setChecklist(emptyChecklist())
    setFotos([]); setFotosRecorrido({}); setFotosNovedad({}); setFirma(null); setExpanded({})
    setCreating(true)
  }

  const set = (k) => (e) => setForm((f) => (k === 'tipo' || k === 'placa' ? conCiclo({ ...f, [k]: e.target.value }) : { ...f, [k]: e.target.value }))
  const setParte = (item, parte, field, value) => setChecklist((c) => ({
    ...c, [item]: { ...c[item], partes: { ...c[item].partes, [parte]: { ...c[item].partes[parte], [field]: value } } },
  }))
  const [expanded, setExpanded] = useState({})

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
    const abierta = entregaAbierta(actas, form.placa)
    if (form.tipo === 'Entrega' && abierta) {
      notify(`La placa ${form.placa} tiene la entrega ${numActa(abierta)} sin acta de recibido. Primero haz el recibido.`, 'error')
      return
    }
    const faltanRecorrido = FOTOS_RECORRIDO.filter((f) => !fotosRecorrido[f.key])
    if (faltanRecorrido.length) {
      notify(`Faltan fotos del recorrido: ${faltanRecorrido.map((f) => f.label).join(', ')}.`, 'error')
      return
    }
    const novedades = novedadesConFoto(checklist)
    const sinFoto = novedades.filter((n) => !fotosNovedad[n.key])
    if (sinFoto.length) {
      notify(`Falta la foto de: ${sinFoto.map((n) => n.parte).join(', ')}.`, 'error')
      return
    }
    if (!firma) { notify('Falta la firma del gestor de flota.', 'error'); return }
    setSaving(true)
    try {
      // Las del recorrido van primero en fotos_urls (asi el conteo y la galeria las incluyen) y ademas
      // quedan en checklist.fotos_recorrido con su nombre, para mostrarlas rotuladas en el detalle.
      const fotos_recorrido = {}
      for (const f of FOTOS_RECORRIDO) fotos_recorrido[f.key] = (await uploadFiles([fotosRecorrido[f.key]], `${form.placa}/recorrido`))[0]
      const adicionales = fotos.length ? await uploadFiles(fotos, `${form.placa}/fotos`) : []
      const fotos_urls = [...Object.values(fotos_recorrido), ...adicionales]
      const firma_url = firma ? (await uploadFiles([firma], `${form.placa}/firma`))[0] : null
      // Cada foto de novedad se guarda dentro de su parte (partes[parte].foto = path en storage).
      const conFotos = structuredClone(checklist)
      for (const n of novedades) {
        conFotos[n.item].partes[n.parte].foto = (await uploadFiles([fotosNovedad[n.key]], `${form.placa}/novedades`))[0]
      }
      // El cliente abre el enlace sin sesion y no puede leer el bucket privado: se le dejan URLs firmadas
      // (generadas aqui, por el gestor que si tiene acceso) de las fotos y de la firma del gestor.
      const publicas = [
        ...FOTOS_RECORRIDO.map((f) => ({ label: f.label, path: fotos_recorrido[f.key] })),
        ...novedades.map((n) => ({ label: `${n.parte} — ${n.estado}${n.obs ? `: ${n.obs}` : ''}`, path: conFotos[n.item].partes[n.parte].foto })),
        ...adicionales.map((path, i) => ({ label: `Foto adicional ${i + 1}`, path })),
      ]
      const { data: firmadas, error: errFirmadas } = await supabase.storage.from('actas')
        .createSignedUrls([...publicas.map((p) => p.path), firma_url], LINK_PUBLICO_SEGUNDOS)
      if (errFirmadas) throw errFirmadas
      const fotos_publicas = publicas.map((p, i) => ({ label: p.label, url: firmadas[i].signedUrl }))
      const firma_gestor_publica = firmadas[publicas.length].signedUrl
      const { acta_entrega_id, ...datos } = form
      const entregaId = form.tipo === 'Recibido' ? acta_entrega_id || null : null
      const fila = {
        ...datos, kilometraje: form.kilometraje ? Number(form.kilometraje) : null,
        // La entrega que cierra un Recibido tambien queda en el checklist: asi el ciclo se ve aunque el
        // proyecto de Supabase todavia no tenga la columna acta_entrega_id (paso SQL 21), y ese paso la
        // copia a la columna al correrlo. El consecutivo lo pone la base de datos.
        checklist: { ...conResumen(conFotos), fotos_recorrido, fotos_publicas, firma_gestor_publica, ...(entregaId ? { acta_entrega_id: entregaId } : {}) },
        fotos_urls, firma_url,
      }
      let { error } = await supabase.from('actas').insert(form.tipo === 'Recibido' ? { ...fila, acta_entrega_id: entregaId } : fila)
      if (error && form.tipo === 'Recibido' && /acta_entrega_id/.test(error.message)) {
        ;({ error } = await supabase.from('actas').insert(fila))
      }
      if (error) throw error
      notify('Acta guardada. Ya puedes enviarla al cliente para su firma.', 'success')
      setCreating(false)
      load()
    } catch (err) {
      notify('Error guardando acta: ' + err.message, 'error')
    }
    setSaving(false)
  }

  const downloadPDF = async () => {
    setExporting(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ])
      await waitForImages(printRef.current)
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: pdfOrientation(canvas.width, canvas.height), unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST')
      pdf.save(`Acta_${viewing.placa}_${viewing.fecha}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800">Actas de entrega y recibido</h1>
          <p className="text-sm text-slate-500">Registro de estado del vehículo al entregar o recibir.</p>
        </div>
        {puedeEditar && (
          <button onClick={() => openCreate()} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg">
            <Icon name="Plus" className="w-4 h-4" /> Nueva acta
          </button>
        )}
      </div>

      {loading ? (
        <Spinner label="Cargando actas..." />
      ) : actas.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">Sin actas registradas todavía.</p>
      ) : (
        <ListaCiclos actas={actas} filtro={filtro} setFiltro={setFiltro}
          onVer={setViewing} onEnviar={puedeEditar ? setCompartiendo : null}
          onRecibir={puedeEditar ? (e) => openCreate({ tipo: 'Recibido', placa: e.placa }) : null} />
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
            <AvisoCiclo form={form} abierta={entregaAbierta(actas, form.placa)} />
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
            <div className="flex flex-col gap-3">
              {CHECK_ITEMS.map((item) => {
                const partes = SUB_ITEMS[item]
                const malas = partes.filter((p) => esNovedad(checklist[item].partes[p].estado)).length
                const abierto = expanded[item]
                const toggle = () => setExpanded((x) => ({ ...x, [item]: !x[item] }))
                return (
                  // Cada item es un bloque: encabezado gris y sus partes en un fondo gris mas claro, para
                  // que con todo desplegado se distinga donde termina un grupo y empieza el siguiente.
                  // El estado del grupo no se elige aqui: se resume de sus partes al guardar (conResumen).
                  <div key={item} className={`rounded-lg border overflow-hidden ${abierto ? 'border-slate-400 shadow-sm' : 'border-slate-300'}`}>
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-200">
                      <button type="button" onClick={toggle} className="flex items-center gap-2 text-sm font-semibold text-slate-800 text-left">
                        {item}
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${malas ? 'bg-amber-100 text-amber-800' : 'bg-white/70 text-slate-500'}`}>
                          {malas ? `${malas} con novedad` : `${partes.length} partes`}
                        </span>
                      </button>
                      <button type="button" onClick={toggle}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-md border shrink-0 transition-colors ${abierto ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                        {abierto ? 'Cerrar' : 'Detalle'}
                        <span className={`text-[10px] transition-transform ${abierto ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                    </div>
                    {abierto && (
                      <div className="bg-slate-100 border-t border-slate-300 px-3 py-1 divide-y divide-slate-300/60">
                        {partes.map((p) => (
                          <div key={p} className="py-1.5">
                            <EstadoInput label={p} estados={estadosParte(item)} entry={checklist[item].partes[p]}
                              onChange={(field, value) => setParte(item, p, field, value)} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fotos del recorrido (obligatorias)</p>
            <FotoRecorrido fotos={fotosRecorrido} setFotos={setFotosRecorrido} onError={(msg) => notify(msg, 'error')} />
          </div>

          {novedadesConFoto(checklist).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fotos de las novedades (obligatorias)</p>
              <div className="flex flex-col gap-2">
                {novedadesConFoto(checklist).map((n) => {
                  const file = fotosNovedad[n.key]
                  return (
                    <div key={n.key} className={`rounded-lg border p-3 ${file ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
                      <p className="text-sm text-slate-800 mb-2">
                        {file ? '✓ ' : ''}Por favor, toma una foto de <strong>{n.parte}</strong>
                        <span className="text-slate-500"> ({n.item})</span>
                        {n.obs ? <>, que presenta: <strong>{n.obs}</strong></> : <>, marcado como <strong>{n.estado}</strong></>}.
                      </p>
                      <PhotoPicker single fotos={file ? [file] : []}
                        onChange={(fs) => setFotosNovedad((m) => ({ ...m, [n.key]: fs[0] }))}
                        onError={(msg) => notify(msg, 'error')} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fotos adicionales (opcional, max 8MB c/u)</p>
            <PhotoPicker fotos={fotos} onChange={setFotos} onError={(msg) => notify(msg, 'error')} />
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Firma del gestor de flota</p>
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
        <Modal title={`${numActa(viewing)} — ${viewing.placa} — ${viewing.tipo} — ${formatDate(viewing.fecha)}`} onClose={() => setViewing(null)}>
          <div ref={printRef} className="bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${viewing.bloqueada ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {viewing.bloqueada ? 'Firmada por el cliente' : 'Pendiente de firma del cliente'}
              </span>
            </div>
            <Row label="Cliente" value={viewing.cliente} />
            <Row label="Conductor" value={viewing.conductor || '-'} />
            <Row label="Kilometraje" value={viewing.kilometraje ? formatKM(viewing.kilometraje) : '-'} />
            <Row label="Combustible" value={viewing.nivel_combustible} />
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Checklist</p>
              <ChecklistView checklist={viewing.checklist} />
            </div>
            {viewing.observaciones && (
              <p className="text-sm text-slate-600 mt-4"><strong>Observaciones del gestor:</strong> {viewing.observaciones}</p>
            )}
            {viewing.bloqueada && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Firmado por el cliente</p>
                <Row label="Nombre" value={viewing.nombre_cliente || '-'} />
                {viewing.observaciones_cliente && <p className="text-sm text-slate-600 mt-1">{viewing.observaciones_cliente}</p>}
              </div>
            )}
            <div className="mt-4">
              <ActaPhotos acta={viewing} />
            </div>
          </div>

          {!viewing.bloqueada && puedeEditar && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <EnviarFirma acta={viewing} notify={notify} />
            </div>
          )}

          <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
            <button onClick={downloadPDF} disabled={exporting} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50">
              {exporting ? <ButtonSpinner /> : <Icon name="Download" className="w-4 h-4" />}
              {exporting ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>
        </Modal>
      )}

      {compartiendo && (
        <Modal title={`Enviar para firma — ${numActa(compartiendo)} — ${compartiendo.placa}`} onClose={() => setCompartiendo(null)}>
          <EnviarFirma acta={compartiendo} notify={notify} />
        </Modal>
      )}

      <Toast {...toast} onClose={clear} />
    </div>
  )
}

// Lo que se le dice al gestor sobre el ciclo al elegir tipo y placa (la base de datos lo vuelve a validar).
function AvisoCiclo({ form, abierta }) {
  if (form.tipo === 'Entrega' && abierta) {
    return (
      <p className="sm:col-span-2 text-xs rounded-lg px-3 py-2 bg-red-50 text-red-700 border border-red-200">
        Esta placa tiene la entrega <strong>{numActa(abierta)}</strong> del {formatDate(abierta.fecha)} ({abierta.cliente}) sin acta de
        recibido. No se puede entregar de nuevo hasta recibirla: cambia el tipo a Recibido.
      </p>
    )
  }
  if (form.tipo === 'Recibido') {
    return abierta ? (
      <p className="sm:col-span-2 text-xs rounded-lg px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
        Este recibido cierra la entrega <strong>{numActa(abierta)}</strong> del {formatDate(abierta.fecha)} ({abierta.cliente}).
      </p>
    ) : (
      <p className="sm:col-span-2 text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200">
        Esta placa no tiene una entrega abierta en la app. El recibido quedará sin acta de entrega (vehículo entregado antes de usar la app).
      </p>
    )
  }
  return null
}

// Actas agrupadas por ciclo: cada Entrega con su Recibido debajo (o el aviso de que falta), y aparte los
// Recibido que no tienen Entrega en la app.
function ListaCiclos({ actas, filtro, setFiltro, onVer, onEnviar, onRecibir }) {
  const { ciclos, sueltas } = agruparActas(actas)
  const pendientes = ciclos.filter((c) => !c.recibido)
  const completas = ciclos.filter((c) => c.recibido)
  const visibles = filtro === 'pendientes' ? pendientes : filtro === 'completas' ? completas : ciclos
  const tab = (key, label, n) => (
    <button onClick={() => setFiltro(key)}
      className={`text-xs font-bold px-3 py-1.5 rounded-full border ${filtro === key ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>
      {label} ({n})
    </button>
  )
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tab('pendientes', 'Pendientes por recibir', pendientes.length)}
        {tab('completas', 'Entrega y recibido listos', completas.length)}
        {tab('todas', 'Todas', ciclos.length)}
      </div>
      {visibles.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No hay actas en este grupo.</p>}
      <div className="flex flex-col gap-3">
        {visibles.map(({ entrega, recibido }) => (
          <div key={entrega.id} className={`bg-white border rounded-xl overflow-hidden ${recibido ? 'border-emerald-200' : 'border-amber-200'}`}>
            <div className={`flex items-center justify-between px-4 py-2 text-xs font-bold ${recibido ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
              <span className="font-mono text-sm">{entrega.placa}</span>
              <span>{recibido ? '✓ Entrega y recibido listos' : 'Pendiente de acta de recibido'}</span>
            </div>
            <FilaActa acta={entrega} onVer={onVer} onEnviar={onEnviar} />
            {recibido ? (
              <div className="border-t border-slate-100"><FilaActa acta={recibido} onVer={onVer} onEnviar={onEnviar} /></div>
            ) : onRecibir && (
              <div className="border-t border-slate-100 px-4 py-3 flex justify-end">
                <button onClick={() => onRecibir(entrega)}
                  className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
                  + Crear acta de recibido
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {filtro === 'todas' && sueltas.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Recibidos sin acta de entrega en la app ({sueltas.length})</p>
          <div className="flex flex-col gap-2">
            {sueltas.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden"><FilaActa acta={r} onVer={onVer} onEnviar={onEnviar} conPlaca /></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FilaActa({ acta, onVer, onEnviar, conPlaca }) {
  return (
    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <button onClick={() => onVer(acta)} className="text-left flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-sm">
          <span className="font-mono">{numActa(acta)}</span> · {acta.tipo}{conPlaca ? <> · <span className="font-mono">{acta.placa}</span></> : null} · {acta.cliente}
        </p>
        <p className="text-xs text-slate-500">{formatDate(acta.fecha)} · {acta.conductor || 'sin conductor registrado'} · {acta.fotos_urls?.length || 0} foto(s)</p>
      </button>
      {acta.bloqueada ? (
        <button onClick={() => onVer(acta)}
          className="shrink-0 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
          ✓ Firmada por el cliente
        </button>
      ) : onEnviar ? (
        <button onClick={() => onEnviar(acta)}
          className="shrink-0 text-xs font-bold px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white">
          Enviar para firma del cliente
        </button>
      ) : (
        // Lector: ve el estado, pero no puede enviar el enlace.
        <span className="shrink-0 text-xs font-bold px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          Pendiente de firma del cliente
        </span>
      )}
    </div>
  )
}

// Enlace para que el cliente firme: lo abre sin iniciar sesion, ve el acta y las fotos sin poder
// editarlas, y solo agrega su nombre, observaciones, fotos opcionales y su firma.
function EnviarFirma({ acta, notify }) {
  const url = publicActaUrl(acta.id)
  const texto = `Acta de ${acta.tipo.toLowerCase()} de ${acta.placa}, por favor revisa y firma:`
  const btn = 'flex-1 text-center text-sm font-bold px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Enviar para firma del cliente</p>
      <p className="text-xs text-slate-500 mb-3">
        El cliente abre este enlace sin iniciar sesión, ve el acta con todas las fotos (sin poder editarla) y solo
        agrega su nombre, observaciones, fotos si quiere, y su firma.
      </p>
      <div className="flex flex-wrap gap-2">
        <a href={waShareUrl(url, texto)} target="_blank" rel="noreferrer" className={btn}>WhatsApp</a>
        <a href={gmailShareUrl(url, `Acta ${acta.placa}`, texto)} target="_blank" rel="noreferrer" className={btn}>Gmail</a>
        <button className={btn} onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            notify('Enlace copiado.', 'success')
          } catch {
            notify('No se pudo copiar automáticamente: ' + url, 'error')
          }
        }}>Copiar enlace</button>
      </div>
    </div>
  )
}

function Field({ label, children }) { return <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}{children}</label> }
const inputCls = 'w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

function EstadoInput({ label, entry, onChange, estados = ESTADOS }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-700">{label}</span>
        <div className="flex flex-wrap justify-end gap-1">
          {estados.map((e) => (
            <button key={e} type="button" onClick={() => onChange('estado', e)}
              className={`text-xs font-bold px-2 py-1 rounded-md border transition-colors ${entry.estado === e ? ESTADO_COLOR[e] : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      {esNovedad(entry.estado) && (
        <input placeholder="Observación..." value={entry.obs} onChange={(e) => onChange('obs', e.target.value)}
          className="w-full mt-2 px-2 py-1.5 bg-white border border-slate-200 rounded text-xs" />
      )}
    </div>
  )
}
