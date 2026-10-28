import { test } from 'node:test'
import assert from 'node:assert/strict'
import { novedadesActa, novedadesNuevas, cicloPorRevisar } from './recepcion.js'

const checklist = (partes) => ({ 'Carrocería': { partes } })

test('novedadesActa: solo las partes que no estan bien', () => {
  const c = checklist({ 'Capó': { estado: 'Bueno' }, 'Baúl': { estado: 'Regular', obs: 'rayado' } })
  assert.deepEqual(novedadesActa(c), [{ item: 'Carrocería', parte: 'Baúl', estado: 'Regular', obs: 'rayado' }])
})

test('novedadesNuevas: lo que aparece en el recibido y no estaba igual en la entrega', () => {
  const entrega = { checklist: checklist({ 'Baúl': { estado: 'Regular' }, 'Capó': { estado: 'Bueno' } }) }
  const recibido = { checklist: checklist({ 'Baúl': { estado: 'Regular' }, 'Capó': { estado: 'Malo', obs: 'golpe' } }) }
  assert.deepEqual(novedadesNuevas(entrega, recibido).map((n) => n.parte), ['Capó'])
})

test('cicloPorRevisar: ultimo ciclo de la placa con recibido', () => {
  const actas = [
    { id: 'e1', tipo: 'Entrega', placa: 'AAA111', created_at: '2026-10-01' },
    { id: 'r1', tipo: 'Recibido', placa: 'AAA111', created_at: '2026-10-05', acta_entrega_id: 'e1' },
    { id: 'e2', tipo: 'Entrega', placa: 'BBB222', created_at: '2026-10-03' },
  ]
  assert.equal(cicloPorRevisar('AAA111', actas).recibido.id, 'r1')
  assert.equal(cicloPorRevisar('BBB222', actas), null)
})
