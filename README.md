# Flota Sustitutos

Migración del prototipo HTML de Alejo (React+Tailwind client-only, localStorage) a una app real: React + Vite + Supabase (auth, DB, storage).

## Estado

App funcional en el código (dashboard, mapa, solicitudes, actas, informes, admin), auth con Google restringido a
`@rentandes.com`, esquema SQL completo con RLS. **Falta que Carlos cree el proyecto de Supabase y complete la
configuración** — no se puede probar en vivo hasta ese paso.

## 1. Crear el proyecto Supabase

1. [supabase.com](https://supabase.com) → New Project.
2. SQL Editor → pegar y correr **`supabase/schema.sql`** completo.
   - **Antes de correrlo**, edita la línea `when new.email in (...)` cerca del principio y pon los correos reales de
     Carlos y Alejandro (hoy tiene placeholders).
3. SQL Editor → correr **`supabase/seed.sql`** (carga los 24 vehículos reales que ya tenía Alejo).
4. Authentication → Providers → Google: activar, seguir el flujo de Google Cloud Console para el Client ID/Secret
   (instrucciones en el propio dashboard de Supabase). En Authentication → URL Configuration, agregar la URL de
   producción cuando exista (por ahora `http://localhost:5173` sirve para probar local).
5. Settings → API: copiar `Project URL` y `anon public key`.

## 2. Configurar el repo local

```
cp .env.example .env
# pegar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env
npm install
npm run dev
```

## 3. Roles

No hay UI de gestión de usuarios todavía (no se construyó, ver "Qué falta"). El trigger `handle_new_user` en
`schema.sql` asigna `admin` automáticamente a los dos correos que edites en el paso 1; cualquier otro
`@rentandes.com` que inicie sesión entra como `gestor`. Para subir a alguien a admin después, editarlo a mano en
Supabase → Table Editor → `profiles`.

## 4. Deploy

No configurado todavía. Más simple: Vercel o Netlify conectado al repo de GitHub, variables de entorno
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` en su dashboard. `npm run build` genera `dist/`.

## Qué falta (a propósito, no es descuido)

- **Gestión de usuarios/roles vía UI** — hoy se hace a mano en Supabase. Agregar si el equipo crece.
- **Firma digital con canvas** — hoy Actas acepta subir una foto/imagen de firma, no un pad de firma en pantalla.
- **Visor de fotos de actas** — se suben y quedan en Storage (bucket privado `actas`), pero no hay galería para
  verlas dentro de la app todavía (se pueden ver desde el dashboard de Supabase Storage mientras tanto).
- **Módulo financiero** (costos por vehículo/parqueadero/traslado) — mencionado en la reunión como fase futura, no
  se construyó.
- **Mantenimiento detallado por ítem** (aceite/llantas/frenos con % ponderado) — la tabla `vehicles` tiene la
  columna `mto_detalle jsonb` lista para esto, pero no hay UI todavía.
- La resolución de una solicitud (asignar vehículo) hace 2 escrituras seguidas desde el cliente (vehículo +
  solicitud), no es atómica. Para 24 vehículos y 1-2 admins el riesgo de carrera es bajo; si crece, mover a una
  función RPC de Postgres.

## Seguridad

- El PIN hardcodeado del prototipo (`3899`) no existe aquí — reemplazado por Google OAuth + Row Level Security.
  Sin fila en `profiles` (dominio no autorizado) = sin acceso a ninguna tabla, verificado por RLS en cada policy.
- Fotos y firmas de actas van a un bucket **privado** de Storage, no público.
