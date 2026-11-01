/**
 * Las obras para el marco de colecciones (/api/admin/projects). El formulario tiene la forma del
 * body del PUT: el inglés en `translations.en` (de la obra y de cada paso), los pasos y los enlaces
 * por id (así conservan su inglés), y la publicación en `publishedAt`. La dirección viaja solo al
 * crear: después se cambia con «Cambiar dirección» (PATCH /projects/:id/slug).
 */
import type { FieldIssue } from '@shared/adminContracts'
import { enumLabel } from '../../models/labels'
import type { Model } from '../../models/types'
import { meta } from '../../stores/meta'
import { projectChecklist } from './checklist'
import { projectsText } from './dict'
import { publicationOf, publicationStatus } from './publication'
import type { AdminProject, ProjectForm, StepForm } from './types'

const t = projectsText
const text = (value: string | null | undefined) => value ?? ''
const trimmed = (value: string) => value.trim() || null

/** El año como número si se escribió como tal; si no, el texto, para que la validación lo nombre. */
function yearValue(raw: string): number | string | null {
  const value = raw.trim()
  if (!value) return null
  return /^\d+$/.test(value) ? Number(value) : value
}

export const FIRST_YEAR = 1990
const lastYear = () => new Date().getFullYear() + 1

function stepForm(step: AdminProject['steps'][number]): StepForm {
  const en = step.translations[0]
  return {
    id: step.id,
    title: step.title,
    body: step.body,
    mediaId: step.mediaId,
    translations: { en: { title: text(en?.title), body: text(en?.body) } },
  }
}

export function blankStep(): StepForm {
  return { id: null, title: '', body: '', mediaId: null, translations: { en: { title: '', body: '' } } }
}

/** El tope del título de un paso en el servidor (str(s, 'title', 200) en admin/projects.ts). */
const STEP_TITLE_MAX = 200

function stepIssues(form: ProjectForm): FieldIssue[] {
  return form.steps.flatMap((step, i) => [
    ...(step.title.trim() ? [] : [{ path: `steps[${i}].title`, message: `Completá el título del paso ${i + 1}.` }]),
    ...(step.title.length > STEP_TITLE_MAX ? [{ path: `steps[${i}].title`, message: `El título del paso ${i + 1} tiene más de ${STEP_TITLE_MAX} caracteres.` }] : []),
    ...(step.body.trim() ? [] : [{ path: `steps[${i}].body`, message: `Contá qué hiciste en el paso ${i + 1}.` }]),
  ])
}

/** Lo que el esquema no sabe de una obra. El rol vacío lo nombra el editor con su propia frase. */
export function projectIssues(form: ProjectForm): FieldIssue[] {
  const issues = stepIssues(form)
  const year = yearValue(form.year)
  if (typeof year === 'number' && (year < FIRST_YEAR || year > lastYear())) {
    issues.push({ path: 'year', message: `El año va entre ${FIRST_YEAR} y ${lastYear()}.` })
  }
  return issues
}

function hasCover(project: AdminProject): boolean {
  return project.media.some(m => m.role === 'COVER')
}

function untranslated(project: AdminProject): boolean {
  return meta.value?.untranslated.some(r => r.collection === 'projects' && r.id === project.id) ?? false
}

