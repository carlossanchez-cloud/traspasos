import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDate, formatKM, isExpired, daysDiff, todayISO } from './format.js'

test('formatDate: dd/mm/yyyy en español, "-" si vacío', () => {
  assert.equal(formatDate('2026-09-23'), '23/09/2026')
  assert.equal(formatDate(''), '-')
  assert.equal(formatDate(null), '-')
})

test('formatKM: separador de miles es_CO', () => {
  assert.equal(formatKM(12345), '12.345 km')
  assert.equal(formatKM(0), '0 km')
  assert.equal(formatKM(null), '0 km')
})

test('isExpired: fecha pasada true, futura false, vacía true', () => {
  assert.equal(isExpired('2020-01-01'), true)
  assert.equal(isExpired('2099-01-01'), false)
  assert.equal(isExpired(''), true)
  assert.equal(isExpired(null), true)
})

test('daysDiff: diferencia en días entre dos ISO dates', () => {
  assert.equal(daysDiff('2026-09-01', '2026-09-13'), 12)
  assert.equal(daysDiff('2026-09-13', '2026-09-01'), -12)
  assert.equal(daysDiff('2026-09-01', '2026-09-01'), 0)
})

test('todayISO: formato YYYY-MM-DD', () => {
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/)
})
