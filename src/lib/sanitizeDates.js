// Postgres 'date' rechaza '' ("invalid input syntax for type date: \"\""), solo acepta una
// fecha valida o null. Los forms de React dejan estos campos en '' cuando quedan vacios.
export function sanitizeDateFields(payload, dateFields) {
  const out = { ...payload }
  for (const f of dateFields) if (out[f] === '') out[f] = null
  return out
}
