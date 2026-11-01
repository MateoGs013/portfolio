/**
 * Tecnologías (/api/admin/techs, sin GET /:id: el registro se busca en la lista). El criterio es el
 * único texto con inglés (`translations.en.note`); el color es un hex de seis cifras que solo usa el
 * registro R; «Desde» es un año entre 1990 y el actual.
 */
import type { FieldIssue } from '@shared/adminContracts'
import type { Model } from '../../models/types'
import { fieldOf } from '../../models/validate'
import { catalog } from '../orgs/dict'
import { FIRST_YEAR, stack } from './dict'

export interface AdminTech {
  id: number
  slug: string
  name: string
  category: string
  since: number
  note: string | null
  color: string | null
  translations: { locale: 'en', note: string | null }[]
  _count: { projects: number, experiences: number, articles: number }
}

/** Con la forma del payload: `since` y `translations.en.note` caen en su campo. */
export interface TechForm {
  name: string
  slug: string
  category: string | null
  since: string
  note: string
  color: string
  translations: { en: { note: string } }
}

export const englishNote = (tech: AdminTech) => tech.translations.find(t => t.locale === 'en')?.note ?? ''
export const missingEnglish = (tech: AdminTech) => !!tech.note?.trim() && !englishNote(tech).trim()
export const techUsed = (tech: AdminTech) => tech._count.projects + tech._count.experiences + tech._count.articles > 0

const thisYear = () => new Date().getFullYear()

/** Un año escrito como número; lo que no lo es viaja tal cual para que el error lo nombre. */
export const yearOf = (text: string): number | string => (/^\d+$/.test(text.trim()) ? Number(text.trim()) : text.trim())

/** «Desde» fuera de 1990…año actual: la misma regla que el servidor, antes de mandar. */
export function sinceIssues(since: string): FieldIssue[] {
  const year = yearOf(since)
  if (typeof year !== 'number' || (year >= FIRST_YEAR && year <= thisYear())) return []
  return [{ path: 'since', message: stack.fields.sinceRange(fieldOf('Tech', 'since')?.label ?? 'Desde', thisYear()) }]
}

export const techModel: Model<AdminTech, TechForm> = {
  key: 'tecnologias',
  path: '/techs',
  schema: 'Tech',
  noun: stack.noun,
  detail: false,
  routes: {
    list: { name: 'tecnologias' },
    record: id => ({ name: 'tecnologia', params: { id: String(id) } }),
  },
  blank: () => ({ name: '', slug: '', category: null, since: String(thisYear()), note: '', color: '', translations: { en: { note: '' } } }),
  toForm: tech => ({
    name: tech.name,
    slug: tech.slug,
    category: tech.category,
    since: String(tech.since),
    note: tech.note ?? '',
    color: tech.color ?? '',
    translations: { en: { note: englishNote(tech) } },
  }),
  toPayload: (form, tech) => ({
    name: form.name.trim(),
    category: form.category,
    since: yearOf(form.since),
    note: form.note.trim() || null,
    color: form.color || null,
    translations: { en: { note: form.translations.en.note.trim() || null } },
    // La dirección viaja solo al crear: después cambia con «Cambiar dirección».
    ...(tech ? {} : { slug: form.slug }),
  }),
  validate: form => sinceIssues(form.since),
  title: tech => tech.name,
  formTitle: form => form.name,
  metaLine: (tech) => {
    const { experiences, articles } = tech._count
    return [stack.since(tech.since), experiences ? catalog.experiences(experiences) : '', articles ? catalog.articles(articles) : '']
      .filter(Boolean)
      .join(' · ')
  },
  aside: tech => (tech._count.projects ? catalog.projects(tech._count.projects) : stack.noProjects),
  status: tech => (missingEnglish(tech) ? { tone: 'wip', label: stack.missingEnglish } : null),
  publicUrl: tech => (tech._count.projects ? `/projects?stack=${tech.slug}` : null),
  sections: [
    { id: 'esencial', label: stack.section, fields: ['name', 'slug', 'category', 'since', 'note', 'translations', 'color'] },
  ],
  filters: [
    { id: 'todas', label: stack.filters.all, test: () => true },
    { id: 'en-uso', label: stack.filters.used, test: techUsed },
    { id: 'sin-uso', label: stack.filters.unused, test: tech => !techUsed(tech) },
    { id: 'sin-ingles', label: stack.filters.noEnglish, test: missingEnglish },
  ],
  keywords: tech => [tech.slug, tech.note ?? ''].join(' '),
  slugEndpoint: id => `/techs/${id}/slug`,
  slugPreview: slug => `/projects?stack=${slug}`,
  impact: true,
}
