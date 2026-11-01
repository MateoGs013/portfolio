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

export type MediaKind = 'IMAGE' | 'VIDEO'
export type MediaRole = 'COVER' | 'GALLERY'
export type MediaViewport = 'DESKTOP' | 'MOBILE'

export interface AdminMedia {
  id: number
  kind: MediaKind
  role: MediaRole
  src: string
  srcWebm: string | null
  poster: string | null
  alt: string
  caption: string | null
  tint: string | null
  viewport: MediaViewport
  width: number
  height: number
  bytes: number | null
  order: number
  translations: En<{ alt: string | null, caption: string | null }>[]
}

/** Una métrica tal como sale de Prisma: el Decimal llega como texto y la fecha en ISO. */
export interface AdminMetric {
  id: number
  key: string
  value: string | number | null
  items: string[]
  unit: string | null
  label: string | null
  source: string | null
  measuredAt: string | null
  order: number
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
 * Una imagen o un video en el formulario. `id` null es una pieza nueva: su archivo espera en la cola
 * (media/mediaQueue.ts) y `upload` nombra lo que se sube al guardar (también un reemplazo, un WebM o
 * un póster de una pieza ya cargada). La media no viaja en el PUT de la obra: se guarda pieza por
 * pieza en /media después, en el mismo Guardar; las rutas de error son `media[i].alt`.
 */
export interface MediaForm {
  key: string
  id: number | null
  kind: MediaKind
  role: MediaRole
  viewport: MediaViewport
  alt: string
  caption: string
  tint: string
  upload: { file: string | null, webm: string | null, poster: string | null }
  translations: { en: { alt: string, caption: string } }
}

/**
 * Una métrica con la forma del body: un número con unidad (`value` y `unit`) o una lista (`items`,
 * un elemento por renglón), según `kind`, que no viaja. El rótulo propio solo cuenta fuera del
 * catálogo de claves.
 */
export interface MetricForm {
  id: number | null
  key: string
  kind: 'value' | 'items'
  value: string
  unit: string | null
  items: string
  label: string
  source: string
  measuredAt: string
  translations: { en: { label: string } }
}

/**
 * El formulario: los textos como texto (el año también, para escribirlo), `publishedAt` en ISO o null
 * (oculta). Tecnologías, enlaces y métricas viajan tal cual en cada guardado: el PUT reemplaza lo que
 * no llega. La media va aparte (MediaForm).
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
  metrics: MetricForm[]
  media: MediaForm[]
  translations: { en: ProjectEnForm }
}
