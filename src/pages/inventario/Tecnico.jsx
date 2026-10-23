import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../lib/AuthProvider'
import { useToast } from '../../lib/useToast'
import { useInventario } from '../../lib/useInventario'
import { Icon } from '../../lib/icons'
import { formatDate, todayISO } from '../../lib/format'
import {
  CALIFICACIONES, CATEGORIAS, CIUDADES, DOCUMENTOS, ORIGENES, SITUACIONES, carga, docsOk, formatCOP, formatMeses,
  mesesEnInventario,
} from '../../lib/inventario'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import { ButtonSpinner } from '../../components/Spinner'
import {
  InventarioLayout, EstadoCarga, Filtros, ChipMeses, Chip, Campos, Seccion, Dato,
} from './comun'
import { FILTRO_INICIAL, aplicarFiltros, nombreActivo, aFila } from '../../lib/inventarioVista'

// Area tecnica: estado, ubicacion, documentos, reparaciones, precios y lo operativo (SOAT, RTM, combustible).
// Solo el Administrador general edita (la base de datos tambien lo exige, paso SQL 23).

const SECCIONES = [
  ['Estado y ubicación', [
    ['situacion', 'Estado del activo', 'select', SITUACIONES], ['origen', 'Origen', 'select', ORIGENES],
    ['fecha_ingreso', 'Fecha ingreso a inventario', 'date'], ['fecha_recuperado', 'Fecha recuperado (custodia)', 'date'],
    ['ciudad', 'Ciudad', 'text'], ['parqueadero', 'Parqueadero', 'text'], ['direccion', 'Dirección', 'text'], ['km_hr', 'Km / horas', 'num'],
    ['proyecto_cliente', 'Proyecto / cliente', 'text'], ['ultimo_contrato', 'Último contrato / cliente', 'text'],
    ['administrador_flota', 'Administrador de flota', 'text'],
  ]],
  ['Documentos', [
    ...DOCUMENTOS.map(([k, l]) => [k, l, 'docsel']), ['reclamacion_siniestros', '¿Reclamaciones de siniestros?', 'select', ['SI', 'NO']],
    ['link_carpeta', 'Link carpeta', 'text'], ['pag_web', 'Página web', 'text'],
  ]],
  ['Estado técnico y reparaciones', [
    ['calificacion', 'Calificación del estado', 'select', CALIFICACIONES.map(([v, t]) => [v, `${Math.round(v * 100)} % — ${t}`])],
    ['tiempo_reparacion', 'Tiempo reparación + prueba de calidad (días)', 'num'], ['costo_reparaciones', 'Costo reparaciones', 'money'],
    ['costo_recolocar', 'Costo para recolocar (rep. + operativo)', 'money'], ['fecha_solicitud_avaluo', 'Fecha solicitud avalúo', 'date'],
    ['fecha_ultima_acta_valor', 'Fecha última acta de valor', 'date'], ['detalle_reparaciones', 'Detalle reparaciones, recolocación y recepción', 'area'],
  ]],
  ['Precios', [['valor_venta_propuesto', 'Valor de venta propuesto', 'money'], ['valor_vpn', 'Valor VPN (contable)', 'money']]],
  ['Operativo', [
    ['nivel_combustible', 'Nivel de combustible (0 a 1)', 'num'], ['fecha_revision_combustible', 'Fecha revisión combustible', 'date'],
    ['vence_soat', 'Vence SOAT', 'date'], ['vence_rtm', 'Vence tecnomecánica', 'date'], ['observaciones_estado', 'Observaciones', 'area'],
  ]],
]
const CAMPOS_TECNICOS = SECCIONES.flatMap(([, c]) => c)
const CAMPOS_ACTIVO = [
  ['categoria', 'Categoría', 'select', CATEGORIAS], ['tipo', 'Tipo', 'text'], ['marca', 'Marca', 'text'], ['linea', 'Línea', 'text'],
  ['clase', 'Clase', 'text'], ['tipo_servicio', 'Servicio', 'select', ['Particular', 'Publico']], ['modelo', 'Modelo (año)', 'num'],
]

