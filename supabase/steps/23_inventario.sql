-- PASO 23 (correr despues del 22) — modulo Inventario.
--
-- Pasa a la base de datos lo que hoy vive en BD_INVENTARIO_V2_4.xlsx:
--   inv_activos  = el activo (placa o ID): categoria, tipo, marca, linea, clase, servicio, modelo.
--   inv_ingresos = cada paso del activo por el inventario (una fila de la hoja INVENTARIO). Un activo puede
--                  entrar, salir (vendido / recolocado) y volver a entrar: cada vez es un ingreso nuevo.
--                  Lleva la parte tecnica (estado, ubicacion, documentos, reparaciones, precios, VPN, y lo
--                  operativo de la hoja ESTADOS) y la salida (valor vendido, fecha, quien vendio, a quien).
--   inv_ofertas  = las ofertas que registra Comercial por cada ingreso, con su estado.
-- Meses en inventario, % de venta, saldo a favor (venta - VPN) y la carga ponderada se calculan en la app.
--
-- Permisos: cualquier usuario con perfil (admin, gestor, lector) puede VER; solo el Administrador general
-- puede crear o cambiar.
--
-- Los datos del Excel se cargan aparte con el archivo de importacion que se genera desde el Excel (no va en
-- el repositorio porque trae valores comerciales reales).

create table if not exists inv_activos (
  id text primary key,                       -- placa o ID interno (columna ID del Excel)
  categoria text not null,
  tipo text,
  marca text,
  linea text,
  clase text,
  tipo_servicio text,
  modelo integer,
  created_at timestamptz not null default now()
);

create table if not exists inv_ingresos (
  id uuid primary key default gen_random_uuid(),
  activo_id text not null references inv_activos(id),
  en_inventario boolean not null default true,
  situacion text not null,
  origen text,
  fecha_recuperado date,
  fecha_ingreso date not null,
  fecha_solicitud_avaluo date,
  km_hr numeric,
  ciudad text,
  parqueadero text,
  direccion text,
  proyecto_cliente text,
  ultimo_contrato text,
  administrador_flota text,
  -- documentos: 'OK' / 'NO' / null
  doc_fotos text, doc_video text, doc_avaluo text, doc_acta_valor text, doc_tarjeta text, doc_improntas text,
  reclamacion_siniestros text,
  fecha_ultima_acta_valor date,
  tiempo_reparacion numeric,
  link_carpeta text,
  pag_web text,
  costo_reparaciones numeric,
  costo_recolocar numeric,
  valor_venta_propuesto numeric,
  calificacion numeric check (calificacion is null or (calificacion > 0 and calificacion <= 1)),
  detalle_reparaciones text,
  valor_vpn numeric,
  -- operativo (hoja ESTADOS)
  nivel_combustible numeric,
  fecha_revision_combustible date,
  vence_soat date,
  vence_rtm date,
  observaciones_estado text,
  -- salida (Comercial)
  fecha_salida date,
  valor_vendido numeric,
  vendido_por text,
  fuente_venta text,
  traspaso_a text,
  facturado_a text,
  notas_venta text,
  actualizado_por uuid references profiles(id) default auth.uid(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists inv_ingresos_activo on inv_ingresos (activo_id);
create index if not exists inv_ingresos_en_inventario on inv_ingresos (en_inventario);
-- Un activo no puede estar dos veces en inventario al mismo tiempo.
create unique index if not exists inv_un_ingreso_abierto on inv_ingresos (activo_id) where en_inventario;

create table if not exists inv_ofertas (
  id uuid primary key default gen_random_uuid(),
  ingreso_id uuid not null references inv_ingresos(id) on delete cascade,
  fecha date not null default current_date,
  ofertante text not null,
  valor numeric not null check (valor > 0),
  fuente text,
  estado text not null default 'EN COMITÉ',
  notas text,
  creada_por uuid references profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists inv_ofertas_ingreso on inv_ofertas (ingreso_id);

-- updated_at y actualizado_por los pone la base de datos en cada cambio (trazabilidad de quien edito).
create or replace function public.inv_marcar_cambio()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.actualizado_por := coalesce(auth.uid(), new.actualizado_por);
  return new;
end;
$$;
drop trigger if exists inv_ingresos_cambio on inv_ingresos;
create trigger inv_ingresos_cambio before update on inv_ingresos
  for each row execute function public.inv_marcar_cambio();

alter table inv_activos enable row level security;
alter table inv_ingresos enable row level security;
alter table inv_ofertas enable row level security;

do $$
declare t text;
begin
  foreach t in array array['inv_activos', 'inv_ingresos', 'inv_ofertas'] loop
    execute format('drop policy if exists "%1$s: leer si hay perfil" on %1$s', t);
    execute format('create policy "%1$s: leer si hay perfil" on %1$s for select to authenticated using (exists (select 1 from profiles where id = auth.uid()))', t);
    execute format('drop policy if exists "%1$s: escribir solo admin" on %1$s', t);
    execute format('create policy "%1$s: escribir solo admin" on %1$s for all to authenticated using (is_admin()) with check (is_admin())', t);
    execute format('revoke all on table %1$s from anon, authenticated', t);
    execute format('grant select, insert, update on table %1$s to authenticated', t);
  end loop;
end $$;

notify pgrst, 'reload schema';
