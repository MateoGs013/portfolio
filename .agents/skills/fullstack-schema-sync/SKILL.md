---
name: fullstack-schema-sync
description: Protocolo de sincronización entre Prisma 7 (PostgreSQL), la API de Express 5, el snapshot de respaldo generado, los tipos y el modo registro del frontend (Nuxt 4) y el CMS (/admin). Úsalo siempre que modifiques modelos, enums, filtros, colecciones o campos de la base de datos.
---

# Sincronización del esquema (Prisma ↔ Express ↔ Nuxt ↔ Admin)

Invariante 1: un solo modelo relacional en PostgreSQL 17, sin copias. Un cambio de esquema toca varias capas; esta lista evita que una quede atrás. Las reglas de backend están en `.claude/rules/backend.md` y las del sitio en `docs/diseno.md`.

## Capa 1: base de datos (`prisma/`, `server/src/seed*`)

- [ ] `prisma/schema.prisma`: modelo, enum o índice.
- [ ] Migración con `prisma migrate dev`, con la conversión de datos si hace falta. Nunca editar una migración ya aplicada.
- [ ] `server/src/seed.ts` (y `server/src/seed/en.ts` si el campo se traduce): el seed refleja el cambio.
- [ ] Si producción necesita el dato, un parche idempotente en `server/src/patches/` con `--dry`. Los parches se corren contra producción solo con el OK de Mateo.
- [ ] `pnpm prisma generate` y `pnpm typecheck`.

## Capa 2: API (`server/src/`)

- [ ] Los query params se validan contra los valores del enum antes de usarlos; un valor inválido se ignora, nunca da 500.
- [ ] La visibilidad (`publishedAt`) y el idioma (`?lang=`) se resuelven en la API, también en relaciones y conteos.
- [ ] El snapshot de respaldo se regenera desde la base (`pnpm db:snapshot`) y se verifica la paridad (`pnpm db:snapshot:check`). No se escriben datos de respaldo a mano.
- [ ] `/api/schema` expone la tabla o relación nueva.

## Capa 3: frontend (`app/lib/`, `app/composables/`)

- [ ] `app/lib/api.ts`: tipos del contrato de la API.
- [ ] `app/composables/useApi.ts`: el filtro nuevo entra en los parámetros y en la clave de `useAsyncData`.
- [ ] `app/lib/fieldMeta.ts`: tipo y rótulo del campo para el modo registro (`.fk` / `.ft`), en el mismo commit que la migración.
- [ ] `app/lib/dict/`: si el campo tiene rótulo o etiqueta de interfaz (un estado, una métrica), su entrada en ES y EN. El contenido nunca va al diccionario.

## Capa 4: admin (`server/admin/js/`)

- [ ] `server/admin/js/config.js`: valores por defecto y opciones de `select` iguales a los enums de `prisma/schema.prisma`.
- [ ] Los formularios de `server/admin/js/components/forms/` editan y validan el campo, con su traducción si la tiene.
- [ ] Si se agregaron clases de Tailwind, `pnpm build:admin-css`.

## Verificación

`pnpm typecheck` y `pnpm lint` en 0. La base local migrada y sembrada (`pnpm prisma migrate deploy`, `pnpm db:seed`), los endpoints afectados responden 200 con parámetros válidos y no dan 500 con valores inválidos, y el campo se ve en el sitio y en `?vista=registro`.
