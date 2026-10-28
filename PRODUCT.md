# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Gestor / encargado de taller.** Trabaja en el taller o el parqueadero, desde el celular, muchas veces con poca
  luz y en horizontal o vertical. Crea las actas de entrega y recibido de los vehículos sustitutos, hace el
  recorrido guiado de fotos, marca las novedades del checklist y firma como gestor de flota.
- **Administrador general.** Trabaja desde el computador, en oficina. Asigna sustitutos y resuelve solicitudes,
  administra ciudades y roles, y es el único que edita el inventario (área técnica y comercial).
- **Cliente externo (sin cuenta).** Recibe el enlace del acta por WhatsApp o Gmail, lo abre en su celular sin
  iniciar sesión, revisa el acta y las fotos del gestor sin poder editarlas, acepta los términos y firma.
- **Lectores internos.** Personas de Rentandes que solo consultan flota, actas e inventario; no pueden crear ni
  cambiar nada.

## Product Purpose

Flota Rentandes es el centro de gestión de activos de Rentandes (renting de vehículos y, más adelante, maquinaria).
Reúne en un solo lugar lo que hoy vive en Excels y chats: la flota de vehículos sustitutos y sus actas, el
inventario de activos recuperados en venta o recolocación y, después, la gestión de flota. El éxito es que cada
movimiento de un activo quede registrado con su prueba y que nadie tenga que reconstruir qué pasó con un vehículo.

## Positioning

Trazabilidad con prueba: cada entrega, recibido, venta o recolocación queda con evidencia verificable (recorrido
de fotos guiado, foto de cada novedad, firma del gestor y del cliente, número consecutivo único y el ciclo
entrega → recibido), además del historial completo de cada activo. Un Excel o un sistema genérico registra datos;
este registra la prueba.

## Operating Context

- Módulos desde el menú principal, después del login con Google: **Sustitutos** (flota, mapa, solicitudes, actas
  de entrega y recibido, informes), **Inventario** (inicio, área Técnica y área Comercial) y **Gestión de flota**
  (por construir, solo administradores).
- El acta se llena en campo con el celular: checklist por grupos (carrocería, llantas, interior, luces, documentos,
  kit de carretera), recorrido de 6 fotos con silueta guía, foto obligatoria de cada novedad, firma del gestor.
  Luego se envía al cliente por WhatsApp o Gmail para su firma.
- Cada acta de recibido cierra un acta de entrega de la misma placa; no se entrega dos veces una placa sin recibirla.
- El inventario se llevaba en `BD_INVENTARIO_V2_4.xlsx`; cada fila es un paso del activo por el inventario (un
  activo puede entrar, salir y volver a entrar). Lo maneja una persona técnica y una comercial.

## Capabilities and Constraints

- Acceso solo con correo @rentandes.com (Google). Roles: Administrador general, Gestor y Lector; los correos nuevos
  entran como Lector. Las reglas viven también en la base de datos (Supabase, RLS), no solo en la interfaz.
- Stack existente: React + Vite + Tailwind, Supabase (auth, base de datos, storage privado para fotos y firmas),
  despliegue en Vercel.
- Cámara desde el navegador: flash (linterna) y tocar para enfocar solo donde el navegador lo permite (Chrome en
  Android); en iPhone no.
- Términos: vehículo sustituto, acta de entrega / recibido, novedad, recorrido, gestor de flota, VPN (valor
  contable), recolocación, % de venta, carga (valor × meses en inventario).
- Pendiente de decidir: contenido del módulo Gestión de flota; si las alertas de SOAT y tecnomecánica van en el
  inventario; unidad del "tiempo en reparación" (días o meses).

## Brand Commitments

- Colores de rentandes.com: verde menta #00d79c y petróleo oscuro #003633 (encabezados, menú, títulos); Open Sans para web (Montserrat solo en el
  logo y documentos); logo rentandes (`public/rentandes-logo.png`).
- Nombre del producto: "Flota Rentandes", subtítulo "Centro de gestión de activos Rentandes".
- Todo en español de Colombia: textos, fechas y moneda (COP).

## Evidence on Hand

- Renders de los modelos de la flota en `src/assets/vehicles/` (generados con IA, no son fotos reales).
- Siluetas guía de las fotos calcadas de fotos de catálogo de un mismo carro elegidas por Alejo
  (`src/assets/siluetas/`).
- Texto de términos y condiciones: Título V, numeral 19.5 del contrato de vehículo sustituto
  (`src/lib/terminos.js`). Menciona "MAREAUTO" y está pendiente de revisión legal.
- Datos reales del inventario (Excel) fuera del repositorio, porque traen precios y VPN.
- No hay testimonios, casos ni cifras públicas: no se deben inventar.

## Product Principles

1. **Toda acción deja prueba.** Si algo se entrega, recibe, vende o cambia, queda quién, cuándo y con qué evidencia.
2. **Primero el campo.** Lo que se hace en taller tiene que funcionar en un celular, con una mano, con poca luz y
   sin explicaciones.
3. **La regla vive en el servidor.** Permisos, consecutivos y ciclos los garantiza la base de datos; la interfaz
   solo los refleja.
4. **Guiar en vez de exigir memoria.** El sistema dice qué foto toca, qué falta y qué sigue (siluetas, avisos,
   contadores), en lugar de esperar que la persona lo recuerde.
5. **Un solo lugar por activo.** Cada vehículo o activo tiene su historial completo en una ficha, no repartido en
   archivos.
