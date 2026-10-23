// Ayudas de las pantallas de Inventario que no son componentes (filtros, nombre del activo, formularios).

export const nombreActivo = (a) => [a?.tipo, a?.marca, a?.linea, a?.modelo].filter(Boolean).join(' · ')

export const FILTRO_INICIAL = { vista: 'en', q: '', situacion: '', categoria: '', ciudad: '' }
export const aplicarFiltros = (ingresos, f) => {
  const q = f.q.trim().toLowerCase()
  return ingresos.filter((i) =>
    (f.vista === 'en' ? i.en_inventario : !i.en_inventario)
    && (!f.situacion || i.situacion === f.situacion)
    && (!f.categoria || i.activo?.categoria === f.categoria)
    && (!f.ciudad || i.ciudad === f.ciudad)
    && (!q || [i.activo_id, i.activo?.marca, i.activo?.linea, i.activo?.tipo, i.parqueadero, i.ultimo_contrato].some((v) => String(v || '').toLowerCase().includes(q))))
}

// Pasa los valores del formulario a lo que se guarda: '' -> null, numeros como numero.
export const aFila = (campos, valores) => Object.fromEntries(campos.map(([k, , tipo]) => {
  const v = valores[k]
  if (v === '' || v == null) return [k, null]
  return [k, tipo === 'num' || tipo === 'money' || k === 'calificacion' ? Number(v) : v]
}))
