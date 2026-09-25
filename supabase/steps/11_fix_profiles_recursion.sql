-- PASO 11 (agregado despues del 10) — arregla "infinite recursion detected in policy
-- for relation profiles". Las policies de profiles (select y update) comprobaban "sos admin"
-- haciendo un select A LA MISMA TABLA profiles dentro de su propia policy -> Postgres vuelve
-- a evaluar esa policy para las filas del subquery, que a su vez... recursion infinita.
--
-- Fix estandar de Supabase: una funcion security definer que consulta profiles SIN pasar
-- por RLS (por eso security definer), usada desde la policy en vez del select inline.
-- Solo mira la fila del usuario actual (auth.uid()), no expone nada mas.
create function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

drop policy "profiles: ver propio o si admin" on profiles;
create policy "profiles: ver propio o si admin" on profiles
  for select using (id = auth.uid() or is_admin());

drop policy "profiles: admin actualiza roles" on profiles;
create policy "profiles: admin actualiza roles" on profiles
  for update to authenticated using (is_admin()) with check (is_admin());
