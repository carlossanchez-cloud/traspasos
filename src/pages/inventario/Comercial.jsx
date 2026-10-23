import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../lib/AuthProvider'
import { useToast } from '../../lib/useToast'
import { useInventario } from '../../lib/useInventario'
import { Icon } from '../../lib/icons'
import { formatDate, todayISO } from '../../lib/format'
import { ESTADOS_OFERTA, FUENTES_VENTA, SALIDAS, formatCOP, formatPct, pctVenta, saldoFavor } from '../../lib/inventario'
import Modal from '../../components/Modal'
import Toast from '../../components/Toast'
import { ButtonSpinner } from '../../components/Spinner'
import {
  InventarioLayout, EstadoCarga, Filtros, ChipMeses, Chip, Campos, Seccion, Dato,
} from './comun'
import { FILTRO_INICIAL, aplicarFiltros, nombreActivo, aFila } from '../../lib/inventarioVista'

// Area comercial: ofertas por cada activo en inventario y el cierre (venta o recolocacion), con % de venta
// (valor vendido / valor propuesto) y saldo a favor (vendido - VPN). Solo el Administrador general edita.

const TONO_OFERTA = { APROBADA: 'emerald', 'APROBADA EN PROCESO': 'emerald', 'VENTA FINALIZADA Y ACTIVO ENTREGADO': 'emerald', NEGADA: 'red', 'CLIENTE DESISTE': 'red', REOFERTAR: 'amber', 'EN COMITÉ': 'amber' }
const mejorOferta = (i) => i.ofertas.filter((o) => !['NEGADA', 'CLIENTE DESISTE'].includes(o.estado)).sort((a, b) => b.valor - a.valor)[0]

export default function InventarioComercial() {
  const inv = useInventario()
  const { isAdmin } = useAuth()
  const { toast, notify, clear } = useToast()
  const [f, setF] = useState(FILTRO_INICIAL)
  const [viendo, setViendo] = useState(null)
  const filas = useMemo(() => {
    const l = aplicarFiltros(inv.ingresos, f)
    return f.vista === 'en'
      ? l.sort((a, b) => (b.ofertas.length - a.ofertas.length) || (Number(b.valor_venta_propuesto) || 0) - (Number(a.valor_venta_propuesto) || 0))
      : l.sort((a, b) => (b.fecha_salida || '').localeCompare(a.fecha_salida || ''))
  }, [inv.ingresos, f])
  const actual = viendo && inv.ingresos.find((i) => i.id === viendo)

  return (
    <InventarioLayout>
      <h1 className="text-xl font-black text-slate-800">Inventario — Comercial</h1>
      <p className="text-sm text-slate-500 mb-4">Ofertas, ventas y recolocaciones de los activos.</p>
      <EstadoCarga inv={inv}>
        <Filtros f={f} setF={setF} ingresos={inv.ingresos} etiquetaSalieron="Vendidos y recolocados" />
        <p className="text-xs text-slate-500 mb-2">{filas.length} activo(s)</p>
        <div className="flex flex-col gap-2">
          {filas.slice(0, 300).map((i) => {
            const mejor = mejorOferta(i)
            return (
              <button key={i.id} onClick={() => setViendo(i.id)}
                className="text-left bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 hover:shadow-sm grid grid-cols-[1fr_auto] sm:grid-cols-[8rem_1fr_10rem_12rem] gap-x-3 gap-y-1 items-center">
                <span className="font-mono font-bold text-slate-800 truncate" title={i.activo_id}>{i.activo_id}</span>
                <span className="order-first sm:order-none col-span-2 sm:col-span-1 text-sm text-slate-600 truncate">{nombreActivo(i.activo)} <span className="text-slate-400">· {i.situacion}</span></span>
                <span className="text-sm text-slate-700 sm:text-right">{formatCOP(i.en_inventario ? i.valor_venta_propuesto : i.valor_vendido)}</span>
                <span className="flex flex-wrap items-center gap-1 justify-end">
                  {i.en_inventario ? (
                    <>
                      <ChipMeses ing={i} />
                      <Chip tono={i.ofertas.length ? 'amber' : 'slate'}>{i.ofertas.length} oferta(s)</Chip>
                      {mejor && <span className="text-[11px] text-slate-500 w-full text-right">mejor: {formatCOP(mejor.valor)}</span>}
                    </>
                  ) : (
                    <>
                      <Chip>{i.fecha_salida ? formatDate(i.fecha_salida) : 'sin fecha'}</Chip>
                      <Chip tono={pctVenta(i) >= 1 ? 'emerald' : pctVenta(i) >= 0.9 ? 'amber' : pctVenta(i) == null ? 'slate' : 'red'}>{formatPct(pctVenta(i))}</Chip>
                    </>
                  )}
                </span>
              </button>
            )
          })}
          {filas.length > 300 && <p className="text-xs text-slate-400 text-center py-2">Mostrando 300 de {filas.length}: usa la búsqueda o los filtros.</p>}
        </div>
      </EstadoCarga>
      {actual && <FichaComercial ing={actual} puedeEditar={isAdmin} onClose={() => setViendo(null)} onGuardado={inv.recargar} notify={notify} />}
      <Toast {...toast} onClose={clear} />
    </InventarioLayout>
  )
}

