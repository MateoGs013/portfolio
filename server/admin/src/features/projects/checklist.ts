/**
 * Lo que conviene que tenga una obra antes de publicarla, para el panel de publicación. Cada ítem
 * lleva a su campo con ?campo=. El inglés se pide campo por campo y solo donde ya hay español, con la
 * regla de la API pública (server/src/admin/translations.ts): el título es un nombre propio y no se
 * pide. Las imágenes se miran en el formulario: una pieza en cola cuenta, porque sube con el Guardar.
 */
import type { ChecklistItem } from '../../models/types'
import { projectsText } from './dict'
import type { MediaForm, ProjectForm } from './types'

const t = projectsText.checklist
const filled = (text: string | null | undefined) => !!text?.trim()

/** Los textos de la obra que se traducen, con el nombre con que se los ve en el editor. */
const TRANSLATED = [
  ['role', projectsText.essentials.role],
  ['summary', projectsText.story.summary],
  ['brief', projectsText.story.brief],
  ['outcome', projectsText.story.outcome],
] as const

/** La primera ruta de un paso con español y sin inglés, o null si está completo. */
function stepMissingEnglish(form: ProjectForm, index: number): string | null {
  const step = form.steps[index]!
  for (const name of ['title', 'body'] as const) {
    if (filled(step[name]) && !filled(step.translations.en[name])) return `steps[${index}].translations.en.${name}`
  }
  return null
}

function englishItems(form: ProjectForm): ChecklistItem[] {
  const own = TRANSLATED
    .filter(([name]) => filled(form[name]))
    .map(([name, label]) => ({
      id: `en-${name}`,
      label: t.english(label),
      done: filled(form.translations.en[name]),
      field: `translations.en.${name}`,
    }))
  const steps = form.steps.map((_, i) => {
    const missing = stepMissingEnglish(form, i)
    const field = missing ?? `steps[${i}].translations.en.title`
    return { id: `en-step-${i}`, label: t.stepEnglish(i + 1), done: missing === null, field }
  })
  return [...own, ...steps]
}

function mediaItems(media: readonly MediaForm[]): ChecklistItem[] {
  const cover = { id: 'cover', label: t.cover, done: media.some(m => m.role === 'COVER'), field: 'media' }
  if (!media.length) return [cover]
  const missing = media.findIndex(m => !filled(m.alt) || !filled(m.translations.en.alt))
  const field = missing === -1 ? 'media' : `media[${missing}].${filled(media[missing]!.alt) ? 'translations.en.alt' : 'alt'}`
  return [cover, { id: 'alt', label: t.alt, done: missing === -1, field }]
}

export function projectChecklist(form: ProjectForm): ChecklistItem[] {
  return [
    { id: 'role', label: t.role, done: filled(form.role), field: 'role' },
    { id: 'summary', label: t.summary, done: filled(form.summary), field: 'summary' },
    { id: 'brief', label: t.brief, done: filled(form.brief), field: 'brief' },
    { id: 'outcome', label: t.outcome, done: filled(form.outcome), field: 'outcome' },
    ...mediaItems(form.media),
    ...englishItems(form),
  ]
}
