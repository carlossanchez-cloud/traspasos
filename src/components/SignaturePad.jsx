import { useRef, useState } from 'react'

// Canvas de firma simple: dedo/mouse dibuja, exporta PNG como File. Reemplaza el
// "sube una foto de la firma" por una firma real capturada en pantalla.
export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(true)

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const p = e.touches ? e.touches[0] : e
    return { x: p.clientX - rect.left, y: p.clientY - rect.top }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.stroke()
    if (empty) setEmpty(false)
  }

  const end = async () => {
    if (!drawing.current) return
    drawing.current = false
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      onChange(new File([blob], 'firma.png', { type: 'image/png' }))
    }, 'image/png')
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setEmpty(true)
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={140}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg touch-none"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] text-slate-400">{empty ? 'Firma aquí (dedo o mouse)' : 'Firma capturada'}</span>
        <button type="button" onClick={clear} className="text-[11px] font-bold text-slate-500 hover:text-slate-700">Borrar</button>
      </div>
    </div>
  )
}
