/**
 * Lo que se lee de una tendencia sin pedir nada: su fuente y su estado en palabras, la nota original
 * (solo http/https), la afinidad y los filtros de la lista. Todo puro.
 */
import { trendSourceLabels, trendStatusLabels, type Trend, type TrendStatus } from '@shared/contentContracts'
import type { StatusTone } from '../../ui/StatusDot.vue'
import type { ListFilter } from '../content/model'
import { radar } from './dict'

const STATUS_TONE: Record<TrendStatus, StatusTone> = {
  DISCOVERED: 'sig',
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

/* ── Filtros ───────────────────────────────────────────── */

export type TrendFilter = 'todas' | 'nuevas' | 'con-publicacion' | 'descartadas'

const byStatus = (status: TrendStatus) => (row: Trend) => row.status === status

export const TREND_FILTERS: readonly ListFilter<Trend, TrendFilter>[] = [
  { id: 'todas', label: radar.filters.all, test: () => true },
  { id: 'nuevas', label: radar.filters.discovered, test: byStatus('DISCOVERED') },
  { id: 'con-publicacion', label: radar.filters.generated, test: byStatus('GENERATED') },
  { id: 'descartadas', label: radar.filters.discarded, test: byStatus('DISCARDED') },
]

export const DEFAULT_TREND_FILTER: TrendFilter = 'todas'

export function isTrendFilter(value: unknown): value is TrendFilter {
  return TREND_FILTERS.some(f => f.id === value)
}
