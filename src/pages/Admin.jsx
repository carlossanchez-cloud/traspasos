import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthProvider'
import { Icon } from '../lib/icons'
import { useToast } from '../lib/useToast'
import Toast from '../components/Toast'
import Spinner from '../components/Spinner'

export default function Admin() {
  const { profile } = useAuth()
  const { toast, notify, clear } = useToast()
  const [ciudades, setCiudades] = useState([])
  const [nueva, setNueva] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [{ data: c }, { data: u }] = await Promise.all([
      supabase.from('ciudades').select('nombre').order('nombre'),
      supabase.from('profiles').select('*').order('email'),
    ])
    setCiudades((c || []).map((r) => r.nombre))
    setUsuarios(u || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const agregar = async () => {
    const nombre = nueva.trim()
    if (!nombre) return
    const cased = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase()
    const { error } = await supabase.from('ciudades').insert({ nombre: cased })
    if (error) { notify('Error: ' + error.message, 'error'); return }
    setNueva(''); load()
  }

  const cambiarRol = async (u) => {
    if (u.id === profile.id) { notify('No puedes cambiar tu propio rol (evita quedarte sin acceso admin).', 'error'); return }
    const nuevoRol = u.role === 'admin' ? 'gestor' : 'admin'
    const { error } = await supabase.from('profiles').update({ role: nuevoRol }).eq('id', u.id)
    if (error) { notify('Error: ' + error.message, 'error'); return }
    notify(`${u.email} ahora es ${nuevoRol}.`, 'success')
    load()
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
        <h2 className="text-sm font-black text-slate-500 uppercase mb-3">Usuarios y roles</h2>
        <p className="text-xs text-slate-400 mb-3">Solo entra quien tenga correo @rentandes.com. Aparecen aquí en cuanto inician sesión por primera vez.</p>
        {loading ? (
          <Spinner label="Cargando usuarios..." className="py-6" />
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía nadie más ha iniciado sesión.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">{u.email}{u.id === profile.id && <span className="text-slate-400 font-normal"> (tú)</span>}</p>
                  <p className="text-[11px] text-slate-400">{u.full_name || 'sin nombre'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${u.role === 'admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {u.role}
                  </span>
                  <button onClick={() => cambiarRol(u)} disabled={u.id === profile.id}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed">
                    {u.role === 'admin' ? 'Bajar a gestor' : 'Subir a admin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast {...toast} onClose={clear} />
    </div>
  )
}
