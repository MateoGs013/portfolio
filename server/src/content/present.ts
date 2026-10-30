/**
 * Forma pública de cada registro. Con lang 'en' cada campo traducible usa su valor en inglés y cae
 * al español; `untranslated` lista lo que quedó en español. Nunca se expone `translations`, ni ids
 * internos, ni la columna vieja de métricas. Los Decimal salen como número y las fechas como ISO.
 */
import type { ArticleRecord } from '../queries/articles.js'
import type { DocRecord } from '../queries/docs.js'
import type { ExperienceRecord } from '../queries/experience.js'
import type { OrgRecord } from '../queries/orgs.js'
import type { ProjectRecord } from '../queries/projects.js'
import type { TechRecord } from '../queries/stack.js'
import { docFieldsOf, hasDocValue, untranslatedFields } from './docFields.js'
import type { Lang } from './lang.js'
import { visibleUsage } from './matches.js'
import type { Wire } from './snapshot.js'
import { presentExperienceStubs, presentProjectStubs, toDay, toIso, toNumber, translate } from './translate.js'

type Project = Wire<ProjectRecord>
type Media = Project['media'][number]

export function presentMedia(m: Media, lang: Lang) {
  const { values, untranslated } = translate(m, m.translations, ['alt', 'caption'], lang)
  return {
    kind: m.kind,
    role: m.role,
    src: m.src,
    srcWebm: m.srcWebm,
    poster: m.poster,
    ...values,
    tint: m.tint,
    viewport: m.viewport,
    width: m.width,
    height: m.height,
    order: m.order,
    bytes: m.bytes,
    untranslated,
  }
}

export function presentStep(s: Project['steps'][number], lang: Lang) {
  const { values, untranslated } = translate(s, s.translations, ['title', 'body'], lang)
  return { order: s.order, ...values, media: s.media ? presentMedia(s.media, lang) : null, untranslated }
}

export function presentLink(l: Project['links'][number], lang: Lang) {
  const { values, untranslated } = translate(l, l.translations, ['label'], lang)
  return { ...values, url: l.url, untranslated }
}

export function presentMetric(m: Project['metrics'][number]) {
  return {
    key: m.key,
    value: toNumber(m.value),
    items: m.items,
    unit: m.unit,
    label: m.label,
    source: m.source,
    measuredAt: toDay(m.measuredAt),
    order: m.order,
  }
}

/** Lo que comparten la lista y el detalle de una obra. */
function projectBase(p: Project, lang: Lang, fields: readonly ('title' | 'role' | 'summary' | 'brief' | 'outcome')[]) {
  const { values, untranslated } = translate(p, p.translations, fields, lang)
  return {
    slug: p.slug,
    ...values,
    year: p.year,
    status: p.status,
    featured: p.featured,
    url: p.url,
    repo: p.repo,
    sortOrder: p.sortOrder,
    publishedAt: toIso(p.publishedAt),
    updatedAt: toIso(p.updatedAt),
    org: p.org,
    metrics: p.metrics.map(presentMetric),
    untranslated,
  }
}

/** Fila de la lista: portadas (imagen o video), org, techs y cuánta media tiene el caso. */
export function presentProjectSummary(p: Project, lang: Lang) {
  return {
    ...projectBase(p, lang, ['title', 'role', 'summary']),
    techs: p.techs.map(t => ({ slug: t.slug, name: t.name, category: t.category })),
    media: p.media.filter(m => m.role === 'COVER').map(m => presentMedia(m, lang)),
    _count: { media: p.media.length, steps: p.steps.length },
  }
}

/** Caso completo: portada y galería en orden, pasos, enlaces, métricas y techs para «Asomar». */
export function presentProject(p: Project, lang: Lang) {
  return {
    ...projectBase(p, lang, ['title', 'role', 'summary', 'brief', 'outcome']),
    createdAt: toIso(p.createdAt),
    media: p.media.map(m => presentMedia(m, lang)),
    steps: p.steps.map(s => presentStep(s, lang)),
    links: p.links.map(l => presentLink(l, lang)),
    techs: p.techs.map((t) => {
      const { values, untranslated } = translate(t, t.translations, ['note'], lang)
      return {
        slug: t.slug,
        name: t.name,
        category: t.category,
        since: t.since,
        ...values,
        projects: presentProjectStubs(t.projects, lang),
        untranslated,
      }
    }),
    experiences: presentExperienceStubs(p.experiences, lang),
    _count: { media: p.media.length, steps: p.steps.length },
  }
}

