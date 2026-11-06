// Modulo Operaciones del menu principal: por ahora un submodulo, en construccion.
export const MODULO_OPERACIONES = {
  base: '/operaciones',
  titulo: 'Operaciones',
  intro: 'Operación de los vehículos de la flota. Escoge un módulo:',
  submodulos: [
    {
      to: '/operaciones/inspecciones-vehiculos-nuevos', icon: 'ClipboardList', titulo: 'Inspecciones vehículos nuevos', corto: 'Inspecciones',
      texto: 'Actas de entrega y recibido de los vehículos nuevos: estado, fotos y firmas de cada inspección.',
    },
  ],
}

export const TEXTO_OPERACIONES = 'Inspecciones de vehículos nuevos: actas de entrega y recibido.'
