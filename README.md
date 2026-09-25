# Flota Sustitutos

Migración del prototipo HTML de Alejo (React+Tailwind client-only, localStorage) a una app real: React + Vite + Supabase (auth, DB, storage).

## Estado

App funcional en el código (dashboard, mapa, solicitudes, actas con firma/fotos, informes, admin con gestión de
roles), auth con Google restringido a `@rentandes.com`, esquema SQL completo con RLS, 12 tests unitarios pasando.
**Falta que Carlos cree el proyecto de Supabase y complete la configuración** — no se puede probar en vivo hasta
ese paso.

## 1. Crear el proyecto Supabase (paso a paso, sin saltarse nada)

### 1.1 Crear la cuenta y el proyecto

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta (o inicia sesión).
2. Botón verde **New Project**.
3. Nombre: `portal-sustitutos` (o el que quieras). Elige una contraseña de base de datos y **guárdala en un lugar
   seguro** (no la vas a necesitar para esta guía, pero Supabase la pide).
4. Región: `South America (São Paulo)` es la más cercana a Colombia.
5. Espera 1-2 minutos a que el proyecto termine de crearse (barra de progreso).

### 1.2 Correr el SQL, un paso a la vez

**Por qué en 8 archivos y no uno solo:** si pegas todo de una vez y algo sale mal a la mitad, es difícil saber
dónde quedó. Cada archivo en `supabase/steps/` es un pedacito independiente — si uno falla, los anteriores ya
quedaron guardados y solo repites ese.

**Regla de oro para copiar sin que se corte:** abre el archivo en el Bloc de notas (o VS Code), haz clic dentro del
texto, `Ctrl+A` (selecciona todo) y `Ctrl+C` (copia todo). No selecciones "a mano" arrastrando el mouse — así es
como se corta a la mitad y da el error `unterminated dollar-quoted string` que ya te salió.

En Supabase: menú izquierdo → **SQL Editor** → botón **New query**.

1. Abre `supabase/steps/01_profiles.sql` en tu editor de texto.
   - **Antes de copiarlo**: busca la línea que dice
     `when new.email in ('carlos.sanchez@rentandes.com', 'alejandro.duenas@rentandes.com') then 'admin'`
     y cambia esos 2 correos por los reales (el tuyo y el de Alejandro). Guarda el archivo.
   - Ahora sí: `Ctrl+A`, `Ctrl+C` sobre el archivo ya editado, pega en el SQL Editor de Supabase, botón **Run**
     (o `Ctrl+Enter`).
   - Debe decir `Success. No rows returned`. Si dice `relation "profiles" already exists`, es porque el intento
     anterior sí alcanzó a crear la tabla antes de fallar — corre esto primero y luego repite el paso 1:
     `drop table if exists profiles cascade;`
2. Repite exactamente lo mismo con `02_ciudades.sql`, luego `03_vehicles.sql`, `04_historial.sql`,
   `05_solicitudes.sql`, `06_actas.sql`, `07_storage.sql`, en ese orden (el orden importa, cada uno depende del
   anterior). Un archivo nuevo (**New query**) por paso, para no mezclar.
3. Por último `08_seed.sql` — carga los 24 vehículos reales que ya tenía Alejo. Al terminar, ve a **Table Editor**
   (menú izquierdo) → tabla `vehicles` → deberías ver 24 filas.
4. `09_profiles_admin_update.sql` y `10_resolve_solicitud_rpc.sql` — se agregaron después del primer intento, dos
   piezas chicas (gestión de roles desde la app, asignación de solicitud atómica). Si ya corriste el paso 1-8 antes
   de esta actualización del repo, solo te falta correr estos 2 archivos nuevos, no hay que repetir nada.

Si en algún paso te vuelve a salir un error, cópiame el mensaje completo (el texto rojo) y te digo exactamente qué
pasó — no lo reintentes a ciegas.

### 1.3 Activar el login con Google

1. Menú izquierdo → **Authentication** → **Providers** → busca **Google** → actívalo.
2. Supabase te va a pedir un **Client ID** y **Client Secret** de Google. Estos se sacan en
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Crea un proyecto (o usa uno existente) → **Create Credentials** → **OAuth client ID** → tipo **Web application**.
   - En **Authorized redirect URIs** pega la URL que Supabase te muestra en esa misma pantalla (termina en
     `/auth/v1/callback`).
   - Copia el Client ID y Client Secret que te da Google, pégalos en Supabase, guarda.
