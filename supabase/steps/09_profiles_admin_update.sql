-- PASO 9 (agregado despues del paso 8) — permite que un admin cambie el rol de otro usuario
-- desde la app (pantalla Administrador > Usuarios). Antes de esto, profiles solo se podia
-- leer, nunca actualizar desde el cliente.
create policy "profiles: admin actualiza roles" on profiles
  for update to authenticated using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
