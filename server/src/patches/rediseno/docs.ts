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

/**
 * Claves que salen (la ubicación, la disponibilidad y la zona horaria pasan a contact), con los valores
 * que se conocen de main. Solo se quitan con uno de esos valores: si alguien las editó en el admin, se
 * conservan al final del doc y el parche lo avisa.
 */
const REMOVED: Record<DocKey, Record<string, string[]>> = {
  about: {
    location: ['Río Negro, Patagonia Argentina'],
    availability_status: ['DISPONIBLE · Búsqueda de equipo o proyectos de alto impacto', 'DISPONIBLE // Búsqueda de equipo o proyectos de alto impacto'],
    timezone: ['UTC-3 (Argentina / Compatible con US & EU)'],
  },
  contact: { timezone: ['UTC-3'] },
}

/** Claves renombradas: si la nueva falta, hereda el valor (y su inglés) de la vieja cuando le sirve. */
const RENAMED: Record<DocKey, Record<string, { to: string, accepts: (value: string) => boolean }>> = {
  about: {},
  // El reloj del pie necesita una zona IANA; 'UTC-3' no lo es y se reemplaza por la del seed.
  contact: { timezone: { to: 'time_zone', accepts: isTimeZone } },
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

/** Listas viejas conocidas (texto de main o la lista que sale de partirlo) que pasan a la del seed. */
const LEGACY_LISTS: Record<DocKey, Record<string, string[][]>> = {
  about: { languages: [['Español (Nativo)', 'Inglés (B2 Profesional Técnico)']] },
  contact: {},
}

function isTimeZone(value: string): boolean {
  if (!value.includes('/')) return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  }
  catch {
    return false
  }
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

/** Devuelve los campos reformados, una línea por cada diferencia y los avisos para el admin. */
export function reform(key: DocKey, current: DocField[]): { fields: DocField[], what: string[], warnings: string[] } {
  const what: string[] = []
  const warnings: string[] = []
  const seed = docs.find(d => d.key === key)!.fields
  const byName = new Map(current.map(f => [f.name, { ...f }]))

  for (const [name, { to, accepts }] of Object.entries(RENAMED[key])) {
    const field = byName.get(name)
    if (!field || byName.has(to) || typeof field.value !== 'string' || !accepts(field.value)) continue
    byName.delete(name)
    byName.set(to, { ...field, name: to })
    what.push(`${key}.${name} → ${key}.${to} (${show(field.value)})`)
  }
  for (const [name, known] of Object.entries(REMOVED[key])) {
    const field = byName.get(name)
    if (!field) continue
    const value = Array.isArray(field.value) ? field.value.join(' · ') : field.value
    if (value.trim() === '' || known.includes(value)) {
      byName.delete(name)
      what.push(`${key}.${name}: se quita`)
    }
    else {
      warnings.push(`doc ${key}.${name}: se editó en el admin (${show(value)}); se conserva, borralo desde el admin si ya no hace falta`)
    }
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
  for (const [name, olds] of Object.entries(LEGACY_LISTS[key])) {
    const field = byName.get(name)
    const next = seed.find(f => f.name === name)
    if (!field || !next || !Array.isArray(field.value)) continue
    const value = field.value
    if (olds.some(old => old.length === value.length && old.every((item, i) => item === value[i]))) {
      what.push(`${key}.${name}: ${show(value)} → ${show(next.value)}`)
      field.value = next.value
    }
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
  return { fields: [...ordered, ...extra], what, warnings }
}

export async function docChanges(db: PrismaClient): Promise<{ changes: Change[], warnings: string[] }> {
  const changes: Change[] = []
  const warnings: string[] = []

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
    const { fields, what, warnings: docWarnings } = reform(d.key, current)
    warnings.push(...docWarnings)
    if (what.length) {
      changes.push({ what, apply: tx => tx.doc.update({ where: { key: d.key }, data: { fields } }) })
    }
  }

  return { changes, warnings }
}
