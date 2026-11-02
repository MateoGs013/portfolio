/**
 * Trayectoria en el marco de colecciones: GET/POST/PUT /api/admin/experience (sin GET /:id: el
 * registro se busca en la lista), dirección fija con PATCH /experience/:id/slug y el inglés en
 * `translations.en`, con las viñetas alineadas posición por posición con las del español.
 *
 * La posición en el CV no se edita en el formulario: viaja la guardada (un PUT sin ella sacaría la
 * entrada del CV) y cambia con PATCH /experience/order desde la vista CV o «Sumar».
 */
import type { FieldIssue } from '@shared/adminContracts'
import { enumLabel } from '../../models/labels'
import type { Model } from '../../models/types'
import { options } from '../../stores/meta'
import { experience as t, periodText } from './dict'
import { BULLET_CHARS, EDUCATION, englishOf, entersCv, entryTitle, isEducation, missingEnglish, titleOf, type Experience } from './record'

/** El formulario con la forma del payload: un error en `translations.en.highlights[1]` cae en su viñeta. */
export interface ExperienceForm {
  kind: string
  role: string
  slug: string
  orgId: number | null
  startedAt: string
  /** Vacío: sigue en curso («Actual»). */
  endedAt: string
  location: string
  summary: string
  story: string
  highlights: string[]
  techIds: number[]
  projectIds: number[]
  translations: { en: { role: string, summary: string, story: string, location: string, highlights: string[] } }
}

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : '')
const orNull = (text: string) => text.trim() || null

/** El inglés con tantas viñetas como el español: la posición es lo que las empareja. */
function alignedEnglish(es: readonly string[], en: readonly string[]): string[] {
  return es.map((_, i) => en[i] ?? '')
}

function bulletIssues(form: ExperienceForm): FieldIssue[] {
  const issues: FieldIssue[] = []
  form.highlights.forEach((item, i) => {
    const has = item.trim().length
    if (has > BULLET_CHARS) issues.push({ path: `highlights[${i}]`, message: t.validate.bullet(i + 1, BULLET_CHARS, has) })
  })
  form.translations.en.highlights.forEach((item, i) => {
    const has = item.trim().length
    const path = `translations.en.highlights[${i}]`
    if (has && !form.highlights[i]?.trim()) issues.push({ path, message: t.validate.bulletOrphan })
    else if (has > BULLET_CHARS) issues.push({ path, message: t.validate.bulletEn(i + 1, BULLET_CHARS, has) })
  })
  return issues
}

/**
 * La tesis y la formación suelen ser de la misma institución: en la lista y el editor se nombran por
 * su tipo y la institución («Tesis · Escuela Da Vinci»), así dos filas no se llaman igual.
 */
const KIND_FIRST = new Set(['THESIS', EDUCATION])
const byKind = (e: Experience) => KIND_FIRST.has(e.kind) && !!e.org?.name
const listTitle = (e: Experience) => (byKind(e) ? `${enumLabel('ExperienceKind', e.kind)} · ${e.org!.name}` : titleOf(e))

