// Roles de la app (paso SQL 22). La base de datos es la que de verdad impide que un lector guarde algo;
// esto solo decide que botones se muestran.
export const ROLES = [
  { key: 'admin', label: 'Administrador general', ayuda: 'Todo, y cambia los roles de los demás.' },
  { key: 'gestor', label: 'Gestor', ayuda: 'Crea actas y solicitudes.' },
  { key: 'lector', label: 'Lector', ayuda: 'Solo ve; no puede crear ni cambiar nada.' },
]
export const rolLabel = (role) => ROLES.find((r) => r.key === role)?.label || role
export const puedeEditar = (role) => role === 'admin' || role === 'gestor'
