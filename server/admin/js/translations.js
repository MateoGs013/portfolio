// Portfolio CMS 2026 · Inglés de cada registro
// El español vive en el registro; el inglés, en sus filas *Translation (o en el `en` de cada campo
// de un Doc). Acá se pasa de la API al formulario y de vuelta, y se calcula qué falta traducir con
// la misma regla que la API pública (`untranslated`): hay texto en español y no hay en inglés.

/** Secciones con inglés editable desde el selector ES|EN. */
export const TRANSLATABLE_SECTIONS = ['projects', 'experience', 'stack', 'docs']

export const PROJECT_EN = ['title', 'role', 'summary', 'brief', 'outcome']
export const STEP_EN = ['title', 'body']
export const LINK_EN = ['label']
export const EXPERIENCE_EN = ['role', 'summary', 'story', 'location']
export const TECH_EN = ['note']

/** Tipos de bloque de un Doc que se traducen (la API pública no lista los demás como pendientes). */
const DOC_PROSE = ['string', 'text', 'list']
/** Tipos de bloque con input EN en el editor (url también: el enlace puede cambiar por idioma). */
export const DOC_EN_TYPES = ['string', 'text', 'markdown', 'url', 'list']

const NL = '\n'

/** Fila en inglés de un registro de la API, o un objeto vacío. */
export const enRow = r => (r?.translations || []).find(t => t.locale === 'en') || {}

/** Fila *Translation → textos editables ('' en vez de null). */
export const enForm = (r, fields) => {
  const t = enRow(r)
  return Object.fromEntries(fields.map(f => [f, t[f] == null ? '' : String(t[f])]))
}

/** Textos editables → `translations` del payload; un campo vacío viaja como null. */
export const enPayload = (en, fields, extra = {}) => ({
  en: { ...Object.fromEntries(fields.map(f => [f, String(en?.[f] || '').trim() || null])), ...extra },
})

export const blankEn = fields => Object.fromEntries(fields.map(f => [f, '']))

/** Valor de un campo como texto (una lista se muestra un ítem por renglón). */
export const asText = v => (Array.isArray(v) ? v.join(NL) : (v == null ? '' : String(v)))

const filled = v => (Array.isArray(v) ? v.some(x => String(x).trim()) : String(v ?? '').trim() !== '')

const PROJECT_LABELS = { role: 'Rol', summary: 'Síntesis', brief: 'Reto', outcome: 'Resultado' }
const EXPERIENCE_LABELS = { role: 'Cargo', summary: 'Síntesis', story: 'Historia', location: 'Lugar', highlights: 'Viñetas del CV' }

const pair = (label, es, en) => ({ label, es, en })

/** Pares español/inglés de una obra en forma de formulario. El título es nombre propio: no cuenta. */
function projectPairs(f) {
  const own = Object.entries(PROJECT_LABELS).map(([k, label]) => pair(label, f[k], f.en?.[k]))
  const steps = (f.steps || []).flatMap((s, i) => [
    pair(`Paso ${i + 1} · título`, s.title, s.en?.title),
    pair(`Paso ${i + 1} · texto`, s.body, s.en?.body),
  ])
  const links = (f.links || []).map((l, i) => pair(`Enlace ${i + 1}`, l.label, l.en?.label))
  const media = (f.media || []).flatMap((m, i) => {
    const t = enRow(m)
    return [pair(`Media ${i + 1} · alt`, m.alt, t.alt), pair(`Media ${i + 1} · pie`, m.caption, t.caption)]
  })
  return [...own, ...steps, ...links, ...media]
}

function pairs(section, f) {
  if (!f) return []
  if (section === 'projects') return projectPairs(f)
  if (section === 'experience') return Object.entries(EXPERIENCE_LABELS).map(([k, label]) => pair(label, f[k], f.en?.[k]))
  if (section === 'stack') return [pair('Criterio', f.note, f.en?.note)]
  if (section === 'docs') return (f.fields || []).filter(b => DOC_PROSE.includes(b.type)).map(b => pair(b.name, b.value, b.en))
  return []
}

/** Rótulos de los campos con español y sin inglés, en forma de formulario. */
export const missingEn = (section, form) => pairs(section, form).filter(p => filled(p.es) && !filled(p.en)).map(p => p.label)

/** Una línea para el `title` y el texto accesible de la marca «sin traducir». */
export const missingText = labels => (labels.length === 1
  ? `Falta traducir 1 campo: ${labels[0]}`
  : `Faltan traducir ${labels.length} campos: ${labels.join(', ')}`)