export const experienceModel: Model<Experience, ExperienceForm> = {
  key: 'experiencia',
  path: '/experience',
  schema: 'Experience',
  noun: { ...t.noun, gender: 'f' },
  routes: {
    list: { name: 'trayectoria' },
    record: id => ({ name: 'experiencia', params: { id: String(id) } }),
    create: { name: 'experiencia-nueva' },
  },
  detail: false,
  blank: () => ({
    kind: 'FREELANCE',
    role: '',
    slug: '',
    orgId: null,
    startedAt: '',
    endedAt: '',
    location: '',
    summary: '',
    story: '',
    highlights: [''],
    techIds: [],
    projectIds: [],
    translations: { en: { role: '', summary: '', story: '', location: '', highlights: [''] } },
  }),
  toForm: (e) => {
    const en = englishOf(e)
    return {
      kind: e.kind,
      role: e.role,
      slug: e.slug,
      orgId: e.orgId,
      startedAt: day(e.startedAt),
      endedAt: day(e.endedAt),
      location: e.location ?? '',
      summary: e.summary,
      story: e.story ?? '',
      highlights: [...e.highlights],
      techIds: e.techs.map(x => x.id),
      projectIds: e.projects.map(x => x.id),
      translations: {
        en: {
          role: en.role ?? '',
          summary: en.summary ?? '',
          story: en.story ?? '',
          location: en.location ?? '',
          highlights: alignedEnglish(e.highlights, en.highlights),
        },
      },
    }
  },
  toPayload: (form, e) => {
    const en = form.translations.en
    return {
      kind: form.kind,
      role: form.role,
      // La dirección viaja solo al crear (vacía, la arma el servidor con el cargo); después es fija.
      ...(e || !form.slug.trim() ? {} : { slug: form.slug.trim() }),
      orgId: form.orgId,
      startedAt: form.startedAt,
      endedAt: form.endedAt || null,
      location: orNull(form.location),
      summary: form.summary,
      story: orNull(form.story),
      highlights: form.highlights,
      // La formación entra al CV por fecha: no guarda puesto en la experiencia (no deja huecos en 1..n).
      cvOrder: form.kind === 'EDUCATION' ? null : e?.cvOrder ?? null,
      techIds: form.techIds,
      projectIds: form.projectIds,
      translations: {
        en: {
          role: orNull(en.role),
          summary: orNull(en.summary),
          story: orNull(en.story),
          location: orNull(en.location),
          highlights: alignedEnglish(form.highlights, en.highlights),
        },
      },
    }
  },
  validate: (form) => {
    const issues = bulletIssues(form)
    if (form.startedAt && form.endedAt && form.endedAt < form.startedAt) issues.push({ path: 'endedAt', message: t.validate.endBeforeStart })
    return issues
  },
  title: listTitle,
  formTitle: (form) => {
    const org = options.value?.orgs.find(o => o.id === form.orgId)?.name
    if (org && KIND_FIRST.has(form.kind)) return `${enumLabel('ExperienceKind', form.kind)} · ${org}`
    return entryTitle({ org, project: options.value?.projects.find(p => p.id === form.projectIds[0])?.title, role: form.role })
  },
  metaLine: e => [byKind(e) ? '' : enumLabel('ExperienceKind', e.kind), periodText(e.startedAt, e.endedAt)].filter(Boolean).join(' · '),
  aside: e => (missingEnglish(e).length ? t.missingEn : ''),
  status: e => (entersCv(e)
    ? { tone: 'ok', label: isEducation(e) ? t.status.education : t.status.inCv }
    : { tone: 'neutral', label: t.status.outside }),
  publicUrl: () => '/about',
  sections: [
    { id: 'esencial', label: t.sections.essentials, fields: ['kind', 'role', 'slug', 'orgId', 'startedAt', 'endedAt', 'location'] },
    { id: 'relato', label: t.sections.story, fields: ['summary', 'story'] },
    { id: 'cv', label: t.sections.cv, fields: ['highlights', 'projectIds', 'techIds', 'cvOrder'] },
  ],
  filters: [
    { id: 'todas', label: t.filters.all, test: () => true },
    { id: 'formacion', label: t.filters.education, test: e => e.kind === EDUCATION },
    { id: 'trabajo', label: t.filters.work, test: e => e.kind !== EDUCATION },
    { id: 'en-el-cv', label: t.filters.inCv, test: entersCv },
    { id: 'falta-ingles', label: t.filters.missingEn, test: e => missingEnglish(e).length > 0 },
  ],
  keywords: e => [e.slug, e.role, englishOf(e).role ?? '', e.location ?? ''].join(' '),
  slugEndpoint: id => `/experience/${id}/slug`,
  // La experiencia no tiene página propia (se lee en /about): no se muestra una dirección del sitio.
  slugPreview: () => null,
}
