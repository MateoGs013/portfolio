/** Lectura tipada de `Doc.fields` (Json): la lista de DocField de app/lib/fieldMeta.ts. */
import type { DocField, DocFieldValue } from '../../../app/lib/fieldMeta.js'
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

/** Los campos bien formados del documento; lo malformado no se publica. */
export function docFieldsOf(json: unknown): DocField[] {
  return Array.isArray(json) ? json.filter(isDocField) : []
}

/** Campos de prosa que tienen versión en inglés. Email, url, fechas y números no se traducen. */
export function isTranslatableField(field: Pick<DocField, 'type'>): boolean {
  return field.type === 'string' || field.type === 'text' || field.type === 'list'
}

function hasValue(value: DocFieldValue | undefined): value is DocFieldValue {
  if (value === undefined) return false
  return typeof value === 'string' ? value.trim() !== '' : value.length > 0
}

/** Valor resuelto de un campo: `en` si existe y se pidió inglés; si no, el español. */
export function docValue(fields: readonly DocField[], name: string, lang: Lang): DocFieldValue | null {
  const field = fields.find(f => f.name === name)
  if (!field) return null
  return lang !== 'es' && hasValue(field.en) ? field.en : field.value
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
