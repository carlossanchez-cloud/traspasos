import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeDateFields } from './sanitizeDates.js'

test('sanitizeDateFields: convierte "" a null solo en los campos de fecha listados', () => {
  const payload = { placa: 'ABC123', fecha_inicio: '', fecha_fin: '2026-01-01', soat: '', rtm: '', modelo: '' }
  const out = sanitizeDateFields(payload, ['fecha_inicio', 'fecha_fin', 'soat', 'rtm'])
  assert.equal(out.fecha_inicio, null)
  assert.equal(out.fecha_fin, '2026-01-01')
  assert.equal(out.soat, null)
  assert.equal(out.rtm, null)
  assert.equal(out.modelo, '', 'campos de texto fuera de la lista no se tocan')
})
