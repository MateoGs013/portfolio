/**
 * Validación de PUT /api/admin/docs/:key contra el esquema fijo (shared/docSchema.ts). Va dentro de
 * `validate('Doc', …)`: junta todos los fallos. Las rutas de error nombran el bloque, no su posición:
 * `fields.display_name` (un bloque requerido que falta), `fields.email.value`, `fields.cv.en`.
 *
 * - Un bloque requerido no se renombra, no cambia de tipo ni se quita. Si la base no lo tiene, el PUT
 *   que lo trae lo crea con el nombre, el tipo y el ancho del esquema.
 * - Los bloques libres son solo texto corto, texto largo o lista.
 * - email, url e image no llevan `en` (se descarta); localizedPath lleva los dos valores, obligatorios.
 * - Sin la clave `en`, un bloque que se traduce conserva el inglés guardado; `en: ''` lo borra.
 */
import type { DocField, DocFieldValue } from '../../../app/lib/fieldMeta.js'
import {
  CV_PATH, DOC_BLOCK_NAME, FREE_BLOCK_TYPES, IMAGE_PATH, docBlock, docSchemas, englishOf, type DocBlock, type DocKey,
} from '../shared/docSchema.js'
import { issue, list, withProtocol } from './input.js'

type Body = Record<string, unknown>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX: Record<string, number> = { string: 300, text: 4000 }
const LIST_MAX = 20
const ITEM_MAX = 300

/** Lo que trae un bloque para validarlo: su rótulo y la ruta de sus errores. */
interface Where {
  path: string
  label: string
}

function problem(where: Where, field: 'value' | 'en' | 'type' | 'name' | '', message: string): void {
  issue({ path: field ? `${where.path}.${field}` : where.path, message })
}

function listValue(raw: unknown, where: Where, field: 'value' | 'en'): string[] {
  const items = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/\r?\n/) : null
  if (!items || !items.every(x => typeof x === 'string')) {
    problem(where, field, `«${where.label}» es una lista: un elemento por renglón.`)
    return []
  }
  const clean = items.map(x => x.trim()).filter(Boolean)
  if (clean.length > LIST_MAX || clean.some(x => x.length > ITEM_MAX)) {
    problem(where, field, `«${where.label}» admite hasta ${LIST_MAX} elementos de ${ITEM_MAX} caracteres.`)
  }
  return clean
}

function webAddress(text: string, where: Where, field: 'value' | 'en'): string {
  const full = withProtocol(text)
  try {
    const parsed = new URL(full)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return full
  }
  catch {
    // Cae al mensaje de abajo.
  }
  problem(where, field, `«${where.label}» tiene que ser una dirección web, como https://ejemplo.com.`)
  return full
}

/** El valor de un bloque según su tipo; vacío queda vacío (salvo las rutas por idioma). */
function blockValue(raw: unknown, type: string, where: Where, field: 'value' | 'en'): DocFieldValue {
  if (type === 'list') return listValue(raw ?? [], where, field)
  if (raw === undefined || raw === null) raw = ''
  if (Array.isArray(raw)) raw = raw.join('\n')
  if (typeof raw !== 'string') {
    problem(where, field, `«${where.label}» tiene que ser texto.`)
    return ''
  }
  const text = raw.trim()
  if (type === 'localizedPath') {
    const lang = field === 'value' ? 'en español' : 'en inglés'
    if (!text) problem(where, field, `Completá «${where.label}» ${lang}.`)
    else if (!CV_PATH.test(text)) problem(where, field, `«${where.label}» ${lang} tiene que ser un PDF de /cv/, como /cv/CV-ES-Mateo-Sonzogni-ATS.pdf.`)
    return text
  }
  if (!text) return ''
  if (type === 'email' && !EMAIL.test(text)) problem(where, field, `«${where.label}» tiene que ser un correo, como nombre@ejemplo.com.`)
  if (type === 'url') return webAddress(text, where, field)
  if (type === 'image' && !IMAGE_PATH.test(text)) problem(where, field, `«${where.label}» se cambia subiendo una imagen nueva.`)
  const max = MAX[type]
  if (max !== undefined && text.length > max) problem(where, field, `«${where.label}» admite hasta ${max} caracteres (tiene ${text.length}).`)
  return type === 'text' ? raw.replace(/\s+$/, '') : text
}

