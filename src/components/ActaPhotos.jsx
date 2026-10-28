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

// Quien firmo que. Desde el paso 19 la firma del gestor va en firma_url y la del cliente en
// firma_cliente_url. Antes, al firmar el cliente su firma reemplazaba a la del gestor en firma_url: en
// esas actas (firmadas, sin firma_cliente_url) la unica firma que queda es la del cliente. Sigue pasando
// en actas nuevas mientras el proyecto de Supabase no tenga corrido el paso 19.
const rotuloFirmas = (acta) => {
  if (acta.firma_cliente_url) return { firma: 'Firma del gestor de flota', reemplazada: false }
  if (acta.bloqueada) return { firma: 'Firma del cliente', reemplazada: true }
  return { firma: acta.checklist?.firma_gestor_publica ? 'Firma del gestor de flota' : 'Firma', reemplazada: false }
}

const firmar = async (path) => (path ? (await signAll([path]))[0] || null : null)

// Todo lo grafico del acta, en el orden del documento: recorrido, novedades, fotos adicionales del
// gestor, fotos del cliente y las dos firmas. Es lo que sale tambien en el PDF.
// `onCargado` avisa cuando ya estan todas las URLs (el PDF espera a eso antes de capturar).
export default function ActaPhotos({ acta, onCargado, documento = false }) {
  const [g, setG] = useState(null)
  useEffect(() => { if (g) onCargado?.() }, [g, onCargado])

  useEffect(() => {
    let cancelled = false
    setG(null)
    // Las del recorrido tambien estan en fotos_urls; se muestran rotuladas aparte y no se repiten abajo.
    const rec = FOTOS_RECORRIDO.filter((f) => acta.checklist?.fotos_recorrido?.[f.key])
      .map((f) => ({ label: f.label, path: acta.checklist.fotos_recorrido[f.key] }))
    const recPaths = new Set(rec.map((r) => r.path))
    const conUrl = (list) => Promise.all(list.map(async (x) => ({ ...x, url: await firmar(x.path) })))
      .then((l) => l.filter((x) => x.url))
    Promise.all([
      conUrl(rec),
      conUrl(fotosDeNovedades(acta.checklist).map((n) => ({ ...n, label: `${n.parte} — ${n.estado}${n.obs ? `: ${n.obs}` : ''}` }))),
      conUrl((acta.fotos_urls || []).filter((p) => !recPaths.has(p)).map((path, i) => ({ path, label: `Foto adicional ${i + 1}` }))),
      conUrl((acta.fotos_urls_cliente || []).map((path, i) => ({ path, label: `Foto del cliente ${i + 1}` }))),
      firmar(acta.firma_url),
      firmar(acta.firma_cliente_url),
    ]).then(([recorrido, novedades, adicionales, cliente, firma, firmaCliente]) => {
      if (!cancelled) setG({ recorrido, novedades, adicionales, cliente, firma, firmaCliente })
    })
    return () => { cancelled = true }
  }, [acta.id])

  if (!g) return <Spinner label="Cargando fotos..." className="py-6" />

  const rotulo = rotuloFirmas(acta)
  const vacio = !g.recorrido.length && !g.novedades.length && !g.adicionales.length && !g.cliente.length && !g.firma && !g.firmaCliente
  return (
    <div className="flex flex-col gap-4">
      <Galeria titulo="Recorrido del vehículo" documento={documento} fotos={g.recorrido} />
      <Galeria titulo="Fotos de novedades" documento={documento} fotos={g.novedades} />
      <Galeria titulo="Fotos adicionales del gestor" documento={documento} fotos={g.adicionales} />
      <Galeria titulo="Fotos del cliente" documento={documento} fotos={g.cliente} />
      {(g.firma || g.firmaCliente) && (
        <div className="grid grid-cols-2 gap-3">
          {g.firma && (
            <Firma titulo={rotulo.firma} url={g.firma}
              nombre={rotulo.reemplazada ? acta.nombre_cliente : null} />
          )}
          {g.firmaCliente && <Firma titulo="Firma del cliente" url={g.firmaCliente} nombre={acta.nombre_cliente} />}
        </div>
      )}
      {rotulo.reemplazada && (
        <p className="text-[11px] text-amber-700">
          En esta acta la firma del cliente quedó guardada en lugar de la del gestor. Pasa cuando la base de datos
          todavía no tiene el ajuste de firmas (paso SQL 19).
        </p>
      )}
      {vacio && <p className="text-sm text-slate-400">Sin fotos ni firma en esta acta.</p>}
    </div>
  )
}

// En el documento PDF van siempre 2 por fila, grandes; en pantalla, 3 desde tablet. La primera fila no es punto
// de corte, para que el titulo nunca quede solo al final de una hoja.
function Galeria({ titulo, fotos, documento }) {
  if (!fotos.length) return null
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase mb-2" data-corte>{titulo} ({fotos.length})</p>
      <div className={`grid grid-cols-2 gap-2 ${documento ? '' : 'sm:grid-cols-3'}`}>
        {fotos.map((f, i) => (
          <a key={f.path} href={f.url} target="_blank" rel="noreferrer" className="block" data-corte={i >= 2 || undefined}>
            <img src={f.url} alt={f.label} className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200" />
            <p className="text-[11px] text-slate-600 mt-1 leading-tight">{f.label}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

function Firma({ titulo, url, nombre }) {
  return (
    <div data-corte>
      <p className="text-xs font-bold text-slate-500 uppercase mb-2">{titulo}</p>
      <img src={url} alt={titulo} className="w-full max-h-32 object-contain border border-slate-200 rounded-lg bg-white" />
      {nombre && <p className="text-xs text-slate-600 mt-1">{nombre}</p>}
    </div>
  )
}
