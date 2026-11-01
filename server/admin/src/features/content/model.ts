/**
 * Lo que se lee de una publicación sin pedir nada: su título, su estado en palabras, el enfoque, la
 * obra de la base de la que habla, las fechas y los filtros de la lista. Todo puro.
 */
import { postPillarLabels, postStatusLabels, type ContentPost, type PostStatus } from '@shared/contentContracts'
import type { ProjectOption } from '@shared/adminContracts'
import type { StatusTone } from '../../ui/StatusDot.vue'
import { content } from './dict'

const STATUS_TONE: Record<PostStatus, StatusTone> = {
  draft: 'wip',
  approved: 'sig',
  published: 'ok',
  rejected: 'neutral',
}

export function postStatusOf(post: Pick<ContentPost, 'status'>): { tone: StatusTone, label: string } {
  return { tone: STATUS_TONE[post.status], label: postStatusLabels[post.status] }
}

export function postTitle(post: Pick<ContentPost, 'title' | 'topic' | 'devto_title'>): string {
  return post.title.trim() || post.devto_title?.trim() || post.topic?.trim() || content.untitled
}

export const pillarOf = (post: Pick<ContentPost, 'pillar'>) => (post.pillar ? postPillarLabels[post.pillar] : null)

/** La obra de la base que nombra la publicación; si el slug no está en la base, no se muestra. */
export function projectOf(slug: string | null, projects: readonly ProjectOption[] | undefined): ProjectOption | null {
  return slug ? projects?.find(p => p.slug === slug) ?? null : null
}

/* ── Fechas ────────────────────────────────────────────── */

const LONG = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
const SHORT = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
const SHORT_YEAR = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/** «30 de octubre de 2026», o null si no hay fecha (nunca una inventada). */
export const longDay = (iso: string | null | undefined) => {
  const date = parse(iso)
  return date ? LONG.format(date) : null
}

/** «30 oct» este año, «30 oct 2025» otro año: para el margen de una fila. */
export function shortDay(iso: string | null | undefined, now = new Date()): string | null {
  const date = parse(iso)
  if (!date) return null
  return (date.getFullYear() === now.getFullYear() ? SHORT : SHORT_YEAR).format(date)
}

/* ── Filtros de la lista ────────────────────────────────── */

export type PostFilter = 'todas' | 'borradores' | 'aprobadas' | 'publicadas' | 'descartadas'

export interface ListFilter<T, F extends string> {
  id: F
  label: string
  test: (row: T) => boolean
}

const byStatus = (status: PostStatus) => (row: ContentPost) => row.status === status

export const POST_FILTERS: readonly ListFilter<ContentPost, PostFilter>[] = [
  { id: 'todas', label: content.filters.all, test: () => true },
  { id: 'borradores', label: content.filters.draft, test: byStatus('draft') },
  { id: 'aprobadas', label: content.filters.approved, test: byStatus('approved') },
  { id: 'publicadas', label: content.filters.published, test: byStatus('published') },
  { id: 'descartadas', label: content.filters.rejected, test: byStatus('rejected') },
]

export const DEFAULT_POST_FILTER: PostFilter = 'todas'

export function isPostFilter(value: unknown): value is PostFilter {
  return POST_FILTERS.some(f => f.id === value)
}

/* ── Formatos del registro ──────────────────────────────── */

export type PostFormat = 'linkedin' | 'hilo' | 'devto' | 'carrusel'
export const POST_FORMATS: readonly PostFormat[] = ['linkedin', 'hilo', 'devto', 'carrusel']
export const DEFAULT_FORMAT: PostFormat = 'linkedin'

export function isPostFormat(value: unknown): value is PostFormat {
  return typeof value === 'string' && (POST_FORMATS as readonly string[]).includes(value)
}
