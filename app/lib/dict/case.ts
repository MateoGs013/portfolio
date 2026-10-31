/** Caso (/projects/:slug). Dueño desde la ola 5: P3. Solo interfaz: el contenido sale de la API. */
import type { DictEntry } from './index'

export default {
  'case.role': { es: 'Rol', en: 'Role' },
  'case.year': { es: 'Año', en: 'Year' },
  'case.client': { es: 'Cliente', en: 'Client' },
  'case.status': { es: 'Estado', en: 'Status' },
  'case.brief': { es: 'Encargo', en: 'Brief' },
  'case.process': { es: 'Proceso', en: 'Process' },
  'case.outcome': { es: 'Resultado', en: 'Outcome' },
  'case.phone': { es: 'En el teléfono', en: 'On the phone' },
  'case.metrics': { es: 'Métricas', en: 'Metrics' },
  'case.stack': { es: 'Tecnologías', en: 'Technologies' },
  'case.links': { es: 'Enlaces', en: 'Links' },
  'case.next': { es: 'Siguiente', en: 'Next' },
  'case.asRecord': { es: 'Velo como registro', en: 'See it as a record' },
  'case.measuredAt': { es: 'Medido el {date}', en: 'Measured on {date}' },
  'case.source': { es: 'Fuente: {source}', en: 'Source: {source}' },
  'case.peek.open': { es: 'Asomar: {name}', en: 'Peek: {name}' },
  'case.peek.since': { es: 'Desde {year}', en: 'Since {year}' },
  'case.peek.years.one': { es: '{n} año', en: '{n} year' },
  'case.peek.years.other': { es: '{n} años', en: '{n} years' },
  'case.peek.alsoIn': { es: 'También en {works}', en: 'Also in {works}' },
  'case.peek.onlyHere': { es: 'Por ahora, solo en esta obra', en: 'Only in this work for now' },
} satisfies Record<string, DictEntry>
