import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// El bucket 'actas' es privado -> las fotos se guardan como PATH, no URL. Para mostrarlas
// se pide una signed URL de corta duración (1h) justo al abrir la galería, no al listar.
async function signAll(paths) {
  const results = await Promise.all(
    paths.map((p) => supabase.storage.from('actas').createSignedUrl(p, 3600)),
  )
  return results.map((r) => r.data?.signedUrl).filter(Boolean)
}

export default function ActaPhotos({ acta }) {
  const [fotoUrls, setFotoUrls] = useState([])
  const [firmaUrl, setFirmaUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      signAll(acta.fotos_urls || []),
      acta.firma_url ? signAll([acta.firma_url]) : Promise.resolve([]),
    ]).then(([fotos, firma]) => {
      if (cancelled) return
      setFotoUrls(fotos)
      setFirmaUrl(firma[0] || null)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [acta.id])

  if (loading) return <p className="text-sm text-slate-400 py-6 text-center">Cargando fotos...</p>

  return (
    <div className="flex flex-col gap-4">
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
      {fotoUrls.length === 0 && !firmaUrl && <p className="text-sm text-slate-400">Sin fotos ni firma en esta acta.</p>}
    </div>
  )
}
