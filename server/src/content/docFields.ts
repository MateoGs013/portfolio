/**
 * Lectura tipada de `Doc.fields` (Json): la lista de DocField de app/lib/fieldMeta.ts, normalizada con
 * el esquema fijo de server/src/shared/docSchema.ts. Un bloque requerido se publica con el tipo y el
 * ancho del esquema aunque esté guardado con otro (las bases anteriores al esquema guardaban el retrato
 * y el PDF del CV como texto), y el `en` de un bloque que no se traduce (email, url, imagen) nunca se
 * sirve: así un inglés viejo no tapa un valor nuevo.
 */
import type { DocField, DocFieldValue } from '../../../app/lib/fieldMeta.js'
import { docBlock, englishOf, isDocKey, isTranslatableType } from '../shared/docSchema.js'
import type { Lang } from './lang.js'

function isFieldValue(value: unknown): value is DocFieldValue {
  return typeof value === 'string' || (Array.isArray(value) && value.every(v => typeof v === 'string'))
}

function isDocField(value: unknown): value is DocField {
  if (typeof value !== 'object' || value === null) return false
  const f = value as Record<string, unknown>
  return typeof f['name'] === 'string'
    && typeof f['type'] === 'string'
    && isFieldValue(f['value'])
    && (f['en'] === undefined || isFieldValue(f['en']))
}

/** El bloque con el tipo y el ancho del esquema (si es requerido) y sin el `en` que su tipo no admite. */
function normalize(field: DocField, key: string | undefined): DocField {
  const fixed = key && isDocKey(key) ? docBlock(key, field.name) : null
  const { en, wide, ...rest } = field
  const type = fixed?.type ?? field.type
  // Un bloque libre conserva su ancho tal como se guardó; uno requerido lleva el del esquema.
  const width = fixed ? (fixed.wide ? { wide: true } : {}) : (wide === undefined ? {} : { wide })
  return {
    ...rest,
    type,
    ...(en !== undefined && englishOf(type) !== 'none' ? { en } : {}),
    ...width,
  }
}

/** Los campos bien formados del documento `key`; lo malformado no se publica. */
export function docFieldsOf(json: unknown, key?: string): DocField[] {
  return Array.isArray(json) ? json.filter(isDocField).map(f => normalize(f, key)) : []
}

/** Campos de prosa que tienen versión en inglés. Email, url, imagen, fechas y números no se traducen. */
export function isTranslatableField(field: Pick<DocField, 'type'>): boolean {
  return isTranslatableType(field.type)
}

function hasValue(value: DocFieldValue | undefined): value is DocFieldValue {
  if (value === undefined) return false
  return typeof value === 'string' ? value.trim() !== '' : value.length > 0
}

/** El valor de `field` en `lang`: su `en` si lo tiene y su tipo lo admite; si no, el español. */
export function fieldValueIn(field: DocField, lang: Lang): DocFieldValue {
  return lang !== 'es' && englishOf(field.type) !== 'none' && hasValue(field.en) ? field.en : field.value
}

/** Valor resuelto de un campo: `en` si existe y se pidió inglés; si no, el español. */
export function docValue(fields: readonly DocField[], name: string, lang: Lang): DocFieldValue | null {
  const field = fields.find(f => f.name === name)
  return field ? fieldValueIn(field, lang) : null
}

/** Igual que docValue, para campos de texto (una lista se une por renglón). */
export function docText(fields: readonly DocField[], name: string, lang: Lang): string | null {
  const value = docValue(fields, name, lang)
  if (value === null) return null
  return Array.isArray(value) ? value.join('\n') : value
}

/** Igual que docValue, para campos de lista (un texto se parte por renglón). */
export function docList(fields: readonly DocField[], name: string, lang: Lang): string[] {
  const value = docValue(fields, name, lang)
  if (value === null) return []
  return Array.isArray(value) ? value : value.split('\n').map(s => s.trim()).filter(Boolean)
}

/** Nombres de los campos de prosa que en `lang` se sirven en español. */
export function untranslatedFields(fields: readonly DocField[], names: readonly string[], lang: Lang): string[] {
  if (lang === 'es') return []
  return names.filter((name) => {
    const field = fields.find(f => f.name === name)
    return field !== undefined && isTranslatableField(field) && hasValue(field.value) && !hasValue(field.en)
  })
}

export { hasValue as hasDocValue }
