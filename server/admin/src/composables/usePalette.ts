/**
 * La paleta Ctrl/⌘K: si está abierta, qué fuentes indexa y cómo se busca. Una fuente es un grupo de
 * entradas (secciones, acciones, obras, vacantes…) que alguien registra con `registerPaletteSource`;
 * registrar otra con el mismo id la reemplaza, así un área puede traer una fuente mejor que la del shell.
 *
 * La búsqueda no distingue acentos ni mayúsculas, pide que estén todas las palabras y pone primero lo
 * que empieza con lo escrito. Sin nada escrito, los grupos de registros muestran los primeros.
 */
import { computed, readonly, ref, shallowReactive, type ComputedRef } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export type PaletteGroup = 'goto' | 'actions' | 'projects' | 'experience' | 'articles' | 'stack' | 'orgs' | 'jobs'

/** El orden en que se muestran los grupos. */
export const PALETTE_GROUPS: readonly PaletteGroup[] = ['goto', 'actions', 'projects', 'experience', 'articles', 'stack', 'orgs', 'jobs']

/** Los grupos de registros: sin nada escrito muestran solo los primeros. */
const RECORD_GROUPS = new Set<PaletteGroup>(['projects', 'experience', 'articles', 'stack', 'orgs', 'jobs'])
const IDLE_LIMIT = 5
const QUERY_LIMIT = 20

export interface PaletteItem {
  /** Único dentro de su fuente. */
  id: string
  label: string
  /** Al margen, en --faint: el estado, el tipo o el atajo. */
  hint?: string
  /** Palabras que también encuentran la entrada (el slug, la empresa). */
  keywords?: string
  /** Una ruta del admin, o una acción. */
  to?: RouteLocationRaw
  run?: () => void
}

export interface PaletteSource {
  id: string
  group: PaletteGroup
  items: () => readonly PaletteItem[]
  /** Se llama al abrir la paleta: para fuentes que se piden recién cuando hacen falta. */
  refresh?: () => void
}

export interface PaletteEntry extends PaletteItem {
  key: string
  group: PaletteGroup
}

export interface PaletteSection {
  group: PaletteGroup
  entries: PaletteEntry[]
}

const sources = shallowReactive(new Map<string, PaletteSource>())
const open = ref(false)

export const paletteOpen = readonly(open)

export function openPalette(): void {
  if (open.value) return
  for (const source of sources.values()) source.refresh?.()
  open.value = true
}

export function closePalette(): void {
  open.value = false
}

export function togglePalette(): void {
  if (open.value) closePalette()
  else openPalette()
}

/** Suma (o reemplaza) una fuente. Devuelve cómo quitarla. */
export function registerPaletteSource(source: PaletteSource): () => void {
  sources.set(source.id, source)
  return () => {
    if (sources.get(source.id) === source) sources.delete(source.id)
  }
}

/** El id de cada opción, para aria-activedescendant. */
export function paletteOptionId(listId: string, index: number): string {
  return `${listId}-opt-${index}`
}

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

function matches(item: PaletteItem, words: string[]): boolean {
  const haystack = normalize(`${item.label} ${item.hint ?? ''} ${item.keywords ?? ''}`)
  return words.every(word => haystack.includes(word))
}

/** Las secciones con lo que coincide, en el orden de los grupos. */
export function searchPalette(query: string): PaletteSection[] {
  const q = normalize(query)
  const words = q.split(/\s+/).filter(Boolean)
  return PALETTE_GROUPS.flatMap((group) => {
    const items = [...sources.values()]
      .filter(source => source.group === group)
      .flatMap(source => source.items().map(item => ({ ...item, group, key: `${source.id}:${item.id}` })))
    let found = words.length ? items.filter(item => matches(item, words)) : items
    if (words.length) {
      // Primero lo que empieza con lo escrito; el resto queda en su orden.
      found = [...found].sort((a, b) => Number(normalize(b.label).startsWith(q)) - Number(normalize(a.label).startsWith(q)))
    }
    const limit = RECORD_GROUPS.has(group) ? (words.length ? QUERY_LIMIT : IDLE_LIMIT) : Infinity
    const entries = found.slice(0, limit)
    return entries.length ? [{ group, entries }] : []
  })
}

/** Para el componente: las secciones de una consulta reactiva. */
export function usePaletteResults(query: () => string): ComputedRef<PaletteSection[]> {
  return computed(() => searchPalette(query()))
}
