-- PASO 9 (agregado despues del paso 8) — permite que un admin cambie el rol de otro usuario
-- desde la app (pantalla Administrador > Usuarios). Antes de esto, profiles solo se podia
-- leer, nunca actualizar desde el cliente. Usa is_admin() (creada en el paso 1) para evitar
-- la misma recursion infinita que tenia la policy de select.
create policy "profiles: admin actualiza roles" on profiles
  for update to authenticated using (is_admin()) with check (is_admin());
