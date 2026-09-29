import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rankBy, prestamosPorMes } from './informesCharts.js'

test('prestamosPorMes: agrupa por mes de fecha_inicio dentro de una ventana fija de 6 meses', () => {
  const now = new Date(2026, 8, 15) // sep 2026, fecha fija para que el test no dependa del reloj
  const rows = [{ fecha_inicio: '2026-09-05' }, { fecha_inicio: '2026-09-20' }, { fecha_inicio: '1999-01-15' }]
  const out = prestamosPorMes(rows, now)
  assert.equal(out.length, 6)
  assert.equal(out[5].n, 2, 'el ultimo mes del arreglo (el actual) cuenta las 2 filas de septiembre')
  assert.equal(out.reduce((a, m) => a + m.n, 0), 2, 'la fila de 1999 queda fuera de la ventana de 6 meses')
})

test('prestamosPorMes: sin filas no explota, todos los meses en 0', () => {
  const out = prestamosPorMes([], new Date(2026, 8, 15))
  assert.equal(out.length, 6)
  assert.ok(out.every((m) => m.n === 0))
})

test('rankBy: cuenta y ordena descendente, agrupa valores faltantes como "Sin dato"', () => {
  const rows = [{ cliente: 'Acme' }, { cliente: 'Acme' }, { cliente: 'Beta' }, { cliente: null }]
  const out = rankBy(rows, 'cliente')
  assert.deepEqual(out, [{ label: 'Acme', n: 2 }, { label: 'Beta', n: 1 }, { label: 'Sin dato', n: 1 }])
})
