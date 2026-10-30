/** Caso (/projects/:slug). F1 deja lo mínimo; dueño desde la ola 5: P3. */
import type { DictEntry } from './index'

export default {
  'case.role': { es: 'Rol', en: 'Role' },
  'case.year': { es: 'Año', en: 'Year' },
  'case.client': { es: 'Cliente', en: 'Client' },
  'case.status': { es: 'Estado', en: 'Status' },
  'case.brief': { es: 'Encargo', en: 'Brief' },
  'case.process': { es: 'Proceso', en: 'Process' },
  'case.outcome': { es: 'Resultado', en: 'Outcome' },
  'case.gallery': { es: 'Galería', en: 'Gallery' },
  'case.metrics': { es: 'Métricas', en: 'Metrics' },
  'case.stack': { es: 'Tecnologías', en: 'Technologies' },
  'case.links': { es: 'Enlaces', en: 'Links' },
  'case.next': { es: 'Siguiente', en: 'Next' },
  'case.measuredAt': { es: 'Medido el {date}', en: 'Measured on {date}' },
} satisfies Record<string, DictEntry>
