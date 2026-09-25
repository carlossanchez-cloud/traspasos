-- PASO 12 (agregado despues del 11) — hallazgos reales del escaneo Strix (2026-09-25):
-- 1. Bucket "actas" sin limite de tamano/tipo -> cualquiera con sesion podia subir
--    archivos gigantes o no-imagen directo a la API de Storage, saltandose la
--    validacion de 8MB/solo-imagen que solo vivia en el frontend (Actas.jsx).
-- 2. Mass assignment: las politicas INSERT de solicitudes/actas no verificaban que
--    creada_por = auth.uid(), un usuario podia forjar quien "creo" el registro.
-- 3. Condicion de carrera en resolve_solicitud: el UPDATE final a vehicles no
--    repetia estado = 'Disponible' en el WHERE, dos solicitudes resueltas casi
--    al mismo tiempo podian asignar el mismo carro dos veces.
-- (El hallazgo de que cualquier usuario con perfil puede LEER actas/fotos de
-- cualquier otro no se toca — es diseno intencional, mismo criterio que vehicles:
-- flota compartida, confirmado con Carlos.)

-- 1. Bucket actas: solo imagenes, maximo 8MB (igual al limite ya validado en el frontend).
update storage.buckets
set file_size_limit = 8388608, allowed_mime_types = array['image/*']
where id = 'actas';

-- 2. Forzar creada_por = auth.uid() al crear, no confiar en el default del cliente.
drop policy if exists "solicitudes: crear si hay perfil" on solicitudes;
create policy "solicitudes: crear si hay perfil" on solicitudes
  for insert to authenticated with check (
    exists (select 1 from profiles where id = auth.uid()) and creada_por = auth.uid()
  );

drop policy if exists "actas: crear si hay perfil" on actas;
create policy "actas: crear si hay perfil" on actas
  for insert to authenticated with check (
    exists (select 1 from profiles where id = auth.uid()) and creada_por = auth.uid()
  );

-- 3. resolve_solicitud: bloquear la fila del vehiculo (FOR UPDATE) para que dos
-- resoluciones concurrentes no pasen ambas la validacion "Disponible", y repetir
-- estado = 'Disponible' en el WHERE del UPDATE para que la segunda, si igual llega
-- a ejecutarse, no afecte ninguna fila (se detecta con GET DIAGNOSTICS y falla).
create or replace function resolve_solicitud(p_solicitud_id uuid, p_placa text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  s solicitudes;
  filas_afectadas int;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Solo un administrador puede resolver solicitudes';
  end if;

  select * into s from solicitudes where id = p_solicitud_id and estado = 'Pendiente';
  if not found then
    raise exception 'Solicitud no existe o ya fue resuelta';
  end if;

  perform 1 from vehicles where placa = p_placa and estado = 'Disponible' for update;
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
    resuelta_at = now()
  where id = p_solicitud_id;
end;
$$;
