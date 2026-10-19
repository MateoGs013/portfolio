---
name: fullstack-schema-sync
description: Protocolo de sincronización atómica entre Prisma 7 (PostgreSQL), Express 5 API, datos de fallback, tipos del Frontend (Nuxt 4) y el CMS Admin (/admin). Úsalo siempre que modifiques modelos, enums, filtros de búsqueda, colecciones o campos de la base de datos.
---

# Fullstack Schema Sync (Prisma ↔ Express ↔ Nuxt ↔ Admin)

El portfolio opera bajo el **Invariante #1: Un solo modelo relacional en PostgreSQL 17 (Cero duplicación)**. Sin embargo, un cambio en el esquema o en los filtros de consulta impacta 5 capas distintas. Esta skill garantiza que nunca ocurra deriva de tipos o enums (como desajustes de `TechCategory` o filtros `?org=` rotos).

## Checklist de Sincronización en 5 Capas

Cada vez que agregues, edites o elimines un modelo, campo, enum o filtro de query, recorre obligatoriamente estas 5 capas en orden:

### Capa 1: Base de Datos y Prisma (`prisma/`)
- [ ] **`prisma/schema.prisma`**: Definir el modelo, enum o índice.
- [ ] **`prisma/seed.ts`**: Actualizar los datos semilla si el campo es obligatorio o si un enum cambió.
- [ ] Ejecutar `pnpm db:generate` para regenerar el cliente en `server/generated/prisma` y verificar con `pnpm typecheck`.

### Capa 2: Backend API y Fallback (`server/src/`)
- [ ] **`server/src/routes/<collection>.ts`**:
  - Validar siempre los query params entrantes contra los enums de Prisma antes de hacer cast (nunca hacer `as EnumType` directo de `req.query` sin validar contra `Object.values(EnumType)`).
  - Asegurar que los filtros relacionales (`?tech=`, `?org=`, `?tag=`, `?status=`, `?featured=`) estén soportados tanto en la consulta Prisma como en el bloque de fallback.
- [ ] **`server/src/data/fallbackData.ts`**:
  - Mantener la paridad estructural exacta con lo que devuelve Prisma (`include` de relaciones como `technologies`, `organization`, `tags`) para que el modo offline/fallback nunca rompa el SSR.
- [ ] **`server/src/routes/schema.ts`**:
  - Si se añade una tabla o relación nueva, exponerla en `/api/schema` para que la vista `/schema` (ERD interactivo) se actualice sola.

### Capa 3: Contratos y Adaptadores Frontend (`app/lib/` & `app/composables/`)
- [ ] **`app/lib/api.ts`**: Actualizar las interfaces TypeScript (`ApiProject`, `ApiTechnology`, etc.).
- [ ] **`app/composables/useApi.ts`**: Si se agregó un filtro nuevo en la URL (ej. `?org=`), incluirlo en la firma de parámetros de `useProjects()` u otro composable y en la key reactiva de `useAsyncData`.
- [ ] **`app/lib/fieldMeta.ts`**: Registrar la metadata de columna (tipo, ancho, icono geométrico, color de badge) para la vista Tabla y el Inspector de `ExplorerDetail.vue`.
- [ ] **`app/lib/explorer.ts`**:
  - Verificar que las colecciones estén listadas en el orden canónico y que los enlaces relacionales (`buildRelationUrl`) apunten a query params realmente implementados en el backend.

### Capa 4: Explorador Frontend (`app/components/explorer/`)
- [ ] **`ExplorerView.vue`**: Verificar que la colección aparezca en `navSections` del sidebar y muestre su conteo real.
- [ ] **`ExplorerGoto.vue` (`⌘K`)**: Asegurar que la colección sea indexada por el buscador global y tenga su atajo numérico o ruta directa.

### Capa 5: Consola Admin (`server/admin/js/`)
- [ ] **`server/admin/js/config.js`**:
  - Sincronizar los valores por defecto (`defaults`) y las opciones de `select` con los enums exactos de `prisma/schema.prisma` (ej. `TechCategory`: `LANGUAGE`, `FRAMEWORK`, `MOTION`, `GRAPHICS`, `BACKEND`, `DATA`, `TOOLING`, `DESIGN`).
- [ ] **`server/admin/js/components/forms/`**: Verificar que los formularios especializados (`ProjectForm.js`, `ExperienceForm.js`, `ProfileForm.js`) agrupen y validen usando exactamente los mismos enums.
- [ ] **`server/admin/js/components/CommandPalette.js`**: Incluir la colección en la paleta de comandos del admin.

## Verificación Post-Cambio
1. Correr `pnpm typecheck` y `pnpm lint` (deben dar **0 errores**).
2. Verificar que los endpoints afectados respondan `200 OK` con parámetros válidos e ignoren de forma segura (sin `500 Internal Server Error`) valores de enum inválidos en query params.
