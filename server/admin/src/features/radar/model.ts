/**
 * Lo que se lee de una tendencia sin pedir nada: su fuente y su estado en palabras, la nota original
 * (solo http/https), la afinidad, las fechas y los filtros de la lista. Todo puro.
 */
import { trendSourceLabels, trendStatusLabels, type Trend, type TrendStatus } from '@shared/radarContracts'
import type { StatusTone } from '../../ui/StatusDot.vue'
import { radar } from './dict'

const STATUS_TONE: Record<TrendStatus, StatusTone> = {
  DISCOVERED: 'neutral',
  GENERATED: 'ok',
  DISCARDED: 'neutral',
}

export function trendStatusOf(row: Pick<Trend, 'status'>): { tone: StatusTone, label: string } {
  return { tone: STATUS_TONE[row.status], label: trendStatusLabels[row.status] }
}

export const trendTitle = (row: Pick<Trend, 'title'>) => row.title.trim() || radar.untitled

/** «Hacker News»; una fuente que el admin no conoce, en palabras («Lobsters», no «LOBSTERS»). */
export function sourceOf(row: Pick<Trend, 'source'>): string {
  const code = row.source.trim()
  if (!code) return ''
  const known = trendSourceLabels[code]
  if (known) return known
  const words = code.replace(/[_-]+/g, ' ').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** La nota original, solo si es una dirección web de verdad. */
export const originalOf = (row: Pick<Trend, 'url'>) => (row.url && /^https?:\/\//i.test(row.url) ? row.url : null)

/** «news.ycombinator.com»: dónde lleva el enlace, para leerlo antes de abrirlo. */
export function hostOf(row: Pick<Trend, 'url'>): string | null {
  const url = originalOf(row)
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  }
  catch {
    return null
  }
}

export const relevanceOf = (row: Pick<Trend, 'relevance_score'>) =>
  (typeof row.relevance_score === 'number' ? radar.relevance(Math.round(row.relevance_score)) : null)

/* ── Fechas ────────────────────────────────────────────── */

const LONG = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
const SHORT = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
const SHORT_YEAR = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/** «30 de octubre de 2026», o null si no hay fecha (nunca una inventada). */
export const longDay = (iso: string | null | undefined) => {
  const date = parse(iso)
  return date ? LONG.format(date) : null
}

/** «30 oct» este año, «30 oct 2025» otro año: para el margen de una fila. */
export function shortDay(iso: string | null | undefined, now = new Date()): string | null {
  const date = parse(iso)
  if (!date) return null
  return (date.getFullYear() === now.getFullYear() ? SHORT : SHORT_YEAR).format(date)
}

/* ── Filtros ───────────────────────────────────────────── */

export interface ListFilter<T, F extends string> {
  id: F
  label: string
  test: (row: T) => boolean
}

export type TrendFilter = 'todas' | 'nuevas' | 'usadas' | 'descartadas'

const byStatus = (status: TrendStatus) => (row: Trend) => row.status === status

export const TREND_FILTERS: readonly ListFilter<Trend, TrendFilter>[] = [
  { id: 'todas', label: radar.filters.all, test: () => true },
  { id: 'nuevas', label: radar.filters.discovered, test: byStatus('DISCOVERED') },
  { id: 'usadas', label: radar.filters.generated, test: byStatus('GENERATED') },
  { id: 'descartadas', label: radar.filters.discarded, test: byStatus('DISCARDED') },
]

export const DEFAULT_TREND_FILTER: TrendFilter = 'todas'

export function isTrendFilter(value: unknown): value is TrendFilter {
  return TREND_FILTERS.some(f => f.id === value)
}
