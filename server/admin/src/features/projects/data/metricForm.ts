/**
 * Las métricas de una obra en el formulario y en el body del PUT (server/src/admin/metrics.ts): un
 * número con unidad o una lista, nunca las dos; fuente y fecha; y el rótulo propio con su inglés solo
 * para una clave fuera del catálogo (/meta.metricKeys). Las del catálogo usan el rótulo del sitio, así
 * que su rótulo guardado viaja tal cual, sin pedirse ni mostrarse.
 */
import type { FieldIssue } from '@shared/adminContracts'
import { meta } from '../../../stores/meta'
import type { AdminMetric, MetricForm } from '../types'
import { dataText } from './dict'

/** La misma regla que el servidor: junta, sin espacios ni acentos, empezando con una letra. */
export const METRIC_KEY = /^[a-zA-Z][a-zA-Z0-9_]{0,47}$/
const DECIMAL = /^-?\d{1,10}(?:\.\d{1,4})?$/
export const LABEL_MAX = 80
const ITEMS_MAX = 20
const ITEM_MAX = 120

const text = (value: string | null | undefined) => value ?? ''
const trimmed = (value: string) => value.trim() || null

export function inCatalog(key: string): boolean {
  return meta.value?.metricKeys.catalog.some(k => k.key === key) ?? false
}

export function metricFormOf(m: AdminMetric): MetricForm {
  return {
    id: m.id,
    key: m.key,
    kind: m.items.length ? 'items' : 'value',
    value: m.value === null ? '' : String(Number(m.value)),
    unit: m.unit,
    items: m.items.join('\n'),
    label: text(m.label),
    source: text(m.source),
    measuredAt: m.measuredAt ? m.measuredAt.slice(0, 10) : '',
    translations: { en: { label: text(m.translations[0]?.label) } },
  }
}

export function blankMetric(): MetricForm {
  return { id: null, key: '', kind: 'value', value: '', unit: null, items: '', label: '', source: '', measuredAt: '', translations: { en: { label: '' } } }
}

/** «0,8» se escribe como «0.8»: el número viaja con punto, como lo espera el servidor. */
export const numberText = (value: string) => value.trim().replace(',', '.')

export const itemsOf = (value: string) => value.split(/\r?\n/).map(x => x.trim()).filter(Boolean)

export function metricPayload(m: MetricForm) {
  const isValue = m.kind === 'value'
  return {
    id: m.id,
    key: m.key.trim(),
    value: isValue ? (numberText(m.value) || null) : null,
    unit: isValue && numberText(m.value) ? m.unit : null,
    items: isValue ? [] : itemsOf(m.items),
    label: trimmed(m.label),
    source: trimmed(m.source),
    measuredAt: m.measuredAt || null,
    translations: { en: { label: m.translations.en.label.trim() } },
  }
}

function keyIssues(m: MetricForm, i: number, seen: Set<string>): FieldIssue[] {
  const t = dataText.metrics.issues
  const key = m.key.trim()
  const path = `metrics[${i}].key`
  if (!key) return [{ path, message: t.key(i + 1) }]
  if (!METRIC_KEY.test(key)) return [{ path, message: t.keyFormat(i + 1) }]
  if (seen.has(key)) return [{ path, message: t.repeated(i + 1) }]
  seen.add(key)
  if (inCatalog(key)) return []
  const issues: FieldIssue[] = []
  if (!m.label.trim()) issues.push({ path: `metrics[${i}].label`, message: t.label(i + 1) })
  if (!m.translations.en.label.trim()) issues.push({ path: `metrics[${i}].translations.en.label`, message: t.labelEn(i + 1) })
  if (m.label.length > LABEL_MAX) issues.push({ path: `metrics[${i}].label`, message: t.long(i + 1, LABEL_MAX) })
  if (m.translations.en.label.length > LABEL_MAX) issues.push({ path: `metrics[${i}].translations.en.label`, message: t.long(i + 1, LABEL_MAX) })
  return issues
}

function valueIssues(m: MetricForm, i: number): FieldIssue[] {
  const t = dataText.metrics.issues
  if (m.kind === 'value') {
    const value = numberText(m.value)
    if (!value) return [{ path: `metrics[${i}].value`, message: t.value(i + 1) }]
    return DECIMAL.test(value) ? [] : [{ path: `metrics[${i}].value`, message: t.number(i + 1) }]
  }
  const items = itemsOf(m.items)
  if (!items.length) return [{ path: `metrics[${i}].items`, message: t.items(i + 1) }]
  if (items.length > ITEMS_MAX || items.some(x => x.length > ITEM_MAX)) return [{ path: `metrics[${i}].items`, message: t.itemsMax(i + 1, ITEMS_MAX, ITEM_MAX) }]
  return []
}

export function metricIssues(list: readonly MetricForm[]): FieldIssue[] {
  const seen = new Set<string>()
  return list.flatMap((m, i) => [...keyIssues(m, i, seen), ...valueIssues(m, i)])
}
