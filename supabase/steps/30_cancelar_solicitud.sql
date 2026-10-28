-- PASO 30 — cancelar una solicitud de sustituto.
--
-- A veces el cliente ya no necesita el sustituto: el Administrador general cancela la solicitud pendiente con
-- un motivo. No se borra: queda con estado Cancelada (fecha, quien y motivo) y la app la muestra en la pestaña
-- Canceladas de Asignaciones. Ningun vehiculo cambia de estado.
-- Se puede volver a correr sin dañar nada.

alter table solicitudes drop constraint if exists solicitudes_estado_check;
alter table solicitudes add constraint solicitudes_estado_check check (estado in ('Pendiente', 'Resuelta', 'Cancelada'));

alter table solicitudes add column if not exists cancelada_por uuid references profiles(id);
alter table solicitudes add column if not exists cancelada_at timestamptz;
alter table solicitudes add column if not exists motivo_cancelacion text;

create or replace function public.cancelar_solicitud(p_solicitud_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Solo el Administrador general puede cancelar solicitudes';
  end if;
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Escribe el motivo de la cancelación';
  end if;

  update solicitudes set
    estado = 'Cancelada',
    cancelada_por = auth.uid(),
    cancelada_at = now(),
    motivo_cancelacion = btrim(p_motivo)
  where id = p_solicitud_id and estado = 'Pendiente';

  if not found then
    raise exception 'La solicitud no existe o ya no está pendiente';
  end if;
end;
$$;

revoke all on function public.cancelar_solicitud(uuid, text) from public;
grant execute on function public.cancelar_solicitud(uuid, text) to authenticated;

notify pgrst, 'reload schema';
