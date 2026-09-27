-- PASO 13 — corrige tipo_vehiculo de los 24 vehiculos del seed original.
-- El INSERT de 08_seed.sql nunca listo la columna tipo_vehiculo, asi que las 24 filas
-- quedaron con el default del schema ('Automovil') sin importar que casi todas son
-- SUV/pickup/furgoneta reales. Corregido a mano a partir del texto real de `modelo`
-- (Automovil / Camioneta / Pickup son los 3 unicos valores que usa la UI, ver
-- VehicleTypeIcon.jsx y el <select> de Solicitudes.jsx).

update vehicles set tipo_vehiculo = 'Camioneta' where placa in (
  'LHV966', -- Ford Escape Hibrida (SUV)
  'NFZ931', 'NFV258', 'LHT164', -- Suzuki Grand Vitara (SUV)
  'LUX232', -- Chevrolet Captiva (SUV)
  'LQW524', -- Renault Duster (SUV)
  'LQL065', 'LZL869', 'LZL872', 'LZL873', 'LZL879', 'LZL880', 'LZL881' -- Renault Kangoo (furgoneta, techo alto)
);

update vehicles set tipo_vehiculo = 'Pickup' where placa in (
  'LHV915', 'LHV917', 'LQS678', 'LQS688', 'LQS690', -- Volkswagen Amarok
  'LQS871', -- Chevrolet Colorado
  'LQT234', 'LQT236', 'LUY174', 'LUY210', -- JAC T8
  'LQT877' -- Renault Duster Oroch
);

-- El resto (ninguno en este seed) se queda en el default 'Automovil'.
