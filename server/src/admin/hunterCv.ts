/**
 * CV Harvard ATS del Job Hunter. Es siempre el mismo CvDocument que el sitio público (`composeCv`,
 * server/src/content/cv.ts) pasado al contrato del admin (AdminCv). La adaptación a una vacante solo
 * cambia el orden (categorías, tecnologías, entradas y viñetas) y suma al resumen las tecnologías
 * que la vacante nombra: el contenido es el de la base. Las pistas vienen de Eros (erosHints.ts) o,
 * sin Eros, de la propia vacante (jobHints).
 */
import type { TechCategory } from '../../generated/prisma/enums.js'
import type { CvDocument, CvPeriod } from '../content/cv.js'
import type { Lang } from '../content/lang.js'
import type { AdminCv, CvAdaptation, CvDiscard } from '../shared/hunterContracts.js'
import { byAffinity, jobText, overlap, techMatches, type JobText } from './hunterMatch.js'

export type { AdminCv, AdminCvEducation, AdminCvEntry, CvAdaptation } from '../shared/hunterContracts.js'

/** Rótulos de interfaz del CV, en el idioma de la vacante. */
export const cvLabels = {
  es: {
    summary: 'Perfil profesional',
    skills: 'Habilidades técnicas',
    experience: 'Experiencia',
    education: 'Educación',
    extra: 'Idiomas y metodología',
    languages: 'Idiomas',
    methodologies: 'Metodología',
    focus: 'Stack para esta búsqueda',
    remote: 'Remoto',
    present: 'Actualidad',
    categories: {
      LANGUAGE: 'Lenguajes', FRAMEWORK: 'Frameworks', MOTION: 'Animación', GRAPHICS: 'Gráficos',
      BACKEND: 'Backend', DATA: 'Datos', TOOLING: 'Herramientas', DESIGN: 'Diseño',
    },
  },
  en: {
    summary: 'Professional Summary',
    skills: 'Technical Skills',
    experience: 'Experience',
    education: 'Education',
    extra: 'Languages & Methodology',
    languages: 'Languages',
    methodologies: 'Methodology',
    focus: 'Stack for this role',
    remote: 'Remote',
    present: 'Present',
    categories: {
      LANGUAGE: 'Languages', FRAMEWORK: 'Frameworks', MOTION: 'Motion', GRAPHICS: 'Graphics',
      BACKEND: 'Backend', DATA: 'Data', TOOLING: 'Tooling', DESIGN: 'Design',
    },
  },
} as const satisfies Record<Lang, unknown>

const locales: Record<Lang, string> = { es: 'es-AR', en: 'en-US' }

