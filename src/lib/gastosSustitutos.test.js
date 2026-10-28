import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GASTOS, totalMes, totalDia, depreciacionMes } from './gastosSustitutos.js'

test('totalMes y totalDia dan lo mismo que las columnas del Excel', () => {
  const lhv966 = GASTOS.find((g) => g.placa === 'LHV966') // Excel: 955401,75 mes, 31846,73 dia
  assert.ok(Math.abs(totalMes(lhv966) - 955401.75) < 2)
  assert.ok(Math.abs(totalDia(lhv966) - 31846.725) < 0.1)
  const lhv289 = GASTOS.find((g) => g.placa === 'LHV289') // Excel: 213787,08 (sin parqueadero ni mantenimiento)
  assert.ok(Math.abs(totalMes(lhv289) - 213787.08) < 2)
})

test('depreciacionMes: 0,5 % del valor del activo, o nada si el Excel no lo trae', () => {
  assert.equal(depreciacionMes({ valor_activo: 100_000_000, depreciacion_pct: 0.005 }), 500_000)
  assert.equal(depreciacionMes({ valor_activo: 100_000_000 }), null)
})

test('una fila por placa', () => {
  assert.equal(new Set(GASTOS.map((g) => g.placa)).size, GASTOS.length)
})
