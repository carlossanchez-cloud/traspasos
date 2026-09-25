import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabaseClient'
import { Icon } from '../lib/icons'
import { CITY_COORDS, cityCoords, distanceKm, titleCase } from '../lib/cityCoords'

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function cityIcon(stats) {
  const total = stats.Disponible + stats.Asignado + stats.Taller
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;width:85px;">
      <div style="background:#fff;border-radius:12px;box-shadow:0 10px 15px -3px rgb(0 0 0 / .15);border:1px solid #e2e8f0;padding:6px;display:flex;flex-direction:column;align-items:center;width:100%;">
        <div style="font-weight:700;font-size:10px;color:#1e293b;margin-bottom:4px;">${escapeHtml(stats.city)}</div>
        <div style="display:flex;gap:4px;">
          <span style="width:20px;height:20px;border-radius:6px;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:900;">${stats.Disponible}</span>
          <span style="width:20px;height:20px;border-radius:6px;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:900;">${stats.Asignado}</span>
          <span style="width:20px;height:20px;border-radius:6px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:900;">${stats.Taller}</span>
        </div>
      </div>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [85, 55], iconAnchor: [42, 55], popupAnchor: [0, -55] })
}

function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.setView(center, 8) }, [center, map])
  return null
}

export default function Mapa() {
  const [vehicles, setVehicles] = useState([])
  const [ciudadManual, setCiudadManual] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [flyCenter, setFlyCenter] = useState(null)
  const [cercanos, setCercanos] = useState([])

  useEffect(() => {
    supabase.from('vehicles').select('placa,modelo,ciudad,estado,cliente').then(({ data }) => setVehicles(data || []))
  }, [])

  const cityStats = useMemo(() => {
    const stats = {}
    vehicles.forEach((v) => {
      if (!v.ciudad) return
      const city = titleCase(v.ciudad)
      if (!stats[city]) stats[city] = { city, Disponible: 0, Asignado: 0, Taller: 0, vehiculos: [] }
      if (stats[city][v.estado] !== undefined) stats[city][v.estado]++
      stats[city].vehiculos.push(v)
    })
    return Object.values(stats)
  }, [vehicles])

  const buscarCercanos = (lat, lon) => {
    const disponibles = vehicles.filter((v) => v.estado === 'Disponible')
    const conDist = disponibles
      .map((v) => ({ ...v, dist: distanceKm([lat, lon], cityCoords(v.ciudad)) }))
      .sort((a, b) => a.dist - b.dist)
    setCercanos(conDist.slice(0, 3))
  }

  const usarMiUbicacion = () => {
    setBuscando(true)
    if (!('geolocation' in navigator)) { setBuscando(false); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => { buscarCercanos(pos.coords.latitude, pos.coords.longitude); setFlyCenter([pos.coords.latitude, pos.coords.longitude]); setBuscando(false) },
      () => setBuscando(false),
    )
  }

  const usarCiudadManual = () => {
    if (!ciudadManual) return
    const city = titleCase(ciudadManual)
    const coords = CITY_COORDS[city] || cityCoords(city)
    buscarCercanos(coords[0], coords[1])
    setFlyCenter(coords)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-black text-slate-800 mb-1">Mapa de la flota</h1>
      <p className="text-sm text-slate-500 mb-4">Ubicación de vehículos sustitutos por ciudad.</p>

      <div className="relative" style={{ height: 560 }}>
        <MapContainer center={[4.5709, -74.2973]} zoom={5} zoomControl={false} style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 0 }} className="border border-slate-200 shadow-sm">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" subdomains="abc" />
          <FlyTo center={flyCenter} />
          {cityStats.map((s) => (
            <Marker key={s.city} position={cityCoords(s.city)} icon={cityIcon(s)}>
              <Popup maxWidth={280} minWidth={240}>
                <div className="p-1">
                  <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-2 flex justify-between">
                    {s.city} <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{s.vehiculos.length} activos</span>
                  </h4>
                  <div className="max-h-[200px] overflow-y-auto text-sm">
                    {s.vehiculos.map((v) => (
                      <div key={v.placa} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <span className="font-mono font-bold text-slate-700 text-xs">{v.placa}</span>
                        <span className="text-[11px] text-slate-400">{v.estado === 'Asignado' ? v.cliente : v.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute top-4 right-4 sm:left-4 sm:right-auto z-[400] w-72 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 p-3 text-white flex items-center gap-2 text-sm font-bold">
            <Icon name="Crosshair" className="w-4 h-4 text-emerald-400" /> Encontrar disponible
          </div>
          <div className="p-4 flex flex-col gap-3">
            <button onClick={usarMiUbicacion} disabled={buscando} className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50">
              {buscando ? 'Ubicando...' : 'Usar mi GPS actual'}
            </button>
            <div className="flex gap-2">
              <input value={ciudadManual} onChange={(e) => setCiudadManual(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && usarCiudadManual()}
                placeholder="O escribe una ciudad..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button onClick={usarCiudadManual} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-lg"><Icon name="Search" className="w-4 h-4" /></button>
            </div>
            {cercanos.length > 0 && cercanos.map((v) => (
              <div key={v.placa} className="p-2 border border-emerald-200 bg-emerald-50 rounded-lg flex justify-between">
                <div><p className="font-mono font-bold text-slate-800 text-sm">{v.placa}</p><p className="text-[10px] text-slate-500 truncate max-w-[120px]">{v.modelo}</p></div>
                <div className="text-right"><p className="text-[10px] font-bold text-emerald-700">{v.ciudad}</p><p className="text-[10px] text-slate-500 font-mono">{Math.round(v.dist)} km</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
