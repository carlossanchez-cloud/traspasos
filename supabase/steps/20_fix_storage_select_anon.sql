-- PASO 20 — fix real: el cliente no podia firmar desde el enlace. Error probado en vivo (2026-10-23,
-- celular sin sesion, despues de correr el paso 19): "permission denied for table profiles".
--
-- Causa raiz: la policy de LECTURA del bucket 'actas' (paso 07) se creo sin "to authenticated", asi que
-- aplica a todos los roles, incluido 'anon'. Al subir un archivo, Storage hace el INSERT devolviendo la
-- fila (RETURNING), y para eso Postgres evalua tambien las policies de SELECT. Esa policy consulta la
-- tabla profiles, y desde el paso 16 anon no tiene ningun permiso sobre profiles: Postgres no la evalua
-- como "falso", lanza el error de permiso y la subida de la firma del cliente falla.
--
-- Fix:
-- 1. La policy de lectura del paso 07 queda solo para 'authenticated' (mismo filtro de siempre).
-- 2. anon puede LEER solo lo que acaba de subir: archivos bajo publicas/{acta_id}/ de un acta que todavia
--    no esta firmada, que es justo lo que necesita el RETURNING de su propia subida. Cuando el cliente
--    firma, el acta queda bloqueada y esos archivos dejan de ser visibles para anon.
--    El chequeo va en una funcion security definer (mismo motivo que el paso 18: anon no puede leer
--    actas directo) y compara el id como texto, para no fallar con carpetas que no son un uuid.

drop policy if exists "actas storage: leer si hay perfil" on storage.objects;

create policy "actas storage: leer si hay perfil" on storage.objects
  for select to authenticated using (
    bucket_id = 'actas' and exists (select 1 from profiles where id = auth.uid())
  );

create or replace function public.acta_publica_abierta(p_carpeta text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from actas where id::text = p_carpeta and not bloqueada);
$$;

revoke all on function public.acta_publica_abierta(text) from public;
grant execute on function public.acta_publica_abierta(text) to anon;

drop policy if exists "actas storage: cliente lee su evidencia mientras firma" on storage.objects;

create policy "actas storage: cliente lee su evidencia mientras firma" on storage.objects
  for select to anon using (
    bucket_id = 'actas'
    and (storage.foldername(name))[1] = 'publicas'
    and public.acta_publica_abierta((storage.foldername(name))[2])
  );
