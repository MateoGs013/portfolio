// Portfolio CMS 2026 · Campos del rediseño
// Visibilidad, rótulos de enums, métricas tipadas (filas Metric) y orden de la media.

/** Una obra se ve en el sitio si tiene fecha de publicación y esa fecha ya pasó. */
export const isPublished = r => !!r.publishedAt && new Date(r.publishedAt).getTime() <= Date.now()

export const MEDIA_ROLE_LABELS = { COVER: 'Portada', GALLERY: 'Galería' }
export const MEDIA_VIEWPORT_LABELS = { DESKTOP: 'Escritorio', MOBILE: 'Celular' }

export const EXPERIENCE_KIND_LABELS = {
  EDUCATION: 'Formación',
  THESIS: 'Tesis',
  FREELANCE: 'Freelance',
  CLIENT: 'Cliente',
  PERSONAL: 'Proyecto propio',
}

/** Rótulos de Metric.unit. Sin unidad, el valor es un conteo o un puntaje. */
export const METRIC_UNIT_LABELS = {
  s: 'segundos (s)',
  ms: 'milisegundos (ms)',
  kb: 'kilobytes (kB)',
  fps: 'cuadros por segundo',
  h: 'horas (h)',
  req_day: 'pedidos por día',
  usd_month: 'USD por mes',
}

/** Viñetas del CV por entrada: hasta 3 de 160 caracteres (la cota de una página A4). */
export const HIGHLIGHTS_MAX = 3
export const HIGHLIGHT_CHARS = 160

const dateOnly = iso => (iso ? String(iso).slice(0, 10) : '')

/** Fila Metric de la API → fila editable. `value` llega como Decimal en texto ('0.8000'). */
export const metricToForm = m => ({
  key: m.key || '',
  mode: (m.items || []).length ? 'list' : 'number',
  value: m.value == null ? '' : Number(m.value),
  items: (m.items || []).join('\n'),
  unit: m.unit || '',
  label: m.label || '',
  source: m.source || '',
  measuredAt: dateOnly(m.measuredAt),
})

export const blankMetric = (key = '', unit = '') => ({
  key, mode: 'number', value: '', items: '', unit, label: '', source: '', measuredAt: '',
})

/** Fila editable → lo que valida el server: un número con unidad o una lista, nunca las dos. */
export const metricToPayload = (m) => {
  const isList = m.mode === 'list'
  return {
    key: (m.key || '').trim(),
    value: isList || m.value === '' || m.value == null ? null : m.value,
    items: isList ? String(m.items || '').split('\n').map(x => x.trim()).filter(Boolean) : [],
    unit: isList ? null : (m.unit || null),
    label: m.label || null,
    source: m.source || null,
    measuredAt: m.measuredAt || null,
  }
}

/** Mismo orden que la API: portadas primero, después por `order` y por id. */
export const sortMedia = rows => [...rows].sort((a, b) =>
  (a.role === b.role ? 0 : a.role === 'COVER' ? -1 : 1) || (a.order - b.order) || (a.id - b.id))

export const fileName = src => String(src || '').split('/').pop()

export const formatBytes = (n) => {
  if (!n) return ''
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`
}
