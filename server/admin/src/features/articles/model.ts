/**
 * Artículos sobre /api/admin/articles. Nacen en borrador y sin fecha (el servidor lo fuerza); se
 * publican con «Mostrar en el sitio», que pone PUBLISHED y la fecha desde la que se ven. La dirección
 * sale del título al crear y después cambia solo con PATCH /articles/:id/slug. El inglés (título,
 * bajada y texto) viaja en `translations.en`. El formulario tiene la forma del payload.
 */
import type { ChecklistItem, Model, RecordStatus } from '../../models/types'
import { enumLabel } from '../../models/labels'
import { articles, shortDate } from './dict'
import { readingMinutes } from '@shared/markdown'
import { fromDay, sameDay, toDay } from './dates'

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

interface English {
  title: string | null
  summary: string | null
  content: string | null
}

export interface AdminArticle {
  id: number
  slug: string
  title: string
  summary: string
  content: string
  readingTimeMin: number
  status: ArticleStatus
  featured: boolean
  coverImage: string | null
  canonicalUrl: string | null
  sortOrder: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  techs: { id: number, name: string, slug: string }[]
  project: { id: number, title: string, slug: string } | null
  projectId: number | null
  translations: (English & { locale: string })[]
}

export interface ArticleForm {
  title: string
  slug: string
  summary: string
  content: string
  /** Como se escribe en el campo; el servidor lo lee como entero. Un input numérico puede dejar un número. */
  readingTimeMin: string | number
  /** Posición en la lista del sitio (más bajo, más arriba), como se escribe en el campo. */
  sortOrder: string | number
  status: ArticleStatus
  /** YYYY-MM-DD en la hora local; vacío si no tiene fecha. */
  publishedAt: string
  featured: boolean
  canonicalUrl: string
  projectId: number | null
  techIds: number[]
  translations: { en: { title: string, summary: string, content: string } }
}

const ENGLISH = ['title', 'summary', 'content'] as const

const englishOf = (a: AdminArticle): English => a.translations.find(t => t.locale === 'en') ?? { title: null, summary: null, content: null }

/** Los campos con español escrito y sin su inglés. */
export function missingEnglish(es: Record<typeof ENGLISH[number], string>, en: Partial<Record<typeof ENGLISH[number], string | null>>): string[] {
  return ENGLISH.filter(k => es[k].trim() && !en[k]?.trim())
}

/** Visible en el sitio: publicado y con la fecha ya cumplida (la misma regla que la API pública). */
export function isLive(status: ArticleStatus, publishedAt: Date | null): boolean {
  return status === 'PUBLISHED' && !!publishedAt && publishedAt.getTime() <= Date.now()
}

/** El estado en palabras, del registro guardado o de lo que se está editando. */
export function articleStatus(status: ArticleStatus, publishedAt: Date | null): RecordStatus {
  if (status !== 'PUBLISHED') return { tone: 'neutral', label: enumLabel('ArticleStatus', status) }
  if (!publishedAt) return { tone: 'wip', label: articles.status.undated }
  if (publishedAt.getTime() > Date.now()) return { tone: 'wip', label: articles.status.scheduled }
  return { tone: 'ok', label: enumLabel('ArticleStatus', status) }
}

const dateOf = (iso: string | null) => (iso ? new Date(iso) : null)

/**
 * La fecha que viaja: la guardada tal cual si el día no cambió (ida y vuelta sin cambios) y «ahora» si
 * se publica sin fecha. Uno que ya estaba publicado sin fecha (un parche) sigue así hasta que se elija.
 */
function publishedAtOut(form: ArticleForm, record: AdminArticle | null): string | null {
  const stored = record?.publishedAt ?? null
  if (!form.publishedAt) {
    const keptUndated = record?.status === 'PUBLISHED' && stored === null
    return form.status === 'PUBLISHED' && !keptUndated ? new Date().toISOString() : null
  }
  if (stored && sameDay(form.publishedAt, stored)) return stored
  return fromDay(form.publishedAt)
}

const text = (value: string) => value.trim() || null

/** Los minutos escritos, o los calculados del texto si el campo quedó vacío (el servidor pondría 5). */
function minutesOut(form: ArticleForm): string | number {
  const typed = String(form.readingTimeMin ?? '').trim()
  if (typed) return typed
  return form.content.trim() ? readingMinutes(form.content) : ''
}

