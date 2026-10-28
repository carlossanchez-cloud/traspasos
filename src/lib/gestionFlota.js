// Submodulos de Gestion de flota (solo administradores), en el orden del menu. `corto` es el nombre de la pestaña.
export const SUBMODULOS = [
  {
    to: '/gestion-flota/mantenimiento', icon: 'Wrench', titulo: 'Gestión de mantenimiento', corto: 'Mantenimiento',
    texto: 'Mantenimientos de la flota: cuándo toca, qué se hizo, dónde y cuánto costó.',
  },
  {
    to: '/gestion-flota/kilometraje-adicional', icon: 'Gauge', titulo: 'Cobro por kilometraje adicional', corto: 'Km adicional',
    texto: 'Kilómetros recorridos por encima de lo pactado en el contrato y lo que se le cobra al cliente.',
  },
  {
    to: '/gestion-flota/costos-repuestos', icon: 'Tag', titulo: 'Costos de repuestos', corto: 'Repuestos',
    texto: 'Guía de precios: busca un repuesto por vehículo (p. ej. filtro de aire de un Renault Logan) y mira cuánto se ha pagado y dónde.',
  },
  {
    to: '/gestion-flota/gestion-documental', icon: 'FileText', titulo: 'Gestión documental', corto: 'Documentos',
    texto: 'Documentos de cada vehículo en un solo lugar.',
  },
  {
    to: '/gestion-flota/rentabilidad', icon: 'TrendingUp', titulo: 'Rentabilidad por vehículo', corto: 'Rentabilidad',
    texto: 'Lo que deja cada vehículo: ingresos frente a sus costos.',
  },
]