export function presentTech(t: Wire<TechRecord>, lang: Lang) {
  const { values, untranslated } = translate(t, t.translations, ['note'], lang)
  const projects = presentProjectStubs(t.projects, lang)
  return {
    slug: t.slug,
    name: t.name,
    category: t.category,
    since: t.since,
    ...values,
    color: t.color,
    projects,
    experiences: presentExperienceStubs(t.experiences, lang),
    _count: { projects: visibleUsage(t), experiences: t.experiences.length },
    untranslated,
  }
}

const experienceFields = ['role', 'summary', 'story', 'highlights', 'location'] as const

export function presentExperience(e: Wire<ExperienceRecord>, lang: Lang) {
  const { values, untranslated } = translate(e, e.translations, experienceFields, lang)
  return {
    slug: e.slug,
    kind: e.kind,
    ...values,
    startedAt: toDay(e.startedAt),
    endedAt: toDay(e.endedAt),
    cvOrder: e.cvOrder,
    org: e.org,
    techs: e.techs,
    projects: presentProjectStubs(e.projects, lang),
    untranslated,
  }
}

export function presentOrg(o: Wire<OrgRecord>, lang: Lang) {
  const projects = presentProjectStubs(o.projects, lang)
  return {
    slug: o.slug,
    name: o.name,
    url: o.url,
    city: o.city,
    projects,
    experiences: presentExperienceStubs(o.experiences, lang),
    _count: { projects: projects.length, experiences: o.experiences.length },
    untranslated: [] as string[],
  }
}

/** Documento con cada `value` ya resuelto en `lang` (el `en` no viaja). */
export function presentDoc(d: Wire<DocRecord>, lang: Lang) {
  const all = docFieldsOf(d.fields)
  const fields = all.map(({ en, ...field }) => (lang !== 'es' && hasDocValue(en) ? { ...field, value: en } : field))
  const untranslated = untranslatedFields(all, all.map(f => f.name), lang)
  return { key: d.key, title: d.title, fields, updatedAt: toIso(d.updatedAt), untranslated }
}

type Article = Wire<ArticleRecord>

function articleBase(a: Article, lang: Lang, fields: readonly ('title' | 'summary' | 'content')[]) {
  const { values, untranslated } = translate(a, a.translations, fields, lang)
  const project = a.project ? presentProjectStubs([a.project], lang)[0] ?? null : null
  return {
    slug: a.slug,
    ...values,
    readingTimeMin: a.readingTimeMin,
    status: a.status,
    featured: a.featured,
    coverImage: a.coverImage,
    canonicalUrl: a.canonicalUrl,
    sortOrder: a.sortOrder,
    publishedAt: toIso(a.publishedAt),
    updatedAt: toIso(a.updatedAt),
    techs: a.techs,
    project,
    untranslated,
  }
}

/** Fila del blog: sin el cuerpo en markdown. */
export function presentArticleSummary(a: Article, lang: Lang) {
  return articleBase(a, lang, ['title', 'summary'])
}

export function presentArticle(a: Article, lang: Lang) {
  return { ...articleBase(a, lang, ['title', 'summary', 'content']), createdAt: toIso(a.createdAt) }
}

export type PublicProjectSummary = ReturnType<typeof presentProjectSummary>
export type PublicProject = ReturnType<typeof presentProject>
export type PublicTech = ReturnType<typeof presentTech>
export type PublicExperience = ReturnType<typeof presentExperience>
export type PublicOrg = ReturnType<typeof presentOrg>
export type PublicDoc = ReturnType<typeof presentDoc>
export type PublicArticleSummary = ReturnType<typeof presentArticleSummary>
export type PublicArticle = ReturnType<typeof presentArticle>
