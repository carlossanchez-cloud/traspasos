// Root cause del bug "me olvida actualizar el kilometraje": Dashboard.jsx guardaba
// cualquier cambio de estado (incluyendo Asignado -> Disponible) sin comparar el
// kilometraje nuevo contra el anterior, asi que si el gestor no tocaba el campo
// km_actual (el valor por defecto que trae el formulario es el km viejo del vehiculo)
// el vehiculo volvia a "Disponible" con el mismo km de siempre. requiresKmUpdate()
// detecta exactamente esa transicion y obliga a que el km cambie antes de guardar.
export function requiresKmUpdate(prevEstado, nextEstado, prevKm, nextKm) {
  if (prevEstado !== 'Asignado' || nextEstado !== 'Disponible') return false
  return Number(nextKm) === Number(prevKm)
}
