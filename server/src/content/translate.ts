/**
 * Resolución del idioma y de los tipos que viajan como texto. `present` usa estas piezas para que
 * un registro de la base y el mismo registro leído del snapshot publiquen exactamente lo mismo.
 */
import type { Prisma } from '../../generated/prisma/client.js'
import { defaultLang, type Lang } from './lang.js'
import { isVisible } from './visibility.js'

type Translation = { locale: string }

/** Un valor traducible está cargado si es texto no vacío o una lista con algo. */
function hasValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return false
}

/**
 * Valores de `fields` en `lang`. Lo que no tiene traducción cae al español y se lista en
 * `untranslated` (solo si en español hay algo que traducir). Nunca expone el arreglo translations.
 */
export function translate<R, K extends keyof R & string>(
  record: R,
  translations: readonly Translation[],
  fields: readonly K[],
  lang: Lang,
): { values: Pick<R, K>, untranslated: K[] } {
  const values = {} as Pick<R, K>
  const untranslated: K[] = []
  const other = lang === defaultLang ? undefined : translations.find(t => t.locale === lang)
  for (const field of fields) {
    const value = (other as Partial<Record<K, unknown>> | undefined)?.[field]
    if (other && hasValue(value)) {
      values[field] = value as R[K]
      continue
    }
    values[field] = record[field]
    if (lang !== defaultLang && hasValue(record[field])) untranslated.push(field)
  }
  return { values, untranslated }
}

/** Fecha y hora en ISO (los Date de Prisma y el texto del snapshot dan lo mismo). */
export function toIso(value: Date | string): string
export function toIso(value: Date | string | null): string | null
export function toIso(value: Date | string | null): string | null {
  return value === null ? null : new Date(value).toISOString()
}

/** Columnas `@db.Date`: solo el día, `YYYY-MM-DD`. */
export function toDay(value: Date | string): string
export function toDay(value: Date | string | null): string | null
export function toDay(value: Date | string | null): string | null {
  return value === null ? null : new Date(value).toISOString().slice(0, 10)
}

/** Decimal de Prisma (llega como objeto o como texto '0.8000') a número. */
export function toNumber(value: Prisma.Decimal | string | null): number | null {
  if (value === null) return null
  const n = Number(value.toString())
  return Number.isFinite(n) ? n : null
}

type ProjectStub = {
  slug: string
  title: string
  year: number
  publishedAt: Date | string | null
  translations: readonly ({ locale: string, title: string | null })[]
}

/** Obra ligada desde otra colección: solo si es visible, con su título en `lang`. */
export function presentProjectStubs(stubs: readonly ProjectStub[], lang: Lang) {
  return stubs.filter(isVisible).map((p) => {
    const { values, untranslated } = translate(p, p.translations, ['title'], lang)
    return { slug: p.slug, title: values.title, year: p.year, untranslated }
  })
}

type ExperienceStub = {
  slug: string
  kind: string
  role: string
  startedAt?: Date | string
  endedAt?: Date | string | null
  translations: readonly ({ locale: string, role: string | null })[]
}

/** Experiencia ligada desde otra colección, con su rol en `lang`. */
export function presentExperienceStubs(stubs: readonly ExperienceStub[], lang: Lang) {
  return stubs.map((e) => {
    const { values, untranslated } = translate(e, e.translations, ['role'], lang)
    return {
      slug: e.slug,
      kind: e.kind,
      role: values.role,
      ...(e.startedAt === undefined ? {} : { startedAt: toDay(e.startedAt) }),
      ...(e.endedAt === undefined ? {} : { endedAt: toDay(e.endedAt) }),
      untranslated,
    }
  })
}
