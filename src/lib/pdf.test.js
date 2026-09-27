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
