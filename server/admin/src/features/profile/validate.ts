/**
 * Lo que se revisa antes de mandar el documento, con las mismas reglas que server/src/admin/docInput.ts
 * (topes, correo, PDF del CV y nombres de los bloques libres) y las rutas del formulario. El servidor
 * vuelve a validar: esto solo evita un viaje para lo que ya se sabe que no pasa.
 */
import type { AdminDoc, FieldIssue } from '@shared/adminContracts'
import { CV_PATH, DOC_BLOCK_NAME, englishOf } from '@shared/docSchema'
import { profile } from './dict'
import { readableName, type BlockForm, type DocForm } from './model'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX: Record<string, number> = { string: 300, text: 4000 }
const LIST_MAX = 20
const ITEM_MAX = 300

const lines = (text: string) => text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

function checkText(type: string, text: string, label: string, path: string, out: FieldIssue[]): void {
  if (type === 'list') {
    const items = lines(text)
    if (items.length > LIST_MAX || items.some(item => item.length > ITEM_MAX)) out.push({ path, message: profile.limits.list(label, LIST_MAX, ITEM_MAX) })
    return
  }
  const clean = type === 'text' ? text.replace(/\s+$/, '') : text.trim()
  const max = MAX[type]
  if (max !== undefined && clean.length > max) out.push({ path, message: profile.limits.text(label, max, clean.length) })
  if (type === 'email' && clean && !EMAIL.test(clean)) out.push({ path, message: profile.limits.email(label) })
}

function checkCv(form: BlockForm, path: string, out: FieldIssue[]): void {
  const t = profile.cv
  for (const [side, lang, example] of [['value', t.inSpanish, t.placeholderEs], ['en', t.inEnglish, t.placeholderEn]] as const) {
    const text = form[side].trim()
    if (!text) out.push({ path: `${path}.${side}`, message: t.required(lang) })
    else if (!CV_PATH.test(text)) out.push({ path: `${path}.${side}`, message: t.invalid(lang, example) })
  }
}

export function validateDoc(form: DocForm, doc: AdminDoc): FieldIssue[] {
  const out: FieldIssue[] = []
  const stored = new Set(doc.fields.map(f => f.name))
  for (const block of doc.schema) {
    const value = form.fields[block.name]
    if (!value || block.type === 'image') continue
    const path = `fields.${block.name}`
    if (block.type === 'localizedPath') {
      // Si falta en la base y sigue vacío no se manda: queda «Falta completar» sin trabar el guardado.
      if (stored.has(block.name) || value.value.trim() || value.en.trim()) checkCv(value, path, out)
      continue
    }
    checkText(block.type, value.value, block.label, `${path}.value`, out)
    if (englishOf(block.type) === 'translate') checkText(block.type, value.en, `${block.label} (${profile.english})`, `${path}.en`, out)
  }

  const taken = new Set(doc.schema.map(b => b.name))
  form.free.forEach((f, i) => {
    const name = f.name.trim()
    const path = `free[${i}]`
    const label = readableName(name) || profile.free.untitled
    if (!name) out.push({ path: `${path}.name`, message: profile.free.nameRequired })
    else if (!DOC_BLOCK_NAME.test(name)) out.push({ path: `${path}.name`, message: profile.free.nameInvalid })
    else if (taken.has(name)) out.push({ path: `${path}.name`, message: profile.free.nameTaken })
    if (name) taken.add(name)
    checkText(f.type, f.value, label, `${path}.value`, out)
    checkText(f.type, f.en, `${label} (${profile.english})`, `${path}.en`, out)
  })
  return out
}
