import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Icon } from '../lib/icons'
import { formatDate, todayISO } from '../lib/format'
import Spinner from '../components/Spinner'

const FILTROS = ['Todos', 'Préstamos Activos', 'En Taller', 'Devueltos/Cerrados']

export default function Informes() {
  const [historial, setHistorial] = useState([])
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState('Todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('historial').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setHistorial(data || []); setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => historial.filter((h) => {
    const q = search.toLowerCase()
    const matchSearch = !q || h.placa.toLowerCase().includes(q) || (h.cliente || '').toLowerCase().includes(q)
    const isActive = !h.fecha_devolucion_real
    let matchFiltro = true
    if (filtro === 'Préstamos Activos') matchFiltro = isActive && h.tipo === 'Asignado'
    else if (filtro === 'En Taller') matchFiltro = isActive && h.tipo === 'Taller'
    else if (filtro === 'Devueltos/Cerrados') matchFiltro = !isActive
    return matchSearch && matchFiltro
  }), [historial, search, filtro])

  const exportCSV = () => {
    const headers = ['Estado', 'Placa', 'Tipo', 'Cliente/Ubicación', 'Admin Flota', 'Sustituyó A', 'Fecha Inicio', 'Fecha Devolución', 'Días', 'KM Inicio', 'KM Fin', 'Novedades Ingreso', 'Novedades Retorno']
    const rows = filtered.map((h) => {
      const isActive = !h.fecha_devolucion_real
      const estado = isActive ? (h.tipo === 'Taller' ? 'En Taller' : 'En Préstamo') : (h.tipo === 'Taller' ? 'Salió de Taller' : 'Devuelto')
      const dias = Math.ceil(Math.abs(new Date((h.fecha_devolucion_real || todayISO()) + 'T00:00:00') - new Date(h.fecha_inicio + 'T00:00:00')) / 86400000)
      return [estado, h.placa, h.tipo, h.cliente, h.admin_flota, h.placa_sustituida || 'N/A', formatDate(h.fecha_inicio),
        isActive ? 'Pendiente' : formatDate(h.fecha_devolucion_real), dias, h.km_inicio ?? '', isActive ? 'Pendiente' : (h.km_fin ?? ''),
        h.novedades_asignacion || 'Sin novedades', h.novedades_retorno || 'Sin novedades']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')
    })
    const csv = [headers.join(';'), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Informe_Flota_${todayISO()}.csv`
    link.click()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800">Informes e historial</h1>
          <p className="text-sm text-slate-500">Préstamos, devoluciones y paso por taller.</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-lg">
          <Icon name="Download" className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Icon name="Search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar placa o cliente..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
          {FILTROS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </div>

      {loading ? (
        <Spinner label="Cargando historial..." />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">Sin registros para este filtro.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="p-3">Placa</th><th className="p-3">Tipo</th><th className="p-3">Cliente/Ubicación</th>
                <th className="p-3">Inicio</th><th className="p-3">Devolución</th><th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id} className="border-b border-slate-50 last:border-0">
                  <td className="p-3 font-mono font-bold">{h.placa}</td>
                  <td className="p-3">{h.tipo}</td>
                  <td className="p-3">{h.cliente}</td>
                  <td className="p-3">{formatDate(h.fecha_inicio)}</td>
                  <td className="p-3">{h.fecha_devolucion_real ? formatDate(h.fecha_devolucion_real) : '-'}</td>
                  <td className="p-3">{h.fecha_devolucion_real ? 'Cerrado' : 'Activo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
