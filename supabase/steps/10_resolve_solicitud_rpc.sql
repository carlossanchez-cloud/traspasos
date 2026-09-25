-- PASO 10 (agregado despues del 9) — resolver una solicitud (asignar vehiculo + cerrar la
-- solicitud) en una sola llamada atomica, en vez de 2 updates seguidos desde el cliente.
-- Evita que una falla a mitad de camino deje el vehiculo asignado pero la solicitud
-- pendiente (o viceversa) si dos admins resuelven casi al mismo tiempo.
create function resolve_solicitud(p_solicitud_id uuid, p_placa text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  s solicitudes;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Solo un administrador puede resolver solicitudes';
  end if;

  select * into s from solicitudes where id = p_solicitud_id and estado = 'Pendiente';
  if not found then
    raise exception 'Solicitud no existe o ya fue resuelta';
  end if;

  if not exists (select 1 from vehicles where placa = p_placa and estado = 'Disponible') then
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
  where placa = p_placa;

  update solicitudes set
    estado = 'Resuelta',
    vehiculo_asignado_placa = p_placa,
    resuelta_por = auth.uid(),
    resuelta_at = now()
  where id = p_solicitud_id;
end;
$$;