export function articleChecklist(form: ArticleForm): ChecklistItem[] {
  const t = articles.checklist
  const en = form.translations.en
  return [
    { id: 'summary', label: t.summary, done: !!form.summary.trim(), field: 'summary' },
    { id: 'content', label: t.content, done: !!form.content.trim(), field: 'content' },
    { id: 'title-en', label: t.titleEn, done: !!en.title.trim(), field: 'translations.en.title' },
    { id: 'summary-en', label: t.summaryEn, done: !!en.summary.trim(), field: 'translations.en.summary' },
    { id: 'content-en', label: t.contentEn, done: !!en.content.trim(), field: 'translations.en.content' },
    { id: 'techs', label: t.techs, done: form.techIds.length > 0, field: 'techIds' },
  ]
}

export const articleModel: Model<AdminArticle, ArticleForm> = {
  key: 'articulos',
  path: '/articles',
  schema: 'Article',
  noun: { one: 'artículo', many: 'artículos', gender: 'm' },
  routes: {
    list: { name: 'articulos' },
    record: id => ({ name: 'articulo', params: { id: String(id) } }),
    create: { name: 'articulo-nuevo' },
  },
  blank: () => ({
    title: '',
    slug: '',
    summary: '',
    content: '',
    readingTimeMin: '',
    sortOrder: '0',
    status: 'DRAFT',
    publishedAt: '',
    featured: false,
    canonicalUrl: '',
    projectId: null,
    techIds: [],
    translations: { en: { title: '', summary: '', content: '' } },
  }),
  toForm: (a) => {
    const en = englishOf(a)
    return {
      title: a.title,
      slug: a.slug,
      summary: a.summary,
      content: a.content,
      readingTimeMin: String(a.readingTimeMin),
      sortOrder: String(a.sortOrder),
      status: a.status,
      publishedAt: a.publishedAt ? toDay(a.publishedAt) : '',
      featured: a.featured,
      canonicalUrl: a.canonicalUrl ?? '',
      projectId: a.projectId,
      techIds: a.techs.map(t => t.id),
      translations: { en: { title: en.title ?? '', summary: en.summary ?? '', content: en.content ?? '' } },
    }
  },
  toPayload: (form, record) => ({
    title: form.title,
    summary: form.summary,
    content: form.content,
    readingTimeMin: minutesOut(form),
    sortOrder: String(form.sortOrder ?? '').trim() || '0',
    // Al crear, el servidor lo deja en borrador y sin fecha diga lo que diga.
    status: form.status,
    publishedAt: publishedAtOut(form, record),
    featured: form.featured,
    canonicalUrl: text(form.canonicalUrl),
    projectId: form.projectId,
    techIds: form.techIds,
    translations: { en: { title: form.translations.en.title, summary: form.translations.en.summary, content: form.translations.en.content } },
    // Lo que el admin no edita viaja como está guardado: el PUT reemplaza el registro entero.
    ...(record ? { coverImage: record.coverImage } : { slug: form.slug }),
  }),
  title: a => a.title,
  formTitle: form => form.title,
  metaLine: (a) => {
    const at = dateOf(a.publishedAt)
    const parts = [
      at && a.status === 'PUBLISHED' ? (at.getTime() > Date.now() ? articles.row.since(shortDate(at)) : shortDate(at)) : '',
      a.project?.title ?? '',
      missingEnglish(a, englishOf(a)).length ? articles.row.noEnglish : '',
    ]
    return parts.filter(Boolean).join(' · ')
  },
  aside: a => articles.row.minutes(a.readingTimeMin),
  status: a => articleStatus(a.status, dateOf(a.publishedAt)),
  publicUrl: a => (isLive(a.status, dateOf(a.publishedAt)) ? `/articles/${a.slug}` : null),
  sections: [
    { id: 'esencial', label: articles.sections.essentials, fields: ['title', 'slug', 'summary', 'projectId', 'techIds', 'readingTimeMin', 'sortOrder', 'canonicalUrl', 'featured', 'status', 'publishedAt'] },
    { id: 'texto', label: articles.sections.text, fields: ['content', 'translations.en.content'] },
  ],
  filters: [
    { id: 'todos', label: articles.filters.all, test: () => true },
    { id: 'publicados', label: articles.filters.published, test: a => isLive(a.status, dateOf(a.publishedAt)) },
    { id: 'borradores', label: articles.filters.drafts, test: a => a.status === 'DRAFT' },
    { id: 'falta-ingles', label: articles.filters.noEnglish, test: a => missingEnglish(a, englishOf(a)).length > 0 },
  ],
  keywords: a => [a.slug, a.summary, a.techs.map(t => t.name).join(' ')].join(' '),
  slugEndpoint: id => `/articles/${id}/slug`,
  slugPreview: slug => `/articles/${slug}`,
  checklist: form => articleChecklist(form),
}
