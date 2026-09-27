import { FLEET_PHOTOS } from '../lib/fleetPhotos'
import VehicleTypeIcon from './VehicleTypeIcon'

// Foto real del vehículo si su placa está en FLEET_PHOTOS; si no (vehículo agregado
// después del seed original), cae al render genérico por tipo.
export default function VehiclePhoto({ placa, tipo, className }) {
  const photo = FLEET_PHOTOS[placa?.toUpperCase()]
  if (!photo) return <VehicleTypeIcon tipo={tipo} className={className} />
  return <img src={photo} alt={placa} className={`object-contain ${className}`} />
}