const CAMPOS_OFERTA = [
  ['fecha', 'Fecha', 'date'], ['ofertante', 'Quién ofrece', 'text'], ['valor', 'Valor ofrecido', 'money'],
  ['fuente', 'Fuente', 'select', FUENTES_VENTA], ['estado', 'Estado de la oferta', 'select', ESTADOS_OFERTA], ['notas', 'Notas', 'area'],
]
const CAMPOS_SALIDA = [
  ['situacion', 'Resultado', 'select', SALIDAS], ['fecha_salida', 'Fecha vendido / recolocado', 'date'],
  ['valor_vendido', 'Valor vendido / recolocado', 'money'], ['vendido_por', 'Vendido por', 'text'],
  ['fuente_venta', 'Fuente de la venta', 'select', FUENTES_VENTA], ['traspaso_a', 'Traspaso o recolocado a', 'text'],
  ['facturado_a', 'Facturado o recolocado a', 'text'], ['notas_venta', 'Notas de la venta', 'area'],
]

function FichaComercial({ ing, puedeEditar, onClose, onGuardado, notify }) {
  const [form, setForm] = useState(null) // 'oferta' | 'salida'
  const [v, setV] = useState({})
  const [guardando, setGuardando] = useState(false)
  const set = (k, val) => setV((x) => ({ ...x, [k]: val }))
  const abrir = (tipo, base = {}) => {
    setForm(tipo)
    setV(tipo === 'oferta'
      ? { fecha: todayISO(), estado: 'EN COMITÉ', ...base }
      : { situacion: 'Vendido Entregado', fecha_salida: todayISO(), ...base })
  }
  const guardar = async () => {
    setGuardando(true)
    let error
    if (form === 'oferta') {
      if (!v.ofertante || !v.valor) { setGuardando(false); notify('Escribe quién ofrece y el valor.', 'error'); return }
      ;({ error } = await supabase.from('inv_ofertas').insert({ ingreso_id: ing.id, ...aFila(CAMPOS_OFERTA, v) }))
    } else {
      if (!v.valor_vendido || !v.fecha_salida) { setGuardando(false); notify('El valor y la fecha son obligatorios.', 'error'); return }
      // Al registrar la salida, el activo deja de estar en inventario.
      ;({ error } = await supabase.from('inv_ingresos').update({ ...aFila(CAMPOS_SALIDA, v), en_inventario: false }).eq('id', ing.id))
    }
    setGuardando(false)
    if (error) { notify('No se pudo guardar: ' + error.message, 'error'); return }
    notify(form === 'oferta' ? 'Oferta registrada.' : 'Salida registrada: el activo salió del inventario.', 'success')
    setForm(null)
    onGuardado()
  }
  const cambiarEstado = async (o, estado) => {
    const { error } = await supabase.from('inv_ofertas').update({ estado }).eq('id', o.id)
    if (error) { notify('No se pudo cambiar: ' + error.message, 'error'); return }
    onGuardado()
  }

  return (
    <Modal title={`${ing.activo_id} — ${nombreActivo(ing.activo)}`} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Chip tono={ing.en_inventario ? 'emerald' : 'slate'}>{ing.en_inventario ? 'En inventario' : 'Salió del inventario'}</Chip>
        <Chip>{ing.situacion}</Chip>
        {ing.en_inventario && <ChipMeses ing={ing} />}
      </div>
      <div className="grid sm:grid-cols-2 gap-x-6">
        <Seccion titulo="Valores">
          <Dato label="Valor de venta propuesto">{formatCOP(ing.valor_venta_propuesto)}</Dato>
          <Dato label="Valor VPN (contable)">{formatCOP(ing.valor_vpn)}</Dato>
          <Dato label="Costo para recolocar">{formatCOP(ing.costo_recolocar)}</Dato>
          <Dato label="Calificación del estado">{ing.calificacion ? `${Math.round(ing.calificacion * 100)} %` : null}</Dato>
          <Dato label="Ubicación">{[ing.ciudad, ing.parqueadero].filter(Boolean).join(' · ') || null}</Dato>
        </Seccion>
        <Seccion titulo="Venta / recolocación">
          {ing.en_inventario ? <p className="text-sm text-slate-400 py-1.5">Todavía en inventario.</p> : (
            <>
              <Dato label="Resultado">{ing.situacion}</Dato>
              <Dato label="Fecha">{formatDate(ing.fecha_salida)}</Dato>
              <Dato label="Valor vendido / recolocado">{formatCOP(ing.valor_vendido)}</Dato>
              <Dato label="% de venta (vendido / propuesto)">{formatPct(pctVenta(ing))}</Dato>
              <Dato label="Saldo a favor (vendido − VPN)">{saldoFavor(ing) == null ? null : formatCOP(saldoFavor(ing))}</Dato>
              <Dato label="Vendido por">{ing.vendido_por}</Dato>
              <Dato label="Fuente">{ing.fuente_venta}</Dato>
              <Dato label="Traspaso o recolocado a">{ing.traspaso_a}</Dato>
              <Dato label="Facturado a">{ing.facturado_a}</Dato>
              {ing.notas_venta && <Dato label="Notas">{ing.notas_venta}</Dato>}
            </>
          )}
        </Seccion>
      </div>

      <Seccion titulo={`Ofertas (${ing.ofertas.length})`}
        accion={puedeEditar && ing.en_inventario && !form && (
          <button onClick={() => abrir('oferta')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50">
            <Icon name="Plus" className="w-3.5 h-3.5" /> Registrar oferta
          </button>
        )}>
        {ing.ofertas.length === 0 && <p className="text-sm text-slate-400">Sin ofertas registradas.</p>}
        <div className="flex flex-col gap-2">
          {ing.ofertas.map((o) => (
            <div key={o.id} className="border border-slate-200 rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{formatCOP(o.valor)} <span className="font-normal text-slate-500">· {o.ofertante}</span></p>
                <p className="text-[11px] text-slate-500">
                  {formatDate(o.fecha)}{o.fuente ? ` · ${o.fuente}` : ''}{ing.valor_venta_propuesto ? ` · ${formatPct(o.valor / ing.valor_venta_propuesto)} del propuesto` : ''}
                  {o.notas ? ` · ${o.notas}` : ''}
                </p>
              </div>
              {puedeEditar && ing.en_inventario ? (
                <select value={o.estado} onChange={(e) => cambiarEstado(o, e.target.value)} className="text-xs font-bold px-2 py-1 rounded-md border border-slate-200 bg-white">
                  {ESTADOS_OFERTA.map((e) => <option key={e}>{e}</option>)}
                </select>
              ) : <Chip tono={TONO_OFERTA[o.estado] || 'slate'}>{o.estado}</Chip>}
              {puedeEditar && ing.en_inventario && !form && ['APROBADA', 'APROBADA EN PROCESO'].includes(o.estado) && (
                <button onClick={() => abrir('salida', { valor_vendido: o.valor, traspaso_a: o.ofertante, facturado_a: o.ofertante, fuente_venta: o.fuente || '' })}
                  className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-600 text-white">Cerrar venta con esta oferta</button>
              )}
            </div>
          ))}
        </div>
      </Seccion>

      {puedeEditar && ing.en_inventario && !form && (
        <div className="flex justify-end mt-4">
          <button onClick={() => abrir('salida')} className="text-sm font-bold px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900">
            Registrar venta o recolocación
          </button>
        </div>
      )}

      {form && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm font-black text-slate-800 mb-2">{form === 'oferta' ? 'Nueva oferta' : 'Venta o recolocación'}</p>
          <Campos campos={form === 'oferta' ? CAMPOS_OFERTA : CAMPOS_SALIDA} valores={v} set={set} />
          {form === 'salida' && v.valor_vendido && ing.valor_venta_propuesto && (
            <p className="text-xs text-slate-500 mt-2">% de venta: <strong>{formatPct(v.valor_vendido / ing.valor_venta_propuesto)}</strong>
              {ing.valor_vpn ? <> · saldo a favor: <strong>{formatCOP(v.valor_vendido - ing.valor_vpn)}</strong></> : null}</p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setForm(null)} className="text-sm font-bold px-4 py-2 rounded-lg border border-slate-200">Cancelar</button>
            <button onClick={guardar} disabled={guardando} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">
              {guardando && <ButtonSpinner />} {form === 'oferta' ? 'Guardar oferta' : 'Registrar salida'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
