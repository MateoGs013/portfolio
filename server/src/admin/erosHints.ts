/**
 * Pistas de adaptación desde el CV que arma Eros. De ese CV no se copia ningún texto: cada campo se
 * empareja con la base y solo queda el orden. Lo que no existe en la base se descarta y se informa.
 *
 * - Claves de `skills` → TechCategory (rótulos del CV y de los enums, en español y en inglés).
 * - Tecnologías → Tech.name de la base por nombre normalizado.
 * - `experience[]` → entradas del CV base por slug, título o rol normalizados.
 * - Viñetas → índice en los highlights de su entrada por texto normalizado.
 * - `summary` → summaryProposal: el admin la muestra al lado y el CV la usa solo si se acepta.
 */
import type { TechCategory } from '../../generated/prisma/enums.js'
import type { CvDocument } from '../content/cv.js'
import { techCategoryLabels } from '../shared/labels.js'
import type { CvDiscard } from '../shared/hunterContracts.js'
import { list, text, unwrap } from './erosContract.js'
import { cvLabels, type CvHints } from './hunterCv.js'

/** Minúsculas, sin acentos ni puntuación ni espacios: «Node.js» y «NodeJS» son lo mismo. */
export function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export interface ErosCvEntry {
  title: string
  role: string | null
  slug: string | null
  bullets: string[]
}

/** Lo que se lee del CV de Eros (POST api/cv/:id). El resto de sus campos no se usa. */
export interface ErosCv {
  summary: string | null
  skills: { label: string, names: string[] }[]
  experience: ErosCvEntry[]
}

type Obj = Record<string, unknown>
const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value)

function skillsOf(raw: unknown): ErosCv['skills'] {
  if (isObj(raw)) return Object.entries(raw).map(([label, names]) => ({ label, names: list(names) }))
  if (!Array.isArray(raw)) return []
  return raw.flatMap((group) => {
    if (!isObj(group)) return []
    const label = text(group['category']) ?? text(group['label'])
    return label ? [{ label, names: list(group['items'] ?? group['names']) }] : []
  })
}

/** El CV de Eros dentro de la respuesta (suelto, en `data` o en `cv`); null si no trae nada usable. */
export function normalizeErosCv(payload: unknown): ErosCv | null {
  const outer = unwrap(payload)
  const o = isObj(outer['cv']) ? outer['cv'] : outer
  const experience = (Array.isArray(o['experience']) ? o['experience'] : []).flatMap((entry): ErosCvEntry[] => {
    if (!isObj(entry)) return []
    const title = text(entry['title']) ?? text(entry['company']) ?? text(entry['role'])
    return title ? [{ title, role: text(entry['role']), slug: text(entry['slug']), bullets: list(entry['bullets'] ?? entry['highlights']) }] : []
  })
  const cv: ErosCv = { summary: text(o['summary']), skills: skillsOf(o['skills']), experience }
  return cv.summary || cv.skills.length || cv.experience.length ? cv : null
}

/** Rótulo de categoría (del CV, del enum o el valor del enum, en los dos idiomas) → TechCategory. */
const categoryByName: ReadonlyMap<string, TechCategory> = (() => {
  const map = new Map<string, TechCategory>()
  for (const [category, label] of Object.entries(techCategoryLabels) as [TechCategory, { es: string, en: string }][]) {
    for (const name of [category, label.es, label.en, cvLabels.es.categories[category], cvLabels.en.categories[category]]) {
      map.set(normalizeName(name), category)
    }
  }
  return map
})()

export function extractHints(eros: ErosCv, base: CvDocument): CvHints {
  const discarded: CvDiscard[] = []
  const inBase = new Set(base.skills.map(g => g.category))
  const techByName = new Map(base.skills.flatMap(g => g.items).map(name => [normalizeName(name), name]))

  const categories: TechCategory[] = []
  const techs: string[] = []
  for (const group of eros.skills) {
    const category = categoryByName.get(normalizeName(group.label))
    if (category && inBase.has(category)) {
      if (!categories.includes(category)) categories.push(category)
    }
    else {
      discarded.push({ kind: 'category', value: group.label })
    }
    for (const name of group.names) {
      const tech = techByName.get(normalizeName(name))
      if (!tech) discarded.push({ kind: 'tech', value: name })
      else if (!techs.includes(tech)) techs.push(tech)
    }
  }

  // Rol, después título y después slug: ante un choque gana la clave más precisa.
  const keys = new Map<string, string>()
  for (const field of ['role', 'title', 'slug'] as const) {
    for (const e of base.experience) keys.set(normalizeName(e[field]), e.slug)
  }
  const entries: string[] = []
  const bullets: Record<string, number[]> = {}
  for (const entry of eros.experience) {
    const slug = [entry.slug, entry.title, entry.role]
      .map(key => (key ? keys.get(normalizeName(key)) : undefined))
      .find(Boolean)
    const target = slug ? base.experience.find(e => e.slug === slug) : undefined
    if (!target || entries.includes(target.slug)) {
      if (!target) discarded.push({ kind: 'entry', value: entry.title })
      continue
    }
    entries.push(target.slug)
    const highlights = target.highlights.map(normalizeName)
    const order: number[] = []
    for (const bullet of entry.bullets) {
      const index = highlights.indexOf(normalizeName(bullet))
      if (index === -1) discarded.push({ kind: 'bullet', value: bullet })
      else if (!order.includes(index)) order.push(index)
    }
    if (order.length) bullets[target.slug] = order
  }

  return { categories, techs, entries, bullets, summaryProposal: eros.summary, discarded }
}
