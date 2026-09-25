import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cityCoords, distanceKm, titleCase } from './cityCoords.js'

test('titleCase: normaliza mayúsculas/minúsculas y espacios', () => {
  assert.equal(titleCase('bogotá'), 'Bogotá')
  assert.equal(titleCase('BOGOTÁ'), 'Bogotá')
  assert.equal(titleCase('  medellín  '), 'Medellín')
  assert.equal(titleCase(''), '')
})

test('cityCoords: conoce ciudades reales de la flota, cae al centro de Colombia si no', () => {
  const [lat, lon] = cityCoords('Bogotá')
  assert.ok(Math.abs(lat - 4.6097) < 0.01)
  assert.ok(Math.abs(lon - -74.0817) < 0.01)

  const fallback = cityCoords('Ciudad Inventada')
  assert.deepEqual(fallback, [4.5709, -74.2973])
})

test('distanceKm: 0 entre el mismo punto, positiva entre Bogotá y Medellín (~240km)', () => {
  const bogota = cityCoords('Bogotá')
  const medellin = cityCoords('Medellín')
  assert.equal(distanceKm(bogota, bogota), 0)
  const d = distanceKm(bogota, medellin)
  assert.ok(d > 200 && d < 280, `esperaba ~240km, dio ${d}`)
})
