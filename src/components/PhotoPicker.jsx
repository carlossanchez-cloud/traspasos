import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../lib/icons'
import { isValidImage } from '../lib/actaChecklist'
import Silueta from './Silueta'
import { precargarSiluetas } from '../lib/siluetas'

// Selector de fotos con dos caminos: "Subir archivos" (galeria / disco) y "Tomar foto" (camara en vivo
// via getUserMedia, en celular y en computador; el navegador pide el permiso). Si la camara no esta
// disponible o se niega el permiso, cae al input con capture, que en celular abre la app de camara.
// Las fotos se acumulan: cada subida o captura se suma a las anteriores, y cada una se puede quitar.
// Con `single` maneja una sola foto (la de una novedad puntual): reemplaza en vez de sumar y la camara
// se cierra sola al disparar. `guia` (opcional) se pasa tal cual a la camara.
export default function PhotoPicker({ fotos, onChange, onError, single, guia }) {
  const fileRef = useRef(null)
  const captureRef = useRef(null)
  const [camera, setCamera] = useState(false)

  const add = (files) => {
    const valid = files.filter(isValidImage)
    if (valid.length < files.length) onError('Algunas fotos no son imágenes válidas o pesan más de 8MB — se omitieron.')
    if (valid.length) onChange(single ? [valid[0]] : [...fotos, ...valid])
  }
  const fromInput = (e) => { add([...e.target.files]); e.target.value = '' }

  const openCamera = () => {
    if (navigator.mediaDevices?.getUserMedia) setCamera(true)
    else captureRef.current.click()
  }

  const previews = useMemo(() => fotos.map((f) => URL.createObjectURL(f)), [fotos])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const btn = `flex-1 flex items-center justify-center gap-2 font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 ${single ? 'text-xs px-2 py-2' : 'text-sm px-3 py-2.5'}`
  return (
    <div>
      <div className="flex gap-2">
        <button type="button" onClick={() => fileRef.current.click()} className={btn}>
          <Icon name="Upload" className="w-4 h-4" /> {single ? 'Subir archivo' : 'Subir archivos'}
        </button>
        <button type="button" onClick={openCamera} className={btn}>
          <Icon name="Camera" className="w-4 h-4" /> {fotos.length && single ? 'Repetir foto' : 'Tomar foto'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple={!single} onChange={fromInput} className="hidden" />
      <input ref={captureRef} type="file" accept="image/*" capture="environment" onChange={fromInput} className="hidden" />

      {fotos.length > 0 && (
        <div className={single ? 'w-28 mt-2' : 'grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3'}>
          {previews.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => onChange(fotos.filter((_, j) => j !== i))} aria-label="Quitar foto"
                className="absolute top-1 right-1 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full p-1">
                <Icon name="X" className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {!single && <p className="text-xs text-slate-500 mt-2">{fotos.length} foto(s) seleccionada(s)</p>}

      {camera && (
        <CameraModal
          guia={guia}
          onCapture={(file) => { add([file]); if (single) setCamera(false) }}
          onClose={() => setCamera(false)}
          onFail={(msg) => { setCamera(false); onError(msg); captureRef.current.click() }}
        />
      )}
    </div>
  )
}

// Con `guia` ({ titulo, ayuda, paso, total, silueta }) muestra encima de la camara que foto toca tomar y una
// silueta de referencia. A la derecha van las miniaturas de lo capturado, para ver al momento que cada foto
// quedo guardada y enfocada (tocar una la agranda). `miniaturas` ([{ key, label, url }], url vacia = pendiente)
// la pasa el recorrido guiado; sin ella se muestran las fotos tomadas en esta apertura de la camara.
// `onRepetir(key)` permite descartar una del recorrido desde la vista ampliada para tomarla de nuevo.
export function CameraModal({ onCapture, onClose, onFail, guia, miniaturas, onRepetir }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  // Flash: la web no tiene flash de disparo, pero en los celulares que lo permiten (Chrome en Android) se
  // puede prender la luz de la camara como linterna mientras se toman las fotos.
  const [flashDisponible, setFlashDisponible] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [sesion, setSesion] = useState([]) // object URLs de lo tomado en esta apertura (modo libre)
  const [flash, setFlash] = useState(false)
  const [viendo, setViendo] = useState(null)
  // onFail llega como funcion nueva en cada render del padre (que se re-renderiza con cada foto);
  // por ref para no reabrir la camara cada vez.
  const onFailRef = useRef(onFail)
  useEffect(() => { onFailRef.current = onFail })

  useEffect(() => { if (guia?.silueta) precargarSiluetas() }, [guia?.silueta])

  useEffect(() => {
    let s = null
    let cancelled = false
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 } }, audio: false })
      .then((st) => {
        if (cancelled) { st.getTracks().forEach((t) => t.stop()); return }
        s = st
        setStream(st)
        videoRef.current.srcObject = st
        setFlashDisponible(Boolean(st.getVideoTracks()[0]?.getCapabilities?.().torch))
      })
      .catch((err) => onFailRef.current(err.name === 'NotAllowedError'
        ? 'No diste permiso para usar la cámara. Puedes activarlo en la configuración del navegador.'
        : 'No se pudo abrir la cámara de este dispositivo.'))
    return () => { cancelled = true; s?.getTracks().forEach((t) => t.stop()) }
  }, [])
  useEffect(() => () => sesion.forEach((u) => URL.revokeObjectURL(u)), [sesion])

  const toggleFlash = async () => {
    try {
      await stream.getVideoTracks()[0].applyConstraints({ advanced: [{ torch: !flashOn }] })
      setFlashOn(!flashOn)
    } catch {
      setFlashDisponible(false)
    }
  }

  const capturar = () => {
    const v = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    canvas.getContext('2d').drawImage(v, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      onCapture(new File([blob], `camara-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      if (!miniaturas) setSesion((l) => [...l, URL.createObjectURL(blob)])
      setFlash(true)
      setTimeout(() => setFlash(false), 150)
    }, 'image/jpeg', 0.85)
  }

  const thumbs = miniaturas || sesion.map((url, i) => ({ key: url, label: `Foto ${i + 1}`, url }))
  const tomadas = thumbs.filter((t) => t.url).length

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {guia && (
        <div className="bg-slate-900 text-white px-4 py-2.5">
          {guia.paso && <p className="text-xs font-bold text-emerald-300">Foto {guia.paso} de {guia.total}</p>}
          <p className="text-lg font-black leading-tight">{guia.titulo}</p>
          <p className="text-xs text-slate-300 mt-0.5">{guia.ayuda}</p>
        </div>
      )}
      <div className="flex-1 flex min-h-0">
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="max-w-full max-h-full" />
          {guia?.silueta && (
            // Guia chica en la esquina superior izquierda, para no tapar lo que se esta fotografiando.
            <div className="absolute top-2 left-2 w-32 sm:w-44 rounded-lg bg-black/60 border border-white/30 p-1.5 pointer-events-none">
              <p className="text-[10px] font-bold text-white/80 uppercase mb-1">Guía</p>
              <div className="h-16 sm:h-24 flex items-center justify-center"><Silueta tipo={guia.silueta} /></div>
            </div>
          )}
          {!stream && <p className="absolute text-white text-sm px-6 text-center">Abriendo cámara… acepta el permiso si el navegador lo pide.</p>}
          {flash && <div className="absolute inset-0 bg-white/70" />}
        </div>
        {thumbs.length > 0 && (
          <div className="w-20 sm:w-28 shrink-0 bg-slate-950 overflow-y-auto p-1.5 flex flex-col gap-1.5">
            {thumbs.map((t, i) => (
              <button key={t.key} type="button" disabled={!t.url} onClick={() => setViendo(t)}
                className={`relative aspect-square rounded-md overflow-hidden border-2 shrink-0 ${t.url ? 'border-emerald-400' : 'border-dashed border-slate-600'}`}>
                {t.url
                  ? <img src={t.url} alt={t.label} className="w-full h-full object-cover" />
                  : <span className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-bold">{i + 1}</span>}
                {t.url && <span className="absolute top-0.5 right-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">✓</span>}
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] leading-tight px-0.5 py-0.5 truncate">{t.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-4 bg-black">
        <div className="w-24 flex flex-col items-start gap-1">
          {flashDisponible && (
            <button type="button" onClick={toggleFlash} aria-pressed={flashOn}
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border ${flashOn ? 'bg-yellow-400 text-slate-900 border-yellow-400' : 'text-white border-white/40'}`}>
              <Icon name="Zap" className="w-3.5 h-3.5" /> Flash {flashOn ? 'on' : 'off'}
            </button>
          )}
          <span className="text-white text-xs">{tomadas} tomada(s)</span>
        </div>
        <button type="button" onClick={capturar} disabled={!stream} aria-label="Tomar foto"
          className="w-16 h-16 rounded-full bg-white border-4 border-slate-400 disabled:opacity-40" />
        <button type="button" onClick={onClose} className="w-24 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg">
          Listo
        </button>
      </div>

      {viendo && (
        <div className="absolute inset-0 z-10 bg-black/95 flex flex-col">
          <p className="text-white font-bold px-4 py-3">{viendo.label}</p>
          <div className="flex-1 min-h-0 flex items-center justify-center p-2">
            <img src={viendo.url} alt={viendo.label} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex gap-2 p-4">
            {onRepetir && (
              <button type="button" onClick={() => { onRepetir(viendo.key); setViendo(null) }}
                className="flex-1 text-sm font-bold text-white border border-white/40 px-3 py-2.5 rounded-lg">
                Repetir esta foto
              </button>
            )}
            <button type="button" onClick={() => setViendo(null)}
              className="flex-1 text-sm font-bold text-white bg-emerald-600 px-3 py-2.5 rounded-lg">
              Se ve bien, volver
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
