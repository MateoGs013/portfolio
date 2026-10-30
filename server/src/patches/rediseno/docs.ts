/**
 * Documentos about y contact con la forma del rediseño, y el doc home borrado.
 * Quita o reemplaza solo las claves listadas acá, agrega las nuevas del seed si faltan y conserva
 * todo valor editado desde el admin. Los campos quedan en el orden del seed; los propios del admin, al final.
 */
import type { PrismaClient } from '../../../generated/prisma/client.js'
import type { DocField } from '../../../../app/lib/fieldMeta.js'
import { docs } from '../../seed/docs.js'
import { show, type Change } from './change.js'

type DocKey = typeof docs[number]['key']

/** Claves que salen: la ubicación, la disponibilidad y la zona horaria pasan a contact. */
const REMOVED: Record<DocKey, string[]> = {
  about: ['location', 'availability_status', 'timezone'],
  contact: ['timezone'],
}

/** Valores viejos conocidos que se reemplazan por los del seed (si alguien los editó, se respetan). */
const LEGACY_VALUES: Record<DocKey, Record<string, string[]>> = {
  about: {
    role: ['Desarrollador Frontend & Full Stack · Creative Developer'],
    // Producción quedó con el valor cortado.
    freelance_experience: ['Activo desde 2023 · ', 'Activo desde 2023 ·', 'Activo desde 2023'],
  },
  contact: { location: ['Río Negro, AR (Disponible para relocalización o remoto)'] },
}

/** Tipo que debe tener cada campo; un valor de texto pasa a lista partiéndolo por '·'. */
const TYPES: Record<DocKey, Record<string, DocField['type']>> = {
  about: { languages: 'list' },
  contact: { email: 'email' },
}

/** Saca el tono de consola de un texto: '//' como separador y '●'. Las URLs no se tocan. */
function plain(text: string): string {
  return text.replace(/\s*●\s*/g, ' ').replace(/(^|[^:])\s*\/\/\s*/g, '$1 · ').replace(/\s{2,}/g, ' ').trim()
}

function asList(value: DocField['value']): string[] {
  return Array.isArray(value) ? value : value.split('·').map(s => s.trim()).filter(Boolean)
}

/** Devuelve los campos reformados y una línea por cada diferencia. */
export function reform(key: DocKey, current: DocField[]): { fields: DocField[], what: string[] } {
  const what: string[] = []
  const seed = docs.find(d => d.key === key)!.fields
  const byName = new Map(current.map(f => [f.name, { ...f }]))

  for (const name of REMOVED[key]) {
    if (byName.delete(name)) what.push(`${key}.${name}: se quita`)
  }
  for (const [name, olds] of Object.entries(LEGACY_VALUES[key])) {
    const field = byName.get(name)
    const next = seed.find(f => f.name === name)
    if (field && next && typeof field.value === 'string' && olds.includes(field.value)) {
      what.push(`${key}.${name}: ${show(field.value)} → ${show(next.value)}`)
      field.value = next.value
    }
  }
  for (const [name, type] of Object.entries(TYPES[key])) {
    const field = byName.get(name)
    if (!field || field.type === type) continue
    what.push(`${key}.${name}: type ${field.type} → ${type}`)
    field.type = type
    if (type === 'list') field.value = asList(field.value)
  }
  for (const field of byName.values()) {
    if (typeof field.value !== 'string' || field.type === 'url') continue
    const clean = plain(field.value)
    if (clean !== field.value) {
      what.push(`${key}.${field.name}: ${show(field.value)} → ${show(clean)}`)
      field.value = clean
    }
  }
  for (const f of seed) {
    if (!byName.has(f.name)) {
      byName.set(f.name, { ...f })
      what.push(`${key}.${f.name}: se agrega (${show(f.value)})`)
    }
  }

  const ordered = seed.map(f => byName.get(f.name)!)
  const extra = [...byName.values()].filter(f => !seed.some(s => s.name === f.name))
  return { fields: [...ordered, ...extra], what }
}

export async function docChanges(db: PrismaClient): Promise<Change[]> {
  const changes: Change[] = []

  const home = await db.doc.findUnique({ where: { key: 'home' }, select: { key: true } })
  if (home) changes.push({ what: ['doc home: se borra'], apply: tx => tx.doc.delete({ where: { key: 'home' } }) })

  for (const d of docs) {
    const row = await db.doc.findUnique({ where: { key: d.key } })
    if (!row) {
      changes.push({
        what: [`doc ${d.key}: se crea desde el seed`],
        apply: tx => tx.doc.create({ data: { key: d.key, title: d.title, fields: [...d.fields] } }),
      })
      continue
    }
    const current = Array.isArray(row.fields) ? (row.fields as unknown as DocField[]) : []
    const { fields, what } = reform(d.key, current)
    if (what.length) {
      changes.push({ what, apply: tx => tx.doc.update({ where: { key: d.key }, data: { fields } }) })
    }
  }

  return changes
}