export const projectModel: Model<AdminProject, ProjectForm> = {
  key: 'obras',
  path: '/projects',
  schema: 'Project',
  noun: { one: 'obra', many: 'obras', gender: 'f' },
  routes: {
    list: { name: 'obras' },
    record: id => ({ name: 'obra', params: { id: String(id) } }),
    create: { name: 'obra-nueva' },
  },
  blank: () => ({
    title: '',
    slug: '',
    year: String(new Date().getFullYear()),
    role: '',
    status: 'WIP',
    featured: false,
    summary: '',
    brief: '',
    outcome: '',
    url: '',
    repo: '',
    publishedAt: null,
    orgId: null,
    techIds: [],
    links: [],
    steps: [],
    translations: { en: { title: '', role: '', summary: '', brief: '', outcome: '' } },
  }),
  toForm: (p) => {
    const en = p.translations[0]
    return {
      title: p.title,
      slug: p.slug,
      year: String(p.year),
      role: p.role,
      status: p.status,
      featured: p.featured,
      summary: p.summary,
      brief: text(p.brief),
      outcome: text(p.outcome),
      url: text(p.url),
      repo: text(p.repo),
      publishedAt: p.publishedAt,
      orgId: p.orgId,
      techIds: p.techs.map(x => x.id),
      links: p.links.map(l => ({ id: l.id, label: l.label, url: l.url, translations: { en: { label: text(l.translations[0]?.label) } } })),
      steps: p.steps.map(stepForm),
      translations: {
        en: { title: text(en?.title), role: text(en?.role), summary: text(en?.summary), brief: text(en?.brief), outcome: text(en?.outcome) },
      },
    }
  },
  toPayload: (form, record) => ({
    title: form.title,
    // Sin dirección escrita, el servidor la arma con el título.
    ...(record || !form.slug.trim() ? {} : { slug: form.slug.trim() }),
    year: yearValue(form.year),
    role: form.role,
    status: form.status,
    featured: form.featured,
    summary: form.summary,
    brief: trimmed(form.brief),
    outcome: trimmed(form.outcome),
    url: trimmed(form.url),
    repo: trimmed(form.repo),
    publishedAt: form.publishedAt,
    orgId: form.orgId,
    techIds: form.techIds,
    links: form.links.map(l => ({ id: l.id, label: l.label, url: l.url, translations: { en: { ...l.translations.en } } })),
    // Una obra nueva no tiene imágenes: sus pasos nacen sin imagen.
    steps: form.steps.map(s => ({
      id: s.id,
      title: s.title,
      body: s.body,
      mediaId: record ? s.mediaId : null,
      translations: { en: { ...s.translations.en } },
    })),
    translations: { en: { ...form.translations.en } },
  }),
  validate: form => projectIssues(form),
  title: p => p.title,
  formTitle: form => form.title,
  metaLine: p => [enumLabel('ProjectStatus', p.status), String(p.year), p.featured ? t.row.featured : ''].filter(Boolean).join(' · '),
  aside: p => (hasCover(p) ? t.row.images(p.media.length) : t.row.noCover),
  status: p => publicationStatus(p.publishedAt),
  publicUrl: p => (publicationOf(p.publishedAt) === 'published' ? `/projects/${p.slug}` : null),
  sections: [
    { id: 'esencial', label: t.sections.essentials, fields: ['title', 'slug', 'year', 'status', 'orgId', 'role', 'featured', 'url', 'repo', 'publishedAt'] },
    { id: 'relato', label: t.sections.story, fields: ['summary', 'brief', 'outcome', 'steps'] },
    { id: 'imagenes', label: t.sections.images, fields: ['media'] },
    { id: 'datos', label: t.sections.data, fields: ['techIds', 'links', 'metrics'] },
  ],
  filters: [
    { id: 'todas', label: t.filters.all, test: () => true },
    { id: 'publicadas', label: t.filters.published, test: p => publicationOf(p.publishedAt) === 'published' },
    { id: 'ocultas', label: t.filters.hidden, test: p => publicationOf(p.publishedAt) === 'hidden' },
    { id: 'programadas', label: t.filters.scheduled, test: p => publicationOf(p.publishedAt) === 'scheduled' },
    { id: 'destacadas', label: t.filters.featured, test: p => p.featured },
    { id: 'falta-ingles', label: t.filters.english, test: untranslated },
  ],
  keywords: p => [p.slug, p.role, p.org?.name ?? ''].join(' '),
  slugEndpoint: id => `/projects/${id}/slug`,
  slugPreview: slug => `/projects/${slug}`,
  checklist: (form, record) => projectChecklist(form, record),
}
