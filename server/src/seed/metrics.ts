/**
 * Métricas de obra: de un mapa `clave → valor` a filas Metric.
 *
 * Son las mismas reglas que la migración 20261101000000_rediseno_movimiento aplicó en SQL sobre
 * la columna vieja `Project.metrics`, así el seed, el parche y la migración producen lo mismo.
 * La etiqueta y la descripción de cada clave viven en el diccionario de interfaz, no acá.
 */
import type { MetricUnit } from '../../../app/lib/fieldMeta.js'

/** Valor de una métrica tal como se escribe en el seed (o como estaba en el Json viejo). */
export type MetricInput = number | string | boolean | null | string[]

export interface MetricRow {
  key: string
  value: number | null
  items: string[]
  unit: MetricUnit | null
  order: number
}

/** Claves cuyo valor viejo era texto con número y unidad ('0.8s', '1,500 RPD', '$0/mes', '24h'). */
const NUMERIC_TEXT = new Set(['lcp', 'freeTierQuota', 'operatingCost', 'ephemeralTTL'])

const UNIT_BY_KEY: Record<string, MetricUnit> = {
  lcp: 's',
  freeTierQuota: 'req_day',
  operatingCost: 'usd_month',
  ephemeralTTL: 'h',
  fpsTarget: 'fps',
}

/** Unidad de una clave: explícita, o por sufijo (…Ms → ms, …Kb → kb). NULL = conteo o puntaje. */
export function unitFor(key: string): MetricUnit | null {
  const unit = UNIT_BY_KEY[key]
  if (unit) return unit
  if (key.endsWith('Ms')) return 'ms'
  if (key.endsWith('Kb')) return 'kb'
  return null
}

function numberFromText(text: string): number | null {
  const digits = text.replace(/[^0-9.]/g, '')
  return digits === '' ? null : Number(digits)
}

/** Una clave a su fila. Ninguna se pierde: lo que no es número ni lista queda como lista de un item. */
export function metricRow(key: string, raw: MetricInput, order: number): MetricRow {
  const row: MetricRow = { key, value: null, items: [], unit: unitFor(key), order }
  if (typeof raw === 'number') row.value = raw
  else if (Array.isArray(raw)) row.items = raw.map(String)
  else if (typeof raw === 'string' && NUMERIC_TEXT.has(key)) row.value = numberFromText(raw)
  else if (raw !== null) row.items = [String(raw)]
  return row
}

/** Un mapa entero, en el orden de sus claves. */
export function metricRows(metrics: Record<string, MetricInput>): MetricRow[] {
  return Object.entries(metrics).map(([key, raw], order) => metricRow(key, raw, order))
}

/** Lee el Json viejo de la base: solo un objeto plano cuenta como mapa de métricas. */
export function legacyMetricRows(json: unknown): MetricRow[] {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return []
  return metricRows(json as Record<string, MetricInput>)
}
