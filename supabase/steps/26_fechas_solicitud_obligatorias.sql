-- PASO 26 — fechas obligatorias en las solicitudes de sustituto.
--
-- Una solicitud nueva debe traer fecha requerida y fecha estimada de devolucion, y la devolucion no puede
-- ser antes de la salida. Con eso los dias requeridos (devolucion - salida, minimo 1) siempre se pueden
-- calcular en los informes. La app ya lo exige; esto lo garantiza tambien en la base de datos.
-- "not valid": aplica a las solicitudes nuevas y no revisa las que ya existen (algunas no tienen devolucion).
-- Se puede volver a correr sin dañar nada.

alter table solicitudes drop constraint if exists solicitudes_fechas_obligatorias;
alter table solicitudes add constraint solicitudes_fechas_obligatorias
  check (fecha_inicio is not null and fecha_fin is not null and fecha_fin >= fecha_inicio) not valid;
