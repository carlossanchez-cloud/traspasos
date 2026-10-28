-- PASO 24 — fix real: el gestor no podia guardar actas. Error probado en vivo (2026-10-28, despues de correr
-- los pasos 19 a 23): "permission denied for function acta_publica_abierta".
--
-- Causa raiz: el paso 22 cambio la policy de subida al bucket 'actas' para usuarios con sesion
-- (authenticated): "puede_editar() o la carpeta publicas/ de un acta sin firmar". Esa segunda parte llama
-- acta_publica_abierta(), y el paso 20 solo le dio permiso de ejecutarla a anon. Postgres revisa los permisos
-- de todas las funciones de la policy antes de evaluarla, asi que aunque puede_editar() fuera verdadero, la
-- subida de cualquier foto o firma fallaba con ese error y el acta no se guardaba.
--
-- Fix: authenticated tambien puede ejecutar acta_publica_abierta (solo responde si un acta sin firmar existe;
-- no expone datos). Ya quedo incluido en el paso 22 para los proyectos que todavia no lo han corrido.

grant execute on function public.acta_publica_abierta(text) to authenticated;

notify pgrst, 'reload schema';