function formatDate(date: string, lang: Lang, withMonth: boolean): string {
  return new Intl.DateTimeFormat(locales[lang], {
    ...(withMonth ? { month: 'short' } : {}),
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

/** «mar 2026 – jul 2026» en experiencia, «2017 – 2023» en formación; sin fin, «Actualidad». */
export function formatPeriod(period: CvPeriod, lang: Lang, withMonth = true): string {
  const start = formatDate(period.start, lang, withMonth)
  const end = period.end ? formatDate(period.end, lang, withMonth) : cvLabels[lang].present
  return start === end ? start : `${start} – ${end}`
}

/**
 * Pistas de adaptación, ya llevadas a la base: cada valor existe en el CvDocument. Dan el orden; lo
 * que no nombran queda después, en el orden de la base. Nunca suman contenido.
 */
export interface CvHints {
  categories: TechCategory[]
  /** Nombres de Tech de la base, los prioritarios primero. */
  techs: string[]
  /** Slugs de las entradas de experiencia del CV base. */
  entries: string[]
  /** Slug de la entrada → índices de sus highlights, en orden. */
  bullets: Record<string, number[]>
  summaryProposal: string | null
  discarded: CvDiscard[]
}

export const noHints: CvHints = { categories: [], techs: [], entries: [], bullets: {}, summaryProposal: null, discarded: [] }

/** Los que tienen lugar en `rank` primero (en ese orden), después el resto como estaba. */
function ranked<T>(items: readonly T[], rank: (item: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index, rank: rank(item) }))
    .sort((a, b) => (a.rank < 0 ? Infinity : a.rank) - (b.rank < 0 ? Infinity : b.rank) || a.index - b.index)
    .map(entry => entry.item)
}

/** Sin Eros: las categorías con más tecnologías de la vacante primero y esas tecnologías adelante. */
export function jobHints(cv: CvDocument, job: JobText): CvHints {
  const matched = techMatches(cv.skills.flatMap(g => g.items), jobText(job))
  const categories = byAffinity(cv.skills, g => overlap(g.items, matched))
    .filter(g => overlap(g.items, matched) > 0)
    .map(g => g.category)
  return { ...noHints, categories, techs: matched }
}

/** El CV de la base en el contrato del admin, con el orden de `hints` y el resumen que corresponda. */
function toAdminCv(cv: CvDocument, hints: CvHints, summary: string | null): AdminCv {
  const lang = cv.lang
  const labels = cvLabels[lang]
  const groups = ranked(cv.skills, g => hints.categories.indexOf(g.category))
  const entries = ranked(cv.experience, e => hints.entries.indexOf(e.slug))

  return {
    lang,
    name: cv.header.name,
    title: cv.header.role,
    location: cv.header.location,
    email: cv.header.email,
    portfolio: cv.header.portfolio,
    github: cv.header.github,
    linkedin: cv.header.linkedin,
    summary,
    skills: Object.fromEntries(groups.map(g => [labels.categories[g.category], ranked(g.items, i => hints.techs.indexOf(i))])),
    experience: entries.map((e) => {
      const order = hints.bullets[e.slug] ?? []
      const bullets = ranked(e.highlights.map((text, index) => ({ text, index })), b => order.indexOf(b.index))
      return {
        title: e.title,
        role: e.role,
        period: formatPeriod(e.period, lang),
        location: e.location ?? labels.remote,
        bullets: bullets.map(b => b.text),
      }
    }),
    education: cv.education.map(e => ({
      degree: e.degree,
      institution: e.org,
      period: formatPeriod(e.period, lang, false),
      location: e.location,
      details: e.highlights.length ? e.highlights.join(' ') : null,
    })),
    languages: cv.languages,
    methodologies: cv.methodologies,
  }
}

/** El CV base, sin adaptar: lo que muestra Trayectoria (/cv-base/html). */
export function baseCv(cv: CvDocument): AdminCv {
  return toAdminCv(cv, noHints, cv.summary)
}

/**
 * El CV para una vacante. El resumen es el de la base más las tecnologías que la vacante nombra;
 * con `useSummaryProposal`, el que propone Eros (si lo hay).
 */
export function tailorCv(cv: CvDocument, job: JobText, hints: CvHints, useSummaryProposal = false): { cv: AdminCv, adaptation: CvAdaptation, usesProposal: boolean } {
  const matched = techMatches(cv.skills.flatMap(g => g.items), jobText(job))
  const focus = matched.length ? `${cvLabels[cv.lang].focus}: ${matched.slice(0, 6).join(', ')}.` : null
  const usesProposal = useSummaryProposal && hints.summaryProposal !== null
  const summary = usesProposal ? hints.summaryProposal : [cv.summary, focus].filter(Boolean).join(' ') || null
  const titles = new Map(cv.experience.map(e => [e.slug, e.title]))

  return {
    cv: toAdminCv(cv, hints, summary),
    usesProposal,
    adaptation: {
      categories: hints.categories,
      entries: hints.entries.map(slug => titles.get(slug) ?? slug),
      bullets: Object.values(hints.bullets).reduce((sum, order) => sum + order.length, 0),
      discarded: hints.discarded,
    },
  }
}
