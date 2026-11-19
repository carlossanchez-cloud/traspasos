-- PASO 31 — estado actual de cada vehiculo (fotos y checklist), el punto de partida antes de entregarlo.
--
-- En la Ficha del vehiculo, el Administrador general registra como esta el carro hoy: fotos y el mismo
-- checklist del acta de entrega, con las novedades por escrito. Cada vez que lo actualiza se guarda una version
-- nueva (nunca se sobrescribe): la ultima es el estado actual y las anteriores quedan como historial.
-- Las fotos van al bucket privado 'actas', carpeta vehiculos/{placa}/ (la policy del paso 22 ya deja subir al
-- admin).
-- Todos los usuarios con perfil pueden verlo; solo el Administrador general puede guardarlo.
-- Se puede volver a correr sin dañar nada.

create table if not exists vehiculo_estados (
  id uuid primary key default gen_random_uuid(),
  placa text not null references vehicles(placa) on update cascade,
  checklist jsonb not null,
  fotos text[] not null default '{}',
  observaciones text,
  creado_por uuid not null default auth.uid() references profiles(id),
  creado_por_email text,
  created_at timestamptz not null default now()
);

create index if not exists vehiculo_estados_placa_fecha on vehiculo_estados (placa, created_at desc);

alter table vehiculo_estados enable row level security;

drop policy if exists "vehiculo_estados: leer si hay perfil" on vehiculo_estados;
create policy "vehiculo_estados: leer si hay perfil" on vehiculo_estados
  for select to authenticated using (exists (select 1 from profiles where id = auth.uid()));

drop policy if exists "vehiculo_estados: crear solo admin" on vehiculo_estados;
create policy "vehiculo_estados: crear solo admin" on vehiculo_estados
  for insert to authenticated with check (is_admin() and creado_por = auth.uid());

-- Sin update ni delete: cada version queda tal cual se guardo.
revoke all on table vehiculo_estados from anon, authenticated;
grant select, insert on table vehiculo_estados to authenticated;

notify pgrst, 'reload schema';
