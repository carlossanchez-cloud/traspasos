# Pendientes para Carlos

Cosas de la rama `sandbox/alejo` que necesitan a alguien con acceso a Supabase o a Vercel. Desde la app no se
pueden hacer.

## 1. Pasos SQL (Supabase → SQL Editor), en este orden

Correrlos en el proyecto de Supabase que usa el preview de `sandbox/alejo`, y después en producción cuando la
rama pase a `main`. Todos se pueden volver a correr sin dañar nada.

| Paso | Archivo | Para qué |
|---|---|---|
| 19 | `supabase/steps/19_firma_gestor_y_cliente.sql` | Firma del gestor y del cliente por separado (antes la del cliente borraba la del gestor) y permisos del enlace público. |
| 20 | `supabase/steps/20_fix_storage_select_anon.sql` | Arregla "permission denied for table profiles" al firmar desde el enlace sin sesión. |
| 21 | `supabase/steps/21_consecutivo_y_ciclo_actas.sql` | N.º consecutivo de actas y control entrega → recibido. Sin él, los recibidos salen sin número y la base de datos no impide entregar dos veces la misma placa. |
| 22 | `supabase/steps/22_rol_lector.sql` | Tercer rol, Lector (solo ver). Los correos nuevos entran como Lector y la base de datos les impide crear actas, solicitudes o subir fotos. Los usuarios actuales conservan su rol. |
| 23 | `supabase/steps/23_inventario.sql` | Tablas del módulo Inventario (activos, pasos por inventario y ofertas). Todos los usuarios pueden ver; solo el Administrador general edita. |
| 24 | `supabase/steps/24_fix_permiso_subir_fotos.sql` | **Urgente.** Arregla "permission denied for function acta_publica_abierta": sin esto el gestor no puede guardar ninguna acta (falla al subir fotos y firma). Una sola línea. |
| — | `importar_inventario.sql` (lo tiene Alejo, **no está en el repositorio** porque trae precios y VPN reales) | Carga inicial del Excel BD_INVENTARIO_V2_4: 1.497 activos y 1.557 pasos por inventario. Correr una sola vez, después del 23; si ya hay datos se detiene sola. |

Para confirmar que quedaron:

```sql
select column_name from information_schema.columns
where table_name = 'actas' and column_name in ('firma_cliente_url', 'consecutivo', 'acta_entrega_id');
```

Deben salir las 3 filas. Para el 22:

```sql
select column_default from information_schema.columns where table_name = 'profiles' and column_name = 'role';
```

Debe decir `'lector'::text`.

## 2. Vercel (proyecto `sustitutos`)

- **Settings → Environment Variables:** que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de **Preview** apunten
  a un proyecto de Supabase que exista. El preview usaba `tafzgfqoxzauyrgtnsfp`, que estaba caído;
  producción usa `xsbfohfjqkjwyubzxqbf`. Después de cambiarlas, hacer **Redeploy**.
- **Settings → Deployment Protection:** si se quiere que Alejo abra los previews sin cuenta de Vercel,
  desactivar "Vercel Authentication" para los previews.

## 3. Supabase → Authentication → URL Configuration

- En **Redirect URLs** agregar `https://*.vercel.app/**`, para que el login con Google vuelva al preview y no a
  producción.

## 4. Datos de prueba

- Dos actas firmadas antes del paso 19 quedaron con la firma del gestor reemplazada por la del cliente. No se
  pueden corregir desde la app.
- Si quedaron dos entregas de la misma placa sin recibido, la más vieja va a figurar como pendiente siempre:
  borrarla o cerrarla en Supabase.
