import amarok from '../assets/vehicles/fleet/amarok.png'
import captiva from '../assets/vehicles/fleet/captiva.png'
import colorado from '../assets/vehicles/fleet/colorado.png'
import duster from '../assets/vehicles/fleet/duster.png'
import fordEscape from '../assets/vehicles/fleet/ford-escape.png'
import grandVitara from '../assets/vehicles/fleet/grand-vitara.png'
import jacT8 from '../assets/vehicles/fleet/jac-t8.png'
import kangoo from '../assets/vehicles/fleet/kangoo.png'
import oroch from '../assets/vehicles/fleet/oroch.png'

// Render real por placa para los 24 vehículos del seed original (captiva.png: la Captiva que se vende en
// Colombia, de la imagen oficial con fondo blanco que mandó Alejo) (mismo modelo real =
// misma imagen, para no pagar generaciones repetidas de un carro pixel-idéntico).
// Vehículo nuevo que no esté aquí simplemente no tiene entrada — VehiclePhoto cae al
// ícono genérico por tipo.
export const FLEET_PHOTOS = {
  LHV915: amarok, LHV917: amarok, LQS678: amarok, LQS688: amarok, LQS690: amarok,
  LQL065: kangoo, LZL869: kangoo, LZL872: kangoo, LZL873: kangoo, LZL879: kangoo, LZL880: kangoo, LZL881: kangoo,
  NFZ931: grandVitara, NFV258: grandVitara, LHT164: grandVitara,
  LQT234: jacT8, LQT236: jacT8, LUY174: jacT8, LUY210: jacT8,
  LHV966: fordEscape,
  LUX232: captiva,
  LQS871: colorado,
  LQT877: oroch,
  LQW524: duster,
}

// Si la placa no esta en la lista, se busca el render por el modelo registrado (p. ej. "JAC T8 2023 MT 4X4"):
// asi un vehiculo nuevo de un modelo que ya tiene render no cae al generico.
const POR_MODELO = [
  [/amarok/i, amarok], [/kangoo/i, kangoo], [/vitara/i, grandVitara], [/jac\s*t\s*8/i, jacT8],
  [/escape/i, fordEscape], [/captiva/i, captiva], [/colorado/i, colorado], [/oroch/i, oroch], [/duster/i, duster],
]

export const renderDe = (vehiculo) => FLEET_PHOTOS[vehiculo?.placa?.toUpperCase()]
  || POR_MODELO.find(([patron]) => patron.test(vehiculo?.modelo || ''))?.[1]
  || null
