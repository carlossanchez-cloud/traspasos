-- Generado desde Informe_Flota_2026-09-29 (2).csv - revisar ANOMALIAS (ver salida del script) antes de correr.
-- El UPDATE de vehicles de abajo dispara el trigger vehicles_track_history (04_historial.sql) -
-- lo desactivamos mientras se carga el backfill para que no invente una fila de historial
-- duplicada (una nuestra + una del trigger) para el ciclo actualmente abierto de cada placa.
-- Todo en una transaccion: si algo falla a la mitad, no queda nada a medias.

begin;

alter table vehicles disable trigger vehicles_track_history;

-- Historial: inserta cada ciclo del CSV que todavia no exista (dedupe por placa+fecha_inicio+fecha_fin).

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LHT164', 'Asignado', 'AUT RIO MAGDALENA', 'RENTANDES', '2026-08-10', '2026-09-07', '2026-09-07', 'Sin novedades', 'Vehículo pasó a estado: Disponible', 'NPV373', 38999, 39153
where not exists (select 1 from historial where placa = 'LHT164' and fecha_inicio = '2026-08-10' and coalesce(fecha_fin::text,'') = coalesce('2026-09-07'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LHV915', 'Asignado', 'VESTAS', 'ALEJO', '2026-08-03', null, null, 'Sin novedades', 'Sin novedades', 'PWL163', 684500, null
where not exists (select 1 from historial where placa = 'LHV915' and fecha_inicio = '2026-08-03' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LHV966', 'Asignado', 'hjgjgh', 'RENTANDES', '2026-06-16', '2026-06-16', '2026-06-16', 'j', 'AUTORIZACION POR CORREO', 'AAA123', 40626, 40627
where not exists (select 1 from historial where placa = 'LHV966' and fecha_inicio = '2026-06-16' and coalesce(fecha_fin::text,'') = coalesce('2026-06-16'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LHV966', 'Asignado', 'eurofarma', 'LUIS', '2026-07-28', '2026-09-07', '2026-09-07', 'Sin novedades', 'AUTORIZACION POR CORREO', 'NFZ941', 40627, 42207
where not exists (select 1 from historial where placa = 'LHV966' and fecha_inicio = '2026-07-28' and coalesce(fecha_fin::text,'') = coalesce('2026-09-07'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LHV966', 'Asignado', 'SECURITAS', 'JESUS', '2026-09-10', '2026-09-24', '2026-09-24', 'Sin novedades', 'AUTORIZACION POR CORREO', 'NFV975', 42207, 42223
where not exists (select 1 from historial where placa = 'LHV966' and fecha_inicio = '2026-09-10' and coalesce(fecha_fin::text,'') = coalesce('2026-09-24'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LHV966', 'Asignado', 'EUROFARMA', 'LUIS', '2026-09-24', null, null, 'Sin novedades', 'Sin novedades', 'NGK470', 42223, null
where not exists (select 1 from historial where placa = 'LHV966' and fecha_inicio = '2026-09-24' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQL065', 'Asignado', 'TRANE', 'CRISTIAN', '2026-07-01', null, null, 'SE ENTREGA EN VIGIA. MTTO AL DIA', 'Sin novedades', 'LZN000', 53467, null
where not exists (select 1 from historial where placa = 'LQL065' and fecha_inicio = '2026-07-01' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQS678', 'Taller', 'IVAN CARS', 'RENTANDES', '2026-06-25', '2026-07-28', '2026-07-28', 'AUTORIZACION PREVIA A CORREO', 'AUTORIZACION PREVIA A CORREO', null, 58390, 59609
where not exists (select 1 from historial where placa = 'LQS678' and fecha_inicio = '2026-06-25' and coalesce(fecha_fin::text,'') = coalesce('2026-07-28'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQS678', 'Asignado', 'SERVICIO DE SALUD INMEDIATO IPS', 'luis', '2026-08-04', '2026-08-25', '2026-08-25', 'Sin novedades', 'AUTORIZACION PREVIA A CORREO', 'NPY119', 59609, 59610
where not exists (select 1 from historial where placa = 'LQS678' and fecha_inicio = '2026-08-04' and coalesce(fecha_fin::text,'') = coalesce('2026-08-25'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQS678', 'Asignado', 'SERVICIO DE SALUD INMEDIATO I.P.S. S.A.S.', 'RENTANDES', '2026-09-17', null, null, 'Sin novedades', 'Sin novedades', 'NFZ940', 59741, null
where not exists (select 1 from historial where placa = 'LQS678' and fecha_inicio = '2026-09-17' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQS688', 'Asignado', '3net', 'cristian', '2026-07-02', null, null, 'Sin novedades', 'Sin novedades', null, 81672, null
where not exists (select 1 from historial where placa = 'LQS688' and fecha_inicio = '2026-07-02' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQS690', 'Taller', 'TALLER EL CONDE', 'RENTANDES', '2026-09-02', null, null, '22/05 se valida con taller, mejor opcion es traer a bogota', 'Sin novedades', null, 77299, null
where not exists (select 1 from historial where placa = 'LQS690' and fecha_inicio = '2026-09-02' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQS871', 'Asignado', 'oceanos', 'ALEJO', '2026-07-22', null, null, 'EL VH EN CONTRATO ESTA EN NISSAN GARANTIA UREA', 'Sin novedades', 'POU448', 80603, null
where not exists (select 1 from historial where placa = 'LQS871' and fecha_inicio = '2026-07-22' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQT234', 'Taller', 'Taller Principal Automotriz', 'RENTANDES', '2026-08-25', '2026-09-09', '2026-09-09', 'KREA NEGOCIOS POR DIRECCION', 'KREA NEGOCIOS POR DIRECCION', null, 21449, 21450
where not exists (select 1 from historial where placa = 'LQT234' and fecha_inicio = '2026-08-25' and coalesce(fecha_fin::text,'') = coalesce('2026-09-09'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQT236', 'Asignado', 'EUROFARMA', 'LUIS', '2026-09-24', '2026-09-24', '2026-09-24', 'Sin novedades', 'SE REALIZO CAMBIO DE ACEITE Y FILTROS A LOS 89904 /// mc servicios diesel COTIZACION PENDIENTE', 'NGK470', 90877, 90878
where not exists (select 1 from historial where placa = 'LQT236' and fecha_inicio = '2026-09-24' and coalesce(fecha_fin::text,'') = coalesce('2026-09-24'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQT877', 'Taller', 'IVANCARS', 'RENTANDES', '2026-07-09', '2026-07-17', '2026-07-17', 'CORREO DE AUTORIZACION PREVIO', 'CORREO DE AUTORIZACION PREVIO', null, 92037, 92039
where not exists (select 1 from historial where placa = 'LQT877' and fecha_inicio = '2026-07-09' and coalesce(fecha_fin::text,'') = coalesce('2026-07-17'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQT877', 'Asignado', 'SERVICIO DE SALLUD', 'RENTANDES', '2026-07-28', null, null, 'Sin novedades', 'Sin novedades', 'NPY120', 92040, null
where not exists (select 1 from historial where placa = 'LQT877' and fecha_inicio = '2026-07-28' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQT877', 'Asignado', 'EUROFARMA', 'luis', '2026-07-28', '2026-08-25', '2026-08-25', 'Sin novedades', 'CORREO DE AUTORIZACION PREVIO', 'NPY120', 92039, 92040
where not exists (select 1 from historial where placa = 'LQT877' and fecha_inicio = '2026-07-28' and coalesce(fecha_fin::text,'') = coalesce('2026-08-25'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQW524', 'Asignado', 'PROCESADORA DE LECHES S.A', 'LUIS', '2026-07-28', '2026-07-30', '2026-07-30', 'Sin novedades', 'TALLER', 'NGK440', 71014, 72397
where not exists (select 1 from historial where placa = 'LQW524' and fecha_inicio = '2026-07-28' and coalesce(fecha_fin::text,'') = coalesce('2026-07-30'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LQW524', 'Asignado', 'AUT RIO MAGDALENA', 'ALEJO', '2026-08-11', null, null, 'Sin novedades', 'Sin novedades', 'NPV372', 72397, null
where not exists (select 1 from historial where placa = 'LQW524' and fecha_inicio = '2026-08-11' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LUX232', 'Asignado', 'SECURITAS', 'JESUS', '2026-06-17', '2026-06-18', '2026-06-18', 'Sin novedades', 'CORREO DE AUTORIZACION - VERIFICAR GPS', 'NFZ279', 29285, 29286
where not exists (select 1 from historial where placa = 'LUX232' and fecha_inicio = '2026-06-17' and coalesce(fecha_fin::text,'') = coalesce('2026-06-18'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LUX232', 'Asignado', 'ACEITES MANUELITA SAS', 'BRYAN', '2026-07-28', '2026-08-05', '2026-08-05', 'VALIDAR PICO Y PLACA PARA LA ENTREGA .KIT DE CARRETERA COMPLETO.', 'CORREO DE AUTORIZACION - VERIFICAR GPS', 'LVV283', 29286, 30031
where not exists (select 1 from historial where placa = 'LUX232' and fecha_inicio = '2026-07-28' and coalesce(fecha_fin::text,'') = coalesce('2026-08-05'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LUX232', 'Asignado', 'tractocentro', 'RENTANDES', '2026-08-17', '2026-08-27', '2026-08-27', 'Sin novedades', 'CORREO DE AUTORIZACION - VERIFICAR GPS', 'POS405', 30031, 30653
where not exists (select 1 from historial where placa = 'LUX232' and fecha_inicio = '2026-08-17' and coalesce(fecha_fin::text,'') = coalesce('2026-08-27'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LUX232', 'Asignado', 'ACEITES MANUELITA', 'BRAYAN', '2026-09-11', null, null, 'Sin novedades', 'Sin novedades', 'NFZ112', 30653, null
where not exists (select 1 from historial where placa = 'LUX232' and fecha_inicio = '2026-09-11' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LUY210', 'Asignado', '3 NET', 'ALEJO', '2026-09-18', null, null, 'Sin novedades', 'Sin novedades', 'LZO095', 77239, null
where not exists (select 1 from historial where placa = 'LUY210' and fecha_inicio = '2026-09-18' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LZL869', 'Asignado', 'VESTAS', 'ALEJANDRO', '2026-07-16', '2026-07-22', '2026-07-22', 'EL CARRO EN CONTRATO EN INGEOCOSMOS ARREGLANDO PINTURA', 'Vehículo pasó a estado: Disponible', 'LZN005', 47777, 46039
where not exists (select 1 from historial where placa = 'LZL869' and fecha_inicio = '2026-07-16' and coalesce(fecha_fin::text,'') = coalesce('2026-07-22'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LZL872', 'Asignado', 'TRANE', 'ALEJANDRO', '2026-06-20', null, null, 'Sin novedades', 'Sin novedades', 'LZN004', 66977, null
where not exists (select 1 from historial where placa = 'LZL872' and fecha_inicio = '2026-06-20' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LZL873', 'Asignado', '3NET', 'ALEJO', '2026-08-17', '2026-09-24', '2026-09-24', 'Sin novedades', 'HACERLA LLEGAR A TALLER PARA REPARACION ELECRICA', 'LZO097', 39781, 50072
where not exists (select 1 from historial where placa = 'LZL873' and fecha_inicio = '2026-08-17' and coalesce(fecha_fin::text,'') = coalesce('2026-09-24'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LZL873', 'Taller', 'PARQUEADERO KREA', 'RENTANDES', '2026-09-24', null, null, 'HACERLA LLEGAR A TALLER PARA REPARACION ELECRICA', 'Sin novedades', null, 50072, null
where not exists (select 1 from historial where placa = 'LZL873' and fecha_inicio = '2026-09-24' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LZL880', 'Asignado', 'SERVICIO DE SALUD INMEDIATO I.P.S. S.A.S.', 'luis', '2026-06-23', '2026-08-27', '2026-08-27', 'se entrega con mtto al dia en jerautos', 'CORREO AUTORIZACION', 'NPY119', 35881, 35882
where not exists (select 1 from historial where placa = 'LZL880' and fecha_inicio = '2026-06-23' and coalesce(fecha_fin::text,'') = coalesce('2026-08-27'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'LZL881', 'Asignado', 'DAIKIN AIRCONDITING COLOMBIA SAS', 'LUIS', '2026-08-04', '2026-09-28', '2026-09-28', 'Sin novedades', 'SIN NOVEDADES', 'LZL868', 24717, 46665
where not exists (select 1 from historial where placa = 'LZL881' and fecha_inicio = '2026-08-04' and coalesce(fecha_fin::text,'') = coalesce('2026-09-28'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'NFV258', 'Asignado', 'SECURITAS', 'jesus', '2026-06-18', '2026-06-22', '2026-06-22', 'Sin novedades', 'JERAUTOS', 'NFZ279', 55968, 56099
where not exists (select 1 from historial where placa = 'NFV258' and fecha_inicio = '2026-06-18' and coalesce(fecha_fin::text,'') = coalesce('2026-06-22'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'NFV258', 'Asignado', 'eurofarma', 'LUIS', '2026-07-09', '2026-09-02', '2026-09-02', 'Sin novedades', 'Vehículo pasó a estado: Disponible', 'NPY119', 56099, 57993
where not exists (select 1 from historial where placa = 'NFV258' and fecha_inicio = '2026-07-09' and coalesce(fecha_fin::text,'') = coalesce('2026-09-02'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'NFV258', 'Asignado', 'SERVICIO DE SALUD INMEDIATO I.P.S. S.A.S.', 'LUIS', '2026-09-17', null, null, 'Sin novedades', 'Sin novedades', 'NFZ930', 57993, null
where not exists (select 1 from historial where placa = 'NFV258' and fecha_inicio = '2026-09-17' and coalesce(fecha_fin::text,'') = coalesce(null::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'NFZ931', 'Asignado', 'securitas', 'JESUS', '2026-07-14', '2026-07-15', '2026-07-15', 'SE ENTREGA FULL', 'Vehículo pasó a estado: Disponible', 'NFZ931', 18685, 18699
where not exists (select 1 from historial where placa = 'NFZ931' and fecha_inicio = '2026-07-14' and coalesce(fecha_fin::text,'') = coalesce('2026-07-15'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'NFZ931', 'Asignado', 'securitas', 'JESUS', '2026-07-22', '2026-08-27', '2026-08-27', 'VH EN CONTRATO SE SINIESTRO', 'Vehículo pasó a estado: Disponible', 'NPX521', 18699, 20600
where not exists (select 1 from historial where placa = 'NFZ931' and fecha_inicio = '2026-07-22' and coalesce(fecha_fin::text,'') = coalesce('2026-08-27'::text,''));

insert into historial (placa, tipo, cliente, admin_flota, fecha_inicio, fecha_fin, fecha_devolucion_real, novedades_asignacion, novedades_retorno, placa_sustituida, km_inicio, km_fin)
select 'NFZ931', 'Asignado', 'SERVICIO DE SALUD INMEDIATO I.P.S. S.A.S.', 'LUIS', '2026-09-17', '2026-09-29', '2026-09-29', 'Sin novedades', 'Vehículo pasó a estado: Disponible', 'NFZ930', 20600, 22284
where not exists (select 1 from historial where placa = 'NFZ931' and fecha_inicio = '2026-09-17' and coalesce(fecha_fin::text,'') = coalesce('2026-09-29'::text,''));

-- ==========================================================
-- Estado actual de vehicles (ultimo ciclo de cada placa)
-- ==========================================================

update vehicles set estado = 'Disponible', cliente = null, admin_flota = 'RENTANDES', fecha_inicio = null, fecha_fin = null, placa_sustituida = null, km_actual = 39153 where placa = 'LHT164';

-- 684500 confirmado real por Carlos (no era typo).
update vehicles set estado = 'Asignado', cliente = 'VESTAS', nombre_ubicacion = nombre_ubicacion, admin_flota = 'ALEJO', fecha_inicio = '2026-08-03', fecha_fin = null, placa_sustituida = 'PWL163', km_actual = 684500 where placa = 'LHV915';

update vehicles set estado = 'Asignado', cliente = 'EUROFARMA', nombre_ubicacion = nombre_ubicacion, admin_flota = 'LUIS', fecha_inicio = '2026-09-24', fecha_fin = null, placa_sustituida = 'NGK470', km_actual = 42223 where placa = 'LHV966';

update vehicles set estado = 'Asignado', cliente = 'TRANE', nombre_ubicacion = nombre_ubicacion, admin_flota = 'CRISTIAN', fecha_inicio = '2026-07-01', fecha_fin = null, placa_sustituida = 'LZN000', km_actual = 53467 where placa = 'LQL065';

update vehicles set estado = 'Asignado', cliente = 'SERVICIO DE SALUD INMEDIATO I.P.S. S.A.S.', nombre_ubicacion = nombre_ubicacion, admin_flota = 'RENTANDES', fecha_inicio = '2026-09-17', fecha_fin = null, placa_sustituida = 'NFZ940', km_actual = 59741 where placa = 'LQS678';

update vehicles set estado = 'Asignado', cliente = '3net', nombre_ubicacion = nombre_ubicacion, admin_flota = 'cristian', fecha_inicio = '2026-07-02', fecha_fin = null, placa_sustituida = null, km_actual = 81672 where placa = 'LQS688';

update vehicles set estado = 'Taller', cliente = null, nombre_ubicacion = 'TALLER EL CONDE', admin_flota = 'RENTANDES', fecha_inicio = '2026-09-02', fecha_fin = null, placa_sustituida = null, km_actual = 77299 where placa = 'LQS690';

update vehicles set estado = 'Asignado', cliente = 'oceanos', nombre_ubicacion = nombre_ubicacion, admin_flota = 'ALEJO', fecha_inicio = '2026-07-22', fecha_fin = null, placa_sustituida = 'POU448', km_actual = 80603 where placa = 'LQS871';

update vehicles set estado = 'Disponible', cliente = null, admin_flota = 'RENTANDES', fecha_inicio = null, fecha_fin = null, placa_sustituida = null, km_actual = 21450 where placa = 'LQT234';

update vehicles set estado = 'Disponible', cliente = null, admin_flota = 'RENTANDES', fecha_inicio = null, fecha_fin = null, placa_sustituida = null, km_actual = 90878 where placa = 'LQT236';

update vehicles set estado = 'Disponible', cliente = null, admin_flota = 'RENTANDES', fecha_inicio = null, fecha_fin = null, placa_sustituida = null, km_actual = 92040 where placa = 'LQT877';

update vehicles set estado = 'Asignado', cliente = 'AUT RIO MAGDALENA', nombre_ubicacion = nombre_ubicacion, admin_flota = 'ALEJO', fecha_inicio = '2026-08-11', fecha_fin = null, placa_sustituida = 'NPV372', km_actual = 72397 where placa = 'LQW524';

update vehicles set estado = 'Asignado', cliente = 'ACEITES MANUELITA', nombre_ubicacion = nombre_ubicacion, admin_flota = 'BRAYAN', fecha_inicio = '2026-09-11', fecha_fin = null, placa_sustituida = 'NFZ112', km_actual = 30653 where placa = 'LUX232';

update vehicles set estado = 'Asignado', cliente = '3 NET', nombre_ubicacion = nombre_ubicacion, admin_flota = 'ALEJO', fecha_inicio = '2026-09-18', fecha_fin = null, placa_sustituida = 'LZO095', km_actual = 77239 where placa = 'LUY210';

-- km_actual = 47777 (KM Inicio del ciclo), no 46039 (KM Fin reportado, menor - el odometro
-- no baja): el dato crudo del recorrido negativo se deja igual en historial arriba, esto
-- solo protege el campo operativo actual.
update vehicles set estado = 'Disponible', cliente = null, admin_flota = 'RENTANDES', fecha_inicio = null, fecha_fin = null, placa_sustituida = null, km_actual = 47777 where placa = 'LZL869';

update vehicles set estado = 'Asignado', cliente = 'TRANE', nombre_ubicacion = nombre_ubicacion, admin_flota = 'ALEJANDRO', fecha_inicio = '2026-06-20', fecha_fin = null, placa_sustituida = 'LZN004', km_actual = 66977 where placa = 'LZL872';

update vehicles set estado = 'Taller', cliente = null, nombre_ubicacion = 'PARQUEADERO KREA', admin_flota = 'RENTANDES', fecha_inicio = '2026-09-24', fecha_fin = null, placa_sustituida = null, km_actual = 50072 where placa = 'LZL873';

update vehicles set estado = 'Disponible', cliente = null, admin_flota = 'RENTANDES', fecha_inicio = null, fecha_fin = null, placa_sustituida = null, km_actual = 35882 where placa = 'LZL880';

update vehicles set estado = 'Disponible', cliente = null, admin_flota = 'RENTANDES', fecha_inicio = null, fecha_fin = null, placa_sustituida = null, km_actual = 46665 where placa = 'LZL881';

update vehicles set estado = 'Asignado', cliente = 'SERVICIO DE SALUD INMEDIATO I.P.S. S.A.S.', nombre_ubicacion = nombre_ubicacion, admin_flota = 'LUIS', fecha_inicio = '2026-09-17', fecha_fin = null, placa_sustituida = 'NFZ930', km_actual = 57993 where placa = 'NFV258';

update vehicles set estado = 'Disponible', cliente = null, admin_flota = 'RENTANDES', fecha_inicio = null, fecha_fin = null, placa_sustituida = null, km_actual = 22284 where placa = 'NFZ931';

alter table vehicles enable trigger vehicles_track_history;

commit;
