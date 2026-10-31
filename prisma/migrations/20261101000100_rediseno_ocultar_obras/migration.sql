-- Rediseño «movimiento»: null-net y lampone quedan en la base sin publicar (decisión 1).
--
-- El contenedor de la API corre `prisma migrate deploy` en cada arranque (Dockerfile.api), así que
-- el código nuevo empieza a servir antes de que alguien corra el parche 2026-11-01-rediseno-datos.
-- Ocultarlas acá cierra esa ventana: nunca se ven públicas con el rediseño. El parche lo repite y
-- queda sin cambios en este punto. Idempotente: solo toca las dos obras que siguen publicadas.
UPDATE "Project" SET "publishedAt" = NULL WHERE "slug" IN ('null-net', 'lampone') AND "publishedAt" IS NOT NULL;
