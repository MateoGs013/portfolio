/**
 * Coerción del body del admin, con los errores en español y ubicados en su campo.
 *
 * Fuera de `validate` cada función falla en el primer problema (400 con ese campo). Dentro de
 * `validate(modelo, body, armar)` juntan todos los problemas y `validate` responde una sola vez:
 * `400 { error, code: 'invalid', errors: [{ path, message }] }`, con rutas anidadas como
 * `links[0].url` o `translations.en.title`. Los rótulos y los topes salen de shared/adminSchema.ts.
 */
import { describe, describeAny, isModelName, translationModel, type ModelName } from '../shared/adminSchema.js'
import { enumLabels, labelOf, type EnumName } from '../shared/labels.js'
import { SLUG_MAX, SLUG_PATTERN, slugify } from '../shared/slug.js'
import type { FieldIssue } from '../shared/adminContracts.js'
import { collecting, describeIssues, fail, issue, placeOf, register } from './issues.js'

export { HttpError, ValidationError, fail, issue } from './issues.js'

type Body = Record<string, unknown>

const TEXT_MAX = 4000

/** Rótulo del campo para el mensaje: el de su modelo o, sin modelo, el primero que lo tenga. */
export function labelFor(b: Body, k: string): string {
  const model = placeOf(b)?.model
  const found = model ? describe(model, k) : describeAny(k)
  return `«${(found ?? describeAny(k))?.label ?? k}»`
}

function maxFor(b: Body, k: string, explicit?: number): number {
  if (explicit !== undefined) return explicit
  const model = placeOf(b)?.model
  return (model ? describe(model, k)?.max : null) ?? TEXT_MAX
}

/**
 * Corre `build` juntando todos los fallos de validación del body. Si hubo alguno, responde 400 con la
 * lista completa; si no, devuelve lo que armó `build`. `build` es sincrónico: no consulta la base.
 */
export function validate<T>(model: ModelName, body: unknown, build: () => T): T {
  register(body, model, childModel)
  const { issues, result, error } = collecting(build)
  if (issues.length) throw describeIssues(issues)
  if (error !== undefined) throw error
  return result as T
}

/** Modelo de un objeto anidado: una relación apunta a su modelo; `translations` a la tabla de inglés. */
function childModel(model: ModelName | null, key: string): ModelName | null {
  if (!model) return null
  if (key === 'translations') return translationModel(model) ?? model
  const target = describe(model, key)?.target
  return target && isModelName(target) ? target : model
}

export function str(b: Body, k: string, maxLen?: number): string {
  const v = b[k]
  if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return fail(b, k, `Completá ${labelFor(b, k)}.`, '')
  if (typeof v !== 'string') return fail(b, k, `${labelFor(b, k)} tiene que ser texto.`, '')
  return within(b, k, v.trim(), maxFor(b, k, maxLen))
}

function within(b: Body, k: string, text: string, max: number): string {
  if (text.length > max) return fail(b, k, `${labelFor(b, k)} admite hasta ${max} caracteres (tiene ${text.length}).`, text)
  return text
}

export function slug(b: Body, k: string): string {
  const v = str(b, k, SLUG_MAX)
  if (v && !SLUG_PATTERN.test(v)) {
    return fail(b, k, `${labelFor(b, k)} lleva solo minúsculas sin acentos, números y guiones, como mi-obra.`, v)
  }
  return v
}

/** Dirección nueva: la que llega o, si no llega, la que sale de `from` (el título o el nombre). */
export function newSlug(b: Body, k: string, from: string): string {
  if (typeof b[k] === 'string' && b[k].trim() !== '') return slug(b, k)
  const derived = slugify(from)
  if (!derived && from) return fail(b, k, `No pudimos armar ${labelFor(b, k)} con ese texto: escribila a mano.`, '')
  return derived
}

/**
 * Las direcciones no cambian al guardar: un PUT con otra dirección es un error. Se cambia con la
 * acción explícita (PATCH …/:id/slug), que avisa que los enlaces viejos dejan de andar.
 */
export function guardSlugChange(actual: string, entrante: unknown, path = 'slug'): void {
  if (entrante === undefined || entrante === null || entrante === '') return
  if (typeof entrante === 'string' && entrante.trim() === actual) return
  issue({ path, message: 'La dirección se cambia con «Cambiar dirección»: avisa que los enlaces viejos dejan de andar.' })
}

