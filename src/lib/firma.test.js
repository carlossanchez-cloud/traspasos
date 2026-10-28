import test from 'node:test'
import assert from 'node:assert/strict'
import { bordesTrazo } from './firma.js'

const imagen = (ancho, alto, pintados) => {
  const data = new Uint8ClampedArray(ancho * alto * 4)
  pintados.forEach(([x, y]) => { data[(y * ancho + x) * 4 + 3] = 255 })
  return data
}

test('bordesTrazo: encierra solo los pixeles dibujados', () => {
  assert.deepEqual(bordesTrazo(imagen(10, 5, [[2, 1], [7, 3]]), 10, 5), { x: 2, y: 1, ancho: 6, alto: 3 })
})

test('bordesTrazo: firma vacia devuelve null', () => {
  assert.equal(bordesTrazo(imagen(4, 4, []), 4, 4), null)
})
