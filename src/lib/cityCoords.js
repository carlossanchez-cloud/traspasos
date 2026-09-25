// Coordenadas de ciudades colombianas conocidas, para centrar el mapa sin llamar a un geocoder.
export const CITY_COORDS = {
  'Bogotá': [4.6097, -74.0817], 'Medellín': [6.2442, -75.5812], 'Cali': [3.4516, -76.5320],
  'Barranquilla': [10.9685, -74.7813], 'Bucaramanga': [7.1193, -73.1227], 'Valledupar': [10.4631, -73.2532],
  'Monteria': [8.7479, -75.8814], 'Montería': [8.7479, -75.8814], 'Santa marta': [11.2407, -74.1990],
  'Santa Marta': [11.2407, -74.1990], 'Cartagena': [10.3910, -75.4794], 'Sincelejo': [9.3047, -75.3978],
  'Pereira': [4.8133, -75.6961], 'Manizales': [5.0681, -75.5173], 'Armenia': [4.5339, -75.6811],
  'Ibagué': [4.4389, -75.2322], 'Villavicencio': [4.1420, -73.6266], 'Neiva': [2.9273, -75.2819],
  'Cúcuta': [7.8939, -72.5078], 'Pasto': [1.2136, -77.2811], 'Popayán': [2.4382, -76.6132], 'Tunja': [5.5353, -73.3678],
}
const COLOMBIA_CENTER = [4.5709, -74.2973]
export const cityCoords = (city) => CITY_COORDS[titleCase(city)] || COLOMBIA_CENTER
export const titleCase = (s) => (s || '').trim().charAt(0).toUpperCase() + (s || '').trim().slice(1).toLowerCase()

export function distanceKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1); const dLon = rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