const isEmpty = (v: DocFieldValue | undefined): boolean => v === undefined || (Array.isArray(v) ? v.length === 0 : v.trim() === '')

/** El inglés que se guarda: el que llega, o el guardado si no llegó la clave. */
function blockEnglish(f: Body, type: string, kept: DocField | undefined, where: Where): DocFieldValue | undefined {
  const mode = englishOf(type)
  if (mode === 'none') return undefined
  const raw = 'en' in f ? f['en'] : kept?.en
  if (mode === 'own') return blockValue(raw, type, where, 'en')
  if (raw === undefined || raw === null) return undefined
  const en = blockValue(raw, type, where, 'en')
  return isEmpty(en) ? undefined : en
}

/** El tipo de un bloque: el del esquema para un requerido (acepta también el guardado), libre si es de los permitidos. */
function blockType(f: Body, fixed: DocBlock | null, kept: DocField | undefined, where: Where): string {
  const sent = typeof f['type'] === 'string' ? f['type'] : undefined
  if (fixed) {
    if (sent !== undefined && sent !== fixed.type && sent !== kept?.type) problem(where, 'type', `«${fixed.label}» es un bloque fijo: su tipo no cambia.`)
    return fixed.type
  }
  const type = sent ?? kept?.type ?? 'string'
  if (!(FREE_BLOCK_TYPES as readonly string[]).includes(type)) problem(where, 'type', `«${where.label}» es un bloque nuevo: elegí texto corto, texto largo o lista.`)
  return type
}

function worldsOf(f: Body): string[] {
  return Array.isArray(f['worlds']) ? f['worlds'].filter((w): w is string => typeof w === 'string') : []
}

/**
 * Los bloques que se guardan: los requeridos en el orden del esquema y después los libres, en el orden
 * en que llegaron. `stored` es lo que la base tiene hoy (para conservar el inglés y detectar lo que se quita).
 */
export function docPayload(key: DocKey, b: Body, stored: readonly DocField[]): DocField[] {
  const schema = docSchemas[key]
  const kept = new Map(stored.map(f => [f.name, f]))
  const seen = new Set<string>()
  const fixed: DocField[] = []
  const free: DocField[] = []
  for (const f of list(b, 'fields')) {
    const name = typeof f['name'] === 'string' ? f['name'].trim() : ''
    const block = docBlock(key, name)
    const where: Where = { path: `fields.${name || 'nuevo'}`, label: block?.label ?? name }
    if (!DOC_BLOCK_NAME.test(name)) {
      problem(where, 'name', 'El nombre de un bloque va en minúsculas, sin espacios ni acentos, como «zona_horaria».')
      continue
    }
    if (seen.has(name)) {
      problem(where, 'name', `Hay dos bloques «${where.label}»: dejá uno solo.`)
      continue
    }
    seen.add(name)
    const type = blockType(f, block, kept.get(name), where)
    // La imagen solo cambia por POST /docs/about/portrait: un formulario viejo no la puede devolver
    // a un archivo que esa subida ya borró. Lo que llega se ignora y queda lo guardado.
    const stored = kept.get(name)
    const value = type === 'image' && stored ? stored.value : blockValue(f['value'], type, where, 'value')
    const en = blockEnglish(f, type, kept.get(name), where)
    const worlds = worldsOf(f)
    const wide = block ? block.wide : f['wide'] === true
    const out: DocField = { name, type: type as DocField['type'], value, ...(en === undefined ? {} : { en }), ...(wide ? { wide: true } : {}), ...(worlds.length ? { worlds } : {}) }
    if (block) fixed.push(out)
    else free.push(out)
  }
  for (const block of schema.blocks) {
    if (!seen.has(block.name) && kept.has(block.name)) {
      problem({ path: `fields.${block.name}`, label: block.label }, '', `«${block.label}» es un bloque fijo de ${schema.label}: no se quita ni se renombra.`)
    }
  }
  const order = schema.blocks.map(x => x.name)
  fixed.sort((x, y) => order.indexOf(x.name) - order.indexOf(y.name))
  return [...fixed, ...free]
}
