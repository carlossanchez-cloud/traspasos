-- PASO 25 (correr despues del 21 y el 22) — eliminar actas incompletas, dejando registro.
--
-- Un acta no se borra de la tabla: se marca como eliminada (cuando, quien y por que) y sale en la app en
-- gris, en el filtro "Eliminadas". Asi queda la trazabilidad aunque se haya eliminado por una falla.
-- Reglas, del lado del servidor:
--   - solo el Administrador general (admin) puede eliminar;
--   - solo actas incompletas: sin firma del cliente (bloqueada = false);
--   - el motivo es obligatorio;
--   - no se puede eliminar un acta Entregado al cliente que ya tiene su Recibido por Rentandes.
-- Una entrega eliminada deja de contar como abierta (se puede volver a entregar esa placa) y un recibido
-- eliminado deja su entrega abierta otra vez (se puede volver a recibir). El enlace del cliente de un acta
-- eliminada deja de funcionar.
-- Se puede volver a correr sin dañar nada.

alter table actas add column if not exists eliminada_en timestamptz;
alter table actas add column if not exists eliminada_por uuid references auth.users(id);
alter table actas add column if not exists eliminada_por_email text;
alter table actas add column if not exists motivo_eliminacion text;

-- Cada entrega se cierra una sola vez... contando solo los recibidos que no estan eliminados.
drop index if exists actas_un_recibido_por_entrega;
create unique index actas_un_recibido_por_entrega on actas (acta_entrega_id)
  where acta_entrega_id is not null and eliminada_en is null;

-- ---- eliminar ----
create or replace function public.eliminar_acta(p_acta_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acta actas%rowtype;
begin
  if not is_admin() then
    raise exception 'Solo el Administrador general puede eliminar actas.';
  end if;
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Escribe el motivo de la eliminación.';
  end if;

  select * into v_acta from actas where id = p_acta_id for update;
  if v_acta.id is null or v_acta.eliminada_en is not null then
    raise exception 'El acta no existe o ya fue eliminada.';
  end if;
  if v_acta.bloqueada then
    raise exception 'El acta ya está firmada por el cliente: no se puede eliminar.';
  end if;
  if v_acta.tipo = 'Entrega' and exists (
    select 1 from actas x where x.acta_entrega_id = v_acta.id and x.eliminada_en is null
  ) then
    raise exception 'Esta entrega ya tiene su acta de recibido: elimina primero el recibido.';
  end if;

  update actas set
    eliminada_en = now(),
    eliminada_por = auth.uid(),
    eliminada_por_email = (select email from profiles where id = auth.uid()),
    motivo_eliminacion = btrim(p_motivo)
  where id = p_acta_id;
end;
$$;

revoke all on function public.eliminar_acta(uuid, text) from public;
grant execute on function public.eliminar_acta(uuid, text) to authenticated;

-- ---- reglas del ciclo (paso 21) sin contar las eliminadas ----
create or replace function public.actas_antes_de_insertar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_abierta actas%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('actas:' || new.placa));
  new.consecutivo := nextval('actas_consecutivo_seq');
  new.eliminada_en := null;
  new.eliminada_por := null;
  new.eliminada_por_email := null;
  new.motivo_eliminacion := null;

  select * into v_abierta from actas e
  where e.tipo = 'Entrega' and e.placa = new.placa and e.eliminada_en is null
    and not exists (select 1 from actas x where x.acta_entrega_id = e.id and x.eliminada_en is null)
  order by e.created_at desc limit 1;

  if new.tipo = 'Entrega' then
    new.acta_entrega_id := null;
    if v_abierta.id is not null then
      raise exception 'La placa % tiene la entrega N.º % sin acta de recibido', new.placa, v_abierta.consecutivo;
    end if;
  else
    if new.acta_entrega_id is null then
      if v_abierta.id is not null then
        raise exception 'Este recibido debe cerrar la entrega N.º % de la placa %', v_abierta.consecutivo, new.placa;
      end if;
    elsif not exists (
      select 1 from actas e
      where e.id = new.acta_entrega_id and e.tipo = 'Entrega' and e.placa = new.placa and e.eliminada_en is null
        and not exists (select 1 from actas x where x.acta_entrega_id = e.id and x.eliminada_en is null)
    ) then
      raise exception 'La entrega indicada no es de la placa % o ya tiene acta de recibido', new.placa;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.actas_antes_de_insertar() from public;

-- ---- el enlace del cliente no abre ni recibe firma de un acta eliminada ----
create or replace function public.acta_disponible_para_publica(p_acta_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from actas where id = p_acta_id and not bloqueada and eliminada_en is null);
$$;

create or replace function public.acta_publica_abierta(p_carpeta text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from actas where id::text = p_carpeta and not bloqueada and eliminada_en is null);
$$;

create or replace function get_acta_publica(p_token uuid)
returns table (
  id uuid, tipo text, placa text, fecha date, cliente text, conductor text,
  kilometraje integer, nivel_combustible text, checklist jsonb, observaciones text,
  bloqueada boolean, nombre_cliente text, observaciones_cliente text, consecutivo bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select a.id, a.tipo, a.placa, a.fecha, a.cliente, a.conductor,
         a.kilometraje, a.nivel_combustible, a.checklist, a.observaciones,
         a.bloqueada, a.nombre_cliente, a.observaciones_cliente, a.consecutivo
  from actas a
  where a.id = p_token and a.eliminada_en is null;
$$;

create or replace function submit_acta_publica(
  p_token uuid,
  p_nombre_cliente text,
  p_observaciones_cliente text,
  p_fotos_urls_cliente text[],
  p_firma_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text := 'publicas/' || p_token::text || '/';
  v_path text;
begin
  if p_nombre_cliente is null or btrim(p_nombre_cliente) = '' then
    raise exception 'El nombre del cliente es obligatorio';
  end if;
  if p_firma_url is null or p_firma_url !~ ('^' || v_prefix) then
    raise exception 'Firma invalida para esta acta';
  end if;

  if not exists (select 1 from actas where id = p_token and not bloqueada and eliminada_en is null) then
    raise exception 'Acta no existe o ya fue firmada por el cliente';
  end if;

  foreach v_path in array coalesce(p_fotos_urls_cliente, '{}') loop
    if v_path !~ ('^' || v_prefix) then
      raise exception 'Foto invalida para esta acta';
    end if;
  end loop;

  update actas set
    nombre_cliente = btrim(p_nombre_cliente),
    observaciones_cliente = p_observaciones_cliente,
    fotos_urls_cliente = coalesce(p_fotos_urls_cliente, '{}'),
    firma_cliente_url = p_firma_url,
    bloqueada = true
  where id = p_token and not bloqueada and eliminada_en is null;
end;
$$;

-- create or replace conserva los permisos; se repiten por si el paso se corre en un proyecto nuevo.
revoke all on function public.acta_disponible_para_publica(uuid) from public;
grant execute on function public.acta_disponible_para_publica(uuid) to anon;
revoke all on function public.acta_publica_abierta(text) from public;
grant execute on function public.acta_publica_abierta(text) to anon, authenticated;
revoke all on function get_acta_publica(uuid) from public;
grant execute on function get_acta_publica(uuid) to anon, authenticated;
revoke all on function submit_acta_publica(uuid, text, text, text[], text) from public;
grant execute on function submit_acta_publica(uuid, text, text, text[], text) to anon, authenticated;

notify pgrst, 'reload schema';