export default function InventarioTecnico() {
  const inv = useInventario()
  const { isAdmin } = useAuth()
  const { toast, notify, clear } = useToast()
  const [f, setF] = useState(FILTRO_INICIAL)
  const [orden, setOrden] = useState('meses')
  const [viendo, setViendo] = useState(null)
  const [nuevo, setNuevo] = useState(false)
  const filas = useMemo(() => {
    const l = aplicarFiltros(inv.ingresos, f)
    const clave = { meses: (i) => mesesEnInventario(i) || 0, carga: (i) => carga(i), valor: (i) => Number(i.valor_venta_propuesto) || 0 }[orden]
    return f.vista === 'en' ? l.sort((a, b) => clave(b) - clave(a)) : l.sort((a, b) => (b.fecha_salida || '').localeCompare(a.fecha_salida || ''))
  }, [inv.ingresos, f, orden])
  const actual = viendo && inv.ingresos.find((i) => i.id === viendo)

  return (
    <InventarioLayout>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800">Inventario — Técnico</h1>
          <p className="text-sm text-slate-500">Estado, ubicación, documentos, reparaciones y precios de cada activo.</p>
        </div>
        {isAdmin && !inv.faltaSql && (
          <button onClick={() => setNuevo(true)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg">
            <Icon name="Plus" className="w-4 h-4" /> Ingreso a inventario
          </button>
        )}
      </div>
      <EstadoCarga inv={inv}>
        <Filtros f={f} setF={setF} ingresos={inv.ingresos} />
        <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
          <span>{filas.length} activo(s)</span>
          {f.vista === 'en' && (
            <label className="flex items-center gap-1">Ordenar por
              <select value={orden} onChange={(e) => setOrden(e.target.value)} className="px-2 py-1 bg-white border border-slate-200 rounded-md">
                <option value="meses">Más tiempo en inventario</option><option value="carga">Mayor carga</option><option value="valor">Mayor valor</option>
              </select>
            </label>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {filas.slice(0, 300).map((i) => (
            <button key={i.id} onClick={() => setViendo(i.id)}
              className="text-left bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 hover:shadow-sm grid grid-cols-[1fr_auto] sm:grid-cols-[8rem_1fr_11rem_7rem_6rem] gap-x-3 gap-y-1 items-center">
              <span className="font-mono font-bold text-slate-800 truncate" title={i.activo_id}>{i.activo_id}</span>
              <span className="sm:order-none order-first col-span-2 sm:col-span-1 text-sm text-slate-600 truncate">{nombreActivo(i.activo)}</span>
              <span className="text-xs text-slate-500 truncate">{i.situacion}<br className="hidden sm:block" /><span className="sm:hidden"> · </span>{[i.ciudad, i.parqueadero].filter(Boolean).join(' · ')}</span>
              <span className="text-sm text-slate-700 sm:text-right">{formatCOP(i.valor_venta_propuesto)}</span>
              <span className="flex sm:flex-col items-center sm:items-end gap-1 justify-end">
                {i.en_inventario ? <ChipMeses ing={i} /> : <Chip>{i.fecha_salida ? formatDate(i.fecha_salida) : 'sin fecha'}</Chip>}
                <span className="text-[10px] text-slate-400">docs {docsOk(i)}/{DOCUMENTOS.length}</span>
              </span>
            </button>
          ))}
          {filas.length > 300 && <p className="text-xs text-slate-400 text-center py-2">Mostrando 300 de {filas.length}: usa la búsqueda o los filtros.</p>}
        </div>
      </EstadoCarga>

      {actual && <FichaTecnica ing={actual} historial={inv.ingresos.filter((x) => x.activo_id === actual.activo_id)}
        puedeEditar={isAdmin} onClose={() => setViendo(null)} onGuardado={inv.recargar} notify={notify} />}
      {nuevo && <NuevoIngreso inv={inv} onClose={() => setNuevo(false)} notify={notify}
        onCreado={(id) => { setNuevo(false); inv.recargar().then(() => setViendo(id)) }} />}
      <Toast {...toast} onClose={clear} />
    </InventarioLayout>
  )
}

function FichaTecnica({ ing, historial, puedeEditar, onClose, onGuardado, notify }) {
  const [editando, setEditando] = useState(false)
  const [v, setV] = useState({})
  const [guardando, setGuardando] = useState(false)
  const empezar = () => { setV({ ...ing, ...Object.fromEntries(CAMPOS_ACTIVO.map(([k]) => [`a_${k}`, ing.activo?.[k] ?? ''])) }); setEditando(true) }
  const set = (k, val) => setV((x) => ({ ...x, [k]: val }))
  const guardar = async () => {
    if (!v.situacion || !v.fecha_ingreso) { notify('El estado y la fecha de ingreso son obligatorios.', 'error'); return }
    setGuardando(true)
    const activo = aFila(CAMPOS_ACTIVO, Object.fromEntries(CAMPOS_ACTIVO.map(([k]) => [k, v[`a_${k}`]])))
    const [r1, r2] = await Promise.all([
      supabase.from('inv_ingresos').update(aFila(CAMPOS_TECNICOS, v)).eq('id', ing.id),
      supabase.from('inv_activos').update(activo).eq('id', ing.activo_id),
    ])
    setGuardando(false)
    const error = r1.error || r2.error
    if (error) { notify('No se pudo guardar: ' + error.message, 'error'); return }
    notify('Cambios guardados.', 'success')
    setEditando(false)
    onGuardado()
  }
  const camposActivo = CAMPOS_ACTIVO.map(([k, ...r]) => [`a_${k}`, ...r])

  return (
    <Modal title={`${ing.activo_id} — ${nombreActivo(ing.activo)}`} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Chip tono={ing.en_inventario ? 'emerald' : 'slate'}>{ing.en_inventario ? 'En inventario' : 'Salió del inventario'}</Chip>
        <Chip>{ing.situacion}</Chip>
        {ing.en_inventario && <ChipMeses ing={ing} />}
        {puedeEditar && !editando && (
          <button onClick={empezar} className="ml-auto flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50">
            <Icon name="Pencil" className="w-3.5 h-3.5" /> Editar
          </button>
        )}
      </div>

      {editando ? (
        <div>
          <Seccion titulo="Activo"><Campos campos={camposActivo} valores={v} set={set} /></Seccion>
          {SECCIONES.map(([t, c]) => (
            <Seccion key={t} titulo={t}><Campos campos={c} valores={v} set={set} listas={{ ciudad: CIUDADES }} /></Seccion>
          ))}
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
            <button onClick={() => setEditando(false)} className="text-sm font-bold px-4 py-2 rounded-lg border border-slate-200">Cancelar</button>
            <button onClick={guardar} disabled={guardando} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">
              {guardando && <ButtonSpinner />} Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-x-6">
          <Seccion titulo="Activo">
            {CAMPOS_ACTIVO.map(([k, l]) => <Dato key={k} label={l}>{ing.activo?.[k]}</Dato>)}
          </Seccion>
          {SECCIONES.map(([t, c]) => (
            <Seccion key={t} titulo={t}>
              {c.map(([k, l, tipo]) => <Dato key={k} label={l}>{mostrar(ing[k], tipo, k)}</Dato>)}
              {t === 'Precios' && <Dato label="Valor recolocación full (venta + costo recolocar)">{formatCOP((Number(ing.valor_venta_propuesto) || 0) + (Number(ing.costo_recolocar) || 0))}</Dato>}
              {t === 'Estado y ubicación' && <Dato label="Meses en inventario">{formatMeses(mesesEnInventario(ing))}</Dato>}
            </Seccion>
          ))}
          <Seccion titulo={`Historial en inventario (${historial.length})`}>
            {[...historial].sort((a, b) => (b.fecha_ingreso || '').localeCompare(a.fecha_ingreso || '')).map((h) => (
              <Dato key={h.id} label={`${formatDate(h.fecha_ingreso)} → ${h.fecha_salida ? formatDate(h.fecha_salida) : 'hoy'}`}>
                {h.situacion}{h.id === ing.id ? ' (este)' : ''}
              </Dato>
            ))}
          </Seccion>
        </div>
      )}
    </Modal>
  )
}

const mostrar = (v, tipo, k) => {
  if (v == null || v === '') return null
  if (tipo === 'date') return formatDate(v)
  if (tipo === 'money') return formatCOP(v)
  if (k === 'calificacion') return `${Math.round(v * 100)} %`
  if (k === 'nivel_combustible') return `${Math.round(v * 100)} %`
  if (k === 'link_carpeta' || k === 'pag_web') return <a href={v} target="_blank" rel="noreferrer" className="text-emerald-700 underline">Abrir</a>
  return String(v)
}

// Ingreso a inventario: de un activo nuevo o de uno que ya estuvo (y salio). No deja abrir un segundo
// ingreso de un activo que sigue en inventario (la base de datos tambien lo impide).
function NuevoIngreso({ inv, onClose, onCreado, notify }) {
  const [v, setV] = useState({ fecha_ingreso: todayISO(), situacion: 'En Avalúo', categoria: 'Automoviles' })
  const [guardando, setGuardando] = useState(false)
  const set = (k, val) => setV((x) => ({ ...x, [k]: val }))
  const id = (v.id || '').trim().toUpperCase()
  const existente = inv.activos.find((a) => a.id === id)
  const abierto = inv.ingresos.find((i) => i.activo_id === id && i.en_inventario)
  const elegirId = (val) => {
    const a = inv.activos.find((x) => x.id === val.trim().toUpperCase())
    setV((x) => ({ ...x, id: val, ...(a ? Object.fromEntries(CAMPOS_ACTIVO.map(([k]) => [k, a[k] ?? ''])) : {}) }))
  }
  const camposIngreso = [
    ['fecha_ingreso', 'Fecha ingreso a inventario', 'date'], ['situacion', 'Estado', 'select', SITUACIONES], ['origen', 'Origen', 'select', ORIGENES],
    ['ciudad', 'Ciudad', 'text'], ['parqueadero', 'Parqueadero', 'text'], ['km_hr', 'Km / horas', 'num'], ['ultimo_contrato', 'Último contrato / cliente', 'text'],
  ]
  const guardar = async () => {
    if (!id) { notify('Escribe la placa o ID del activo.', 'error'); return }
    if (abierto) { notify(`${id} ya está en inventario.`, 'error'); return }
    setGuardando(true)
    const activo = { id, ...aFila(CAMPOS_ACTIVO, v) }
    const r1 = existente
      ? await supabase.from('inv_activos').update(aFila(CAMPOS_ACTIVO, v)).eq('id', id)
      : await supabase.from('inv_activos').insert(activo)
    const r2 = r1.error ? r1 : await supabase.from('inv_ingresos').insert({ activo_id: id, en_inventario: true, ...aFila(camposIngreso, v) }).select('id').single()
    setGuardando(false)
    if (r2.error) { notify('No se pudo guardar: ' + r2.error.message, 'error'); return }
    notify(`${id} ingresó al inventario.`, 'success')
    onCreado(r2.data.id)
  }
  return (
    <Modal title="Ingreso a inventario" onClose={onClose} wide>
      <label className="block text-xs font-bold text-slate-500 uppercase">Placa o ID del activo
        <input value={v.id || ''} onChange={(e) => elegirId(e.target.value)} list="lista-activos"
          className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono uppercase" />
        <datalist id="lista-activos">{inv.activos.slice(0, 2000).map((a) => <option key={a.id} value={a.id} />)}</datalist>
      </label>
      {id && (
        <p className={`text-xs mt-2 rounded-lg px-3 py-2 border ${abierto ? 'bg-red-50 text-red-700 border-red-200' : existente ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          {abierto ? `${id} ya está en inventario desde el ${formatDate(abierto.fecha_ingreso)}.`
            : existente ? `${id} ya estuvo en inventario: se abre un ingreso nuevo con sus datos.` : 'Activo nuevo: completa sus datos.'}
        </p>
      )}
      <Seccion titulo="Activo"><Campos campos={CAMPOS_ACTIVO} valores={v} set={set} /></Seccion>
      <Seccion titulo="Ingreso"><Campos campos={camposIngreso} valores={v} set={set} listas={{ ciudad: CIUDADES }} /></Seccion>
      <p className="text-xs text-slate-400 mt-3">Documentos, reparaciones y precios se completan después en la ficha (Editar).</p>
      <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
        <button onClick={guardar} disabled={guardando || !!abierto} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">
          {guardando && <ButtonSpinner />} Guardar ingreso
        </button>
      </div>
    </Modal>
  )
}
