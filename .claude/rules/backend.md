---
paths:
  - "server/**"
  - "prisma/**"
  - "app/lib/fieldMeta.ts"
---

# Backend y modelo de contenido

## El schema es trabajo de diseño

El mundo DATOS **muestra en pantalla los nombres de campo, sus tipos y sus relaciones**. Nombrar una columna no es una decisión interna: es una decisión visible. `summaryShort` y `pitch` no significan lo mismo para quien lee.

Criterio para agregar una colección: **cada una debería ser la respuesta a una pregunta concreta que trae quien entra.**

El schema está migrado. Todo cambio pasa por `prisma migrate dev` con nombre descriptivo y se refleja en `app/lib/fieldMeta.ts` en el mismo commit.

## Contrato de URL

Innegociable. Los query params de la URL pública mapean uno a uno a los del endpoint.

```
/datos/projects?stack=webgl&year=2024   →   GET /api/projects?stack=webgl&year=2024
```

Si un filtro no se puede expresar como query param, no se agrega.

## Endpoints

```
GET /api/schema             → [{ key, label, kind, count }]
GET /api/projects           → ?stack=&year=&role=&featured=
GET /api/projects/:slug     → record + subviews + media + links
GET /api/experience
GET /api/stack
GET /api/orgs/:slug          → org + sus proyectos y experiencias (sin lista: se llega por relación)
GET /api/docs/:key
```

Envoltura: `{ data, meta: { count, filters } }`

## Un modelo de contenido estructurado y relacional

Toda la información vive en PostgreSQL 17 gobernada por Prisma. Cada registro contiene tanto metadatos técnicos estructurados (`summary`, `year`, `metrics`, `techs`) como narrativa y proceso en profundidad (`brief`, `outcome`, `steps`, `media`).

`app/lib/fieldMeta.ts` declara la tipificación y presentación de los campos para la hoja técnica del explorador:

```ts
{ campo: { type, label, wide, nullable } }
```

Nombrar una columna o propiedad es una decisión visible en la hoja técnica del portafolio. Cero duplicación de datos.

## Documentos

`about` y `contact` son documentos, no colecciones. `Doc.fields` lleva su propio tipo porque es contenido libre y DATOS lo muestra:

```json
{ "name":"bio", "type":"text", "value":"…", "wide":true }
```

`wide:true` saca al campo de la grilla angosta y le da ancho completo con medida de lectura propia. Existe porque la prosa larga metida en una columna de valores queda torpe — es el único punto donde el mundo DATOS se pone incómodo.

## Admin

Propio y mínimo: `server/src/admin/` (API en `/api/admin/*`) y `server/admin/` (UI en `/admin`, Vue global sin build). Bearer `ADMIN_TOKEN` desde `.env`; sin token el admin responde 503. Un descriptor por modelo en `admin.js` genera el formulario: al agregar un campo al schema, agregarlo ahí también. La media se sube por multipart a `public/media/projects/` y el tamaño se lee del archivo, no se pide.

## Nullables

`metrics` y otros campos opcionales se muestran como `NULL` en DATOS, no se esconden. Devolver `null` explícito, no omitir la clave.
