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

Para confirmar que quedaron:

```sql
select column_name from information_schema.columns
where table_name = 'actas' and column_name in ('firma_cliente_url', 'consecutivo', 'acta_entrega_id');
```

Deben salir las 3 filas.

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
