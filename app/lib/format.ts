/**
 * Formato de fechas, cifras y unidades según el idioma activo. Las cifras salen de la base; acá solo
 * se decide cómo se escriben (separadores, unidad y «Presente»).
 */
import type { Metric } from './api'
import { isDictKey, translate, type Lang } from './dict'

const numberLocale: Record<Lang, string> = { es: 'es-AR', en: 'en-US' }

/** 'YYYY-MM-DD' (o ISO completo) → 'MM/AAAA'. */
function monthYear(day: string): string {
  const [year, month] = day.slice(0, 10).split('-')
  return `${month}/${year}`
}

/** Período de una experiencia: `MM/AAAA – MM/AAAA`, o `MM/AAAA – Presente` si sigue en curso. */
export function period(start: string, end: string | null, lang: Lang): string {
  const to = end ? monthYear(end) : translate('common.present', lang)
  return `${monthYear(start)} – ${to}`
}

/** Un número con los separadores del idioma, sin ceros decimales de más. */
export function number(value: number, lang: Lang, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat(numberLocale[lang], { maximumFractionDigits }).format(value)
}

/**
 * Valor de una métrica con su unidad: `0,8 s`, `42 KB`, `1500/día`, `US$ 0/mes`. Sin unidad es un
 * conteo o un puntaje y va solo el número.
 */
export function metric(value: number, unit: string | null, lang: Lang): string {
  if (unit === 'usd_month') {
    const money = new Intl.NumberFormat(numberLocale[lang], { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value)
    return translate('unit.usd_month', lang, { n: money })
  }
  const n = number(value, lang)
  const key = `unit.${unit}`
  return unit && isDictKey(key) ? translate(key, lang, { n }) : n
}

/** El valor visible de una fila Metric: el número con su unidad o la lista (`ES · EN · DE`). */
export function metricValue(m: Pick<Metric, 'value' | 'items' | 'unit'>, lang: Lang): string | null {
  if (m.value !== null) return metric(m.value, m.unit, lang)
  return m.items.length ? m.items.join(' · ') : null
}

/** El rótulo de una métrica: el del diccionario o, si la clave es nueva, el que se cargó en el admin. */
export function metricLabel(m: Pick<Metric, 'key' | 'label'>, lang: Lang): string {
  const key = `metric.${m.key}.label`
  return isDictKey(key) ? translate(key, lang) : (m.label ?? m.key)
}

/** Qué mide la métrica (para «Asomar»), o null si la clave no está en el diccionario. */
export function metricDescription(m: Pick<Metric, 'key'>, lang: Lang): string | null {
  const key = `metric.${m.key}.desc`
  return isDictKey(key) ? translate(key, lang) : null
}

/** Años completos desde una fecha ('YYYY-MM-DD', ISO o un año) hasta hoy. */
export function yearsSince(date: string | number, now: Date = new Date()): number {
  const from = typeof date === 'number' ? new Date(Date.UTC(date, 0, 1)) : new Date(date)
  let years = now.getUTCFullYear() - from.getUTCFullYear()
  const beforeAnniversary = now.getUTCMonth() < from.getUTCMonth()
    || (now.getUTCMonth() === from.getUTCMonth() && now.getUTCDate() < from.getUTCDate())
  if (beforeAnniversary) years -= 1
  return Math.max(0, years)
}
