/**
 * Las frases de la bandeja del Inicio (pending.ts): rótulos de campo desde adminSchema y docSchema,
 * listas en español («Rol, resultado y 2 pasos»), plurales y fechas. Las rutas que llegan son las del
 * body (`translations.en.outcome`, `steps[1].translations.en.body`, `fields.headline.en`).
 */
import { describe, type ModelName } from '../shared/adminSchema.js'
import { docBlock, type DocKey } from '../shared/docSchema.js'

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** «a», «a y b», «a, b y c». */
export function joinEs(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`
}

export const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1)
const lower = (s: string) => s.charAt(0).toLocaleLowerCase('es') + s.slice(1)

const DAY = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** «12 de noviembre de 2026». Las fechas de publicación se eligen como día: UTC no lo corre. */
export const longDay = (at: Date | string) => DAY.format(new Date(at))

/** Lo anidado que se cuenta en vez de nombrarse: «2 pasos», «1 enlace». */
const NESTED: Record<string, readonly [string, string]> = {
  steps: ['paso', 'pasos'],
  links: ['enlace', 'enlaces'],
  metrics: ['rótulo de métrica', 'rótulos de métricas'],
  media: ['imagen', 'imágenes'],
}

const EN = 'translations.en.'
const ITEM = /^highlights\[(\d+)\]$/

function fieldLabel(model: ModelName, name: string): string {
  return describe(model, name)?.label ?? name
}

/**
 * Los campos sin inglés de un registro, en una lista que se lee: los propios por su rótulo (las
 * viñetas por número) y lo anidado contado. `model` es el modelo del registro; en los documentos, el
 * rótulo sale del bloque.
 */
export function describeFields(owner: { model: ModelName } | { doc: DocKey }, paths: readonly string[]): string {
  const own: string[] = []
  const bullets: number[] = []
  const nested = new Map<string, Set<number>>()
  for (const path of paths) {
    const inside = /^(\w+)\[(\d+)\]\./.exec(path)
    if (inside && inside[1] && NESTED[inside[1]]) {
      const set = nested.get(inside[1]) ?? new Set<number>()
      set.add(Number(inside[2]))
      nested.set(inside[1], set)
      continue
    }
    if ('doc' in owner) {
      const name = path.replace(/^fields\./, '').replace(/\.en$/, '')
      own.push(docBlock(owner.doc, name)?.label ?? name)
      continue
    }
    const rest = path.startsWith(EN) ? path.slice(EN.length) : path
    const item = ITEM.exec(rest)
    if (item) bullets.push(Number(item[1]) + 1)
    else own.push(fieldLabel(owner.model, rest))
  }
  const parts = [
    ...own.map((label, i) => (i === 0 ? label : lower(label))),
    ...(bullets.length ? [bullets.length === 1 ? `la viñeta ${bullets[0]}` : `las viñetas ${joinEs(bullets.map(String))}`] : []),
    ...[...nested].map(([key, set]) => plural(set.size, ...NESTED[key]!)),
  ]
  return capitalize(joinEs(parts))
}
