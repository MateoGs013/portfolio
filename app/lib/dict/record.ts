/**
 * Vista registro (tecla R; docs/diseno.md §2.1). Dueño desde la ola 4: F5. Los nombres de campo, los
 * tipos y `NULL` son identificadores del esquema y no se traducen; acá solo va lo que se lee en prosa.
 */
import type { DictEntry } from './index'

export default {
  'record.label': { es: 'Registro', en: 'Record' },
  'record.toRecord': { es: 'Ver como registro', en: 'View as record' },
  'record.toDesign': { es: 'Ver como diseño', en: 'View as design' },
  'record.null': { es: 'NULL', en: 'NULL' },
  'record.collection': { es: 'colección {model} · {count}', en: 'collection {model} · {count}' },
  'record.count.one': { es: '{n} registro', en: '{n} record' },
  'record.count.other': { es: '{n} registros', en: '{n} records' },
} satisfies Record<string, DictEntry>
