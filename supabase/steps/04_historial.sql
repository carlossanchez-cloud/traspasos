-- PASO 4 de 8 — Historial de préstamos/taller. Se llena SOLO por el trigger de abajo,
-- nunca directo desde la app (equivalente server-side al processSaveVehicle() del prototipo).

create table historial (
  id uuid primary key default gen_random_uuid(),
  placa text not null,
  tipo text not null,
  cliente text,
  admin_flota text,
  fecha_inicio date not null default current_date,
  fecha_fin date,
  fecha_devolucion_real date,
  novedades_asignacion text,
  novedades_retorno text,
  placa_sustituida text,
  km_inicio integer,
  km_fin integer,
  created_at timestamptz not null default now()
);

alter table historial enable row level security;

create policy "historial: leer si hay perfil" on historial
  for select using (exists (select 1 from profiles where id = auth.uid()));

create function track_vehicle_history()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.estado is distinct from new.estado and old.estado in ('Asignado', 'Taller') then
    update historial
    set fecha_devolucion_real = current_date,
        novedades_retorno = coalesce(new.observaciones, 'Vehículo pasó a estado: ' || new.estado),
        km_fin = new.km_actual
    where placa = new.placa and fecha_devolucion_real is null;
  end if;

  if old.estado is distinct from new.estado and new.estado in ('Asignado', 'Taller') then
    insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, novedades_asignacion, placa_sustituida, km_inicio)
    values (
      new.placa, new.estado,
      case when new.estado = 'Asignado' then new.cliente else coalesce(new.nombre_ubicacion, 'Taller Interno') end,
      case when new.estado = 'Asignado' then new.admin_flota else 'RENTANDES' end,
      case when new.estado = 'Asignado' then new.fecha_inicio else current_date end,
      case when new.estado = 'Asignado' then new.fecha_fin else null end,
      case when new.estado = 'Asignado' then new.novedades_asignacion else new.observaciones end,
      case when new.estado = 'Asignado' then new.placa_sustituida else 'N/A' end,
      new.km_actual
    );
  end if;

  new.updated_at = now();
  if old.estado is distinct from new.estado then
    new.fecha_estado = current_date;
  end if;

  return new;
end;
$$;

create trigger vehicles_track_history
  before update on vehicles
  for each row execute function track_vehicle_history();
