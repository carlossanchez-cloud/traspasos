-- PASO 7 de 8 — Bucket privado para fotos y firmas de actas.

insert into storage.buckets (id, name, public) values ('actas', 'actas', false);

create policy "actas storage: leer si hay perfil" on storage.objects
  for select using (bucket_id = 'actas' and exists (select 1 from profiles where id = auth.uid()));

create policy "actas storage: subir si hay perfil" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'actas' and exists (select 1 from profiles where id = auth.uid())
  );
