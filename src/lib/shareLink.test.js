import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publicActaUrl, waShareUrl, mailtoShareUrl } from './shareLink.js'

test('publicActaUrl: arma la ruta publica con el id del acta como token', () => {
  assert.equal(publicActaUrl('abc-123', 'https://sustitutos.vercel.app'), 'https://sustitutos.vercel.app/acta-publica/abc-123')
})

test('waShareUrl: link de wa.me con el texto y la url codificados', () => {
  const url = waShareUrl('https://x.test/a', 'Hola')
  assert.match(url, /^https:\/\/wa\.me\/\?text=/)
  assert.match(decodeURIComponent(url.split('=')[1]), /Hola https:\/\/x\.test\/a/)
})

test('mailtoShareUrl: incluye subject y body con la url', () => {
  const url = mailtoShareUrl('https://x.test/a', 'Asunto', 'Cuerpo')
  assert.match(url, /^mailto:\?subject=Asunto&body=/)
  assert.match(decodeURIComponent(url), /Cuerpo[\s\S]*https:\/\/x\.test\/a/)
})
