/** CV Harvard ATS. F1 deja lo mínimo; dueño desde la ola 4: F6. */
import type { DictEntry } from './index'

export default {
  'cv.title': { es: 'Currículum', en: 'Résumé' },
  'cv.summary': { es: 'Perfil', en: 'Profile' },
  'cv.experience': { es: 'Experiencia', en: 'Experience' },
  'cv.education': { es: 'Formación', en: 'Education' },
  'cv.skills': { es: 'Habilidades', en: 'Skills' },
  'cv.languages': { es: 'Idiomas', en: 'Languages' },
  'cv.download': { es: 'Descargar PDF', en: 'Download PDF' },
  'cv.print': { es: 'Imprimir', en: 'Print' },
} satisfies Record<string, DictEntry>
