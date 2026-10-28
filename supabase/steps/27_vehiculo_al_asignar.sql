-- PASO 27 — guardar como estaba el vehiculo en el momento de asignarlo.
--
-- Al asignar un sustituto (resolve_solicitud) se guarda en la solicitud una copia de los datos del vehiculo
-- en ese momento: modelo, tipo, ciudad, kilometraje, combustible, SOAT, tecnomecanica, seguro y mantenimiento.
-- Sirve para compartirle la asignacion al gestor de flota y para comparar despues con el acta de entrega si
-- el vehiculo sigue en las mismas condiciones (el vehiculo cambia; esta copia no).
-- Las solicitudes asignadas antes de este paso no tienen copia: la app muestra los datos actuales del vehiculo.
-- Se puede volver a correr sin dañar nada.

alter table solicitudes add column if not exists vehiculo_al_asignar jsonb;

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
    estado = 'Asignado',
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

notify pgrst, 'reload schema';
