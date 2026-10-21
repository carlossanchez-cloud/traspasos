import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Spinner from './Spinner'
import { CHECK_ITEMS } from '../lib/actaChecklist'

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
  const [firmaUrl, setFirmaUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      signAll([...(acta.fotos_urls || []), ...(acta.fotos_urls_cliente || [])]),
      acta.firma_url ? signAll([acta.firma_url]) : Promise.resolve([]),
      Promise.all(fotosDeNovedades(acta.checklist).map(async (n) => ({ ...n, url: (await signAll([n.path]))[0] }))),
    ]).then(([fotos, firma, nov]) => {
      if (cancelled) return
      setFotoUrls(fotos)
      setNovedades(nov.filter((n) => n.url))
      setFirmaUrl(firma[0] || null)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [acta.id])

  if (loading) return <Spinner label="Cargando fotos..." className="py-6" />

  return (
    <div className="flex flex-col gap-4">
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
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fotos ({fotoUrls.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {fotoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
              </a>
            ))}
          </div>
        </div>
      )}
      {firmaUrl && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Firma</p>
          <img src={firmaUrl} alt="Firma" className="max-h-32 border border-slate-200 rounded-lg bg-white" />
        </div>
      )}
      {fotoUrls.length === 0 && novedades.length === 0 && !firmaUrl && <p className="text-sm text-slate-400">Sin fotos ni firma en esta acta.</p>}
    </div>
  )
}
