import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../lib/icons'
import { FOTOS_RECORRIDO, siguienteRecorrido } from '../lib/actaChecklist'
import PhotoPicker, { CameraModal } from './PhotoPicker'

// Fotos obligatorias del acta (las 4 diagonales, habitaculo y tablero). "Iniciar recorrido" abre la camara
// y va pidiendo una por una en el orden de la vuelta al carro; cada foto tambien se puede repetir o subir
// suelta desde su casilla. `fotos` es { [key]: File } y `setFotos` el setter de estado (acepta updater,
// asi dos disparos seguidos no caen en la misma casilla).
export default function FotoRecorrido({ fotos, setFotos, onError }) {
  const [camera, setCamera] = useState(false)
  const siguiente = siguienteRecorrido(fotos)
  const tomadas = FOTOS_RECORRIDO.filter((f) => fotos[f.key]).length
  const total = FOTOS_RECORRIDO.length
  const urls = useMemo(() => Object.fromEntries(Object.entries(fotos).filter(([, f]) => f).map(([k, f]) => [k, URL.createObjectURL(f)])), [fotos])
  useEffect(() => () => Object.values(urls).forEach((u) => URL.revokeObjectURL(u)), [urls])

  const iniciar = () => {
    if (navigator.mediaDevices?.getUserMedia) setCamera(true)
    else onError('Este navegador no permite abrir la cámara aquí: usa "Tomar foto" o "Subir archivo" en cada casilla.')
  }
  const capturar = (file) => setFotos((m) => {
    const k = siguienteRecorrido(m)?.key
    return k ? { ...m, [k]: file } : m
  })

  return (
    <div className="rounded-lg border border-slate-300 overflow-hidden">
      <div className="bg-slate-200 px-3 py-2.5">
        <p className="text-sm text-slate-800">
          Se necesitan <strong>las 4 fotos diagonales</strong>, una del <strong>habitáculo</strong> y una del
          <strong> tablero con el motor encendido</strong>. Da la vuelta al carro empezando por la esquina delantera izquierda.
        </p>
        {siguiente ? (
          <button type="button" onClick={iniciar}
            className="mt-2 w-full flex items-center justify-center gap-2 text-sm font-bold px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
            <Icon name="Camera" className="w-4 h-4" />
            {tomadas ? `Continuar recorrido (${tomadas} de ${total})` : 'Iniciar recorrido de fotos'}
          </button>
        ) : (
          <p className="mt-2 text-sm font-bold text-emerald-700">✓ Recorrido completo ({total} de {total})</p>
        )}
      </div>
      <div className="bg-slate-100 border-t border-slate-300 px-3 py-1 divide-y divide-slate-300/60">
        {FOTOS_RECORRIDO.map((f, i) => (
          <div key={f.key} className="py-2">
            <p className={`text-xs font-bold mb-1.5 ${fotos[f.key] ? 'text-emerald-700' : 'text-slate-700'}`}>
              {fotos[f.key] ? '✓' : `${i + 1}.`} {f.label}
            </p>
            <PhotoPicker single fotos={fotos[f.key] ? [fotos[f.key]] : []} onError={onError}
              onChange={(fs) => setFotos((m) => ({ ...m, [f.key]: fs[0] }))} />
          </div>
        ))}
      </div>

      {camera && siguiente && (
        <CameraModal
          guia={{ titulo: siguiente.label, ayuda: siguiente.ayuda, silueta: siguiente.silueta, paso: FOTOS_RECORRIDO.indexOf(siguiente) + 1, total }}
          miniaturas={FOTOS_RECORRIDO.map((f) => ({ key: f.key, label: f.label, url: urls[f.key] }))}
          onRepetir={(key) => setFotos((m) => ({ ...m, [key]: undefined }))}
          onCapture={capturar}
          onClose={() => setCamera(false)}
          onFail={(msg) => { setCamera(false); onError(msg) }}
        />
      )}
    </div>
  )
}
