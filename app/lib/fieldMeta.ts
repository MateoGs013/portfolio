/**
 * Metadatos de campos del esquema técnico.
 *
 * Cada campo declara su tipo visible en pantalla (`type`), si requiere ancho completo
 * de lectura (`wide`) y si admite valores nulos (`nullable`).
 *
 * El orden de los campos es el orden de lectura de la hoja técnica:
 * primero la identidad y síntesis, luego enlaces y métricas, y finalmente
 * el dossier profundo (brief, outcome, steps, media).
 */

export type World = 'datos'

export type FieldType =
  | 'string' | 'text' | 'int' | 'bool' | 'date' | 'datetime' | 'url' | 'json'
  | `enum ${string}`
  | `relation → ${string}`
  | `relation[] → ${string}`

export interface FieldMeta {
  type: FieldType
  label?: string
  wide?: boolean
  nullable?: boolean
}

export type CollectionKey = 'projects' | 'experience' | 'stack' | 'orgs'
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
      summary: { type: 'string', label: 'síntesis ejecutiva', wide: true },
      media: { type: 'relation[] → Media', label: 'capturas & piezas multimedia', wide: true },
      brief: { type: 'text', label: 'encargo / brief', wide: true, nullable: true },
      outcome: { type: 'text', label: 'resultado en producción', wide: true, nullable: true },
      steps: { type: 'relation[] → ProcessStep', label: 'proceso de ingeniería (taller)', wide: true },
      metrics: { type: 'json', label: 'telemetría & métricas lighthouse', wide: true, nullable: true },
      techs: { type: 'relation[] → Tech', label: 'arsenal tecnológico' },
      links: { type: 'relation[] → Link', label: 'enlaces directos' },
      url: { type: 'url', label: 'sitio en vivo', nullable: true },
      repo: { type: 'url', label: 'código en github', nullable: true },
      year: { type: 'int', label: 'año de entrega' },
      role: { type: 'string', label: 'rol desempeñado' },
      status: { type: 'enum ProjectStatus', label: 'estado de producción' },
      org: { type: 'relation → Org', label: 'cliente / organización', nullable: true },
      featured: { type: 'bool', label: 'proyecto destacado' },
      publishedAt: { type: 'datetime', label: 'publicado en', nullable: true },
      updatedAt: { type: 'datetime', label: 'última actualización' },
      slug: { type: 'string', label: 'identificador' },
    },
  },

  experience: {
    label: 'experience',
    kind: 'collection',
    nameField: 'role',
    fields: {
      role: { type: 'string', label: 'rol / cargo' },
      org: { type: 'relation → Org', label: 'institución / empresa', nullable: true },
      startedAt: { type: 'date', label: 'fecha de inicio' },
      endedAt: { type: 'date', label: 'fecha de culminación', nullable: true },
      summary: { type: 'string', label: 'síntesis de desempeño', wide: true },
      story: { type: 'text', label: 'relato de aprendizajes e impacto', wide: true, nullable: true },
      techs: { type: 'relation[] → Tech', label: 'tecnologías aplicadas' },
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
      since: { type: 'int', label: 'año de adopción' },
      note: { type: 'string', label: 'criterio técnico de uso', wide: true, nullable: true },
      projects: { type: 'relation[] → Project', label: 'proyectos en que se usó' },
      experiences: { type: 'relation[] → Experience', label: 'etapas en que se usó' },
      color: { type: 'string', label: 'color distintivo', nullable: true },
      slug: { type: 'string', label: 'identificador' },
    },
  },

  orgs: {
    label: 'orgs',
    kind: 'collection',
    nameField: 'name',
    fields: {
      name: { type: 'string', label: 'nombre' },
      city: { type: 'string', label: 'ubicación / sede', nullable: true },
      url: { type: 'url', label: 'sitio oficial', nullable: true },
      projects: { type: 'relation[] → Project', label: 'proyectos asociados' },
      experiences: { type: 'relation[] → Experience', label: 'experiencias asociadas' },
      slug: { type: 'string', label: 'identificador' },
    },
  },
}

/** Forma de cada item de `Doc.fields`. */
export type DocField = {
  name: string
  type: FieldType
  value: string
  wide?: boolean
  worlds?: string[]
}

/** Orden de navegación en el explorador. */
export const collectionOrder: CollectionKey[] = ['projects', 'experience', 'stack']
export const docOrder: DocKey[] = ['about', 'contact']

export function fieldsFor(collection: CollectionKey, _world?: string): string[] {
  return Object.keys(fieldMeta[collection].fields)
}
