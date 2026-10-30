/**
 * CV Harvard ATS (F6): títulos de sección, rótulos de habilidades y la barra de descarga. Los títulos
 * son los que reconoce un ATS y coinciden con los del generador del Job Hunter (server/src/admin/hunterCv.ts).
 */
import type { DictEntry } from './index'

export default {
  'cv.title': { es: 'Currículum', en: 'Résumé' },
  'cv.summary': { es: 'Perfil profesional', en: 'Professional summary' },
  'cv.experience': { es: 'Experiencia', en: 'Experience' },
  'cv.education': { es: 'Educación', en: 'Education' },
  'cv.skills': { es: 'Habilidades técnicas', en: 'Technical skills' },
  'cv.languages': { es: 'Idiomas', en: 'Languages' },
  'cv.techs': { es: 'Tecnologías', en: 'Technologies' },
  'cv.contact': { es: 'Contacto', en: 'Contact' },
  'cv.actions': { es: 'Acciones del currículum', en: 'Résumé actions' },
  'cv.download': { es: 'Descargar PDF', en: 'Download PDF' },
  'cv.downloadHint': { es: 'Descargar {file}', en: 'Download {file}' },
  'cv.otherPdf': { es: 'PDF en español', en: 'PDF in English' },
  'cv.print': { es: 'Imprimir', en: 'Print' },
  'cv.printHint': { es: 'Imprimir o guardar como PDF, una página A4', en: 'Print or save as PDF, one A4 page' },
  // «Languages» del CV son los idiomas: la categoría de tecnologías se nombra distinto para un ATS.
  'cv.skill.LANGUAGE': { es: 'Lenguajes', en: 'Programming languages' },
  'cv.skill.FRAMEWORK': { es: 'Frameworks', en: 'Frameworks' },
  'cv.skill.MOTION': { es: 'Animación', en: 'Animation' },
  'cv.skill.GRAPHICS': { es: 'Gráficos', en: 'Graphics' },
  'cv.skill.BACKEND': { es: 'Backend y APIs', en: 'Backend & APIs' },
  'cv.skill.DATA': { es: 'Bases de datos', en: 'Databases' },
  'cv.skill.TOOLING': { es: 'Herramientas', en: 'Tooling' },
  'cv.skill.DESIGN': { es: 'Diseño', en: 'Design' },
} satisfies Record<string, DictEntry>
