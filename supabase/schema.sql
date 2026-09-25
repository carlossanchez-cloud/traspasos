-- Portal Sustitutos — schema completo, de referencia.
-- Si es tu primera vez configurando esto, NO uses este archivo: usa supabase/steps/01..08
-- (mismo contenido partido en pasos chicos, con instrucciones en el README). Este archivo
-- sirve para copiar todo de una vez cuando ya sabes que el SQL funciona (ej. otro ambiente).
-- Orden importa (profiles antes que las tablas que la referencian).

-- ============================================================
-- 1. PROFILES — un perfil por usuario autenticado con Google.
--    Rol se asigna aqui, no en el cliente. Sin fila en profiles = sin acceso a nada (RLS abajo).
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'gestor' check (role in ('admin', 'gestor')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: ver propio o si admin" on profiles
  for select using (
    id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Trigger: al crear un usuario de Auth, solo se crea perfil si el correo es @rentandes.com.
-- Sin @rentandes.com -> usuario queda autenticado pero SIN perfil -> RLS de todas las tablas
-- de abajo lo bloquea (fail-closed), reemplazando el PIN hardcodeado del prototipo.
--
-- *** TODO Carlos: reemplazar estos 2 correos por los reales de Alejandro y el tuyo antes de correr. ***
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email like '%@rentandes.com' then
    insert into public.profiles (id, email, full_name, role)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      case
        when new.email in ('carlos.sanchez@rentandes.com', 'alejandro.duenas@rentandes.com') then 'admin'
        else 'gestor'
      end
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 2. CIUDADES — lista editable (reemplaza el localStorage renting_ciudades_v6).
-- ============================================================
create table ciudades (
  nombre text primary key
);

insert into ciudades (nombre) values
  ('Bogotá'), ('Medellín'), ('Cali'), ('Barranquilla'), ('Bucaramanga'),
  ('Valledupar'), ('Monteria'), ('Sincelejo'), ('Santa marta'), ('Cartagena');

alter table ciudades enable row level security;

create policy "ciudades: leer si hay perfil" on ciudades
  for select using (exists (select 1 from profiles where id = auth.uid()));

create policy "ciudades: escribir solo admin" on ciudades
  for insert to authenticated with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 3. VEHICLES — flota de sustitutos.
-- ============================================================
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

-- ============================================================
-- 4. HISTORIAL — se llena SOLO por trigger cuando vehicles.estado cambia
--    (equivalente a processSaveVehicle() del prototipo, pero server-side y
--    en un solo lugar en vez de repetido en cada acción del cliente).
-- ============================================================
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
-- Sin policy de insert/update para authenticated: solo el trigger (security definer) escribe aqui.

create function track_vehicle_history()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Estado cambió y el anterior estaba activo (Asignado/Taller): cierra la fila abierta.
  if old.estado is distinct from new.estado and old.estado in ('Asignado', 'Taller') then
    update historial
    set fecha_devolucion_real = current_date,
        novedades_retorno = coalesce(new.observaciones, 'Vehículo pasó a estado: ' || new.estado),
        km_fin = new.km_actual
    where placa = new.placa and fecha_devolucion_real is null;
  end if;

  -- Nuevo estado es activo: abre fila nueva.
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

-- ============================================================
-- 5. SOLICITUDES — pedido de sustituto por un gestor.
-- ============================================================
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

-- ============================================================
-- 6. ACTAS — entrega/recibido. Fotos y firma van a Storage (bucket 'actas'), aqui solo URLs.
-- ============================================================
create table actas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('Entrega', 'Recibido')),
  placa text not null references vehicles(placa),
  fecha date not null default current_date,
  cliente text,
  conductor text,
  kilometraje integer,
  nivel_combustible text,
  checklist jsonb,
  observaciones text,
  fotos_urls text[] not null default '{}',
  firma_url text,
  creada_por uuid references profiles(id) not null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table actas enable row level security;

create policy "actas: leer si hay perfil" on actas
  for select using (exists (select 1 from profiles where id = auth.uid()));

create policy "actas: crear si hay perfil" on actas
  for insert to authenticated with check (exists (select 1 from profiles where id = auth.uid()));

-- ============================================================
-- 7. STORAGE — bucket privado para fotos/firmas de actas.
-- ============================================================
insert into storage.buckets (id, name, public) values ('actas', 'actas', false);

create policy "actas storage: leer si hay perfil" on storage.objects
  for select using (bucket_id = 'actas' and exists (select 1 from profiles where id = auth.uid()));

create policy "actas storage: subir si hay perfil" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'actas' and exists (select 1 from profiles where id = auth.uid())
  );

-- ============================================================
-- 8. PROFILES — permitir que un admin cambie el rol de otro usuario (pantalla Admin > Usuarios).
-- ============================================================
create policy "profiles: admin actualiza roles" on profiles
  for update to authenticated using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- 9. RESOLVER SOLICITUD — asignar vehiculo + cerrar solicitud en una sola transaccion.
-- ============================================================
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
