/**
 * Rutas de campo con la notación del body (`links[0].url`, `translations.en.title`): leerlas en el
 * formulario, saber en qué sección viven y encontrar su control en la pantalla. El formulario de cada
 * modelo tiene la forma del payload, así un error del servidor cae justo en su campo.
 */
import type { AnyModel, ModelSection } from '../../models/types'

const EN_PREFIX = 'translations.en.'

/** `links[2].url` → ['links', 2, 'url']. */
export function segments(path: string): (string | number)[] {
  return path.split('.').flatMap(part => part.split(/\[(\d+)\]/).filter(Boolean).map(p => (/^\d+$/.test(p) ? Number(p) : p)))
}

/** El valor en `path`, o undefined si el camino no existe. */
export function readPath(source: unknown, path: string): unknown {
  let value: unknown = source
  for (const key of segments(path)) {
    if (value === null || typeof value !== 'object') return undefined
    value = (value as Record<string | number, unknown>)[key]
  }
  return value
}

/** El campo de primer nivel de una ruta: `translations.en.title` y `title` son `title`. */
export function rootName(path: string): string {
  const rest = path.startsWith(EN_PREFIX) ? path.slice(EN_PREFIX.length) : path
  return String(segments(rest)[0] ?? rest)
}

/** La sección del modelo donde se edita `path`; la primera si ninguna lo nombra. */
export function sectionOf(model: AnyModel, path: string): ModelSection | null {
  const sections: readonly ModelSection[] = model.sections
  const root = rootName(path)
  return sections.find(s => s.fields.includes(path))
    ?? sections.find(s => s.fields.includes(root))
    ?? (path.startsWith(EN_PREFIX) ? sections.find(s => s.fields.includes('translations')) : undefined)
    ?? sections[0]
    ?? null
}

/** El índice de orden de una ruta en el formulario: sección y lugar dentro de ella. */
export function orderOf(model: AnyModel, path: string): number {
  const sections: readonly ModelSection[] = model.sections
  const section = sectionOf(model, path)
  const s = section ? sections.indexOf(section) : sections.length
  const f = section ? section.fields.indexOf(section.fields.includes(path) ? path : rootName(path)) : 0
  return s * 1000 + Math.max(0, f) * 10 + (path.startsWith(EN_PREFIX) ? 1 : 0)
}

const ENTRY = 'input:not([type="hidden"]), textarea, select, [role="combobox"], [role="switch"]'
const FOCUSABLE = `${ENTRY}, button, [tabindex="0"]`

/**
 * El control de un campo en la pantalla: el que lleva `data-field` con esa ruta (o, si no está, el de
 * su campo de primer nivel). Los campos lo ponen en su Field.
 */
export function controlFor(path: string): HTMLElement | null {
  const main = document.getElementById('main') ?? document.body
  const exact = main.querySelector<HTMLElement>(`[data-field="${CSS.escape(path)}"]`)
  const host = exact ?? main.querySelector<HTMLElement>(`[data-field="${CSS.escape(rootName(path))}"]`)
  if (!host) return null
  // Primero donde se escribe; los botones del rótulo («Copiar del español») quedan para el final.
  if (host.matches(FOCUSABLE)) return host
  return host.querySelector<HTMLElement>(ENTRY) ?? host.querySelector<HTMLElement>(FOCUSABLE)
}
