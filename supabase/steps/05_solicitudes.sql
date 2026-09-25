-- PASO 5 de 8 — Solicitudes de vehículo sustituto.

create table solicitudes (
  id uuid primary key default gen_random_uuid(),
  placa_contrato text not null,
  tipo_vehiculo text not null default 'Automóvil',
  ciudad text not null references ciudades(nombre),
  admin_flota text not null,
  cliente_empresa text not null,
  fecha_inicio date not null default current_date,
  fecha_fin date,
  observaciones text,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'Resuelta')),
  vehiculo_asignado_placa text references vehicles(placa),
  resuelta_por uuid references profiles(id),
  resuelta_at timestamptz,
  creada_por uuid references profiles(id) not null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table solicitudes enable row level security;

create policy "solicitudes: leer si hay perfil" on solicitudes
  for select using (exists (select 1 from profiles where id = auth.uid()));

create policy "solicitudes: crear si hay perfil" on solicitudes
  for insert to authenticated with check (exists (select 1 from profiles where id = auth.uid()));

create policy "solicitudes: resolver solo admin" on solicitudes
  for update to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
