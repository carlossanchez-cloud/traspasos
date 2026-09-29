-- PASO 16 — vista publica sin login para que el cliente firme su parte del acta.
--
-- Flujo: el gestor crea/llena el acta como siempre (INSERT autenticado, sin cambios).
-- El acta NUNCA tuvo UPDATE para 'authenticated' (solo INSERT/SELECT, ver 06_actas.sql),
-- asi que la parte del gestor ya queda "bloqueada" por diseno en cuanto la guarda: no hay
-- forma de que el gestor la edite despues. Lo unico que faltaba era una via para que el
-- CLIENTE (sin cuenta, sin sesion de Supabase) agregue su nombre/observaciones/fotos/firma
-- y quede registrado que ya se cerro.
--
-- Token del enlace publico: se reusa actas.id (uuid v4 de gen_random_uuid(), no
-- enumerable/adivinable) en vez de agregar una columna de token nueva - ya cumple el
-- requisito de "unguessable" y evita una columna redundante.
--
-- Seguridad: NO se agrega ninguna policy de RLS "anon puede leer/escribir actas". Eso
-- abriria la tabla completa (un cliente sin id concreto podria listar TODAS las actas via
-- REST). En cambio, dos funciones security definer hacen de API angosta: reciben el id
-- puntual (el token que el cliente ya tiene por el link) y devuelven/tocan solo esa fila y
-- solo las columnas que le corresponden al cliente. El storage tambien queda acotado a la
-- carpeta publicas/{acta_id}/ de una acta puntual que aun no este bloqueada.

alter table actas add column if not exists bloqueada boolean not null default false;
alter table actas add column if not exists nombre_cliente text;
alter table actas add column if not exists observaciones_cliente text;
alter table actas add column if not exists fotos_urls_cliente text[] not null default '{}';

-- ============================================================
-- Lectura publica: solo los campos que el cliente necesita ver (llenados por el gestor),
-- nunca toda la fila ni otras actas.
-- ============================================================
create or replace function get_acta_publica(p_token uuid)
returns table (
  id uuid, tipo text, placa text, fecha date, cliente text, conductor text,
  kilometraje integer, nivel_combustible text, checklist jsonb, observaciones text,
  bloqueada boolean, nombre_cliente text, observaciones_cliente text
)
language sql
security definer
set search_path = public
stable
as $$
  select a.id, a.tipo, a.placa, a.fecha, a.cliente, a.conductor,
         a.kilometraje, a.nivel_combustible, a.checklist, a.observaciones,
         a.bloqueada, a.nombre_cliente, a.observaciones_cliente
  from actas a
  where a.id = p_token;
$$;

grant execute on function get_acta_publica(uuid) to anon;

-- ============================================================
-- Envio publico: solo puede tocar nombre_cliente/observaciones_cliente/fotos_urls_cliente/
-- firma_url de ESA acta, y solo si todavia no estaba bloqueada (evita reescribir una firma
-- ya puesta, o que alguien reenvie el formulario dos veces).
-- ============================================================
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

  if not exists (select 1 from actas where id = p_token and not bloqueada) then
    raise exception 'Acta no existe o ya fue firmada por el cliente';
  end if;

  -- Los paths de foto/firma deben venir de la carpeta publicas/{token}/ de ESTA acta
  -- (la unica que la policy de storage de abajo permite subir para un token no bloqueado),
  -- nunca de otra acta o de otra carpeta del bucket.
  foreach v_path in array coalesce(p_fotos_urls_cliente, '{}') loop
    if v_path !~ ('^' || v_prefix) then
      raise exception 'Foto invalida para esta acta';
    end if;
  end loop;
  if p_firma_url is not null and p_firma_url !~ ('^' || v_prefix) then
    raise exception 'Firma invalida para esta acta';
  end if;

  update actas set
    nombre_cliente = btrim(p_nombre_cliente),
    observaciones_cliente = p_observaciones_cliente,
    fotos_urls_cliente = coalesce(p_fotos_urls_cliente, '{}'),
    firma_url = coalesce(p_firma_url, firma_url),
    bloqueada = true
  where id = p_token and not bloqueada;
end;
$$;

grant execute on function submit_acta_publica(uuid, text, text, text[], text) to anon;

-- ============================================================
-- Storage: el cliente (anon) puede SUBIR fotos/firma solo bajo publicas/{acta_id}/ y solo
-- si esa acta puntual existe y no esta bloqueada todavia. Sin policy de select para anon:
-- no necesita leer del bucket, solo escribir su propia evidencia.
-- ============================================================
create policy "actas storage: cliente sube evidencia publica si el acta no esta bloqueada" on storage.objects
  for insert to anon with check (
    bucket_id = 'actas'
    and (storage.foldername(name))[1] = 'publicas'
    and exists (
      select 1 from actas
      where id::text = (storage.foldername(name))[2]
        and not bloqueada
    )
  );