export function optStr(b: Body, k: string, maxLen?: number): string | null {
  const v = b[k]
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') return fail(b, k, `${labelFor(b, k)} tiene que ser texto.`, null)
  const trimmed = v.trim()
  if (trimmed === '') return null
  return within(b, k, trimmed, maxFor(b, k, maxLen))
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

/** `ejemplo.com/ruta` → `https://ejemplo.com/ruta`. Lo que ya trae protocolo queda igual. */
export function withProtocol(v: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return v
  const bare = v.replace(/^\/\//, '')
  return /^[^\s/@]+\.[^\s/@]{2,}(?:[/?#]\S*)?$/.test(bare) ? `https://${bare}` : v
}

function checkUrl(b: Body, k: string, v: string): string {
  const full = withProtocol(v)
  let parsed: URL
  try {
    parsed = new URL(full)
  }
  catch {
    return fail(b, k, `${labelFor(b, k)} tiene que ser una dirección web, como https://ejemplo.com.`, full)
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return fail(b, k, `${labelFor(b, k)} tiene que empezar con http, https o mailto.`, full)
  return full
}

export function url(b: Body, k: string, maxLen = 2048): string {
  const v = str(b, k, maxLen)
  return v ? checkUrl(b, k, v) : v
}

export function optUrl(b: Body, k: string, maxLen = 2048): string | null {
  const v = optStr(b, k, maxLen)
  return v ? checkUrl(b, k, v) : null
}

function range(min: number, max: number): string {
  const unbounded = min <= -2147483648 && max >= 2147483647
  return unbounded ? 'un número entero' : `un número entero entre ${min} y ${max}`
}

export function int(b: Body, k: string, min = -2147483648, max = 2147483647): number {
  const v = b[k]
  if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return fail(b, k, `Completá ${labelFor(b, k)}.`, 0)
  const n = typeof v === 'string' ? Number(v.trim()) : v
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) return fail(b, k, `${labelFor(b, k)} tiene que ser ${range(min, max)}.`, 0)
  return n
}

export function optInt(b: Body, k: string, min?: number, max?: number): number | null {
  const v = b[k]
  if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return null
  return int(b, k, min, max)
}

export function bool(b: Body, k: string): boolean {
  const v = b[k]
  if (typeof v === 'boolean') return v
  if (v === 'true') return true
  if (v === 'false' || v === undefined || v === null) return false
  return fail(b, k, `${labelFor(b, k)} tiene que ser sí o no.`, false)
}

export function date(b: Body, k: string): Date {
  const v = b[k]
  if (v === undefined || v === null || v === '') return fail(b, k, `Completá ${labelFor(b, k)}.`, new Date(0))
  const d = typeof v === 'string' ? new Date(v) : null
  if (!d || Number.isNaN(d.getTime())) return fail(b, k, `${labelFor(b, k)} tiene que ser una fecha, como 2026-10-31.`, new Date(0))
  return d
}

export function optDate(b: Body, k: string): Date | null {
  const v = b[k]
  if (v === undefined || v === null || v === '') return null
  return date(b, k)
}

/** Las opciones con su rótulo: «En producción, En desarrollo o Archivado». */
function choices(values: readonly string[]): string {
  const name = (Object.keys(enumLabels) as EnumName[]).find(n => values.every(v => v in enumLabels[n]))
  const shown = values.map(v => (name ? labelOf(name, v) : v))
  return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} o ${shown.at(-1)}` : shown.join('')
}

export function enumOf<T extends string>(b: Body, k: string, values: readonly T[]): T {
  const v = b[k]
  if (typeof v !== 'string' || !(values as readonly string[]).includes(v)) {
    return fail(b, k, `Elegí ${labelFor(b, k)}: ${choices(values)}.`, values[0] as T)
  }
  return v as T
}

export function intList(b: Body, k: string): number[] {
  const v = b[k] ?? []
  if (!Array.isArray(v) || !v.every(x => Number.isInteger(x))) return fail(b, k, `${labelFor(b, k)} tiene que ser una lista de elementos elegidos.`, [])
  return v as number[]
}

export function list(b: Body, k: string): Body[] {
  const v = b[k] ?? []
  if (!Array.isArray(v) || !v.every(x => x && typeof x === 'object' && !Array.isArray(x))) return fail(b, k, `${labelFor(b, k)} tiene que ser una lista.`, [])
  return v as Body[]
}

/** JSON libre: objeto, array o null. Acepta string y lo parsea. */
export function json(b: Body, k: string): unknown {
  const v = b[k]
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string') return v
  try {
    return JSON.parse(v)
  }
  catch {
    return fail(b, k, `${labelFor(b, k)} no tiene un formato válido.`, null)
  }
}

export type { FieldIssue }
