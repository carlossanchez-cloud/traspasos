import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'

// Cuantas solicitudes de sustituto esperan asignacion: el numero rojo junto a "Asignaciones" en el menu.
// Se vuelve a contar al cambiar de pantalla, cada minuto y cuando alguien avisa con avisarSolicitudes()
// (al enviar una solicitud o asignar un vehiculo).
const EVENTO = 'solicitudes-cambiaron'
export const avisarSolicitudes = () => window.dispatchEvent(new Event(EVENTO))

export function usePendientes(activo) {
  const [n, setN] = useState(0)
  const { pathname } = useLocation()
  useEffect(() => {
    if (!activo) return undefined
    let vivo = true
    const contar = async () => {
      const { count } = await supabase.from('solicitudes').select('id', { count: 'exact', head: true }).eq('estado', 'Pendiente')
      if (vivo && count != null) setN(count)
    }
    contar()
    const reloj = setInterval(contar, 60000)
    window.addEventListener(EVENTO, contar)
    return () => { vivo = false; clearInterval(reloj); window.removeEventListener(EVENTO, contar) }
  }, [activo, pathname])
  return activo ? n : 0
}
