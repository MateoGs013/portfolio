/**
 * Las opciones de «Qué se mide», siempre con un rótulo humano: el catálogo de /meta (las que más usan
 * las otras obras primero), las claves sin catálogo que ya tienen un rótulo cargado y, al final, «Otra
 * cifra, con rótulo propio». Una clave sin rótulo nunca aparece suelta en la lista, y la clave en sí
 * no se muestra: es un dato técnico que se ve en «Ver JSON».
 */
import { computed } from 'vue'
import { meta } from '../../../stores/meta'
import type { SelectOption } from '../../../ui/field'
import { dataText } from './dict'

export const OTHER = '~otra'

const sentence = (text: string) => text.trim().replace(/\.$/, '')

export const keyOptions = computed<SelectOption<string>[]>(() => {
  const keys = meta.value?.metricKeys
  if (!keys) return [{ value: OTHER, label: dataText.metrics.other }]
  const catalog = [...keys.catalog]
    .sort((a, b) => b.uses - a.uses || a.label.es.localeCompare(b.label.es, 'es'))
    .map(k => ({ value: k.key, label: `${k.label.es} · ${sentence(k.desc.es)}` }))
  const unlisted = keys.unlisted
    .filter((k): k is typeof k & { label: string } => !!k.label?.trim())
    .map(k => ({ value: k.key, label: k.label }))
  return [...catalog, ...unlisted, { value: OTHER, label: dataText.metrics.other }]
})

/** El rótulo que ya tiene una clave sin catálogo en otra obra, para no escribirlo de nuevo. */
export function knownLabel(key: string): string | null {
  return meta.value?.metricKeys.unlisted.find(k => k.key === key)?.label ?? null
}

/** Qué mide una clave del catálogo, para la ayuda del campo. */
export function keyDescription(key: string): string | null {
  return meta.value?.metricKeys.catalog.find(k => k.key === key)?.desc.es ?? null
}

/** La unidad que sugiere el nombre de la clave, para no elegirla a mano: bundleSizeKb → kb. */
export function unitFor(key: string): string | null {
  if (/Kb$/.test(key)) return 'kb'
  if (/Ms$/.test(key)) return 'ms'
  if (key === 'lcp') return 's'
  if (/^fps|Fps$/.test(key)) return 'fps'
  return null
}

/** El nombre de una métrica en su fila: el rótulo del catálogo, el propio o el que ya tiene en otra obra. */
export function metricTitle(key: string, label: string): string {
  return meta.value?.metricKeys.catalog.find(k => k.key === key)?.label.es ?? (label.trim() || knownLabel(key) || '')
}
