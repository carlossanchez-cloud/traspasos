import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Icon } from '../lib/icons'
import { formatDate, formatKM, isExpired, STATUS_STYLE } from '../lib/format'
import { overallMtoPct } from '../lib/maintenance'
import { pdfOrientation } from '../lib/pdf'
import VehiclePhoto from '../components/VehiclePhoto'
import MaintenancePanel from '../components/MaintenancePanel'
import Spinner from '../components/Spinner'
import { ButtonSpinner } from '../components/Spinner'

function Row({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold text-slate-400 uppercase">{label}</span>
      <span className={`text-sm font-semibold ${warn ? 'text-red-600' : 'text-slate-700'}`}>{value}</span>
    </div>
  )
}

export default function Ficha() {
  const { id } = useParams()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const printRef = useRef(null)

  useEffect(() => {
    supabase.from('vehicles').select('*').eq('id', id).single()
      .then(({ data }) => { setVehicle(data); setLoading(false) })
  }, [id])

  const downloadPDF = async () => {
    setExporting(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: pdfOrientation(canvas.width, canvas.height), unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`Ficha_${vehicle.placa}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <Spinner label="Cargando ficha..." className="py-24" />
  if (!vehicle) return <p className="text-sm text-slate-400 text-center py-24">Vehículo no encontrado.</p>

  const style = STATUS_STYLE[vehicle.estado]
  const soatExpired = isExpired(vehicle.soat)
  const rtmExpired = isExpired(vehicle.rtm)
  const overall = overallMtoPct(vehicle.mto_detalle, vehicle.km_actual)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
          <Icon name="ArrowLeft" className="w-4 h-4" /> Volver a la flota
        </Link>
        <button onClick={downloadPDF} disabled={exporting}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50">
          {exporting ? <ButtonSpinner /> : <Icon name="Download" className="w-4 h-4" />}
          {exporting ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>

      <div ref={printRef} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-b from-slate-50 to-slate-100 px-6 pt-6 pb-2 flex justify-center">
          <VehiclePhoto placa={vehicle.placa} tipo={vehicle.tipo_vehiculo} className="w-full h-32" />
        </div>
        <div className="p-6">
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <p className="font-mono font-black text-2xl text-slate-800">{vehicle.placa}</p>
            <p className="text-sm text-slate-500">{vehicle.modelo} &middot; {vehicle.tipo_vehiculo}</p>
          </div>
          <div className="text-right shrink-0">
            <img src="/rentandes-logo.png" alt="rentandes" className="h-5 w-auto mb-2 ml-auto" />
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${style.badge}`}>{vehicle.estado}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ubicación y asignación</p>
            <Row label="Ciudad" value={vehicle.ciudad} />
            {vehicle.estado === 'Asignado' && (
              <>
                <Row label="Cliente" value={vehicle.cliente || '-'} />
                <Row label="Admin de flota" value={vehicle.admin_flota || '-'} />
                <Row label="Placa sustituida" value={vehicle.placa_sustituida || '-'} />
                <Row label="Desde" value={formatDate(vehicle.fecha_inicio)} />
                <Row label="Hasta" value={formatDate(vehicle.fecha_fin)} warn={isExpired(vehicle.fecha_fin)} />
              </>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1 mt-4 sm:mt-0">Estado del vehículo</p>
            <Row label="Kilometraje" value={formatKM(vehicle.km_actual)} />
            <Row label="Combustible" value={vehicle.nivel_combustible} />
            <Row label="SOAT vence" value={formatDate(vehicle.soat)} warn={soatExpired} />
            <Row label="RTM vence" value={formatDate(vehicle.rtm)} warn={rtmExpired} />
            <Row label="Desgaste general" value={`${overall}%`} warn={overall >= 90} />
          </div>
        </div>

        {vehicle.observaciones && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Observaciones</p>
            <p className="text-sm text-slate-600">{vehicle.observaciones}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100">
          <MaintenancePanel detalle={vehicle.mto_detalle} kmActual={vehicle.km_actual} onChange={() => {}} readOnly />
        </div>
        </div>
      </div>
    </div>
  )
}
