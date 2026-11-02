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

El schema está migrado. Todo cambio pasa por `prisma migrate dev` con nombre descriptivo y se refleja en `app/lib/fieldMeta.ts` en el mismo commit. El server importa de `app/lib/` **solo tipos**: la imagen del API (`Dockerfile.api`) no copia `app/`. Un valor que usan los dos lados vive en `server/src/shared/` y `app/lib` lo reexporta (por ejemplo `metricUnits`).

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

No hay alias (`/api/project`, `/api/techs`…) ni alias de slug: `arg-piscinas` da 404 y la redirección vive en el front. El slug de las rutas de detalle se pasa a minúscula (`detailSlug` en `filters.ts`): `/api/projects/La-Rucula` responde igual que `la-rucula`.

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

Generados, nunca escritos a mano. Si la consulta a la base falla, la ruta responde con la última respuesta buena de esa misma consulta (memoria y `data/content-last-good.json`) y, si nunca hubo una, con `server/src/snapshot/content.json`. Las dos copias pasan por el mismo `present` y los mismos `matches`, así que la forma es idéntica. La última respuesta buena guarda el `at` del content.json como formato (un archivo de otra versión se descarta), no recuerda listas vacías ni registros que ya no existen (y borra la copia que tenía de esa consulta), los parches la borran del disco al aplicar (después se reinicia la API), se escribe a lo sumo cada 5 s y se olvida entera después de cada escritura del admin (`forgetLastGood`). Si una copia recordada no pasa por `present`, se cae a content.json.

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

Propio: la API en `server/src/admin/` (`/api/admin/*`) y la UI en `server/admin/src/` (Vite, `.vue` y TypeScript, compilada a `server/admin/dist/` y servida en `/admin/` por `server/src/admin/ui.ts`). Bearer `ADMIN_TOKEN` desde `.env`; sin token válido el admin responde 503 y la UI sin build también. Las reglas de la UI están en `.claude/rules/admin.md` y el inventario de endpoints en `docs/admin.md` §9.

**El contrato es `server/src/shared/adminSchema.ts`.** Un descriptor por campo de la base (rótulo, ayuda, obligatorio, tope, tipo de control, si tiene inglés, dónde se lee, si el formulario lo pide), armado en `shared/schema/{work,catalog,field}.ts`. El servidor saca de ahí los mensajes de error y la UI arma sus campos con lo mismo, que llega entero en `GET /api/admin/meta`. Los rótulos de los enums viven en `shared/labels.ts` y llegan a la UI por `/meta` (`enumOptions`); los tipos del cable en `shared/adminContracts.ts` (y `hunterContracts.ts`, `contentContracts.ts` para Eros). La UI importa de `server/src/shared/` por el alias `@shared`: tipos siempre, valores solo de módulos que no importan nada del servidor (`slug`, `docSchema`, `markdown`, `contentContracts`).

**Errores.** Todo error del admin (salvo el 401 y el 503 de `requireAdmin` en `auth.ts`, que responden solo `{ error }`) sale por `server/src/admin/errors.ts` como `AdminErrorBody`: `{ error, code, errors: [{ path, message }] }`, en español. Un 400 (`code: 'invalid'`) junta todos los campos que fallaron con su ruta en el payload, anidada (`links[0].url`, `translations.en.title`, `metrics[2].source`, `fields.headline.en`), para que la UI marque cada campo. Los demás códigos: `unauthorized`, `not_found`, `conflict` (409 por una restricción única, en su campo), `in_use` (409 por una relación), `cv_expired` (409, `hunterCvCache.ts`), `too_large`, `offline` y `db_unavailable` (503), `eros_auth` e `internal`. `eros_unreachable` lo arma el cliente ante un 502 o 504 de Eros, no el servidor. La validación va por `validate('<Modelo>', body, …)` y los helpers de `input.ts`, que toman rótulo y tope del descriptor.

**Direcciones fijas.** El slug se deriva al crear (`newSlug`, `shared/slug.ts`: ñ→n, acentos a ASCII) y después no cambia al guardar: el PUT llama a `guardSlugChange(actual, entrante)`, que responde 400 en `slug` si llega otra. Se cambia solo con `PATCH /<colección>/:id/slug`, que la UI ofrece como «Cambiar dirección» con el aviso de que los enlaces viejos dejan de andar. No hay tabla de alias.

**Escrituras.** Cada router que escribe en Prisma se monta detrás de `forgetsLastGood` (`router.ts`), que olvida los respaldos de la API pública después de cada escritura buena. Lo anidado (pasos, enlaces, métricas, traducciones) se sincroniza por id y conserva lo que no llega. La media se sube por multipart a `public/media/projects/<slug>/` (el retrato a `_perfil/`); el formato se lee de los bytes y el tamaño del archivo, no se piden.

### Sumar un campo

En el mismo commit, en este orden:

1. `prisma/schema.prisma` y `pnpm prisma migrate dev --name <qué-cambia>`.
2. `app/lib/fieldMeta.ts`: su tipo visible para el modo registro (si el sitio lo muestra).
3. `server/src/shared/schema/*.ts`: el descriptor en el modelo que corresponde (rótulo y ayuda en español claro, tope, `translatable`, `surfaces`). Si es un enum nuevo, sus rótulos en `shared/labels.ts`.
4. El router del admin (`server/src/admin/<colección>.ts`): leerlo y validarlo en el POST y el PUT, y devolverlo en el GET.
5. La UI: el campo en `features/<área>/model.ts` (en `blank`, `toForm`, `toPayload` y la sección que lo muestra, con la misma ruta que el payload) y su control en la sección, con `data-field`.
6. Si se publica: `present` en `server/src/content/`, `pnpm db:snapshot` y commit del snapshot.
7. `pnpm lint`: `check-admin-schema` falla si el campo no tiene descriptor (o si sobra uno) y `check-admin-endpoints` si cambió una ruta sin tocar `docs/admin.md` §9.

### Pruebas del admin

Nunca contra la base de trabajo ni contra el Eros real. Siempre con `node scripts/admin-run.mjs [--demo] [--eros-mock] [--web] -- <comando>`: copia la base a `portfolio_admin_*` y la migra, levanta la API en un puerto libre entre 3940 y 3990 con una clave al azar y `HUNTER_API_URL=http://127.0.0.1:9`, y borra todo al terminar. `--demo` suma la muestra (`EROS_DEMO=1`), `--eros-mock` apunta a `tests/admin/eros-mock.ts` y `--web` compila Nuxt contra esa API para probar el proxy. Cada spec `tests/e2e/admin-*.spec.ts` y cada `tests/admin/*.test.ts` declara sus modos en líneas `admin-run:` de la cabecera; `pnpm test:e2e` (`tests/e2e/run.mjs`) corre cada archivo una vez por línea. El `.env` local apunta `HUNTER_API_URL` al Eros real: un script que importe `server/src/app.ts` directamente importa antes `scripts/eros-offline.ts`. Después de `--web`, `pnpm build` otra vez antes de `pnpm start`.

## Nullables

Los campos opcionales se muestran como `NULL` en el modo registro, no se esconden. Devolver `null` explícito, no omitir la clave.
