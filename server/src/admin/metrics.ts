/**
 * Métricas de obra que llegan del editor del admin, validadas como filas Metric y guardadas por id.
 * Una métrica es un número (`value`, Decimal 14,4, con `unit` opcional) o una lista (`items`), nunca las dos.
 *
 * Guardar no reemplaza las filas: la que llega con su id se actualiza (y conserva su inglés en
 * MetricTranslation), la que llega sin id se crea, la que no llega se borra y el orden sale de la
 * posición en la lista (0..n-1). El rótulo propio en inglés llega en `translations.en.label`.
 */
import { Prisma } from '../../generated/prisma/client.js'
import { metricUnits, type MetricUnit } from '../shared/metricUnits.js'
import { enumOf, fail, list, optDate, optInt, optStr } from './input.js'
import { enBody, saveMetricEn } from './translations.js'

type Body = Record<string, unknown>
type Tx = Prisma.TransactionClient

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

export interface MetricInput {
  id: number | null
  data: MetricData
  en: Body | null
}

const KEY = /^[a-zA-Z][a-zA-Z0-9_]{0,47}$/
/** Decimal(14,4): hasta 10 dígitos enteros y 4 decimales. */
const DECIMAL = /^-?\d{1,10}(?:\.\d{1,4})?$/

function metricValue(m: Body): Prisma.Decimal | null {
  const raw = m['value']
  if (raw === undefined || raw === null || raw === '') return null
  const text = typeof raw === 'number' && Number.isFinite(raw) ? String(raw) : typeof raw === 'string' ? raw.trim() : null
  if (text === null || !DECIMAL.test(text)) {
    return fail(m, 'value', 'El valor tiene que ser un número, con hasta cuatro decimales separados por punto (como 0.8).', null)
  }
  return new Prisma.Decimal(text)
}

function metricItems(m: Body): string[] {
  const raw = m['items']
  if (raw === undefined || raw === null) return []
  const values = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/\r?\n/) : null
  if (!values || !values.every(x => typeof x === 'string')) return fail(m, 'items', 'La lista tiene que ser texto, un elemento por renglón.', [])
  const items = values.map(x => x.trim()).filter(Boolean)
  if (items.length > 20 || items.some(x => x.length > 120)) return fail(m, 'items', 'La lista admite hasta 20 elementos de 120 caracteres.', items)
  return items
}

/**
 * Lista de métricas del body, en el orden en que llegan. `undefined` si el body no trae `metrics`
 * (así un guardado que no las incluye no las borra). Va dentro de `validate`: junta los fallos.
 */
export function metricList(b: Body): MetricInput[] | undefined {
  if (b['metrics'] === undefined || b['metrics'] === null) return undefined
  const seen = new Set<string>()
  return list(b, 'metrics').map((m, order) => {
    const key = typeof m['key'] === 'string' ? m['key'].trim() : ''
    if (!KEY.test(key)) fail(m, 'key', 'La clave va junta, sin espacios ni acentos, como «bundleSizeKb».', key)
    else if (seen.has(key)) fail(m, 'key', `La métrica «${key}» está dos veces: dejá una sola.`, key)
    seen.add(key)

    const value = metricValue(m)
    const items = metricItems(m)
    // Un valor que no es número ya tiene su error: no se suma «cargá uno de los dos».
    const typed = m['value'] !== undefined && m['value'] !== null && m['value'] !== ''
    if (value !== null && items.length > 0) fail(m, 'value', 'Va un número o una lista, no los dos.', null)
    else if (value === null && items.length === 0 && !typed) fail(m, 'value', 'Cargá un número o una lista, una de las dos.', null)
    const unit = value !== null && m['unit'] ? enumOf(m, 'unit', metricUnits) : null
    return {
      id: optInt(m, 'id'),
      data: {
        key,
        value,
        items,
        unit,
        label: optStr(m, 'label', 80),
        source: optStr(m, 'source', 200),
        measuredAt: optDate(m, 'measuredAt'),
        order,
      },
      en: enBody(m),
    }
  })
}

/**
 * Una métrica sin id (o con uno que no es de esta obra) cuya clave ya existe en la obra, y que ninguna
 * otra reclama por id, es esa misma fila: así el admin actual, que no manda ids, no las recrea ni
 * pierde su inglés.
 */
function claimByKey(metrics: MetricInput[], own: Map<number, string>): MetricInput[] {
  const claimed = new Set(metrics.flatMap(m => (m.id !== null && own.has(m.id) ? [m.id] : [])))
  const byKey = new Map([...own].filter(([id]) => !claimed.has(id)).map(([id, key]) => [key, id]))
  return metrics.map((m) => {
    if (m.id !== null && own.has(m.id)) return m
    const id = byKey.get(m.data.key) ?? null
    if (id !== null) byKey.delete(m.data.key)
    return { ...m, id }
  })
}

/**
 * Sincroniza las métricas de la obra por id. (projectId, key) es único: las que se quedan y cambian
 * de clave pasan antes por una clave provisoria, así dos métricas pueden intercambiar sus claves.
 */
export async function syncMetrics(tx: Tx, projectId: number, incoming: MetricInput[]): Promise<void> {
  const own = new Map((await tx.metric.findMany({ where: { projectId }, select: { id: true, key: true } })).map(m => [m.id, m.key]))
  const metrics = claimByKey(incoming, own)
  const kept = metrics.filter((m): m is MetricInput & { id: number } => m.id !== null && own.has(m.id))
  await tx.metric.deleteMany({ where: { projectId, id: { notIn: kept.map(m => m.id) } } })
  for (const m of kept) {
    if (own.get(m.id) !== m.data.key) await tx.metric.update({ where: { id: m.id }, data: { key: `~${m.id}` } })
  }
  for (const m of metrics) {
    const row = m.id !== null && own.has(m.id)
      ? await tx.metric.update({ where: { id: m.id }, data: m.data, select: { id: true } })
      : await tx.metric.create({ data: { ...m.data, projectId }, select: { id: true } })
    if (m.en) await saveMetricEn(tx, row.id, m.en)
  }
}
