// Enlace publico de un acta: reusa el id (uuid v4, no enumerable) como token, no hace
// falta una columna de token aparte (ver supabase/steps/16_actas_publicas.sql).
export const publicActaUrl = (actaId, origin = window.location.origin) => `${origin}/acta-publica/${actaId}`

export const waShareUrl = (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`

// Redaccion de Gmail directa (en vez de mailto:, que abre el programa de correo predeterminado del equipo,
// p.ej. Outlook). En el celular abre Gmail en el navegador o en la app si esta instalada.
export const gmailShareUrl = (url, subject, text) =>
  `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`

// Compartir solo texto (sin enlace), p. ej. el resumen de una asignacion.
export const waTextUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`
export const gmailTextUrl = (subject, text) =>
  `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
