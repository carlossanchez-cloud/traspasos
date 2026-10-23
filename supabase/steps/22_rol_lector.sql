-- PASO 22 — tercer rol: lector (solo ver).
--
-- Roles desde este paso:
--   admin  = Administrador general: todo, y es el unico que cambia roles.
--   gestor = Gestor: crea actas y solicitudes, como hasta ahora.
--   lector = Lector: entra y ve todo, pero no puede crear ni cambiar nada.
-- Todo correo @rentandes.com que entre por primera vez queda como lector; un administrador lo sube a gestor
-- o admin desde Administrador -> Usuarios y roles. Los usuarios que ya existen conservan su rol.
--
-- Las reglas van en la base de datos (no solo ocultando botones): aunque un lector intente guardar desde la
-- consola del navegador, el insert se rechaza.

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'gestor', 'lector'));
alter table profiles alter column role set default 'lector';

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email like '%@rentandes.com' then
    insert into public.profiles (id, email, full_name, role)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      case
        when new.email in ('carlos.sanchez@rentandes.com', 'alejandro.duenas@rentandes.com') then 'admin'
        else 'lector'
      end
    );
  end if;
  return new;
end;
$$;
revoke all on function handle_new_user() from public;

-- Quien puede crear/guardar: admin o gestor (security definer: no depende de que el usuario pueda leer profiles).
create or replace function public.puede_editar()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'gestor'));
$$;
revoke all on function public.puede_editar() from public;
grant execute on function public.puede_editar() to authenticated;

drop policy if exists "solicitudes: crear si hay perfil" on solicitudes;
create policy "solicitudes: crear si hay perfil" on solicitudes
  for insert to authenticated with check (public.puede_editar() and creada_por = auth.uid());

drop policy if exists "actas: crear si hay perfil" on actas;
create policy "actas: crear si hay perfil" on actas
  for insert to authenticated with check (public.puede_editar() and creada_por = auth.uid());

-- Subir fotos/firmas: admin o gestor. Un lector con sesion abierta igual puede firmar como cliente el enlace
-- de un acta (carpeta publicas/{acta}/ de un acta sin firmar), igual que alguien sin sesion.
drop policy if exists "actas storage: subir si hay perfil" on storage.objects;
create policy "actas storage: subir si hay perfil" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'actas' and (
      public.puede_editar()
      or ((storage.foldername(name))[1] = 'publicas' and public.acta_publica_abierta((storage.foldername(name))[2]))
    )
  );

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
  if target_role not in ('admin', 'gestor', 'lector') then
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

notify pgrst, 'reload schema';
