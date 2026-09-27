-- PASO 14 — foto real subida por un admin, por vehiculo (no generada por IA).
-- Reusa el bucket privado 'actas' ya creado en el paso 7 (mismo patron de signed URL:
-- se guarda el PATH, no una URL publica) bajo el prefijo vehiculos/<placa>/..., para
-- no provisionar un bucket ni politicas nuevas — sus policies ya son "bucket_id =
-- 'actas' y existe perfil", sin restriccion de carpeta.
alter table vehicles add column if not exists foto_path text;
