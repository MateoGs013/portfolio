/**
 * Lectura de una vacante para los respaldos del Job Hunter: en qué idioma está escrita y qué
 * tecnologías de la base menciona. No sabe nada del candidato: compara texto contra nombres.
 */
import type { Lang } from '../content/lang.js'

export interface JobText {
  title: string
  company: string
  description: string | null
  tags: string[]
}

/** Todo el texto de la vacante, en minúscula. */
export function jobText(job: JobText): string {
  return `${job.title} ${job.description ?? ''} ${job.tags.join(' ')} ${job.company}`.toLowerCase()
}

/** Palabras que en una vacante solo aparecen si está escrita en español. */
const spanishMarkers = /\b(desarrollador|desarrolladora|experiencia|buscamos|equipo|trabajo|requisitos|conocimientos|empresa)\b/

/** El CV y el pitch de respaldo salen en el idioma de la vacante; ante la duda, en inglés. */
export function jobLang(job: JobText): Lang {
  return spanishMarkers.test(jobText(job)) ? 'es' : 'en'
}

/** Nombres que también son palabras comunes en inglés: solo cuentan con su sufijo (`next.js`). */
const ambiguous = new Set(['next'])

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Variantes con las que una vacante nombra una tecnología: «Vue 3» → vue, «Node.js» → node, nodejs. */
function variants(name: string): string[] {
  const full = name.toLowerCase().trim()
  const base = full.replace(/\s+\d+(\.\d+)*$/, '').replace(/\s+css$/, '')
  const out = new Set([full, base])
  if (base.endsWith('.js')) {
    const bare = base.slice(0, -3)
    out.add(`${bare}js`)
    if (!ambiguous.has(bare)) out.add(bare)
  }
  return [...out].filter(v => v.length > 1)
}

function mentions(text: string, name: string): boolean {
  return variants(name).some(v => new RegExp(`(^|[^a-z0-9])${escapeRegExp(v)}($|[^a-z0-9])`).test(text))
}

/** Las tecnologías de `names` que la vacante nombra, en el orden de `names` y sin repetir. */
export function techMatches(names: readonly string[], text: string): string[] {
  return [...new Set(names)].filter(name => mentions(text, name))
}

/** Cuántos de `names` están en `matched`: ordena experiencia, categorías y obras por afinidad. */
export function overlap(names: readonly string[], matched: readonly string[]): number {
  return names.filter(n => matched.includes(n)).length
}

/** Ordena por afinidad descendente sin perder el orden original entre empates. */
export function byAffinity<T>(items: readonly T[], score: (item: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index, score: score(item) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(entry => entry.item)
}
