import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rolLabel, puedeEditar } from './roles.js'

test('puedeEditar: admin y gestor sí, lector no', () => {
  assert.equal(puedeEditar('admin'), true)
  assert.equal(puedeEditar('gestor'), true)
  assert.equal(puedeEditar('lector'), false)
  assert.equal(puedeEditar(undefined), false)
})

test('rolLabel: nombre para mostrar de cada rol', () => {
  assert.equal(rolLabel('admin'), 'Administrador general')
  assert.equal(rolLabel('lector'), 'Lector')
})
