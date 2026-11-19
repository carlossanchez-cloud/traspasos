import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { formatDate } from '../lib/format'
import { conResumen, ESTADO_COLOR } from '../lib/actaChecklist'
import { novedadesActa } from '../lib/recepcion'
import { checklistDesde, textoEstadoActual, diferenciasChecklist, fotosDeActa, actaMasReciente } from '../lib/estadoActual'
import { numActa, tipoActa, tipoActaFrase } from '../lib/ciclosActas'
import { waTextUrl, gmailTextUrl } from '../lib/shareLink'
import { Icon } from '../lib/icons'
import ChecklistView from './ChecklistView'
import ChecklistEditor from './ChecklistEditor'
import PhotoPicker from './PhotoPicker'
import Modal from './Modal'
import Spinner, { ButtonSpinner } from './Spinner'

// "Fotos y estado actual" de la Ficha (paso SQL 31): como esta el vehiculo hoy, el punto de partida para
// entregarlo. Fotos y el mismo checklist del acta de entrega. Solo el Administrador general lo actualiza; cada
// actualizacion es una version nueva y las anteriores quedan en el historial.
export default function EstadoActualVehiculo({ vehiculo, notify }) {
  const { isAdmin, profile } = useAuth()
  const [versiones, setVersiones] = useState(null) // null = cargando
  const [faltaSql, setFaltaSql] = useState(false)
  const [vista, setVista] = useState(0) // indice de la version que se ve (0 = actual)
  const [urls, setUrls] = useState({}) // path -> signed url
  const [editando, setEditando] = useState(null)
  const [actas, setActas] = useState([])
  const [descartada, setDescartada] = useState(() => { try { return localStorage.getItem(`estado-descartado-${vehiculo.placa}`) } catch { return null } })
  const [comparando, setComparando] = useState(null) // { acta, fotos: Set, conservar, guardando }

  const cargar = async () => {
    const { data, error } = await supabase.from('vehiculo_estados').select('*')
      .eq('placa', vehiculo.placa).order('created_at', { ascending: false }).limit(30)
    if (error) {
      setFaltaSql(/vehiculo_estados|schema cache|does not exist/i.test(error.message))
      setVersiones([])
      return
    }
    setVersiones(data || [])
    setVista(0)
    const { data: a } = await supabase.from('actas').select('*').eq('placa', vehiculo.placa)
      .order('created_at', { ascending: false }).limit(10)
    setActas(a || [])
  }
  useEffect(() => { cargar() }, [vehiculo.placa]) // eslint-disable-line react-hooks/exhaustive-deps

  const version = versiones?.[vista] || null
  const firmar = (paths) => {
    const faltan = paths.filter((p) => !urls[p])
    if (!faltan.length) return
    Promise.all(faltan.map((p) => supabase.storage.from('actas').createSignedUrl(p, 3600)))
      .then((rs) => setUrls((u) => ({ ...u, ...Object.fromEntries(faltan.map((p, i) => [p, rs[i].data?.signedUrl]).filter(([, url]) => url)) })))
  }
  useEffect(() => { firmar(version?.fotos || []) }, [version]) // eslint-disable-line react-hooks/exhaustive-deps

  // Acta mas nueva que el estado actual (p. ej. el recibido de un prestamo): se ofrece para actualizarlo.
  const candidata = versiones && !faltaSql ? actaMasReciente(actas, versiones[0]) : null
  const ofrecer = isAdmin && candidata && candidata.id !== descartada
  const abrirComparacion = () => {
    const fotos = fotosDeActa(candidata)
    firmar([...fotos, ...(versiones[0]?.fotos || [])])
    setComparando({ acta: candidata, fotos: new Set(fotos), conservar: false, guardando: false })
  }
  const descartar = () => {
    try { localStorage.setItem(`estado-descartado-${vehiculo.placa}`, candidata.id) } catch { /* sin almacenamiento: se vuelve a ofrecer */ }
    setDescartada(candidata.id)
    setComparando(null)
  }
  const actualizarDesdeActa = async () => {
    setComparando((c) => ({ ...c, guardando: true }))
    const anterior = versiones[0]
    const fotos = [...(comparando.conservar ? anterior?.fotos || [] : []), ...comparando.fotos]
    const { error } = await supabase.from('vehiculo_estados').insert({
      placa: vehiculo.placa,
      checklist: conResumen(checklistDesde(comparando.acta.checklist)),
      fotos: [...new Set(fotos)],
      observaciones: [anterior?.observaciones, `Actualizado desde el acta ${tipoActaFrase(comparando.acta)} ${numActa(comparando.acta)}.`].filter(Boolean).join(' '),
      creado_por_email: profile?.email || null,
    })
    if (error) {
      notify('No se pudo actualizar: ' + error.message, 'error')
      setComparando((c) => ({ ...c, guardando: false }))
      return
    }
    notify('Estado actual actualizado con el acta.', 'success')
    setComparando(null)
    cargar()
  }

  const abrirEdicion = () => setEditando({
    checklist: checklistDesde(versiones?.[0]?.checklist),
    fotos: versiones?.[0]?.fotos || [],
    nuevas: [],
    observaciones: versiones?.[0]?.observaciones || '',
    expanded: {},
    guardando: false,
  })

  const guardar = async () => {
    setEditando((e) => ({ ...e, guardando: true }))
    try {
      const subidas = []
      for (const file of editando.nuevas) {
        const path = `vehiculos/${vehiculo.placa}/${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from('actas').upload(path, file)
        if (error) throw error
        subidas.push(path)
      }
      const { error } = await supabase.from('vehiculo_estados').insert({
        placa: vehiculo.placa,
        checklist: conResumen(editando.checklist),
        fotos: [...editando.fotos, ...subidas],
        observaciones: editando.observaciones.trim() || null,
        creado_por_email: profile?.email || null,
      })
      if (error) throw error
      notify('Estado actual guardado.', 'success')
      setEditando(null)
      cargar()
    } catch (err) {
      const falta = /vehiculo_estados|schema cache|does not exist/i.test(err.message || '')
      notify(falta ? 'Falta un ajuste en la base de datos (paso SQL 31, pendiente de Carlos).' : 'No se pudo guardar: ' + err.message, 'error')
      setEditando((e) => ({ ...e, guardando: false }))
    }
  }

  const setParte = (item, parte, campo, valor) => setEditando((e) => ({
    ...e,
    checklist: { ...e.checklist, [item]: { ...e.checklist[item], partes: { ...e.checklist[item].partes, [parte]: { ...e.checklist[item].partes[parte], [campo]: valor } } } },
  }))

  const novedades = version ? novedadesActa(version.checklist) : []
  const texto = version ? textoEstadoActual(vehiculo, version) : ''
  const btn = 'flex-1 text-center text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase">Fotos y estado actual</p>
        {isAdmin && !faltaSql && versiones && (
          <button onClick={abrirEdicion} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
            <Icon name={versiones.length ? 'Pencil' : 'Plus'} className="w-3.5 h-3.5" /> {versiones.length ? 'Actualizar estado actual' : 'Registrar estado actual'}
          </button>
        )}
      </div>

      {ofrecer && (
        <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-sm text-sky-900">
            Hay un acta más reciente que el estado actual: <strong>{tipoActa(candidata)} {numActa(candidata)}</strong> del {formatDate(candidata.fecha)}.
            ¿Quieres actualizar el estado actual con ella?
          </p>
          <div className="flex gap-2 shrink-0">
            <button onClick={descartar} className="text-xs font-bold px-3 py-2 rounded-lg border border-sky-300 bg-white text-sky-800">Ahora no</button>
            <button onClick={abrirComparacion} className="text-xs font-bold px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white">Ver diferencias</button>
          </div>
        </div>
      )}

      {versiones === null ? (
        <Spinner label="Cargando estado actual..." className="py-4" />
      ) : faltaSql ? (
        <p className="text-sm text-slate-500">Falta un ajuste en la base de datos (paso SQL 31, pendiente de Carlos).</p>
      ) : !version ? (
        <p className="text-sm text-slate-400">
          Todavía no se ha registrado el estado actual de este vehículo{isAdmin ? ': regístralo con fotos y el checklist para tener el punto de partida antes de entregarlo.' : '.'}
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-3">
            {vista === 0 ? 'Actualizado' : <strong className="text-amber-700">Versión anterior, del</strong>} el {formatDate(version.created_at.slice(0, 10))}
            {version.creado_por_email ? ` por ${version.creado_por_email}` : ''}
            {vista > 0 && <button onClick={() => setVista(0)} className="ml-2 font-bold text-emerald-700 underline">Ver el actual</button>}
          </p>

          {version.fotos?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {version.fotos.map((p) => (
                <a key={p} href={urls[p]} target="_blank" rel="noreferrer" className="block">
                  {urls[p]
                    ? <img src={urls[p]} alt="Foto del vehículo" className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200" />
                    : <div className="w-full aspect-[4/3] rounded-lg bg-slate-100 animate-pulse" />}
                </a>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400 mb-3">Sin fotos.</p>}

          <div className={`rounded-xl border px-4 py-3 ${novedades.length ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            {novedades.length === 0 ? (
              <p className="text-sm text-emerald-800"><strong>Sin novedades:</strong> todo el checklist está en buen estado.</p>
            ) : (
              <>
                <p className="text-sm font-bold text-amber-800 mb-1">Detalles que tiene hoy ({novedades.length})</p>
                <ul className="flex flex-col gap-1">
                  {novedades.map((n) => (
                    <li key={`${n.item}|${n.parte}`} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${ESTADO_COLOR[n.estado] || ''}`}>{n.estado}</span>
                      {n.item} › {n.parte}{n.obs ? ` — ${n.obs}` : ''}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {version.observaciones && <p className="text-xs text-slate-600 mt-2">Observaciones: {version.observaciones}</p>}
          </div>

          <details className="mt-2">
            <summary className="text-xs font-bold text-slate-500 cursor-pointer">Ver checklist completo</summary>
            <div className="mt-2"><ChecklistView checklist={version.checklist} /></div>
          </details>

          <p className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Avisar los detalles al cliente</p>
          <div className="flex gap-2">
            <a href={waTextUrl(texto)} target="_blank" rel="noreferrer" className={btn}>WhatsApp</a>
            <a href={gmailTextUrl(`Estado actual del vehículo ${vehiculo.placa} — Rentandes`, texto)} target="_blank" rel="noreferrer" className={btn}>Gmail</a>
          </div>

          {versiones.length > 1 && (
            <details className="mt-4">
              <summary className="text-xs font-bold text-slate-500 cursor-pointer">Historial ({versiones.length - 1} versiones anteriores)</summary>
              <ul className="mt-2 flex flex-col gap-1">
                {versiones.slice(1).map((v, i) => (
                  <li key={v.id}>
                    <button onClick={() => setVista(i + 1)} className={`text-xs ${vista === i + 1 ? 'font-bold text-slate-800' : 'text-emerald-700 underline'}`}>
                      {formatDate(v.created_at.slice(0, 10))}{v.creado_por_email ? ` · ${v.creado_por_email}` : ''} · {novedadesActa(v.checklist).length} novedad(es) · {v.fotos?.length || 0} foto(s)
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {comparando && (
        <Modal title={`Actualizar con ${tipoActaFrase(comparando.acta)} ${numActa(comparando.acta)}`} onClose={() => !comparando.guardando && setComparando(null)} wide>
          {(() => {
            const cambios = diferenciasChecklist(versiones[0]?.checklist, comparando.acta.checklist)
            const fotosActa = fotosDeActa(comparando.acta)
            const badge = (e) => <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${ESTADO_COLOR[e.estado] || ''}`}>{e.estado}</span>
            return (
              <>
                <p className="text-sm text-slate-500 mb-3">
                  Acta del {formatDate(comparando.acta.fecha)}{comparando.acta.cliente ? ` (${comparando.acta.cliente})` : ''} frente al estado actual
                  {versiones[0] ? ` del ${formatDate(versiones[0].created_at.slice(0, 10))}` : ' (todavía no hay)'}.
                </p>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Diferencias en el checklist ({cambios.length})</p>
                {cambios.length === 0 ? (
                  <p className="text-sm text-emerald-700 mb-3">El checklist del acta es igual al estado actual.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5 mb-3">
                    {cambios.map((c) => (
                      <li key={`${c.item}|${c.parte}`} className="text-sm text-slate-700 flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold">{c.item} › {c.parte}:</span>
                        {badge(c.antes)}{c.antes.obs ? <span className="text-xs text-slate-500">{c.antes.obs}</span> : null}
                        <span className="text-slate-400">→</span>
                        {badge(c.despues)}{c.despues.obs ? <span className="text-xs text-slate-500">{c.despues.obs}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Fotos del acta: marca las que quedan en el estado actual</p>
                {fotosActa.length === 0 ? <p className="text-sm text-slate-400">El acta no tiene fotos.</p> : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {fotosActa.map((p) => {
                      const on = comparando.fotos.has(p)
                      const toggle = () => setComparando((c) => { const f = new Set(c.fotos); if (f.has(p)) f.delete(p); else f.add(p); return { ...c, fotos: f } })
                      return (
                        <button key={p} type="button" onClick={toggle} className={`relative rounded-lg overflow-hidden border-2 ${on ? 'border-emerald-500' : 'border-transparent opacity-50'}`}>
                          {urls[p] ? <img src={urls[p]} alt="Foto del acta" className="w-full aspect-[4/3] object-cover" /> : <div className="w-full aspect-[4/3] bg-slate-100" />}
                          <span className={`absolute top-1 right-1 w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${on ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 border border-slate-300'}`}>{on ? '✓' : ''}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {versiones[0]?.fotos?.length > 0 && (
                  <label className="flex items-center gap-2 mt-3 text-sm text-slate-700">
                    <input type="checkbox" checked={comparando.conservar} onChange={(e) => setComparando((c) => ({ ...c, conservar: e.target.checked }))} />
                    Conservar también las {versiones[0].fotos.length} fotos del estado actual
                  </label>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                  <button onClick={descartar} disabled={comparando.guardando} className="text-sm font-bold px-4 py-2 rounded-lg border border-slate-300 text-slate-700">No actualizar</button>
                  <button onClick={actualizarDesdeActa} disabled={comparando.guardando} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">
                    {comparando.guardando && <ButtonSpinner />} Actualizar estado actual
                  </button>
                </div>
              </>
            )
          })()}
        </Modal>
      )}

      {editando && (
        <Modal title={`Estado actual — ${vehiculo.placa}`} onClose={() => !editando.guardando && setEditando(null)} wide>
          <p className="text-sm text-slate-500 mb-3">
            Cómo está el vehículo hoy. Al guardar queda como el estado actual; el anterior se conserva en el historial.
          </p>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fotos</p>
          {editando.fotos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {editando.fotos.map((p) => (
                <div key={p} className="relative">
                  {urls[p]
                    ? <img src={urls[p]} alt="Foto actual" className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200" />
                    : <div className="w-full aspect-[4/3] rounded-lg bg-slate-100" />}
                  <button type="button" onClick={() => setEditando((e) => ({ ...e, fotos: e.fotos.filter((x) => x !== p) }))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 border border-slate-300 text-slate-700 text-xs font-bold" title="Quitar esta foto">✕</button>
                </div>
              ))}
            </div>
          )}
          <PhotoPicker fotos={editando.nuevas} onChange={(nuevas) => setEditando((e) => ({ ...e, nuevas }))} onError={(m) => notify(m, 'error')} />

          <p className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Checklist</p>
          <ChecklistEditor checklist={editando.checklist} setParte={setParte}
            expanded={editando.expanded} setExpanded={(fn) => setEditando((e) => ({ ...e, expanded: typeof fn === 'function' ? fn(e.expanded) : fn }))} />

          <label className="block text-xs font-bold text-slate-500 uppercase mt-4">
            Observaciones
            <textarea value={editando.observaciones} onChange={(e) => setEditando((x) => ({ ...x, observaciones: e.target.value }))} rows={2}
              placeholder="Ej.: tapicería trasera manchada, pendiente de lavado"
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm normal-case font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </label>

          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
            <button onClick={() => setEditando(null)} disabled={editando.guardando} className="text-sm font-bold px-4 py-2 rounded-lg border border-slate-300 text-slate-700">Cancelar</button>
            <button onClick={guardar} disabled={editando.guardando} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">
              {editando.guardando && <ButtonSpinner />} {editando.guardando ? 'Guardando...' : 'Guardar estado actual'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
