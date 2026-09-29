// Constantes del checklist de actas, compartidas entre la vista del gestor (Actas.jsx,
// autenticada) y la vista publica sin login del cliente (ActaPublica.jsx) para que ambas
// rendericen el mismo checklist con el mismo estilo, sin duplicar el objeto.
export const CHECK_ITEMS = ['Carrocería', 'Llantas', 'Interior', 'Luces', 'Documentos en el vehículo']
export const ESTADOS = ['Bueno', 'Regular', 'Malo']
export const ESTADO_COLOR = {
  Bueno: 'bg-emerald-600 text-white border-emerald-600',
  Regular: 'bg-amber-500 text-white border-amber-500',
  Malo: 'bg-red-600 text-white border-red-600',
}

export const emptyChecklist = () => Object.fromEntries(CHECK_ITEMS.map((k) => [k, { estado: 'Bueno', obs: '' }]))

export const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8MB — fotos de celular normales caben, evita subir cualquier cosa gigante
export const isValidImage = (file) => file.type.startsWith('image/') && file.size <= MAX_FILE_BYTES
