-- PASO 28 — asignar un sustituto por arrendamiento tercerizado.
--
-- Cuando no hay un vehiculo propio disponible en la ciudad, el Administrador general cierra la solicitud con
-- un vehiculo de un proveedor externo (p. ej. Localiza, 4WD): se guarda el proveedor y la tarifa diaria. En
-- la app la solicitud queda en Completadas como "tercerizado". Ningun vehiculo de la flota cambia de estado.
-- Se puede volver a correr sin dañar nada.

alter table solicitudes add column if not exists tercerizado boolean not null default false;
alter table solicitudes add column if not exists proveedor_tercerizado text;
alter table solicitudes add column if not exists tarifa_diaria_tercerizado numeric(14, 2);

create or replace function resolve_solicitud_tercerizado(p_solicitud_id uuid, p_proveedor text, p_tarifa_diaria numeric)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Solo un administrador puede resolver solicitudes';
  end if;
  if p_proveedor is null or btrim(p_proveedor) = '' then
    raise exception 'Escribe el proveedor del arrendamiento tercerizado';
  end if;
  if p_tarifa_diaria is null or p_tarifa_diaria <= 0 then
    raise exception 'La tarifa diaria debe ser mayor que cero';
  end if;

  update solicitudes set
    estado = 'Resuelta',
    tercerizado = true,
    proveedor_tercerizado = btrim(p_proveedor),
    tarifa_diaria_tercerizado = p_tarifa_diaria,
    vehiculo_asignado_placa = null,
    resuelta_por = auth.uid(),
    resuelta_at = now()
  where id = p_solicitud_id and estado = 'Pendiente';

  if not found then
    raise exception 'Solicitud no existe o ya fue resuelta';
  end if;
end;
$$;

revoke all on function resolve_solicitud_tercerizado(uuid, text, numeric) from public;
grant execute on function resolve_solicitud_tercerizado(uuid, text, numeric) to authenticated;

notify pgrst, 'reload schema';
