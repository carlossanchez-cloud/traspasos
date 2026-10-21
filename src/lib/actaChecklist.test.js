import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidImage, emptyChecklist, CHECK_ITEMS, SUB_ITEMS } from './actaChecklist.js'

test('isValidImage: acepta imagen <= 8MB, rechaza otro tipo o mas de 8MB', () => {
  assert.equal(isValidImage({ type: 'image/png', size: 1024 }), true)
  assert.equal(isValidImage({ type: 'image/jpeg', size: 8 * 1024 * 1024 }), true)
  assert.equal(isValidImage({ type: 'application/pdf', size: 1024 }), false)
  assert.equal(isValidImage({ type: 'image/png', size: 8 * 1024 * 1024 + 1 }), false)
})

test('emptyChecklist: un item por cada CHECK_ITEMS, todos en "Bueno"', () => {
  const c = emptyChecklist()
  assert.equal(Object.keys(c).length, CHECK_ITEMS.length)
  for (const item of CHECK_ITEMS.filter((i) => !SUB_ITEMS[i])) assert.deepEqual(c[item], { estado: 'Bueno', obs: '' })
})

test('emptyChecklist: cada item con desglose trae todas sus partes en "Bueno"', () => {
  const c = emptyChecklist()
  for (const [item, partes] of Object.entries(SUB_ITEMS)) {
    assert.equal(c[item].estado, 'Bueno')
    assert.equal(Object.keys(c[item].partes).length, partes.length)
    for (const p of partes) assert.deepEqual(c[item].partes[p], { estado: 'Bueno', obs: '' })
  }
  assert.equal(SUB_ITEMS['Carrocería'].length, 12)
  assert.equal(SUB_ITEMS['Llantas'].length, 5)
})
