-- PASO 19 — el acta la firma primero el gestor de flota y despues el cliente por el enlace.
--
-- Flujo nuevo: el gestor (o el encargado del taller) llena el acta, toma las fotos y FIRMA el; al
-- guardar, el acta queda cerrada para el y aparece "Enviar para firma del cliente". El cliente abre el
-- enlace, ve todo (incluidas las fotos) sin poder editar, y solo agrega nombre, observaciones, fotos
-- opcionales y su firma.
--
-- Cambios:
-- 1. Columna nueva firma_cliente_url. firma_url pasa a ser la firma del gestor; antes el envio del
--    cliente la sobreescribia (firma_url = coalesce(p_firma_url, firma_url)), asi se perdia una de las dos.
-- 2. submit_acta_publica escribe la firma del cliente en firma_cliente_url y la exige; las fotos del
--    cliente son opcionales.
-- 3. Repite (idempotente) lo que el flujo publico necesita para el rol anon, porque el envio del cliente
--    fallaba en pruebas con "revisa tu conexion": el paso 16 quita a anon el USAGE del schema public (sin
--    eso anon no puede llamar ninguna funcion) y el paso 18 (policy de storage) pudo no haberse corrido
--    en todos los proyectos. Correr este paso deja ambas cosas bien sin importar que se corrio antes.
--    Las tablas siguen cerradas para anon (paso 16): solo puede ejecutar estas 3 funciones.

alter table actas add column if not exists firma_cliente_url text;

grant usage on schema public to anon;

-- ---- (igual al paso 18) chequeo para la policy de storage del cliente ----
create or replace function public.acta_disponible_para_publica(p_acta_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from actas where id = p_acta_id and not bloqueada);
$$;

revoke all on function public.acta_disponible_para_publica(uuid) from public;
grant execute on function public.acta_disponible_para_publica(uuid) to anon;

drop policy if exists "actas storage: cliente sube evidencia publica si el acta no esta bloqueada" on storage.objects;

create policy "actas storage: cliente sube evidencia publica si el acta no esta bloqueada" on storage.objects
  for insert to anon with check (
    bucket_id = 'actas'
    and (storage.foldername(name))[1] = 'publicas'
    and public.acta_disponible_para_publica(((storage.foldername(name))[2])::uuid)
  );

-- ---- envio del cliente: firma propia, fotos opcionales ----
create or replace function submit_acta_publica(
  p_token uuid,
  p_nombre_cliente text,
  p_observaciones_cliente text,
  p_fotos_urls_cliente text[],
  p_firma_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text := 'publicas/' || p_token::text || '/';
  v_path text;
begin
  if p_nombre_cliente is null or btrim(p_nombre_cliente) = '' then
    raise exception 'El nombre del cliente es obligatorio';
  end if;
  if p_firma_url is null or p_firma_url !~ ('^' || v_prefix) then
    raise exception 'Firma invalida para esta acta';
  end if;

  if not exists (select 1 from actas where id = p_token and not bloqueada) then
    raise exception 'Acta no existe o ya fue firmada por el cliente';
  end if;

  foreach v_path in array coalesce(p_fotos_urls_cliente, '{}') loop
    if v_path !~ ('^' || v_prefix) then
      raise exception 'Foto invalida para esta acta';
    end if;
  end loop;

  update actas set
    nombre_cliente = btrim(p_nombre_cliente),
    observaciones_cliente = p_observaciones_cliente,
    fotos_urls_cliente = coalesce(p_fotos_urls_cliente, '{}'),
    firma_cliente_url = p_firma_url,
    bloqueada = true
  where id = p_token and not bloqueada;
end;
$$;

revoke all on function submit_acta_publica(uuid, text, text, text[], text) from public;
grant execute on function submit_acta_publica(uuid, text, text, text[], text) to anon;

revoke all on function get_acta_publica(uuid) from public;
grant execute on function get_acta_publica(uuid) to anon;

-- Que la API de Supabase vea ya la columna nueva.
notify pgrst, 'reload schema';
