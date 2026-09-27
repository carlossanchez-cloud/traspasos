import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { FLEET_PHOTOS } from '../lib/fleetPhotos'
import VehicleTypeIcon from './VehicleTypeIcon'

// Orden de fuentes para la foto de un vehículo:
// 1. Foto real subida por un admin (bucket privado 'actas', requiere signed URL).
// 2. Render generado con IA para los 24 vehículos del seed original (fleetPhotos.js).
// 3. Ícono genérico por tipo (siempre disponible, ninguno de los dos anteriores
//    necesita existir para que un vehículo nuevo se vea bien de una vez).
export default function VehiclePhoto({ vehicle, className }) {
  const [signedUrl, setSignedUrl] = useState(null)

  useEffect(() => {
    if (!vehicle.foto_path) { setSignedUrl(null); return }
    let cancelled = false
    supabase.storage.from('actas').createSignedUrl(vehicle.foto_path, 3600).then(({ data }) => {
      if (!cancelled) setSignedUrl(data?.signedUrl || null)
    })
    return () => { cancelled = true }
  }, [vehicle.foto_path])

  if (vehicle.foto_path) {
    if (!signedUrl) return <div className={`${className} bg-slate-100 rounded-lg animate-pulse`} />
    return <img src={signedUrl} alt={vehicle.placa} className={`object-contain ${className}`} />
  }

  const generated = FLEET_PHOTOS[vehicle.placa?.toUpperCase()]
  if (generated) return <img src={generated} alt={vehicle.placa} className={`object-contain ${className}`} />

  return <VehicleTypeIcon tipo={vehicle.tipo_vehiculo} className={className} />
}
