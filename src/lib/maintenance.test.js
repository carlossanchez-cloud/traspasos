import { test } from 'node:test'
import assert from 'node:assert/strict'
import { overallMtoPct, itemPct, MTO_ITEMS } from './maintenance.js'

test('overallMtoPct: 0 sin detalle', () => {
  assert.equal(overallMtoPct(null, 50000), 0)
})

test('overallMtoPct: aceite pesa 40%, si solo el aceite está al 100% da 40%', () => {
  const detalle = { aceite: { km: 0, frecuencia: 10000 } }
  assert.equal(overallMtoPct(detalle, 10000), 40)
})

test('overallMtoPct: todos los ítems al 100% da 100%', () => {
  const detalle = {
    aceite: { km: 0, frecuencia: 10000 },
    llantas: { km: 0, frecuencia: 40000 },
    frenos: { km: 0, frecuencia: 20000 },
    filtros: { km: 0, frecuencia: 10000 },
  }
  assert.equal(overallMtoPct(detalle, 40000), 100)
})

test('overallMtoPct: nunca pasa de 100% por ítem aunque el km recorrido sea mayor a la frecuencia', () => {
  const detalle = { aceite: { km: 0, frecuencia: 10000 } }
  assert.equal(overallMtoPct(detalle, 999999), 40) // 40% del peso del aceite, no más
})

// Regression guard para el reporte "la formula de desgaste esta invertida" (reunion 2026-09-29):
// auditoria linea por linea (itemPct/overallMtoPct, historial de git, y los tests de arriba)
// no encontro ninguna inversion — la formula siempre fue recorrido/frecuencia, mas uso = mas
// desgaste, y coincide con el peso 40/20/20/20 documentado. Este test deja constancia de esa
// verificacion y evita que una futura "correccion" apresurada la invierta de verdad.
test('itemPct/overallMtoPct: a mas km recorridos, el % de desgaste sube (nunca baja)', () => {
  const detalle = { llantas: { km: 10000, frecuencia: 40000 } }
  const item = MTO_ITEMS.find((i) => i.key === 'llantas')
  const pctRecienCambiada = itemPct(item, detalle, 10000) // recien cambiada -> 0%
  const pctPocoUso = itemPct(item, detalle, 12000) // 2.000 km de uso -> 5%
  const pctMuchoUso = itemPct(item, detalle, 60000) // paso la frecuencia (50.000 km recorridos) -> 100% (tope)
  assert.equal(pctRecienCambiada, 0)
  assert.equal(pctPocoUso, 5)
  assert.equal(pctMuchoUso, 100)
  assert.ok(pctRecienCambiada < pctPocoUso && pctPocoUso < pctMuchoUso, 'el desgaste debe subir con el uso, no bajar')
})
