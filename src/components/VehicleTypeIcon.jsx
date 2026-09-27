import automovil from '../assets/vehicles/automovil.png'
import camioneta from '../assets/vehicles/camioneta.png'
import pickup from '../assets/vehicles/pickup.png'

// Render 3D genérico por tipo de vehículo (estudio, fondo transparente, sombra de piso),
// estilo tarjeta de vehículo de apps tipo Uber. Generado con Gemini (gemini-2.5-flash-image,
// alias "Nano Banana") a pedido explícito sin marca/logo real — representa el TIPO de
// vehículo, no un modelo real de la flota, así que no se le pone insignia de ninguna marca.
const IMAGES = { 'Automóvil': automovil, 'Camioneta': camioneta, 'Pickup': pickup }

export default function VehicleTypeIcon({ tipo, className = 'w-16 h-10' }) {
  return (
    <img
      src={IMAGES[tipo] || IMAGES['Automóvil']}
      alt={tipo}
      className={`object-contain ${className}`}
    />
  )
}
