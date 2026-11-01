/**
 * Una obra como la devuelve GET /api/admin/projects(/:id) (server/src/admin/projects.ts) y su
 * formulario, que tiene la forma exacta del body del PUT: así un error del servidor en
 * `steps[1].translations.en.body` o ?campo= caen justo en su campo.
 */
import type { AdminRecord } from '../../models/types'

type En<T> = T & { locale: 'en' }

export type ProjectStatus = 'LIVE' | 'WIP' | 'ARCHIVED'

export interface AdminStep {
  id: number
  order: number
  title: string
  body: string
  mediaId: number | null
  translations: En<{ title: string | null, body: string | null }>[]
}

export interface AdminLink {
  id: number
  label: string
  url: string
  translations: En<{ label: string | null }>[]
}

export interface AdminMedia {
  id: number
  kind: 'IMAGE' | 'VIDEO'
  role: 'COVER' | 'GALLERY'
  src: string
  poster: string | null
  alt: string
  caption: string | null
  order: number
  translations: En<{ alt: string | null, caption: string | null }>[]
}

export interface AdminMetric {
  id: number
  key: string
  label: string | null
  translations: En<{ label: string | null }>[]
}

export interface AdminProject extends AdminRecord {
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
  sortOrder: number
  publishedAt: string | null
  orgId: number | null
  org: { id: number, name: string } | null
  techs: { id: number, name: string }[]
  links: AdminLink[]
  steps: AdminStep[]
  media: AdminMedia[]
  metrics: AdminMetric[]
  translations: En<{ title: string | null, role: string | null, summary: string | null, brief: string | null, outcome: string | null }>[]
}

export interface ProjectEnForm {
  title: string
  role: string
  summary: string
  brief: string
  outcome: string
}

export interface StepForm {
  id: number | null
  title: string
  body: string
  mediaId: number | null
  translations: { en: { title: string, body: string } }
}

export interface LinkForm {
  id: number | null
  label: string
  url: string
  translations: { en: { label: string } }
}

/**
 * El formulario: los textos como texto (el año también, para escribirlo), `publishedAt` en ISO o null
 * (oculta). Tecnologías y enlaces viajan tal cual en cada guardado: el PUT reemplaza lo que no llega.
 * Las métricas no viajan: sin la clave el servidor las conserva.
 */
export interface ProjectForm {
  title: string
  slug: string
  year: string
  role: string
  status: ProjectStatus
  featured: boolean
  summary: string
  brief: string
  outcome: string
  url: string
  repo: string
  publishedAt: string | null
  orgId: number | null
  techIds: number[]
  links: LinkForm[]
  steps: StepForm[]
  translations: { en: ProjectEnForm }
}
