import { test } from 'node:test'
import assert from 'node:assert/strict'
import { overallMtoPct } from './maintenance.js'

test('overallMtoPct: 0 sin detalle', () => {
  assert.equal(overallMtoPct(null, 50000), 0)
})

test('overallMtoPct: aceite pesa 40%, si solo el aceite está al 100% da 40%', () => {
  const detalle = { aceite: { km: 0, frecuencia: 10000 } }
  assert.equal(overallMtoPct(detalle, 10000), 40)
})

test('overallMtoPct: todos los ítems al 100% da 100%', () => {
  const detalle = {
    aceite: { km: 0, frecuencia: 10000 },
    llantas: { km: 0, frecuencia: 40000 },
    frenos: { km: 0, frecuencia: 20000 },
    filtros: { km: 0, frecuencia: 10000 },
  }
  assert.equal(overallMtoPct(detalle, 40000), 100)
})

test('overallMtoPct: nunca pasa de 100% por ítem aunque el km recorrido sea mayor a la frecuencia', () => {
  const detalle = { aceite: { km: 0, frecuencia: 10000 } }
  assert.equal(overallMtoPct(detalle, 999999), 40) // 40% del peso del aceite, no más
})
