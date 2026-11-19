import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checklistDesde, textoEstadoActual } from './estadoActual.js'

test('checklistDesde: conserva lo guardado y completa las partes que falten en Bueno', () => {
  const c = checklistDesde({ 'Carrocería': { partes: { 'Capó': { estado: 'Malo', obs: 'golpe' } } } })
  assert.deepEqual(c['Carrocería'].partes['Capó'], { estado: 'Malo', obs: 'golpe' })
  assert.equal(c['Carrocería'].partes['Baúl'].estado, 'Bueno')
  assert.ok(c['Llantas'].partes)
})

test('textoEstadoActual: lista las novedades para avisarle al cliente', () => {
  const t = textoEstadoActual({ placa: 'LUX232', modelo: 'CHEVROLET CAPTIVA' },
    { created_at: '2026-11-19T10:00:00Z', checklist: { 'Carrocería': { partes: { 'Capó': { estado: 'Regular', obs: 'rayón' } } } }, observaciones: 'Tapicería sucia' })
  assert.match(t, /Estado actual del vehículo LUX232 — CHEVROLET CAPTIVA/)
  assert.match(t, /- Carrocería › Capó: Regular \(rayón\)/)
  assert.match(t, /Observaciones: Tapicería sucia/)
})
