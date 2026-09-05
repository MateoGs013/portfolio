/**
 * Formas que devuelve el API (server/src/routes). Escritas a mano y a
 * propósito: el front no importa nada de Prisma. Si el server cambia una
 * forma, cambia acá en el mismo commit.
 */
import type { CollectionKey, DocField, DocKey } from './fieldMeta'

export interface Envelope<T> {
  data: T
  meta: { count: number, filters: Record<string, string> }
}

export type SchemaEntry =
  | { key: CollectionKey, label: string, kind: 'collection', count: number }
  | { key: DocKey, label: string, kind: 'document', count: number }

export interface OrgRef { slug: string, name: string, city?: string | null }
export interface TechRef { slug: string, name: string }
export interface LinkRef { label: string, url: string }

export type ProjectStatus = 'LIVE' | 'ARCHIVED' | 'WIP'
export type MediaKind = 'IMAGE' | 'VIDEO'
export type MediaRole = 'COVER' | 'GALLERY' | 'LAYER'
export type TechCategory = 'LANGUAGE' | 'FRAMEWORK' | 'MOTION' | 'GRAPHICS' | 'BACKEND' | 'DATA' | 'TOOLING' | 'DESIGN'

export interface Media {
  id: number
  kind: MediaKind
  role: MediaRole
  src: string
  alt: string
  width: number
  height: number
  layer: number | null
  order: number
  bytes: number | null
}

export interface ProcessStep {
  id: number
  order: number
  title: string
  body: string
  media: Media | null
}

export interface Project {
  id: number
  slug: string
  title: string
  year: number
  role: string
  status: ProjectStatus
  featured: boolean
  summary: string
  brief: string | null
  outcome: string | null
  url: string | null
  repo: string | null
  metrics: unknown | null
  sortOrder: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  org: OrgRef | null
  techs: TechRef[]
  links: LinkRef[]
  /** Solo en la lista. */
  _count?: { media: number, steps: number }
  /** Solo en el detalle. */
  media?: Media[]
  steps?: ProcessStep[]
}

export interface Experience {
  id: number
  slug: string
  role: string
  startedAt: string
  endedAt: string | null
  summary: string
  story: string | null
  org: OrgRef | null
  techs: TechRef[]
}

export interface Tech {
  id: number
  slug: string
  name: string
  category: TechCategory
  since: number
  note: string | null
  color: string | null
  _count: { projects: number, experiences: number }
}

export interface Org {
  id: number
  slug: string
  name: string
  url: string | null
  city: string | null
  projects: { slug: string, title: string, year: number }[]
  experiences: { slug: string, role: string, startedAt: string, endedAt: string | null }[]
}

export interface Doc {
  key: DocKey
  title: string
  fields: DocField[]
  updatedAt: string
}

/** Qué tipo devuelve la lista de cada colección. */
export interface CollectionRecord {
  projects: Project
  experience: Experience
  stack: Tech
  orgs: Org
}

export type AnyRecord = Project | Experience | Tech | Org
