// Enlace publico de un acta: reusa el id (uuid v4, no enumerable) como token, no hace
// falta una columna de token aparte (ver supabase/steps/16_actas_publicas.sql).
export const publicActaUrl = (actaId, origin = window.location.origin) => `${origin}/acta-publica/${actaId}`

export const waShareUrl = (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`

export const mailtoShareUrl = (url, subject, text) =>
  `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
