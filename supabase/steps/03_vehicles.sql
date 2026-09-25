-- PASO 3 de 8 — Tabla de vehículos.

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  placa text not null unique,
  modelo text not null,
  tipo_vehiculo text not null default 'Automóvil',
  ciudad text not null references ciudades(nombre),
  estado text not null default 'Disponible' check (estado in ('Disponible', 'Asignado', 'Taller')),
  fecha_estado date not null default current_date,
  cliente text,
  admin_flota text,
  fecha_inicio date,
  fecha_fin date,
  novedades_asignacion text,
  placa_sustituida text,
  soat date,
  rtm date,
  seguro_activo boolean not null default true,
  aseguradora text,
  nivel_combustible text not null default 'Lleno' check (nivel_combustible in ('Lleno', '3/4', '1/2', '1/4', 'Reserva')),
  km_actual integer not null default 0,
  km_ultimo_mto integer not null default 0,
  frecuencia_mto integer not null default 10000,
  observaciones text,
  nombre_ubicacion text,
  ubicacion text,
  mto_detalle jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table vehicles enable row level security;

create policy "vehicles: leer si hay perfil" on vehicles
  for select using (exists (select 1 from profiles where id = auth.uid()));

create policy "vehicles: escribir solo admin" on vehicles
  for all to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
