/**
 * Métricas de obra que llegan del editor del admin, validadas como filas Metric.
 * Una métrica es un número (`value`, Decimal 14,4, con `unit` opcional) o una lista (`items`), nunca las dos.
 */
import { Prisma } from '../../generated/prisma/client.js'
import { metricUnits, type MetricUnit } from '../shared/metricUnits.js'
import { HttpError, enumOf, list, optDate, optStr } from './input.js'

type Body = Record<string, unknown>

export interface MetricData {
  key: string
  value: Prisma.Decimal | null
  items: string[]
  unit: MetricUnit | null
  label: string | null
  source: string | null
  measuredAt: Date | null
  order: number
}

const KEY = /^[a-zA-Z][a-zA-Z0-9_]{0,47}$/
/** Decimal(14,4): hasta 10 dígitos enteros y 4 decimales. */
const DECIMAL = /^-?\d{1,10}(?:\.\d{1,4})?$/

function metricValue(raw: unknown, key: string): Prisma.Decimal | null {
  if (raw === undefined || raw === null || raw === '') return null
  const text = typeof raw === 'number' && Number.isFinite(raw) ? String(raw) : typeof raw === 'string' ? raw.trim() : null
  if (text === null || !DECIMAL.test(text)) {
    throw new HttpError(400, `métrica "${key}": el valor tiene que ser un número (hasta 4 decimales, con punto)`)
  }
  return new Prisma.Decimal(text)
}

function metricItems(raw: unknown, key: string): string[] {
  if (raw === undefined || raw === null) return []
  const values = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/\r?\n/) : null
  if (!values || !values.every(x => typeof x === 'string')) throw new HttpError(400, `métrica "${key}": la lista tiene que ser texto`)
  const items = values.map(x => x.trim()).filter(Boolean)
  if (items.length > 20 || items.some(x => x.length > 120)) {
    throw new HttpError(400, `métrica "${key}": hasta 20 elementos de 120 caracteres`)
  }
  return items
}

/**
 * Lista de métricas del body, en el orden en que llegan. `undefined` si el body no trae `metrics`
 * (así un guardado que no las incluye no las borra).
 */
export function metricList(b: Body): MetricData[] | undefined {
  if (b['metrics'] === undefined || b['metrics'] === null) return undefined
  const seen = new Set<string>()
  return list(b, 'metrics').map((m, order) => {
    const key = typeof m['key'] === 'string' ? m['key'].trim() : ''
    if (!KEY.test(key)) throw new HttpError(400, `métrica ${order + 1}: la clave va en camelCase, sin espacios (ej: bundleSizeKb)`)
    if (seen.has(key)) throw new HttpError(400, `la métrica "${key}" está repetida`)
    seen.add(key)

    const value = metricValue(m['value'], key)
    const items = metricItems(m['items'], key)
    if ((value === null) === (items.length === 0)) {
      throw new HttpError(400, `métrica "${key}": cargá un número o una lista (una de las dos)`)
    }
    const unit = value !== null && m['unit'] ? enumOf(m, 'unit', metricUnits) : null
    return {
      key,
      value,
      items,
      unit,
      label: optStr(m, 'label', 80),
      source: optStr(m, 'source', 200),
      measuredAt: optDate(m, 'measuredAt'),
      order,
    }
  })
}
