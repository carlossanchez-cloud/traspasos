import { IMAGEN } from '../lib/siluetas'

export default function Silueta({ tipo }) {
  const [src, espejo] = IMAGEN[tipo] || []
  if (!src) return null
  return (
    <img src={src} alt="" aria-hidden="true" className="max-w-full max-h-full object-contain"
      style={{ opacity: 0.95, filter: 'drop-shadow(0 0 2px rgba(0,0,0,.9))', transform: espejo ? 'scaleX(-1)' : undefined }} />
  )
}
