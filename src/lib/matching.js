// Comparacion "humana" de texto: ignora mayusculas/minusculas y espacios sobrantes.
// Root cause del bug "No hay vehiculos en esta ciudad": abrirResolucion() en
// Solicitudes.jsx filtraba vehicles con .eq('ciudad', ...) y .eq('tipo_vehiculo', ...),
// una comparacion EXACTA byte a byte. Datos reales (seed cargado a mano, ciudades
// agregadas en momentos distintos) traen inconsistencias de mayusculas/espacios entre
// solicitudes.ciudad/tipo_vehiculo y vehicles.ciudad/tipo_vehiculo aunque para un humano
// sea "la misma" ciudad/tipo, asi que el AND de 3 filtros exactos quedaba en 0 filas.
// Tambien ignora tildes: "Bogota" y "Bogotá" son la misma ciudad.
const normal = (t) => (t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
export const sameText = (a, b) => normal(a) === normal(b)

export function matchesSolicitud(vehicle, solicitud) {
  return sameText(vehicle.ciudad, solicitud.ciudad) && sameText(vehicle.tipo_vehiculo, solicitud.tipo_vehiculo)
}

// Como esta la flota en la ciudad de una solicitud: disponibles del tipo pedido (`exactos`), disponibles de otro
// tipo (`otroTipo`) y cuantos vehiculos de la ciudad no estan disponibles, por estado (`ocupados`). Sirve para
// explicar por que no aparece un vehiculo y para ofrecer uno de otro tipo antes de tercerizar.
export function flotaParaSolicitud(vehicles, solicitud) {
  const enCiudad = vehicles.filter((v) => sameText(v.ciudad, solicitud.ciudad))
  const disponibles = enCiudad.filter((v) => v.estado === 'Disponible')
  const ocupados = {}
  for (const v of enCiudad) if (v.estado !== 'Disponible') ocupados[v.estado] = (ocupados[v.estado] || 0) + 1
  return {
    exactos: disponibles.filter((v) => sameText(v.tipo_vehiculo, solicitud.tipo_vehiculo)),
    otroTipo: disponibles.filter((v) => !sameText(v.tipo_vehiculo, solicitud.tipo_vehiculo)),
    ocupados,
    total: enCiudad.length,
  }
}
