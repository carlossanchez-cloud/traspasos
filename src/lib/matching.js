// Comparacion "humana" de texto: ignora mayusculas/minusculas y espacios sobrantes.
// Root cause del bug "No hay vehiculos en esta ciudad": abrirResolucion() en
// Solicitudes.jsx filtraba vehicles con .eq('ciudad', ...) y .eq('tipo_vehiculo', ...),
// una comparacion EXACTA byte a byte. Datos reales (seed cargado a mano, ciudades
// agregadas en momentos distintos) traen inconsistencias de mayusculas/espacios entre
// solicitudes.ciudad/tipo_vehiculo y vehicles.ciudad/tipo_vehiculo aunque para un humano
// sea "la misma" ciudad/tipo, asi que el AND de 3 filtros exactos quedaba en 0 filas.
export const sameText = (a, b) => (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()

export function matchesSolicitud(vehicle, solicitud) {
  return sameText(vehicle.ciudad, solicitud.ciudad) && sameText(vehicle.tipo_vehiculo, solicitud.tipo_vehiculo)
}
