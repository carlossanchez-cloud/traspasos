import test from 'node:test'
import assert from 'node:assert/strict'
import { pdfOrientation } from './pdf.js'

test('pdfOrientation picks landscape for wide captures', () => {
  assert.equal(pdfOrientation(1280, 640), 'l')
})

test('pdfOrientation picks portrait for tall captures', () => {
  assert.equal(pdfOrientation(640, 1280), 'p')
})

test('pdfOrientation treats a square capture as landscape (tie-break, no distortion either way)', () => {
  assert.equal(pdfOrientation(800, 800), 'l')
})

import { cortesPagina } from './pdf.js'

test('cortesPagina: corta en el ultimo bloque que cabe, no a la mitad de uno', () => {
  // pagina de 1000; bloques empiezan en 0, 400, 900, 1300, 2100
  assert.deepEqual(cortesPagina(2500, 1000, [400, 900, 1300, 2100]), [[0, 900], [900, 1300], [1300, 2100], [2100, 2500]])
})

test('cortesPagina: sin limites utiles corta en el alto de pagina', () => {
  assert.deepEqual(cortesPagina(2500, 1000, []), [[0, 1000], [1000, 2000], [2000, 2500]])
  // un limite muy cerca del inicio (menos de un tercio de pagina) no se usa
  assert.deepEqual(cortesPagina(1500, 1000, [100]), [[0, 1000], [1000, 1500]])
})

test('cortesPagina: documento que cabe en una pagina', () => {
  assert.deepEqual(cortesPagina(600, 1000, [200, 400]), [[0, 600]])
})
