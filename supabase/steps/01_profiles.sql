-- PASO 1 de 8 — Perfiles y control de acceso por correo.
-- *** Antes de correr esto: cambia los 2 correos de la linea "when new.email in (...)"
-- *** por el correo real de Carlos y el de Alejandro. Guarda el archivo ANTES de copiar.

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
