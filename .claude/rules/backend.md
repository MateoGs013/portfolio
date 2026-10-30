---
paths:
  - "server/**"
  - "prisma/**"
  - "app/lib/fieldMeta.ts"
---

# Backend y modelo de contenido

## El schema es trabajo de diseño

El modo registro (`R`, `?vista=registro`) **muestra en pantalla los nombres de campo, sus tipos y sus relaciones**. Nombrar una columna no es una decisión interna: es una decisión visible. `summaryShort` y `pitch` no significan lo mismo para quien lee.

Criterio para agregar una colección: **cada una debería ser la respuesta a una pregunta concreta que trae quien entra.**

El schema está migrado. Todo cambio pasa por `prisma migrate dev` con nombre descriptivo y se refleja en `app/lib/fieldMeta.ts` en el mismo commit. El server importa de `app/lib/` **solo tipos**: la imagen del API (`Dockerfile.api`) no copia `app/`.

## Contrato de URL

Innegociable. Los query params de la URL pública mapean uno a uno a los del endpoint.

```
/projects?status=live&stack=vue&lang=en   →   GET /api/projects?status=live&stack=vue&lang=en
```

- `?lang=es|en` vale en todos los endpoints públicos. Cualquier otro valor, o ninguno, da español. La respuesta lo devuelve en `meta.lang`.
- `vista`, `cv` y `foco` son parámetros de presentación del front: no se reenvían a la API (y el canonical no los lleva).
- Si un filtro no se puede expresar como query param, no se agrega.

## Endpoints

```
GET /api/schema                → [{ key, label, kind, count }]: conteos con visibilidad; documentos about y contact
GET /api/projects              → ?status=live|wip|archived &stack= &featured=true|false &year= &org=
GET /api/projects/:slug        → el caso: portada y galería, pasos, enlaces, métricas y techs con sus obras
GET /api/stack                 → ?category= — más obras visibles primero, después por nombre
GET /api/stack/:slug
GET /api/experience            → ?stack= &org= — de la más reciente a la más vieja
GET /api/experience/:slug
GET /api/orgs                  → con sus obras visibles y su experiencia
GET /api/orgs/:slug
GET /api/docs/:key             → about | contact, con cada value ya resuelto en el idioma
GET /api/articles              → ?stack= &featured= &project= — solo publicados, sin el cuerpo
GET /api/articles/:slug
GET /api/cv                    → CvDocument (content/cv.ts): el CV Harvard ATS compuesto desde la base
```

No hay alias (`/api/project`, `/api/techs`…) ni alias de slug: `arg-piscinas` da 404 y la redirección vive en el front.

Envoltura: `{ data, meta: { count, filters, lang, source } }`.

- `meta.filters` es **lo que se aplicó**, normalizado a su forma pública en minúscula (`?status=LIVE` → `{ status: 'live' }`). Lo inválido (`?status=foo`) no filtra y no aparece.
- `meta.source` es `'db'` o `'snapshot'` (ver Respaldos).

## Capas

```
server/src/queries/   funciones puras sobre Prisma: registro crudo en español con sus translations
server/src/content/   visibility · lang · present (forma pública) · matches (filtros en memoria) · cv · snapshot
server/src/routes/    cada endpoint como Resource { db, snapshot, present } + su handler
```

- **Visibilidad:** una obra se ve si `publishedAt` no es nulo y ya pasó (`visibleProject()`, armado por consulta para que `now` no quede fijo). Se aplica en la lista, el detalle (404), cada relación hacia Project y los conteos. Los artículos: `status = PUBLISHED` y `publishedAt` cumplido. Nunca se filtra en un componente.
- **Idioma:** `present(record, lang)` usa el valor de la tabla `*Translation` y cae al español; `untranslated: string[]` lista los campos que quedaron en español (el front les pone `lang="es"`). En los Doc, el inglés va en el `en` de cada campo. Nunca se expone `translations`, ni ids internos, ni `legacyMetrics`.
- **Tipos en el cable:** `Metric.value` (Decimal) sale como número; fechas `@db.Date` como `YYYY-MM-DD` y el resto en ISO.

## Respaldos

Generados, nunca escritos a mano. Si la consulta a la base falla, la ruta responde con la última respuesta buena de esa misma consulta (memoria y `data/content-last-good.json`) y, si nunca hubo una, con `server/src/snapshot/content.json`. Las dos copias pasan por el mismo `present` y los mismos `matches`, así que la forma es idéntica.

```bash
pnpm db:snapshot          # regenera content.json desde la base (sin filtros, solo lo visible)
pnpm db:snapshot:check    # con la base arriba: compara base y snapshot en una matriz fija; ≠ 0 si difieren
```

Después de cambiar contenido (seed, parche o admin) se regenera el snapshot y se commitea.

## Un modelo de contenido estructurado y relacional

Toda la información vive en PostgreSQL 17 gobernada por Prisma. Cada registro contiene tanto metadatos técnicos estructurados (`summary`, `year`, `metrics`, `techs`) como narrativa y proceso en profundidad (`brief`, `outcome`, `steps`, `media`).

`app/lib/fieldMeta.ts` declara la tipificación y presentación de los campos para el modo registro y el admin:

```ts
{ campo: { type, label, wide, nullable } }
```

Nombrar una columna o propiedad es una decisión visible en el modo registro del portafolio. Cero duplicación de datos.

## Documentos

`about` y `contact` son documentos, no colecciones. `Doc.fields` lleva su propio tipo (`DocField`) porque es contenido libre y el modo registro lo muestra:

```json
{ "name": "engineering_philosophy", "type": "text", "value": "…", "en": "…", "wide": true }
```

`wide:true` saca al campo de la grilla angosta y le da ancho completo con medida de lectura propia. La API publica `value` ya resuelto en el idioma pedido; `en` no viaja.

## Admin

Propio y mínimo: `server/src/admin/` (API en `/api/admin/*`) y `server/admin/` (UI en `/admin`, Vue global sin build). Bearer `ADMIN_TOKEN` desde `.env`; sin token el admin responde 503. El descriptor de cada modelo vive en `server/admin/js/config.js` y en los formularios de `server/admin/js/components/forms/*.js`: al agregar un campo al schema, agregarlo ahí también. La media se sube por multipart a `public/media/projects/` y el tamaño se lee del archivo, no se pide.

## Nullables

Los campos opcionales se muestran como `NULL` en el modo registro, no se esconden. Devolver `null` explícito, no omitir la clave.
