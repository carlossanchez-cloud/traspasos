import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Icon } from '../lib/icons'
import { useToast } from '../lib/useToast'
import Toast from '../components/Toast'

export default function Admin() {
  const { toast, notify, clear } = useToast()
  const [ciudades, setCiudades] = useState([])
  const [nueva, setNueva] = useState('')

  const load = () => supabase.from('ciudades').select('nombre').order('nombre').then(({ data }) => setCiudades((data || []).map((r) => r.nombre)))
  useEffect(() => { load() }, [])

  const agregar = async () => {
    const nombre = nueva.trim()
    if (!nombre) return
    const cased = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase()
    const { error } = await supabase.from('ciudades').insert({ nombre: cased })
    if (error) { notify('Error: ' + error.message, 'error'); return }
    setNueva(''); load()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-black text-slate-800 mb-1">Administrador</h1>
      <p className="text-sm text-slate-500 mb-6">Configuración general de la plataforma.</p>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-black text-slate-500 uppercase mb-3">Ciudades</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {ciudades.map((c) => <span key={c} className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{c}</span>)}
        </div>
        <div className="flex gap-2">
          <input value={nueva} onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregar()}
            placeholder="Nombre de la nueva ciudad" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          <button onClick={agregar} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg">
            <Icon name="Plus" className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-black text-slate-500 uppercase mb-2">Usuarios y roles</h2>
        <p className="text-sm text-slate-500">
          Los roles (admin/gestor) se asignan en la tabla <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">profiles</code> de
          Supabase (Table Editor), no desde aquí — solo entra quien tenga correo @rentandes.com.
        </p>
      </div>

      <Toast {...toast} onClose={clear} />
    </div>
  )
}
