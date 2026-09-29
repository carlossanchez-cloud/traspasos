import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requiresKmUpdate } from './kmGuard.js'

test('requiresKmUpdate: true si pasa de Asignado a Disponible sin cambiar el km', () => {
  assert.equal(requiresKmUpdate('Asignado', 'Disponible', 12000, 12000), true)
  assert.equal(requiresKmUpdate('Asignado', 'Disponible', 12000, '12000'), true) // input number como string
})

test('requiresKmUpdate: false si el km si cambio', () => {
  assert.equal(requiresKmUpdate('Asignado', 'Disponible', 12000, 12450), false)
})

test('requiresKmUpdate: false para cualquier otra transicion de estado', () => {
  assert.equal(requiresKmUpdate('Disponible', 'Asignado', 12000, 12000), false)
  assert.equal(requiresKmUpdate('Asignado', 'Taller', 12000, 12000), false)
  assert.equal(requiresKmUpdate('Disponible', 'Disponible', 12000, 12000), false)
})

test('requiresKmUpdate: no depende de la placa/id, es consistente para cualquier vehiculo (bug LZ2090)', () => {
  // La condicion solo mira estado/km, nunca el id del vehiculo, asi que no puede
  // "fallar para algunas placas" como pasaba antes de extraer esta funcion pura.
  assert.equal(requiresKmUpdate('Asignado', 'Disponible', 0, 0), true)
  assert.equal(requiresKmUpdate('Asignado', 'Disponible', 999999, 999999), true)
})
