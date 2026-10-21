import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidImage, emptyChecklist, esNovedad, estadosParte, resumenEstado, conResumen, novedadesConFoto, CHECK_ITEMS, SUB_ITEMS } from './actaChecklist.js'

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

test('emptyChecklist: cada item con desglose trae todas sus partes en su estado por defecto', () => {
  const c = emptyChecklist()
  for (const [item, partes] of Object.entries(SUB_ITEMS)) {
    assert.equal(c[item].estado, 'Bueno')
    assert.equal(Object.keys(c[item].partes).length, partes.length)
    for (const p of partes) assert.deepEqual(c[item].partes[p], { estado: estadosParte(item)[0], obs: '' })
  }
  assert.equal(SUB_ITEMS['Carrocería'].length, 13)
  assert.equal(SUB_ITEMS['Llantas'].length, 5)
  assert.equal(c['Documentos en el vehículo'].partes['SOAT'].estado, 'Vigente')
})

test('esNovedad: Bueno, Vigente y No aplica no son novedad', () => {
  for (const e of ['Bueno', 'Vigente', 'No aplica']) assert.equal(esNovedad(e), false)
  for (const e of ['Regular', 'Malo', 'Vencido', 'No se encuentra']) assert.equal(esNovedad(e), true)
})

test('resumenEstado: el estado del grupo es lo peor de sus partes', () => {
  const p = (...estados) => Object.fromEntries(estados.map((estado, i) => [i, { estado, obs: '' }]))
  assert.equal(resumenEstado(p('Bueno', 'Bueno')), 'Bueno')
  assert.equal(resumenEstado(p('Bueno', 'Regular')), 'Regular')
  assert.equal(resumenEstado(p('Regular', 'Malo')), 'Malo')
  assert.equal(resumenEstado(p('Vigente', 'No aplica')), 'Bueno')
  assert.equal(resumenEstado(p('Vigente', 'Vencido')), 'Malo')
  assert.equal(resumenEstado(p('No se encuentra')), 'Malo')
})

test('conResumen: recalcula el estado de cada grupo al guardar', () => {
  const c = emptyChecklist()
  c['Llantas'].partes['Posición 5 — Repuesto'].estado = 'Regular'
  const r = conResumen(c)
  assert.equal(r['Llantas'].estado, 'Regular')
  assert.equal(r['Carrocería'].estado, 'Bueno')
})

test('novedadesConFoto: pide foto de Regular/Malo/Vencido, no de Bueno ni No se encuentra', () => {
  const c = emptyChecklist()
  c['Carrocería'].partes['Puerta delantera izquierda'] = { estado: 'Regular', obs: 'sumido' }
  c['Kit de carretera'].partes['Extintor'] = { estado: 'Malo', obs: '' }
  c['Documentos en el vehículo'].partes['SOAT'] = { estado: 'Vencido', obs: '' }
  c['Documentos en el vehículo'].partes['Tarjeta de propiedad'] = { estado: 'No se encuentra', obs: '' }
  c['Documentos en el vehículo'].partes['Póliza todo riesgo'] = { estado: 'No aplica', obs: '' }
  const n = novedadesConFoto(c)
  assert.deepEqual(n.map((x) => x.parte), ['Puerta delantera izquierda', 'SOAT', 'Extintor'])
  assert.equal(n[0].obs, 'sumido')
  assert.equal(n[0].key, 'Carrocería::Puerta delantera izquierda')
})
