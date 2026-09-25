-- PASO 6 de 8 — Actas de entrega/recibido.

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
