import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Trae todo el inventario (activos, sus pasos por inventario y las ofertas) y lo une: cada ingreso lleva
// su `activo` y sus `ofertas`. Son pocos miles de filas, se filtra en el navegador.
// `faltaSql` = el proyecto de Supabase todavia no tiene las tablas (paso SQL 23).
export function useInventario() {
  const [estado, setEstado] = useState({ loading: true, error: null, faltaSql: false, ingresos: [], activos: [] })

  const cargar = useCallback(async () => {
    const todo = async (tabla) => {
      const filas = []
      for (let desde = 0; ; desde += 1000) {
        const { data, error } = await supabase.from(tabla).select('*').range(desde, desde + 999)
        if (error) throw error
        filas.push(...(data || []))
        if (!data || data.length < 1000) return filas
      }
    }
    try {
      const [activos, ingresos, ofertas] = await Promise.all([todo('inv_activos'), todo('inv_ingresos'), todo('inv_ofertas')])
      const porActivo = new Map(activos.map((a) => [a.id, a]))
      const ofertasDe = new Map()
      for (const o of ofertas) ofertasDe.set(o.ingreso_id, [...(ofertasDe.get(o.ingreso_id) || []), o])
      const unidos = ingresos.map((i) => ({
        ...i,
        activo: porActivo.get(i.activo_id) || { id: i.activo_id },
        ofertas: (ofertasDe.get(i.id) || []).sort((x, y) => (y.fecha || '').localeCompare(x.fecha || '')),
      }))
      setEstado({ loading: false, error: null, faltaSql: false, ingresos: unidos, activos })
    } catch (err) {
      const faltaSql = /inv_|schema cache|does not exist/i.test(err.message || '')
      setEstado({ loading: false, error: err.message, faltaSql, ingresos: [], activos: [] })
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])
  return { ...estado, recargar: cargar }
}
