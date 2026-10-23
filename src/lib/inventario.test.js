import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mesesEnInventario, carga, promedioPonderado, pctVenta, saldoFavor, docsOk, semaforo } from './inventario.js'

const hoy = new Date('2026-10-31T00:00:00')

test('mesesEnInventario: hasta hoy si sigue en inventario, hasta la salida si ya salio (dias / 30)', () => {
  assert.equal(mesesEnInventario({ fecha_ingreso: '2026-10-01' }, hoy), 1)
  assert.equal(mesesEnInventario({ fecha_ingreso: '2026-07-03', fecha_salida: '2026-08-02' }, hoy), 1)
  assert.equal(mesesEnInventario({}, hoy), null)
})

test('carga y promedio ponderado: pesa mas el activo caro y viejo', () => {
  const a = { fecha_ingreso: '2026-10-01', valor_venta_propuesto: 10_000_000 } // 1 mes
  const b = { fecha_ingreso: '2026-07-03', valor_venta_propuesto: 30_000_000 } // 4 meses
  assert.equal(carga(a, hoy), 10_000_000)
  assert.equal(carga(b, hoy), 120_000_000)
  // (1*10 + 4*30) / 40 = 3.25 meses, no el promedio simple de 2.5
  assert.equal(promedioPonderado([a, b, { fecha_ingreso: '2026-01-01' }], hoy), 3.25)
  assert.equal(promedioPonderado([], hoy), null)
})

test('pctVenta y saldoFavor: como las columnas % Venta y VENTA - VPN del Excel', () => {
  const v = { valor_venta_propuesto: 20_000_000, valor_vendido: 18_000_000, valor_vpn: 15_000_000 }
  assert.equal(pctVenta(v), 0.9)
  assert.equal(saldoFavor(v), 3_000_000)
  assert.equal(pctVenta({ valor_venta_propuesto: 1 }), null)
  assert.equal(saldoFavor({ valor_vendido: 5 }), null)
})

test('docsOk y semaforo', () => {
  assert.equal(docsOk({ doc_fotos: 'OK', doc_avaluo: 'Ok', doc_tarjeta: 'NO' }), 2)
  assert.deepEqual([semaforo(2), semaforo(5), semaforo(9), semaforo(null)], ['emerald', 'amber', 'red', 'slate'])
})
