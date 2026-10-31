/**
 * Metadatos de campos del esquema (prisma/schema.prisma).
 *
 * Cada campo declara su tipo visible en pantalla (`type`), si requiere ancho completo
 * de lectura (`wide`) y si admite valores nulos (`nullable`). La vista registro y el admin
 * los muestran tal cual, así que los rótulos son llanos.
 *
 * El orden de los campos es el orden de lectura: identidad y síntesis, enlaces y métricas,
 * y al final el relato (brief, outcome, steps, media).
 */

export type World = 'datos'

export type FieldType =
  | 'string' | 'text' | 'int' | 'decimal' | 'bool' | 'date' | 'datetime' | 'url' | 'email' | 'list' | 'json'
  | `enum ${string}`
  | `relation → ${string}`
  | `relation[] → ${string}`

export interface FieldMeta {
  type: FieldType
  label?: string
  wide?: boolean
  nullable?: boolean
}

export type CollectionKey = 'projects' | 'experience' | 'stack' | 'articles' | 'orgs'
export type DocKey = 'about' | 'contact'

export interface CollectionMeta {
  label: string
  kind: 'collection'
  nameField: string
  fields: Record<string, FieldMeta>
}

export const fieldMeta: Record<CollectionKey, CollectionMeta> = {
  projects: {
    label: 'projects',
    kind: 'collection',
    nameField: 'title',
    fields: {
      summary: { type: 'string', label: 'resumen', wide: true },
      media: { type: 'relation[] → Media', label: 'imágenes y videos', wide: true },
      brief: { type: 'text', label: 'encargo', wide: true, nullable: true },
      outcome: { type: 'text', label: 'resultado', wide: true, nullable: true },
      steps: { type: 'relation[] → ProcessStep', label: 'proceso', wide: true },
      metrics: { type: 'relation[] → Metric', label: 'métricas', wide: true },
      techs: { type: 'relation[] → Tech', label: 'tecnologías' },
      links: { type: 'relation[] → Link', label: 'enlaces' },
      url: { type: 'url', label: 'sitio en vivo', nullable: true },
      repo: { type: 'url', label: 'repositorio', nullable: true },
      year: { type: 'int', label: 'año' },
      role: { type: 'string', label: 'rol' },
      status: { type: 'enum ProjectStatus', label: 'estado' },
      org: { type: 'relation → Org', label: 'cliente u organización', nullable: true },
      experiences: { type: 'relation[] → Experience', label: 'experiencia ligada' },
      featured: { type: 'bool', label: 'destacada' },
      publishedAt: { type: 'datetime', label: 'publicado en el sitio', nullable: true },
      translations: { type: 'relation[] → ProjectTranslation', label: 'traducciones' },
      updatedAt: { type: 'datetime', label: 'última actualización' },
      slug: { type: 'string', label: 'identificador' },
    },
  },

  experience: {
    label: 'experience',
    kind: 'collection',
    nameField: 'role',
    fields: {
      role: { type: 'string', label: 'rol' },
      kind: { type: 'enum ExperienceKind', label: 'tipo' },
      org: { type: 'relation → Org', label: 'institución o empresa', nullable: true },
      startedAt: { type: 'date', label: 'inicio' },
      endedAt: { type: 'date', label: 'fin', nullable: true },
      location: { type: 'string', label: 'ubicación', nullable: true },
      summary: { type: 'string', label: 'resumen', wide: true },
      story: { type: 'text', label: 'relato', wide: true, nullable: true },
      highlights: { type: 'list', label: 'viñetas del CV', wide: true },
      cvOrder: { type: 'int', label: 'orden en el CV', nullable: true },
      projects: { type: 'relation[] → Project', label: 'obras' },
      techs: { type: 'relation[] → Tech', label: 'tecnologías' },
      translations: { type: 'relation[] → ExperienceTranslation', label: 'traducciones' },
      slug: { type: 'string', label: 'identificador' },
    },
  },

  stack: {
    label: 'stack',
    kind: 'collection',
    nameField: 'name',
    fields: {
      name: { type: 'string', label: 'tecnología' },
      category: { type: 'enum TechCategory', label: 'categoría' },
      since: { type: 'int', label: 'la usa desde' },
      note: { type: 'string', label: 'cuándo la elige', wide: true, nullable: true },
      projects: { type: 'relation[] → Project', label: 'obras' },
      experiences: { type: 'relation[] → Experience', label: 'experiencia' },
      color: { type: 'string', label: 'color', nullable: true },
      translations: { type: 'relation[] → TechTranslation', label: 'traducciones' },
      slug: { type: 'string', label: 'identificador' },
    },
  },

  orgs: {
    label: 'orgs',
    kind: 'collection',
    nameField: 'name',
    fields: {
      name: { type: 'string', label: 'nombre' },
      city: { type: 'string', label: 'ciudad', nullable: true },
      url: { type: 'url', label: 'sitio', nullable: true },
      projects: { type: 'relation[] → Project', label: 'obras' },
      experiences: { type: 'relation[] → Experience', label: 'experiencia' },
      slug: { type: 'string', label: 'identificador' },
    },
  },

  articles: {
    label: 'articles',
    kind: 'collection',
    nameField: 'title',
    fields: {
      summary: { type: 'string', label: 'resumen', wide: true },
      content: { type: 'text', label: 'contenido (markdown)', wide: true },
      readingTimeMin: { type: 'int', label: 'minutos de lectura' },
      techs: { type: 'relation[] → Tech', label: 'tecnologías' },
      project: { type: 'relation → Project', label: 'obra relacionada', nullable: true },
      status: { type: 'enum ArticleStatus', label: 'estado' },
      featured: { type: 'bool', label: 'destacado' },
      publishedAt: { type: 'datetime', label: 'publicado en', nullable: true },
      canonicalUrl: { type: 'url', label: 'enlace canónico', nullable: true },
      translations: { type: 'relation[] → ArticleTranslation', label: 'traducciones' },
      slug: { type: 'string', label: 'identificador' },
    },
  },
}

