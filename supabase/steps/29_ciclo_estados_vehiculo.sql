-- PASO 29 (correr despues del 27) — el estado del vehiculo sigue a las actas.
--
--   Disponible
--     -> al confirmar la asignacion (resolve_solicitud) ........ En proceso de entrega
--     -> cuando el cliente firma el acta de entrega ............ Asignado
--     -> cuando el cliente firma el acta de recibido ........... En proceso de recepción
--        (se toman del acta de recibido el kilometraje y el combustible)
--     -> el Administrador general revisa las dos actas (revisar_recepcion):
--          las acepta ............................................ Disponible
--          hay una novedad relevante ............................. Taller (con la nota de la novedad)
--
-- El historial (paso 4) sigue igual: el prestamo se abre al pasar a Asignado y se cierra al pasar a
-- En proceso de recepción (con el kilometraje del acta). La revision deja su resultado en ese prestamo.
-- Se puede volver a correr sin dañar nada.

alter table vehicles drop constraint if exists vehicles_estado_check;
alter table vehicles add constraint vehicles_estado_check
  check (estado in ('Disponible', 'En proceso de entrega', 'Asignado', 'En proceso de recepción', 'Taller'));

-- Por si el paso 27 no se corrio: resolve_solicitud usa esta columna.
alter table solicitudes add column if not exists vehiculo_al_asignar jsonb;

-- ---- asignar: el vehiculo queda En proceso de entrega (antes quedaba Asignado de una vez) ----
create or replace function resolve_solicitud(p_solicitud_id uuid, p_placa text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  s solicitudes;
  v vehicles;
  filas_afectadas int;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Solo un administrador puede resolver solicitudes';
  end if;

  select * into s from solicitudes where id = p_solicitud_id and estado = 'Pendiente';
  if not found then
    raise exception 'Solicitud no existe o ya fue resuelta';
  end if;

  select * into v from vehicles where placa = p_placa and estado = 'Disponible' for update;
  if not found then
    raise exception 'El vehiculo % ya no esta disponible', p_placa;
  end if;

  update vehicles set
    estado = 'En proceso de entrega',
    cliente = s.cliente_empresa,
    admin_flota = s.admin_flota,
    fecha_inicio = s.fecha_inicio,
    fecha_fin = s.fecha_fin,
    placa_sustituida = s.placa_contrato,
    novedades_asignacion = s.observaciones
  where placa = p_placa and estado = 'Disponible';

  get diagnostics filas_afectadas = row_count;
  if filas_afectadas = 0 then
    raise exception 'El vehiculo % ya no esta disponible', p_placa;
  end if;

  update solicitudes set
    estado = 'Resuelta',
    vehiculo_asignado_placa = p_placa,
    resuelta_por = auth.uid(),
    resuelta_at = now(),
    vehiculo_al_asignar = jsonb_build_object(
      'placa', v.placa, 'modelo', v.modelo, 'tipo_vehiculo', v.tipo_vehiculo, 'ciudad', v.ciudad,
      'km_actual', v.km_actual, 'nivel_combustible', v.nivel_combustible,
      'soat', v.soat, 'rtm', v.rtm, 'seguro_activo', v.seguro_activo, 'aseguradora', v.aseguradora,
      'km_ultimo_mto', v.km_ultimo_mto, 'frecuencia_mto', v.frecuencia_mto,
      'observaciones', v.observaciones, 'nombre_ubicacion', v.nombre_ubicacion
    )
  where id = p_solicitud_id;
end;
$$;

revoke all on function resolve_solicitud(uuid, text) from public;
grant execute on function resolve_solicitud(uuid, text) to authenticated;

-- ---- firma del cliente: mueve el estado del vehiculo ----
-- El gestor firma al crear el acta; el acta queda completa (bloqueada) cuando firma el cliente.
create or replace function public.actas_firma_mueve_vehiculo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.bloqueada and not coalesce(old.bloqueada, false) then
    if new.tipo = 'Entrega' then
      update vehicles set estado = 'Asignado'
      where placa = new.placa and estado = 'En proceso de entrega';
    elsif new.tipo = 'Recibido' then
      update vehicles set
        estado = 'En proceso de recepción',
        km_actual = greatest(km_actual, coalesce(new.kilometraje, 0)),
        nivel_combustible = case
          when new.nivel_combustible in ('Lleno', '3/4', '1/2', '1/4', 'Reserva') then new.nivel_combustible
          else nivel_combustible end
      where placa = new.placa and estado = 'Asignado';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.actas_firma_mueve_vehiculo() from public;

drop trigger if exists actas_firma_mueve_vehiculo on actas;
create trigger actas_firma_mueve_vehiculo after update of bloqueada on actas
  for each row execute function public.actas_firma_mueve_vehiculo();

-- ---- revision de la recepcion por el Administrador general ----
create or replace function public.revisar_recepcion(p_placa text, p_destino text, p_nota text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nota text := nullif(btrim(coalesce(p_nota, '')), '');
begin
  if not is_admin() then
    raise exception 'Solo el Administrador general puede revisar la recepción de un vehículo';
  end if;
  if p_destino not in ('Disponible', 'Taller') then
    raise exception 'Destino invalido: %', p_destino;
  end if;
  if p_destino = 'Taller' and v_nota is null then
    raise exception 'Describe la novedad por la que el vehículo pasa a taller';
  end if;

  -- Resultado de la revision en el prestamo que se cerro al recibir el vehiculo.
  update historial set novedades_retorno = case
      when p_destino = 'Disponible' then 'Recepción aceptada: mismas condiciones de la entrega.' || coalesce(' ' || v_nota, '')
      else 'Recepción con novedad, pasa a taller: ' || v_nota end
  where id = (
    select id from historial where placa = p_placa and tipo = 'Asignado' and fecha_devolucion_real is not null
    order by fecha_devolucion_real desc, created_at desc limit 1
  );

  update vehicles set
    estado = p_destino,
    cliente = null,
    admin_flota = null,
    fecha_inicio = null,
    fecha_fin = null,
    placa_sustituida = null,
    novedades_asignacion = null,
    observaciones = case when p_destino = 'Taller' then v_nota else observaciones end
  where placa = p_placa and estado = 'En proceso de recepción';

  if not found then
    raise exception 'El vehículo % no está en proceso de recepción', p_placa;
  end if;
end;
$$;

revoke all on function public.revisar_recepcion(text, text, text) from public;
grant execute on function public.revisar_recepcion(text, text, text) to authenticated;

notify pgrst, 'reload schema';
