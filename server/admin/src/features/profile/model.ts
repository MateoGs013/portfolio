/**
 * El documento de Perfil como formulario y de vuelta (PUT /api/admin/docs/:key):
 * - `fields` lleva cada bloque fijo del esquema por su nombre, con la forma de las rutas de error del
 *   servidor (`fields.email.value`, `fields.cv.en`): un 400 cae justo en su campo;
 * - `free` son los bloques libres, en orden, con el nombre editable;
 * - las listas se editan como texto, un elemento por renglón.
 * La imagen no está en el formulario: cambia solo con POST /docs/about/portrait.
 */
import type { AdminDoc, AdminDocField } from '@shared/adminContracts'
import { englishOf, FREE_BLOCK_TYPES, type DocBlock } from '@shared/docSchema'

export type FreeType = (typeof FREE_BLOCK_TYPES)[number]

export interface BlockForm {
  value: string
  en: string
}

export interface FreeForm extends BlockForm {
  /** Estable mientras se edita: `guardado:<nombre original>` o `nuevo:<n>`. */
  uid: string
  name: string
  type: FreeType
}

export interface DocForm {
  fields: Record<string, BlockForm>
  free: FreeForm[]
}

const STORED = 'guardado:'

const asText = (value: AdminDocField['value'] | undefined): string => (Array.isArray(value) ? value.join('\n') : (value ?? ''))

const lines = (text: string): string[] => text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)

export const isFreeType = (type: string): type is FreeType => (FREE_BLOCK_TYPES as readonly string[]).includes(type)

/** Los bloques libres guardados: los que no son del esquema. */
export function freeFields(doc: AdminDoc): AdminDocField[] {
  const fixed = new Set(doc.schema.map(b => b.name))
  return doc.fields.filter(f => !fixed.has(f.name))
}

export function toForm(doc: AdminDoc): DocForm {
  const stored = new Map(doc.fields.map(f => [f.name, f]))
  const fields: Record<string, BlockForm> = {}
  for (const block of doc.schema) {
    const field = stored.get(block.name)
    fields[block.name] = { value: asText(field?.value), en: asText(field?.en) }
  }
  const free = freeFields(doc).map(f => ({
    uid: `${STORED}${f.name}`,
    name: f.name,
    type: isFreeType(f.type) ? f.type : 'string',
    value: asText(f.value),
    en: asText(f.en),
  }))
  return { fields, free }
}

/** La clave de un bloque nuevo, única aunque se recupere un borrador después de recargar. */
export function blankFree(): FreeForm {
  return { uid: `nuevo:${crypto.randomUUID()}`, name: '', type: 'string', value: '', en: '' }
}

/** El valor como lo guarda la base: lista para `list`, texto para el resto. */
function valueOf(type: string, text: string): string | string[] {
  return type === 'list' ? lines(text) : text
}

/** Lo que el formulario no edita y la base guarda (ancho y mundos de un bloque libre). */
function keptExtras(field: AdminDocField | undefined): Pick<AdminDocField, 'wide'> & { worlds?: unknown } {
  const extra = field as (AdminDocField & { worlds?: unknown }) | undefined
  return { ...(extra?.wide ? { wide: true } : {}), ...(Array.isArray(extra?.worlds) ? { worlds: extra.worlds } : {}) }
}

function blockPayload(block: DocBlock, form: BlockForm, stored: AdminDocField | undefined): Record<string, unknown> {
  const english = englishOf(block.type)
  // La imagen la guarda el servidor tal cual estaba: lo que llega se ignora.
  const value = block.type === 'image' ? (stored?.value ?? '') : valueOf(block.type, form.value)
  return {
    name: block.name,
    type: block.type,
    value,
    ...(english === 'none' ? {} : { en: valueOf(block.type, form.en) }),
    ...keptExtras(stored),
  }
}

/** ¿El bloque fijo que falta en la base tiene algo escrito? Solo así se crea al guardar. */
function hasContent(block: DocBlock, form: BlockForm): boolean {
  if (block.type === 'image') return false
  return !!form.value.trim() || (englishOf(block.type) !== 'none' && !!form.en.trim())
}

export function toPayload(form: DocForm, doc: AdminDoc): { fields: Record<string, unknown>[] } {
  const stored = new Map(doc.fields.map(f => [f.name, f]))
  const fixed = doc.schema
    .filter(block => stored.has(block.name) || hasContent(block, form.fields[block.name] ?? { value: '', en: '' }))
    .map(block => blockPayload(block, form.fields[block.name] ?? { value: '', en: '' }, stored.get(block.name)))
  const free = form.free.map((f) => {
    const original = f.uid.startsWith(STORED) ? stored.get(f.uid.slice(STORED.length)) : undefined
    const extras = original ? keptExtras(original) : (f.type === 'text' ? { wide: true } : {})
    return { name: f.name.trim(), type: f.type, value: valueOf(f.type, f.value), en: valueOf(f.type, f.en), ...extras }
  })
  return { fields: [...fixed, ...free] }
}

/** «horario de atención» → «horario_de_atencion»: el nombre que acepta la base. */
export function blockName(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[_0-9]+|_+$/g, '')
    .slice(0, 48)
}

/** El nombre de un bloque libre leído por una persona: «horario_de_atencion» → «Horario de atencion». */
export function readableName(name: string): string {
  const words = name.trim().replace(/_+/g, ' ').trim()
  return words ? words.charAt(0).toLocaleUpperCase('es') + words.slice(1) : ''
}

/**
 * Lleva una ruta de error del servidor (`fields.<nombre>.value`) a la del formulario: los bloques
 * fijos quedan igual y los libres pasan a `free[i]` (el servidor los nombra por su nombre actual).
 */
export function formPath(path: string, form: DocForm): string {
  const match = /^fields\.([^.[]+)(.*)$/.exec(path)
  if (!match) return path
  const [, name = '', rest = ''] = match
  if (name in form.fields) return path
  let index = form.free.findIndex(f => f.name.trim() === name)
  // Un nombre que no se pudo leer llega como `fields.nuevo`.
  if (index === -1 && name === 'nuevo') index = form.free.findIndex(f => !f.name.trim())
  return index === -1 ? path : `free[${index}]${rest}`
}
