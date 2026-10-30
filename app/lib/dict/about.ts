/** Sobre mí (P4): rótulos de la página y del acceso al CV. El contenido sale de about, contact y /api/experience. */
import type { DictEntry } from './index'

export default {
  'about.facts': { es: 'En breve', en: 'At a glance' },
  'about.education': { es: 'Formación', en: 'Education' },
  'about.degree': { es: 'Título técnico', en: 'Technical degree' },
  'about.higherEducation': { es: 'Formación superior', en: 'Higher education' },
  'about.languages': { es: 'Idiomas', en: 'Languages' },
  'about.modalities': { es: 'Modalidades', en: 'Work arrangements' },
  'about.goal': { es: 'Hacia dónde voy', en: 'Where I’m headed' },
  'about.timeline': { es: 'Trayectoria', en: 'Career' },
  'about.works': { es: 'Obra', en: 'Work' },
  'about.availability': { es: 'Disponibilidad', en: 'Availability' },
  'about.viewCv': { es: 'Ver CV', en: 'View résumé' },
  'about.cvFormat': { es: 'Harvard ATS · una página A4', en: 'Harvard ATS · one A4 page' },
  'about.closeCv': { es: 'Volver a Sobre mí', en: 'Back to About' },
} satisfies Record<string, DictEntry>
