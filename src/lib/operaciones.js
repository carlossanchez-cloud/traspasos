// Modulo Operaciones del menu principal: por ahora un submodulo, en construccion.
export const MODULO_OPERACIONES = {
  base: '/operaciones',
  titulo: 'Operaciones',
  intro: 'Operación de los vehículos de la flota. Escoge un módulo:',
  submodulos: [
    {
      to: '/operaciones/inspecciones-activos-nuevos', icon: 'ClipboardList', titulo: 'Inspecciones activos nuevos', corto: 'Inspecciones',
      texto: 'Actas de entrega y recibido de los activos nuevos: estado, fotos y firmas de cada inspección.',
    },
  ],
}

export const TEXTO_OPERACIONES = 'Inspecciones de activos nuevos: actas de entrega y recibido.'
