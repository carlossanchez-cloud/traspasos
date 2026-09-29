-- PASO 16 — permisos explícitos para proyectos donde la Data API no concede
-- acceso automático. RLS sigue decidiendo qué filas puede usar cada sesión.

revoke usage on schema public from anon;
grant usage on schema public to authenticated;

revoke all on table profiles, ciudades, vehicles, historial, solicitudes, actas
  from anon, authenticated;

grant select on table profiles, ciudades, vehicles, historial, solicitudes, actas
  to authenticated;
grant insert on table ciudades, vehicles, solicitudes, actas
  to authenticated;
grant update, delete on table vehicles
  to authenticated;

revoke all on function is_admin() from public;
grant execute on function is_admin() to authenticated;

revoke all on function resolve_solicitud(uuid, text) from public;
grant execute on function resolve_solicitud(uuid, text) to authenticated;

revoke all on function set_user_role(uuid, text) from public;
grant execute on function set_user_role(uuid, text) to authenticated;

-- Estas funciones solo deben ejecutarse por sus triggers.
revoke all on function handle_new_user() from public;
revoke all on function track_vehicle_history() from public;
