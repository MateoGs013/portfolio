/**
 * El CV en texto plano para pegar en un formulario ATS (GET /api/admin/hunter/cv/:id/txt). Es el
 * mismo AdminCv que la hoja impresa, con los mismos rótulos (cvLabels) y el mismo orden de secciones:
 * sin marcado, una línea por dato y viñetas con guion.
 */
import type { AdminCv } from '../shared/hunterContracts.js'
import { cvLabels } from './hunterCv.js'

const upper = (s: string, lang: string) => s.toLocaleUpperCase(lang)

/** «https://www.linkedin.com/in/x/» → «linkedin.com/in/x». */
function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '')
}

function section(title: string, lines: string[], lang: string): string[] {
  return lines.length ? [upper(title, lang), ...lines, ''] : []
}

function when(period: string, location: string | null): string {
  return [period, location].filter(Boolean).join(' · ')
}

export function renderCvText(cv: AdminCv): string {
  const labels = cvLabels[cv.lang]
  const lang = cv.lang
  const contact = [cv.location, cv.email, ...[cv.portfolio, cv.linkedin, cv.github].map(u => (u ? shortUrl(u) : null))]
    .filter((v): v is string => Boolean(v))
    .join(' · ')

  // El nombre va tal cual (un ATS lo lee mejor así); los títulos de sección, en mayúsculas.
  const head = [cv.name, cv.title, contact || null].filter((v): v is string => Boolean(v))

  const skills = Object.entries(cv.skills)
    .filter(([, items]) => items.length)
    .map(([label, items]) => `${label}: ${items.join(', ')}`)

  const experience = cv.experience.flatMap((x, i) => [
    ...(i ? [''] : []),
    x.role && x.role !== x.title ? `${x.title} — ${x.role}` : x.title,
    when(x.period, x.location),
    ...x.bullets.map(b => `- ${b}`),
  ])

  const education = cv.education.flatMap((x, i) => [
    ...(i ? [''] : []),
    x.institution ? `${x.institution} — ${x.degree}` : x.degree,
    when(x.period, x.location),
    ...(x.details ? [x.details] : []),
  ])

  const extra = [
    cv.languages.length ? `${labels.languages}: ${cv.languages.join(' · ')}` : null,
    cv.methodologies ? `${labels.methodologies}: ${cv.methodologies}` : null,
  ].filter((v): v is string => Boolean(v))

  return [
    ...head,
    '',
    ...section(labels.summary, cv.summary ? [cv.summary] : [], lang),
    ...section(labels.skills, skills, lang),
    ...section(labels.experience, experience, lang),
    ...section(labels.education, education, lang),
    ...section(labels.extra, extra, lang),
  ].join('\n').trimEnd() + '\n'
}
