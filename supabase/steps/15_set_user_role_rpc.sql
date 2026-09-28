-- PASO 15 — funcion explicita para cambiar el rol de un usuario, en vez del UPDATE crudo
-- que el cliente hacia directo sobre profiles.role.
--
-- react-doctor (regla supabase-client-owned-authz-field) marca cualquier .update({role})
-- hecho desde el navegador. La policy de RLS ya protegia esto de verdad (is_admin(),
-- 09_profiles_admin_update.sql, re-verifica el rol guardado en servidor de quien llama via
-- auth.uid() - el cliente no puede forjarlo), pero una funcion propia es el fix canonico de
-- la regla: valida el valor nuevo, y ademas cierra un hueco real que SI existia - "no puedes
-- cambiar tu propio rol" solo se checkeaba deshabilitando el boton en el UI, nunca en el
-- servidor. Un admin con la consola del navegador abierta si podia auto-degradarse (o peor,
-- si alguna vez se debilita la policy de UPDATE, ya no dependeria solo de eso).
create or replace function set_user_role(target_id uuid, target_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Solo un administrador puede cambiar roles.';
  end if;
  if target_role not in ('admin', 'gestor') then
    raise exception 'Rol invalido: %', target_role;
  end if;
  if target_id = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol.';
  end if;
  update profiles set role = target_role where id = target_id;
end;
$$;

revoke all on function set_user_role(uuid, text) from public;
grant execute on function set_user_role(uuid, text) to authenticated;