/** Registros que solo se ven dentro de una obra (no son colecciones navegables). */
export const relationMeta: Record<'media' | 'metrics', { label: string, fields: Record<string, FieldMeta> }> = {
  media: {
    label: 'Media',
    fields: {
      kind: { type: 'enum MediaKind', label: 'tipo' },
      role: { type: 'enum MediaRole', label: 'rol' },
      src: { type: 'string', label: 'archivo' },
      srcWebm: { type: 'string', label: 'archivo webm', nullable: true },
      poster: { type: 'string', label: 'póster', nullable: true },
      alt: { type: 'string', label: 'texto alternativo' },
      caption: { type: 'string', label: 'pie', nullable: true },
      tint: { type: 'string', label: 'tinte', nullable: true },
      viewport: { type: 'enum MediaViewport', label: 'pantalla' },
      width: { type: 'int', label: 'ancho' },
      height: { type: 'int', label: 'alto' },
      order: { type: 'int', label: 'orden' },
      bytes: { type: 'int', label: 'peso en bytes', nullable: true },
      translations: { type: 'relation[] → MediaTranslation', label: 'traducciones' },
    },
  },
  metrics: {
    label: 'Metric',
    fields: {
      key: { type: 'string', label: 'clave' },
      value: { type: 'decimal', label: 'valor', nullable: true },
      items: { type: 'list', label: 'lista' },
      unit: { type: 'string', label: 'unidad', nullable: true },
      label: { type: 'string', label: 'rótulo propio', nullable: true },
      source: { type: 'string', label: 'origen', nullable: true },
      measuredAt: { type: 'date', label: 'medido el', nullable: true },
      order: { type: 'int', label: 'orden' },
    },
  },
}

/** Unidades de Metric.unit: viven en server/src/shared porque el API las usa en ejecución. */
export { metricUnits, type MetricUnit } from '../../server/src/shared/metricUnits.js'

/** Un valor de documento: texto o lista (about.languages). */
export type DocFieldValue = string | string[]

/** Forma de cada item de `Doc.fields`. `en` es el valor en inglés; sin él, se sirve el español. */
export type DocField = {
  name: string
  type: FieldType
  value: DocFieldValue
  en?: DocFieldValue
  wide?: boolean
  worlds?: string[]
}

/** Orden de lectura. */
export const collectionOrder: CollectionKey[] = ['projects', 'experience', 'stack', 'articles', 'orgs']
export const docOrder: DocKey[] = ['about', 'contact']

export function fieldsFor(collection: CollectionKey, _world?: string): string[] {
  return Object.keys(fieldMeta[collection].fields)
}
