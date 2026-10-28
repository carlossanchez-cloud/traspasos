import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sameText, matchesSolicitud, flotaParaSolicitud } from './matching.js'

test('sameText: ignora mayusculas', () => {
  assert.equal(sameText('Bogotá', 'bogotá'), true)
  assert.equal(sameText('CAMIONETA', 'camioneta'), true)
})

test('sameText: ignora espacios sobrantes', () => {
  assert.equal(sameText('Bogotá ', ' Bogotá'), true)
  assert.equal(sameText('Santa marta', 'Santa Marta'), true)
})

test('sameText: null/undefined no explota, distinto texto no matchea', () => {
  assert.equal(sameText(null, ''), true)
  assert.equal(sameText(undefined, 'Cali'), false)
  assert.equal(sameText('Cali', 'Medellín'), false)
})

test('matchesSolicitud: LHV966 (Camioneta/Bogotá) matchea solicitud con distinto casing', () => {
  const vehicle = { ciudad: 'Bogotá', tipo_vehiculo: 'Camioneta' }
  const solicitud = { ciudad: 'bogotá ', tipo_vehiculo: ' CAMIONETA' }
  assert.equal(matchesSolicitud(vehicle, solicitud), true)
})

test('matchesSolicitud: ciudad o tipo distinto no matchea', () => {
  assert.equal(matchesSolicitud({ ciudad: 'Bogotá', tipo_vehiculo: 'Camioneta' }, { ciudad: 'Cali', tipo_vehiculo: 'Camioneta' }), false)
  assert.equal(matchesSolicitud({ ciudad: 'Bogotá', tipo_vehiculo: 'Camioneta' }, { ciudad: 'Bogotá', tipo_vehiculo: 'Pickup' }), false)
})

test('sameText: ignora tildes', () => {
  assert.equal(sameText('Bogota', 'Bogotá'), true)
  assert.equal(sameText('Automovil', 'Automóvil'), true)
})

test('flotaParaSolicitud: separa disponibles del tipo, de otro tipo y los ocupados de la ciudad', () => {
  const vehicles = [
    { placa: 'A', ciudad: 'Bogotá', tipo_vehiculo: 'Camioneta', estado: 'Disponible' },
    { placa: 'B', ciudad: 'Bogota', tipo_vehiculo: 'Automóvil', estado: 'Disponible' },
    { placa: 'C', ciudad: 'Bogotá', tipo_vehiculo: 'Automóvil', estado: 'Asignado' },
    { placa: 'D', ciudad: 'Bogotá', tipo_vehiculo: 'Automóvil', estado: 'Taller' },
    { placa: 'E', ciudad: 'Cali', tipo_vehiculo: 'Automóvil', estado: 'Disponible' },
  ]
  const f = flotaParaSolicitud(vehicles, { ciudad: 'Bogotá', tipo_vehiculo: 'Automóvil' })
  assert.deepEqual(f.exactos.map((v) => v.placa), ['B'])
  assert.deepEqual(f.otroTipo.map((v) => v.placa), ['A'])
  assert.deepEqual(f.ocupados, { Asignado: 1, Taller: 1 })
  assert.equal(f.total, 4)
})
