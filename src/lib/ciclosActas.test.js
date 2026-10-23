import { test } from 'node:test'
import assert from 'node:assert/strict'
import { numActa, agruparActas, entregaAbierta } from './ciclosActas.js'

const acta = (id, tipo, placa, created_at, extra = {}) => ({ id, tipo, placa, created_at, ...extra })

test('numActa: numero con 4 cifras, o "Sin N.º" si el acta aun no lo tiene', () => {
  assert.equal(numActa({ consecutivo: 7 }), 'N.º 0007')
  assert.equal(numActa({ consecutivo: 12345 }), 'N.º 12345')
  assert.equal(numActa({}), 'Sin N.º')
})

test('agruparActas: empareja cada recibido con su entrega y deja aparte los recibidos sin entrega', () => {
  const actas = [
    acta('e1', 'Entrega', 'AAA111', '2026-10-01'),
    acta('r1', 'Recibido', 'AAA111', '2026-10-05', { acta_entrega_id: 'e1' }),
    acta('e2', 'Entrega', 'BBB222', '2026-10-03'),
    acta('r0', 'Recibido', 'CCC333', '2026-09-30'),
  ]
  const { ciclos, sueltas } = agruparActas(actas)
  assert.deepEqual(ciclos.map((c) => [c.entrega.id, c.recibido?.id ?? null]), [['e2', null], ['e1', 'r1']])
  assert.deepEqual(sueltas.map((s) => s.id), ['r0'])
})

test('entregaAbierta: la entrega de la placa que aun no tiene recibido', () => {
  const actas = [
    acta('e1', 'Entrega', 'AAA111', '2026-10-01'),
    acta('r1', 'Recibido', 'AAA111', '2026-10-05', { acta_entrega_id: 'e1' }),
    acta('e3', 'Entrega', 'AAA111', '2026-10-10'),
  ]
  assert.equal(entregaAbierta(actas, 'AAA111').id, 'e3')
  assert.equal(entregaAbierta(actas, 'ZZZ999'), null)
  assert.equal(entregaAbierta(actas.slice(0, 2), 'AAA111'), null)
})
