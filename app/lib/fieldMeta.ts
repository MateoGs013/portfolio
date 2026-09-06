/**
 * Qué campo ve cada mundo, y con qué tipo.
 *
 * Es el único lugar donde se declara esto. Antes de agregar un campo,
 * decidir a qué mundo pertenece. Si la respuesta es "a los dos", justificarlo
 * en el comentario: que los dos mundos muestren lo mismo es la falla más
 * fácil del proyecto. `/revision-mundos` cuenta los compartidos.
 *
 * `type` es lo que DATOS imprime al lado del valor. Se escribe como lo
 * leería alguien que mira un schema, no como lo nombra Prisma.
 *
 * El orden de los campos es el orden de lectura de la hoja en DATOS: primero
 * lo que responde "qué es esto", después los links, al final la metadata.
 */

export type World = 'datos' | 'diseno'

export type FieldType =
  | 'string' | 'text' | 'int' | 'bool' | 'date' | 'datetime' | 'url' | 'json'
  | `enum ${string}`
  | `relation → ${string}`
  | `relation[] → ${string}`

export interface FieldMeta {
  type: FieldType
  worlds: World[]
  /** Saca al campo de la grilla angosta y le da ancho de lectura. Solo importa en DATOS. */
  wide?: boolean
  /** Puede ser NULL. DATOS lo muestra como NULL, no lo esconde. */
  nullable?: boolean
}

export type CollectionKey = 'projects' | 'experience' | 'stack' | 'orgs'
export type DocKey = 'about' | 'contact'

export interface CollectionMeta {
  label: string
  kind: 'collection'
  /** Campo que hace de nombre del record. Vive en los dos mundos: es lo que viaja en el pasaje. */
  nameField: string
  fields: Record<string, FieldMeta>
}

export const fieldMeta: Record<CollectionKey, CollectionMeta> = {
  projects: {
    label: 'projects',
    kind: 'collection',
    nameField: 'title',
    fields: {
      // Compartidos, con motivo: el slug es la ruta, el título es el ancla del pasaje.
      title: { type: 'string', worlds: ['datos', 'diseno'] },
      // Hechos sobre el trabajo → DATOS.
      summary: { type: 'string', worlds: ['datos'], wide: true },
      year: { type: 'int', worlds: ['datos'] },
      role: { type: 'string', worlds: ['datos'] },
      status: { type: 'enum ProjectStatus', worlds: ['datos'] },
      org: { type: 'relation → Org', worlds: ['datos'], nullable: true },
      techs: { type: 'relation[] → Tech', worlds: ['datos'] },
      url: { type: 'url', worlds: ['datos'], nullable: true },
      repo: { type: 'url', worlds: ['datos'], nullable: true },
      links: { type: 'relation[] → Link', worlds: ['datos'] },
      metrics: { type: 'json', worlds: ['datos'], nullable: true },
      featured: { type: 'bool', worlds: ['datos'] },
      publishedAt: { type: 'datetime', worlds: ['datos'], nullable: true },
      updatedAt: { type: 'datetime', worlds: ['datos'] },
      slug: { type: 'string', worlds: ['datos', 'diseno'] },
      // El trabajo → DISEÑO.
      brief: { type: 'text', worlds: ['diseno'], nullable: true },
      outcome: { type: 'text', worlds: ['diseno'], nullable: true },
      media: { type: 'relation[] → Media', worlds: ['diseno'] },
      steps: { type: 'relation[] → ProcessStep', worlds: ['diseno'] },
    },
  },

  experience: {
    label: 'experience',
    kind: 'collection',
    // El nombre es el rol, no la organización: la experiencia es freelance y
    // propia, y varias etapas no tienen organización detrás.
    nameField: 'role',
    fields: {
      role: { type: 'string', worlds: ['datos', 'diseno'] }, // es el nombre del record
      org: { type: 'relation → Org', worlds: ['datos', 'diseno'], nullable: true }, // rotula la banda en DISEÑO
      // Compartidas porque el tiempo es la dimensión dominante de esta colección:
      // DATOS las lista como fechas, DISEÑO las dibuja como bandas.
      startedAt: { type: 'date', worlds: ['datos', 'diseno'] },
      endedAt: { type: 'date', worlds: ['datos', 'diseno'], nullable: true },
      summary: { type: 'string', worlds: ['datos'], wide: true },
      techs: { type: 'relation[] → Tech', worlds: ['datos'] },
      slug: { type: 'string', worlds: ['datos', 'diseno'] },
      story: { type: 'text', worlds: ['diseno'], nullable: true },
    },
  },

  stack: {
    label: 'stack',
    kind: 'collection',
    nameField: 'name',
    fields: {
      name: { type: 'string', worlds: ['datos', 'diseno'] },
      category: { type: 'enum TechCategory', worlds: ['datos'] },
      // Compartido: DATOS lo imprime, DISEÑO lo lee como tamaño del chip.
      since: { type: 'int', worlds: ['datos', 'diseno'] },
      note: { type: 'string', worlds: ['datos'], wide: true, nullable: true },
      projects: { type: 'relation[] → Project', worlds: ['datos'] },
      experiences: { type: 'relation[] → Experience', worlds: ['datos'] },
      slug: { type: 'string', worlds: ['datos', 'diseno'] },
      color: { type: 'string', worlds: ['diseno'], nullable: true },
    },
  },

  orgs: {
    label: 'orgs',
    kind: 'collection',
    nameField: 'name',
    fields: {
      name: { type: 'string', worlds: ['datos', 'diseno'] },
      city: { type: 'string', worlds: ['datos'], nullable: true },
      url: { type: 'url', worlds: ['datos'], nullable: true },
      projects: { type: 'relation[] → Project', worlds: ['datos'] },
      experiences: { type: 'relation[] → Experience', worlds: ['datos'] },
      slug: { type: 'string', worlds: ['datos'] },
    },
  },
}

/** Forma de cada item de `Doc.fields`. `worlds` ausente = los dos.
 *  Es un `type` y no una `interface` para que sea asignable al Json de Prisma. */
export type DocField = {
  name: string
  type: FieldType
  value: string
  wide?: boolean
  worlds?: World[]
}

/** Orden de navegación en DATOS. `orgs` no está: se llega por relación. */
export const collectionOrder: CollectionKey[] = ['projects', 'experience', 'stack']
export const docOrder: DocKey[] = ['about', 'contact']

export function fieldsFor(collection: CollectionKey, world: World): string[] {
  return Object.entries(fieldMeta[collection].fields)
    .filter(([, meta]) => meta.worlds.includes(world))
    .map(([name]) => name)
}
