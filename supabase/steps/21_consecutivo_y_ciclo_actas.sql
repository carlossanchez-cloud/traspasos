-- PASO 21 (correr despues del 19 y el 20) — consecutivo unico de actas y pareja entrega/recibido.
--
-- 1. Consecutivo: cada acta recibe un numero unico (1, 2, 3...) que asigna la base de datos al guardarla.
--    Lo pone un trigger, no la app: aunque alguien mande otro numero desde el navegador, se reemplaza, y
--    la secuencia nunca repite. Las actas que ya existen se numeran por fecha de creacion.
-- 2. Ciclo entrega -> recibido: el acta de Recibido guarda acta_entrega_id, el acta de Entrega que cierra.
--    El mismo trigger valida, del lado del servidor:
--    - no se puede crear una Entrega de una placa que tiene otra Entrega sin su Recibido;
--    - un Recibido debe cerrar una Entrega de la MISMA placa que siga abierta. Solo se permite un Recibido
--      sin Entrega cuando la placa no tiene ninguna Entrega abierta (vehiculos entregados antes de la app);
--    - cada Entrega se cierra una sola vez (indice unico).
--    Las actas que ya existen se emparejan solas: cada Recibido con la Entrega abierta mas reciente de su
--    placa creada antes que el.

alter table actas add column if not exists consecutivo bigint;
alter table actas add column if not exists acta_entrega_id uuid references actas(id);

-- ---- numerar las existentes y emparejarlas, en orden de creacion ----
do $$
declare
  r record;
  n bigint := coalesce((select max(consecutivo) from actas), 0);
begin
  for r in select id, tipo, placa, created_at from actas where consecutivo is null order by created_at, id loop
    n := n + 1;
    update actas set consecutivo = n where id = r.id;
  end loop;

  for r in select id, placa, created_at from actas
           where tipo = 'Recibido' and acta_entrega_id is null order by created_at, id loop
    update actas set acta_entrega_id = (
      select e.id from actas e
      where e.tipo = 'Entrega' and e.placa = r.placa and e.created_at <= r.created_at
        and not exists (select 1 from actas x where x.acta_entrega_id = e.id)
      order by e.created_at desc limit 1
    ) where id = r.id;
  end loop;
end $$;

create sequence if not exists actas_consecutivo_seq owned by actas.consecutivo;
select setval('actas_consecutivo_seq', coalesce((select max(consecutivo) from actas), 0) + 1, false);

alter table actas alter column consecutivo set not null;
create unique index if not exists actas_consecutivo_unico on actas (consecutivo);
create unique index if not exists actas_un_recibido_por_entrega on actas (acta_entrega_id) where acta_entrega_id is not null;

-- ---- numero y reglas del ciclo, en cada insert ----
create or replace function public.actas_antes_de_insertar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_abierta actas%rowtype;
begin
  -- Dos actas de la misma placa guardadas al mismo tiempo se validan una detras de la otra.
  perform pg_advisory_xact_lock(hashtext('actas:' || new.placa));
  new.consecutivo := nextval('actas_consecutivo_seq');

  select * into v_abierta from actas e
  where e.tipo = 'Entrega' and e.placa = new.placa
    and not exists (select 1 from actas x where x.acta_entrega_id = e.id)
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
      where e.id = new.acta_entrega_id and e.tipo = 'Entrega' and e.placa = new.placa
        and not exists (select 1 from actas x where x.acta_entrega_id = e.id)
    ) then
      raise exception 'La entrega indicada no es de la placa % o ya tiene acta de recibido', new.placa;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.actas_antes_de_insertar() from public;

drop trigger if exists actas_antes_de_insertar on actas;
create trigger actas_antes_de_insertar before insert on actas
  for each row execute function public.actas_antes_de_insertar();

-- ---- el enlace del cliente tambien muestra el numero del acta ----
-- (cambia el tipo de retorno: hay que borrar y volver a crear la funcion, con sus permisos)
drop function if exists get_acta_publica(uuid);
create function get_acta_publica(p_token uuid)
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
  where a.id = p_token;
$$;

revoke all on function get_acta_publica(uuid) from public;
grant execute on function get_acta_publica(uuid) to anon, authenticated;
