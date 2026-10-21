// Constantes del checklist de actas, compartidas entre la vista del gestor (Actas.jsx,
// autenticada) y la vista publica sin login del cliente (ActaPublica.jsx) para que ambas
// rendericen el mismo checklist con el mismo estilo, sin duplicar el objeto.
export const CHECK_ITEMS = ['Carrocería', 'Llantas', 'Interior', 'Luces', 'Documentos en el vehículo', 'Kit de carretera']
// Items que se despliegan en sub-partes, cada una con su propio estado. Se guardan dentro del
// mismo item del checklist (checklist['Carrocería'].partes), asi las actas viejas sin partes siguen leyendose.
export const SUB_ITEMS = {
  'Carrocería': [
    'Puerta delantera izquierda', 'Puerta delantera derecha', 'Puerta trasera izquierda', 'Puerta trasera derecha',
    'Capó', 'Baúl', 'Techo', 'Guardabarro delantero izquierdo', 'Guardabarro delantero derecho',
    'Costado izquierdo', 'Costado derecho', 'Bumper delantero', 'Bumper trasero',
  ],
  'Llantas': [
    'Posición 1 — Delantera izquierda', 'Posición 2 — Delantera derecha', 'Posición 3 — Trasera derecha',
    'Posición 4 — Trasera izquierda', 'Posición 5 — Repuesto',
  ],
  'Interior': ['Tapizados', 'Carteras de puertas', 'Techo', 'Volante', 'Palanca de cambios', 'Tablero de instrumentos'],
  'Luces': ['Delanteras', 'Traseras', 'Interiores'],
  'Documentos en el vehículo': ['SOAT', 'Tecnomecánica', 'Póliza todo riesgo', 'Tarjeta de propiedad'],
  'Kit de carretera': ['Botiquín', 'Extintor', 'Chaleco', 'Linterna', 'Conos', 'Herramienta', 'Gato', 'Cruceta', 'Tacos de seguridad'],
}
export const ESTADOS = ['Bueno', 'Regular', 'Malo']
// Las partes de Documentos no se califican por estado fisico sino por vigencia.
export const ESTADOS_DOCUMENTO = ['Vigente', 'Vencido', 'No aplica', 'No se encuentra']
// Opciones de las partes de un item; la primera es la que viene por defecto.
export const estadosParte = (item) => (item === 'Documentos en el vehículo' ? ESTADOS_DOCUMENTO : ESTADOS)
export const ESTADO_COLOR = {
  Bueno: 'bg-emerald-600 text-white border-emerald-600',
  Regular: 'bg-amber-500 text-white border-amber-500',
  Malo: 'bg-red-600 text-white border-red-600',
  Vigente: 'bg-emerald-600 text-white border-emerald-600',
  Vencido: 'bg-red-600 text-white border-red-600',
  'No aplica': 'bg-slate-500 text-white border-slate-500',
  'No se encuentra': 'bg-amber-500 text-white border-amber-500',
}
// Estados que no son una novedad: no piden observacion ni suman al contador "con novedad".
export const esNovedad = (estado) => !['Bueno', 'Vigente', 'No aplica'].includes(estado)

const emptyEntry = (estado = 'Bueno') => ({ estado, obs: '' })
export const emptyChecklist = () => Object.fromEntries(CHECK_ITEMS.map((k) => [k, SUB_ITEMS[k]
  ? { ...emptyEntry(), partes: Object.fromEntries(SUB_ITEMS[k].map((p) => [p, emptyEntry(estadosParte(k)[0])])) }
  : emptyEntry()]))

export const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8MB — fotos de celular normales caben, evita subir cualquier cosa gigante
export const isValidImage = (file) => file.type.startsWith('image/') && file.size <= MAX_FILE_BYTES
