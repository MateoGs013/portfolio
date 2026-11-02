/**
 * Validación antes de mandar, con el esquema que llega en /meta (shared/adminSchema.ts) y el mismo
 * formato y las mismas frases que el servidor (server/src/admin/input.ts): `[{ path, message }]`.
 * Revisa solo lo que va en el payload; lo que el servidor sabe y el cliente no (direcciones repetidas,
 * registros borrados) sigue llegando en su 400 o 409.
 */
import type { FieldIssue } from '@shared/adminContracts'
import type { FieldDescriptor, ModelName } from '@shared/adminSchema'
import { schema } from '../stores/meta'
import { SLUG_MAX, SLUG_PATTERN } from './slug'

type Payload = Record<string, unknown>

const TEXT_KINDS = new Set(['text', 'prose', 'markdown', 'slug', 'url', 'path', 'email', 'color'])

function descriptors(model: ModelName): Readonly<Record<string, FieldDescriptor>> | null {
  return (schema.value?.[model] as Readonly<Record<string, FieldDescriptor>> | undefined) ?? null
}

const quoted = (d: FieldDescriptor) => `«${d.label}»`
const empty = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

/** Igual que withProtocol del servidor: `ejemplo.com` vale como `https://ejemplo.com`. */
function looksLikeUrl(value: string): boolean {
  const full = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value.replace(/^\/\//, '')}`
  try {
    const url = new URL(full)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) && (url.protocol === 'mailto:' || url.hostname.includes('.'))
  }
  catch {
    return false
  }
}

function checkText(d: FieldDescriptor, value: string): string | null {
  const text = value.trim()
  const max = d.kind === 'slug' ? Math.min(d.max ?? SLUG_MAX, SLUG_MAX) : d.max
  if (max !== null && text.length > max) return `${quoted(d)} admite hasta ${max} caracteres (tiene ${text.length}).`
  if (d.kind === 'slug' && !SLUG_PATTERN.test(text)) return `${quoted(d)} lleva solo minúsculas sin acentos, números y guiones, como mi-obra.`
  if (d.kind === 'url' && !looksLikeUrl(text)) return `${quoted(d)} tiene que ser una dirección web, como https://ejemplo.com.`
  if (d.kind === 'color' && !/^#[0-9a-f]{6}$/i.test(text)) return `${quoted(d)} tiene que ser un color como #b97e46.`
  return null
}

/** El problema de un valor según su descriptor, o null si está bien. */
export function checkValue(d: FieldDescriptor, value: unknown): string | null {
  if (empty(value)) return d.required ? `Completá ${quoted(d)}.` : null
  if (TEXT_KINDS.has(d.kind)) return typeof value === 'string' ? checkText(d, value) : `${quoted(d)} tiene que ser texto.`
  if (d.kind === 'int') {
    const n = typeof value === 'string' ? Number(value.trim()) : value
    return typeof n === 'number' && Number.isInteger(n) ? null : `${quoted(d)} tiene que ser un número entero.`
  }
  if (d.kind === 'list' && Array.isArray(value) && d.max !== null && value.length > d.max) {
    return `${quoted(d)} admite hasta ${d.max} elementos.`
  }
  return null
}

function validateFlat(model: ModelName, payload: Payload, prefix: string, requireMissing: boolean): FieldIssue[] {
  const fields = descriptors(model)
  if (!fields) return []
  const issues: FieldIssue[] = []
  for (const [name, d] of Object.entries(fields)) {
    if (!d.editable || d.kind === 'relation' || d.kind === 'json' || d.kind === 'system') continue
    // Una dirección que no viaja la arma el servidor con el título.
    if (!(name in payload) && !(requireMissing && d.required && d.kind !== 'slug')) continue
    const message = checkValue(d, payload[name])
    if (message) issues.push({ path: `${prefix}${name}`, message })
  }
  return issues
}

/**
 * Los problemas del payload de `model`. `translations.en` se revisa con la tabla de inglés (solo topes:
 * el inglés nunca es obligatorio). Al crear, un obligatorio que falta en el payload también cuenta.
 */
export function validatePayload(model: ModelName, payload: Payload, options: { creating?: boolean } = {}): FieldIssue[] {
  const issues = validateFlat(model, payload, '', options.creating === true)
  const en = (payload['translations'] as { en?: Payload } | undefined)?.en
  const translation = `${model}Translation` as ModelName
  if (en && descriptors(translation)) issues.push(...validateFlat(translation, en, 'translations.en.', false))
  return issues
}

/** El descriptor de un campo (rótulo y ayuda en los formularios), o null si /meta no llegó. */
export function fieldOf(model: ModelName, name: string): FieldDescriptor | null {
  return descriptors(model)?.[name] ?? null
}
