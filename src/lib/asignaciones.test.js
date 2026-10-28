import { test } from 'node:test'
import assert from 'node:assert/strict'
import { datosVehiculoAsignado, resumenAsignacion, costoTercerizado, asignadoA } from './asignaciones.js'

const s = { cliente_empresa: 'Colgate', placa_contrato: 'HTR902', ciudad: 'Bogotá', fecha_inicio: '2026-10-20', fecha_fin: '2026-10-27', vehiculo_asignado_placa: 'LHV966', observaciones: 'Recoger en Chapinero.' }

test('datosVehiculoAsignado: prefiere la copia guardada al asignar sobre los datos actuales', () => {
  assert.deepEqual(datosVehiculoAsignado({ vehiculo_al_asignar: { km_actual: 100 } }, { km_actual: 900 }), { km_actual: 100, alAsignar: true })
  assert.deepEqual(datosVehiculoAsignado({}, { km_actual: 900 }), { km_actual: 900, alAsignar: false })
  assert.equal(datosVehiculoAsignado({}, null), null)
})

test('resumenAsignacion: trae vehiculo, kilometraje, combustible, dias y observaciones', () => {
  const t = resumenAsignacion(s, { modelo: 'FORD ESCAPE', tipo_vehiculo: 'Automóvil', km_actual: 45200, nivel_combustible: 'Lleno', soat: '2027-01-10' })
  assert.match(t, /Vehículo asignado: LHV966 — FORD ESCAPE/)
  assert.match(t, /Kilometraje: 45\.200 km/)
  assert.match(t, /Combustible: Lleno/)
  assert.match(t, /\(7 días\)/)
  assert.match(t, /Observaciones: Recoger en Chapinero\./)
  assert.doesNotMatch(t, /Tecnomecánica/)
})

test('tercerizado: costo = tarifa diaria x dias requeridos, y el resumen trae proveedor y tarifa', () => {
  const t = { ...s, tercerizado: true, vehiculo_asignado_placa: null, proveedor_tercerizado: 'Localiza', tarifa_diaria_tercerizado: 180000 }
  assert.equal(costoTercerizado(t), 7 * 180000)
  assert.equal(costoTercerizado({ ...t, fecha_fin: null }), null)
  assert.match(asignadoA(t), /^Tercerizado: Localiza · \$\s?180\.000\/día$/)
  const r = resumenAsignacion(t, null)
  assert.match(r, /Proveedor: Localiza/)
  assert.match(r, /Costo estimado: \$\s?1\.260\.000/)
  assert.doesNotMatch(r, /Vehículo asignado:/)
})
