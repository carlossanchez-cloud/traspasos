-- PASO 18 — fix real: la policy de storage del paso 17 para subir fotos/firma del acta
-- publica fallaba SIEMPRE para 'anon' con "new row violates row-level security policy"
-- (probado en vivo 2026-09-30, cliente real intentando subir una foto).
--
-- Causa raiz: la policy de storage.objects hacia un `exists (select 1 from actas where ...)`
-- crudo dentro del WITH CHECK. Esa subconsulta corre como el rol actual ('anon'), y por
-- lo tanto queda sujeta a las policies de RLS de `actas` (06_actas.sql) - que solo dejan
-- leer/insertar a quien tiene fila en `profiles` (auth.uid()). Para 'anon', auth.uid() es
-- null, asi que la subconsulta siempre daba 0 filas, sin importar si el acta existia o
-- estaba bloqueada de verdad - la policy de storage nunca podia pasar.
--
-- get_acta_publica/submit_acta_publica (paso 17) no tenian este problema porque son
-- `security definer` (evitan RLS de `actas`). Una policy declarativa de RLS no puede serlo
-- - el fix es mover el chequeo a una funcion `security definer` aparte y llamarla desde la
-- policy, mismo patron que las otras 2 funciones de este mismo paso 17.

create or replace function public.acta_disponible_para_publica(p_acta_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from actas where id = p_acta_id and not bloqueada);
$$;

grant execute on function public.acta_disponible_para_publica(uuid) to anon;

drop policy if exists "actas storage: cliente sube evidencia publica si el acta no esta bloqueada" on storage.objects;

create policy "actas storage: cliente sube evidencia publica si el acta no esta bloqueada" on storage.objects
  for insert to anon with check (
    bucket_id = 'actas'
    and (storage.foldername(name))[1] = 'publicas'
    and public.acta_disponible_para_publica(((storage.foldername(name))[2])::uuid)
  );
