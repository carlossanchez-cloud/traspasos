import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checklistDesde, textoEstadoActual, diferenciasChecklist, fotosDeActa, actaMasReciente } from './estadoActual.js'

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

test('diferenciasChecklist: solo las partes que cambiaron', () => {
  const antes = { 'Carrocería': { partes: { 'Capó': { estado: 'Regular', obs: 'rayón' } } } }
  const despues = { 'Carrocería': { partes: { 'Capó': { estado: 'Malo', obs: 'golpe' }, 'Baúl': { estado: 'Bueno', obs: '' } } } }
  const d = diferenciasChecklist(antes, despues)
  assert.deepEqual(d.map((x) => [x.parte, x.antes.estado, x.despues.estado]), [['Capó', 'Regular', 'Malo']])
})

test('fotosDeActa y actaMasReciente', () => {
  const acta = { id: 'r1', created_at: '2026-11-20', fotos_urls: ['a', 'b'], checklist: { fotos_recorrido: { x: 'a' }, 'Carrocería': { partes: { 'Capó': { foto: 'n1' } } } } }
  assert.deepEqual(fotosDeActa(acta).sort(), ['a', 'b', 'n1'])
  assert.equal(actaMasReciente([acta, { id: 'e0', created_at: '2026-11-01' }], { created_at: '2026-11-10' }).id, 'r1')
  assert.equal(actaMasReciente([{ id: 'e0', created_at: '2026-11-01' }], { created_at: '2026-11-10' }), null)
  assert.equal(actaMasReciente([{ ...acta, eliminada_en: 'x' }], null), null)
})
