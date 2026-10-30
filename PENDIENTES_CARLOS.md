# Pendientes para Carlos

Cosas de la rama `sandbox/alejo` que necesitan a alguien con acceso a Supabase o a Vercel. Desde la app no se
pueden hacer.

## 1. Preview: al día

Los pasos 19 a 30 ya se corrieron en el Supabase del preview (Carlos confirmó los 25 a 30 el 30/10/2026).
Si Inventario sigue vacío en el preview, falta `importar_inventario.sql` (lo tiene Alejo; **no está en el
repositorio** porque trae precios y VPN reales). Para confirmar:

```sql
select (select count(*) from inv_activos) as activos, (select count(*) from inv_ingresos) as ingresos;
-- debe dar 1497 y 1557
```

## 2. Cuando `sandbox/alejo` pase a `main` (producción)

1. Revisar y unir el pull request de `sandbox/alejo` a `main`.
2. En el Supabase de producción (`xsbfohfjqkjwyubzxqbf`) correr, en este orden, los pasos **19, 20, 21, 22, 23,
   24, 25, 26, 27, 28, 29 y 30** de `supabase/steps/`. Sin ellos, las actas nuevas fallan en producción.
3. Cargar el inventario con `importar_inventario.sql` (lo tiene Alejo; **no está en el repositorio** porque trae
   precios y VPN reales). Una sola vez, después del 23; si ya hay datos se detiene sola.
4. Revisar que en Supabase → Authentication → URL Configuration esté la URL de producción.

| Paso | Archivo | Para qué |
|---|---|---|
| 19 | `19_firma_gestor_y_cliente.sql` | Firma del gestor y del cliente por separado, y permisos del enlace público. |
| 20 | `20_fix_storage_select_anon.sql` | Arregla "permission denied for table profiles" al firmar desde el enlace sin sesión. |
| 21 | `21_consecutivo_y_ciclo_actas.sql` | N.º consecutivo de actas y control entrega → recibido. |
| 22 | `22_rol_lector.sql` | Tercer rol, Lector (solo ver). Los correos nuevos entran como Lector. |
| 23 | `23_inventario.sql` | Tablas del módulo Inventario. |
| 24 | `24_fix_permiso_subir_fotos.sql` | Arregla "permission denied for function acta_publica_abierta" al guardar actas. |
| 25 | `25_eliminar_actas.sql` | Eliminar actas incompletas con registro (ver arriba). |
| 26 | `26_fechas_solicitud_obligatorias.sql` | Fechas obligatorias en las solicitudes (ver arriba). |
| 27 | `27_vehiculo_al_asignar.sql` | Copia del vehículo al asignarlo (ver arriba). |
| 28 | `28_arrendamiento_tercerizado.sql` | Asignación por arrendamiento tercerizado (ver arriba). |
| 29 | `29_ciclo_estados_vehiculo.sql` | Estados del vehículo según las actas (ver arriba). |
| 30 | `30_cancelar_solicitud.sql` | Cancelar solicitudes con motivo (ver arriba). |

Para confirmar en producción:

```sql
-- 4 filas (pasos 19, 21 y 25)
select column_name from information_schema.columns
where table_name = 'actas' and column_name in ('firma_cliente_url', 'consecutivo', 'acta_entrega_id', 'eliminada_en');

-- 'lector'::text (paso 22)
select column_default from information_schema.columns where table_name = 'profiles' and column_name = 'role';
```

## 3. Más adelante (cuando haya tiempo)

- **Gastos editable desde la app:** hoy la pestaña Gastos sale de un Excel fijo dentro del código. Para que el
  Administrador lo edite hace falta una tabla nueva en Supabase (se prepara el paso SQL cuando se retome).

## 4. Datos de prueba

- Algunas actas de prueba se firmaron antes del paso 19 y la firma del cliente reemplazó la del gestor. No se
  corrigen desde la app; si molestan, se pueden eliminar (con el paso 25) o borrar en Supabase.
