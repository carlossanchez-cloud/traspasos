-- LIMPIEZA DE DATOS DE PRUEBA — correr UNA SOLA VEZ y SOLO en el Supabase del preview (sandbox/alejo).
-- NO correr en producción (xsbfohfjqkjwyubzxqbf).
--
-- Deja la base de prueba lista para probar el ciclo nuevo de estados (paso 29) desde cero:
--   1. Todos los vehiculos Asignados (o en proceso de entrega / recepcion) quedan Disponibles, sin datos de
--      prestamo. El historial cierra solo cada prestamo abierto (trigger del paso 4). Los de Taller no se tocan.
--   2. Las actas de entrega que no tienen su acta de recibido se marcan como eliminadas (motivo "Limpieza de
--      datos de prueba"): siguen en el filtro Eliminadas de Actas, no se borran. Sin esto, esos carros no
--      podrian tener una entrega nueva.
--   3. Las solicitudes pendientes (sin asignar) se BORRAN. Las ya asignadas (Completadas) se conservan.
--
-- Requiere el paso 25 (columnas de actas eliminadas): si falta, se detiene sin cambiar nada.
-- Todo va en una transaccion: o se aplica completo o no se aplica nada.

begin;

do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'actas' and column_name = 'eliminada_en') then
    raise exception 'Falta el paso 25 (25_eliminar_actas.sql). Corre ese paso primero.';
  end if;
end $$;

-- 2. Entregas abiertas -> eliminadas (antes de liberar los carros, para que el historial y el ciclo queden claros).
update actas e set
  eliminada_en = now(),
  eliminada_por = null,
  eliminada_por_email = 'limpieza de datos (SQL)',
  motivo_eliminacion = 'Limpieza de datos de prueba'
where e.tipo = 'Entrega'
  and e.eliminada_en is null
  and not exists (
    select 1 from actas r
    where r.tipo = 'Recibido' and r.eliminada_en is null
      and (r.acta_entrega_id = e.id or r.checklist->>'acta_entrega_id' = e.id::text)
  );

-- 1. Carros prestados -> Disponibles.
update vehicles set
  estado = 'Disponible',
  cliente = null,
  admin_flota = null,
  fecha_inicio = null,
  fecha_fin = null,
  placa_sustituida = null,
  novedades_asignacion = null
where estado <> 'Disponible' and estado <> 'Taller';

-- 3. Solicitudes pendientes -> borradas.
delete from solicitudes where estado = 'Pendiente';

commit;

-- Para revisar como quedo (debe salir 0 en las tres primeras):
select
  (select count(*) from vehicles where estado not in ('Disponible', 'Taller')) as carros_prestados,
  (select count(*) from solicitudes where estado = 'Pendiente') as solicitudes_pendientes,
  (select count(*) from actas e where e.tipo = 'Entrega' and e.eliminada_en is null
     and not exists (select 1 from actas r where r.tipo = 'Recibido' and r.eliminada_en is null
       and (r.acta_entrega_id = e.id or r.checklist->>'acta_entrega_id' = e.id::text))) as entregas_abiertas,
  (select count(*) from vehicles where estado = 'Disponible') as carros_disponibles,
  (select count(*) from actas where motivo_eliminacion = 'Limpieza de datos de prueba') as actas_marcadas;
