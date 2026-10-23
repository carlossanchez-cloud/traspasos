import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Spinner from './Spinner'
import { CHECK_ITEMS, FOTOS_RECORRIDO } from '../lib/actaChecklist'

// El bucket 'actas' es privado -> las fotos se guardan como PATH, no URL. Para mostrarlas
// se pide una signed URL de corta duración (1h) justo al abrir la galería, no al listar.
async function signAll(paths) {
  const results = await Promise.all(
    paths.map((p) => supabase.storage.from('actas').createSignedUrl(p, 3600)),
  )
  return results.map((r) => r.data?.signedUrl).filter(Boolean)
}

// Fotos de novedades: guardadas dentro de cada parte del checklist (partes[parte].foto).
const fotosDeNovedades = (checklist) => CHECK_ITEMS.flatMap((item) => Object.entries(checklist?.[item]?.partes || {})
  .filter(([, p]) => p.foto)
  .map(([parte, p]) => ({ parte, item, estado: p.estado, obs: p.obs, path: p.foto })))

export default function ActaPhotos({ acta }) {
  const [fotoUrls, setFotoUrls] = useState([])
  const [novedades, setNovedades] = useState([])
  const [recorrido, setRecorrido] = useState([])
  const [firmaUrl, setFirmaUrl] = useState(null)
  const [firmaClienteUrl, setFirmaClienteUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    // Las del recorrido tambien estan en fotos_urls; se muestran rotuladas aparte y no se repiten abajo.
    const rec = FOTOS_RECORRIDO.filter((f) => acta.checklist?.fotos_recorrido?.[f.key])
      .map((f) => ({ label: f.label, path: acta.checklist.fotos_recorrido[f.key] }))
    const recPaths = new Set(rec.map((r) => r.path))
    Promise.all([
      signAll([...(acta.fotos_urls || []).filter((p) => !recPaths.has(p)), ...(acta.fotos_urls_cliente || [])]),
      acta.firma_url ? signAll([acta.firma_url]) : Promise.resolve([]),
      acta.firma_cliente_url ? signAll([acta.firma_cliente_url]) : Promise.resolve([]),
      Promise.all(fotosDeNovedades(acta.checklist).map(async (n) => ({ ...n, url: (await signAll([n.path]))[0] }))),
      Promise.all(rec.map(async (r) => ({ ...r, url: (await signAll([r.path]))[0] }))),
    ]).then(([fotos, firma, firmaCliente, nov, recUrls]) => {
      if (cancelled) return
      setRecorrido(recUrls.filter((r) => r.url))
      setFotoUrls(fotos)
      setNovedades(nov.filter((n) => n.url))
      setFirmaUrl(firma[0] || null)
      setFirmaClienteUrl(firmaCliente[0] || null)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [acta.id])

  if (loading) return <Spinner label="Cargando fotos..." className="py-6" />

  return (
    <div className="flex flex-col gap-4">
      {recorrido.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Recorrido del vehículo ({recorrido.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {recorrido.map((r) => (
              <a key={r.path} href={r.url} target="_blank" rel="noreferrer" className="block">
                <img src={r.url} alt={r.label} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                <p className="text-[11px] text-slate-600 mt-1 leading-tight font-semibold">{r.label}</p>
              </a>
            ))}
          </div>
        </div>
      )}
      {novedades.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fotos de novedades ({novedades.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {novedades.map((n) => (
              <a key={n.path} href={n.url} target="_blank" rel="noreferrer" className="block">
                <img src={n.url} alt={n.parte} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                <p className="text-[11px] text-slate-600 mt-1 leading-tight"><strong>{n.parte}</strong> — {n.estado}{n.obs ? `: ${n.obs}` : ''}</p>
              </a>
            ))}
          </div>
        </div>
      )}
      {fotoUrls.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">{recorrido.length ? 'Fotos adicionales' : 'Fotos'} ({fotoUrls.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {fotoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
              </a>
            ))}
          </div>
        </div>
      )}
      {(firmaUrl || firmaClienteUrl) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {firmaUrl && (
            <div>
              {/* Actas nuevas: firma_url es la del gestor (paso 19). En las de antes podia ser la del cliente. */}
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">{acta.checklist?.firma_gestor_publica ? 'Firma del gestor de flota' : 'Firma'}</p>
              <img src={firmaUrl} alt="Firma del gestor" className="max-h-32 border border-slate-200 rounded-lg bg-white" />
            </div>
          )}
          {firmaClienteUrl && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Firma del cliente</p>
              <img src={firmaClienteUrl} alt="Firma del cliente" className="max-h-32 border border-slate-200 rounded-lg bg-white" />
            </div>
          )}
        </div>
      )}
      {fotoUrls.length === 0 && novedades.length === 0 && recorrido.length === 0 && !firmaUrl && !firmaClienteUrl && <p className="text-sm text-slate-400">Sin fotos ni firma en esta acta.</p>}
    </div>
  )
}
