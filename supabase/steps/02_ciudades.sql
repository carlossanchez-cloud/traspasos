-- PASO 2 de 8 — Lista de ciudades.

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
