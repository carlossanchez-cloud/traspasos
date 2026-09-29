import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const sql = readFileSync(new URL('../../supabase/steps/16_data_api_grants.sql', import.meta.url), 'utf8')
  .toLowerCase()
  .replace(/\s+/g, ' ')
const recursionFix = readFileSync(new URL('../../supabase/steps/11_fix_profiles_recursion.sql', import.meta.url), 'utf8')
  .toLowerCase()
  .replace(/\s+/g, ' ')

test('las migraciones 01..16 pueden reemplazar is_admin sin colisionar', () => {
  assert.match(recursionFix, /create or replace function is_admin\(\)/)
})

test('Data API: authenticated recibe solo los accesos usados por el frontend', () => {
  assert.match(sql, /grant usage on schema public to authenticated/)
  assert.match(sql, /grant select on (table )?profiles, ciudades, vehicles, historial, solicitudes, actas to authenticated/)
  assert.match(sql, /grant insert on (table )?ciudades, vehicles, solicitudes, actas to authenticated/)
  assert.match(sql, /grant update, delete on (table )?vehicles to authenticated/)
})

test('Data API: las RPC quedan cerradas a public y habilitadas para authenticated', () => {
  for (const signature of ['is_admin()', 'resolve_solicitud(uuid, text)', 'set_user_role(uuid, text)']) {
    assert.ok(sql.includes(`revoke all on function ${signature} from public`), signature)
    assert.ok(sql.includes(`grant execute on function ${signature} to authenticated`), signature)
  }
})

test('Data API: no se conceden accesos al rol anon', () => {
  assert.doesNotMatch(sql, /grant\b[^;]*\bto anon\b/)
})
