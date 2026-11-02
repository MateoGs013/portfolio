/**
 * Una entrada de trayectoria tal como la devuelve GET /api/admin/experience y lo que se calcula de
 * ella sin preguntarle a nadie más: cómo se titula (como en el CV: la empresa, si no la primera obra,
 * si no el cargo), si entra al CV y en qué puesto, y qué textos tienen español sin su inglés.
 */
import type { WithEnglish } from '@shared/adminContracts'

export const EDUCATION = 'EDUCATION'

/** El idioma de la hoja del CV base. */
export type SheetLang = 'es' | 'en'
/** La cota del CV en una página A4 (server/src/admin/experience.ts). */
export const BULLETS_MAX = 3
export const BULLET_CHARS = 160

interface ExperienceEnglish {
  role: string | null
  summary: string | null
  story: string | null
  location: string | null
  highlights: string[]
}

export type Experience = WithEnglish<{
  id: number
  slug: string
  kind: string
  role: string
  startedAt: string
  endedAt: string | null
  summary: string
  story: string | null
  highlights: string[]
  location: string | null
  cvOrder: number | null
  orgId: number | null
  org: { id: number, name: string } | null
  techs: { id: number, name: string }[]
  projects: { id: number, title: string, slug: string }[]
}, ExperienceEnglish>

/** El inglés guardado, o una fila vacía si nunca se tradujo. */
export function englishOf(e: Experience): ExperienceEnglish {
  return e.translations.find(t => t.locale === 'en') ?? { role: null, summary: null, story: null, location: null, highlights: [] }
}

/** El nombre de la entrada, el mismo que encabeza su bloque en el CV. */
export function entryTitle(parts: { org: string | null | undefined, project: string | null | undefined, role: string }): string {
  return parts.org?.trim() || parts.project?.trim() || parts.role.trim()
}

export function titleOf(e: Experience): string {
  return entryTitle({ org: e.org?.name, project: e.projects[0]?.title, role: e.role })
}

export const isEducation = (e: Pick<Experience, 'kind'>) => e.kind === EDUCATION

/** Entra a la experiencia del CV (la formación va aparte y entra siempre). */
export const inCvOrder = (e: Pick<Experience, 'kind' | 'cvOrder'>) => !isEducation(e) && e.cvOrder !== null

export const entersCv = (e: Pick<Experience, 'kind' | 'cvOrder'>) => isEducation(e) || e.cvOrder !== null

/** Las entradas de trabajo del CV, en su orden. */
export function cvEntries<T extends Pick<Experience, 'kind' | 'cvOrder'>>(rows: readonly T[]): T[] {
  return rows.filter(inCvOrder).sort((a, b) => (a.cvOrder ?? 0) - (b.cvOrder ?? 0))
}

/** El puesto (1..n) de una entrada en la experiencia del CV, o null si no entra. */
export function cvPlace(rows: readonly Experience[], id: number): number | null {
  const index = cvEntries(rows).findIndex(e => e.id === id)
  return index >= 0 ? index + 1 : null
}

const filled = (text: string | null | undefined) => !!text?.trim()

/** Rutas del body con español sin inglés: `translations.en.role`, `translations.en.highlights[1]`. */
export function missingEnglish(e: Experience): string[] {
  const en = englishOf(e)
  const texts = (['role', 'summary', 'story', 'location'] as const)
    .filter(name => filled(e[name]) && !filled(en[name]))
    .map(name => `translations.en.${name}`)
  const bullets = e.highlights.flatMap((item, i) => (filled(item) && !filled(en.highlights[i]) ? [`translations.en.highlights[${i}]`] : []))
  return [...texts, ...bullets]
}