3. En **Authentication** → **URL Configuration**, agrega `http://localhost:5173` en **Site URL** (para probar
   local). Cuando la app esté en un dominio real, agrégalo también ahí.

### 1.4 Copiar las llaves de conexión

Menú izquierdo → **Settings** → **API**. Vas a necesitar dos valores para el paso 2:
- **Project URL** (algo como `https://xxxxx.supabase.co`)
- **anon public** key (una llave larga, empieza distinto a la `service_role` — usa la `anon`, nunca la `service_role`
  en el frontend)

## 2. Configurar el repo local

1. Abre una terminal en la carpeta `portal-sustitutos`.
2. Copia el archivo de ejemplo: `cp .env.example .env` (o duplícalo a mano y renómbralo a `.env`).
3. Abre `.env` en tu editor de texto y reemplaza los dos valores con lo que copiaste en el paso 1.4:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-larga
   ```
4. Instala dependencias (solo la primera vez, o cuando cambie `package.json`): `npm install`
5. Arranca la app: `npm run dev` — te va a mostrar una URL tipo `http://localhost:5173`, ábrela en el navegador.
6. Debe aparecer la pantalla de login "Entrar con Google". Si entras con tu correo `@rentandes.com` y quedas
   dentro (ves el menú de Flota/Mapa/Solicitudes), todo quedó bien configurado.

## 3. Roles

El trigger `handle_new_user` asigna `admin` automáticamente a los dos correos que edites en el paso 1.1; cualquier
otro `@rentandes.com` que inicie sesión entra como `gestor`. Para cambiar el rol de alguien después: pantalla
**Administrador → Usuarios y roles** dentro de la app (necesita el paso SQL `09_profiles_admin_update.sql`), o a
mano en Supabase → Table Editor → `profiles` si prefieres.

## 4. Deploy

No configurado todavía. Más simple: Vercel o Netlify conectado al repo de GitHub, variables de entorno
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` en su dashboard. `npm run build` genera `dist/`.

## Qué se agregó después de la primera entrega (2026-09-25)

- **Gestión de roles vía UI** — Admin → Usuarios y roles, sube/baja admin↔gestor. No puedes cambiar tu propio rol
  (evita quedarte bloqueado sin querer). Requiere el paso SQL `09_profiles_admin_update.sql`.
- **Firma digital con canvas** — Actas ahora captura la firma dibujada en pantalla (dedo o mouse), no una foto subida.
- **Visor de fotos de actas** — clic en una acta abre sus fotos y firma (URLs firmadas de 1h, el bucket sigue privado).
- **Mantenimiento detallado por ítem** — aceite/llantas/frenos/filtros con % de desgaste ponderado (aceite pesa
  más), editable desde el modal de edición de un vehículo.
- **Resolución de solicitud atómica** — ahora es una función RPC de Postgres (`resolve_solicitud`, ver
  `10_resolve_solicitud_rpc.sql`) en vez de 2 updates seguidos desde el cliente.
- **Validación de archivos en Actas** — solo imágenes, máx 8MB c/u (encontrado real al revisar seguridad, ver abajo).

## Qué falta (a propósito, no es descuido)

- **Módulo financiero** (costos por vehículo/parqueadero/traslado) — la propia reunión lo marcó como fase futura,
  no una necesidad de ahora. No construido a propósito.
- **Deploy** — ver sección 4, necesita que Carlos conecte su cuenta de Vercel/Netlify.

## Seguridad

- El PIN hardcodeado del prototipo (`3899`) no existe aquí — reemplazado por Google OAuth + Row Level Security.
  Sin fila en `profiles` (dominio no autorizado) = sin acceso a ninguna tabla, verificado por RLS en cada policy.
- Fotos y firmas de actas van a un bucket **privado** de Storage, no público — se ven con URLs firmadas de corta
  duración, no con enlaces permanentes.
- Se corrió un escaneo con Strix (white-box) el 2026-09-25: el primer intento (modelo `gemini-2.5-pro`, no
  recomendado por la propia herramienta) alucinó los 4 hallazgos — citaban archivos, tablas y dominios que no
  existen en este repo. Se descartaron todos. Al revisar el código real a mano por las mismas 4 categorías, el
  único hallazgo genuino era la falta de validación de archivos en Actas, ya corregida arriba. Pendiente: repetir
  el escaneo con un modelo recomendado (Anthropic/OpenAI) o Strix Cloud para tener una pasada confiable.
