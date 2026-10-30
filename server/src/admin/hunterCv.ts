/**
 * CV Harvard ATS de respaldo del Job Hunter. Es el mismo CvDocument que el sitio público
 * (`composeCv`, server/src/content/cv.ts) mapeado al contrato que lee AdmJobHunter.js y que
 * también devuelve Eros. La adaptación a la vacante solo toca el orden y el resumen: el contenido
 * es el de la base.
 */
import type { CvDocument, CvPeriod } from '../content/cv.js'
import type { Lang } from '../content/lang.js'
import { byAffinity, jobLang, jobText, overlap, techMatches, type JobText } from './hunterMatch.js'
import { loadCv } from './profile.js'

export interface AdminCvEntry {
  title: string
  role: string
  period: string
  location: string
  bullets: string[]
}

export interface AdminCvEducation {
  degree: string
  institution: string | null
  period: string
  location: string | null
  details: string | null
}

/** Contrato del CV adaptado (el mismo que responde Eros en POST /api/cv/:id). */
export interface AdminCv {
  lang: Lang
  name: string | null
  title: string | null
  location: string | null
  email: string | null
  portfolio: string | null
  github: string | null
  linkedin: string | null
  summary: string | null
  /** Rótulo de categoría → tecnologías, las que nombra la vacante primero. */
  skills: Record<string, string[]>
  experience: AdminCvEntry[]
  education: AdminCvEducation[]
  languages: string[]
  methodologies: string | null
}

/** Rótulos de interfaz del CV de respaldo, en el idioma de la vacante. */
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

/** Mapea el CvDocument al contrato del admin, ordenado por afinidad con la vacante. */
export function tailorCv(cv: CvDocument, job: JobText): AdminCv {
  const lang = cv.lang
  const labels = cvLabels[lang]
  const allTechs = cv.skills.flatMap(group => group.items)
  const matched = techMatches(allTechs, jobText(job))

  const skills = byAffinity(cv.skills, group => overlap(group.items, matched))
    .map(group => [
      labels.categories[group.category],
      byAffinity(group.items, item => (matched.includes(item) ? 1 : 0)),
    ] as const)

  const focus = matched.length ? `${labels.focus}: ${matched.slice(0, 6).join(', ')}.` : null
  const summary = [cv.summary, focus].filter(Boolean).join(' ') || null

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
    skills: Object.fromEntries(skills.map(([label, items]) => [label, items])),
    // Las entradas quedan en el orden curado (cvOrder, cronología inversa): un CV ATS con la cronología
    // rota se lee como error. La adaptación toca habilidades y resumen, no el orden de la trayectoria.
    experience: cv.experience.map(e => ({
      title: e.title,
      role: e.role,
      period: formatPeriod(e.period, lang),
      location: e.location ?? labels.remote,
      bullets: e.highlights,
    })),
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

/** POST /cv/:id de respaldo: el CV de la base, en el idioma de la vacante. */
export async function generateCvHeuristic(job: JobText): Promise<{ data: AdminCv }> {
  return { data: tailorCv(await loadCv(jobLang(job)), job) }
}
