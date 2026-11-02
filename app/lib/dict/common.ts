/**
 * Vocabulario que comparten todas las áreas: estados, tipos de experiencia, categorías de tecnología,
 * métricas (qué son y qué miden), unidades e idiomas. Dueño: F1.
 *
 * Los rótulos de los enums de la base (estado, tipo, categoría y unidad) viven en
 * server/src/shared/labels.ts y el catálogo de métricas en server/src/shared/metricKeys.ts, que también
 * usa el admin: acá se reexportan con sus claves de siempre.
 */
import { experienceKindLabels, metricUnitFormats, prefixed, projectStatusLabels, techCategoryLabels } from '../../../server/src/shared/labels.js'
import { metricDictEntries } from '../../../server/src/shared/metricKeys.js'
import type { DictEntry } from './index'

export default {
  ...prefixed('status', projectStatusLabels),
  ...prefixed('kind', experienceKindLabels),
  ...prefixed('category', techCategoryLabels),

  ...metricDictEntries(),

  ...prefixed('unit', metricUnitFormats),

  'lang.es': { es: 'Español', en: 'Spanish' },
  'lang.en': { es: 'Inglés', en: 'English' },
  'common.remote': { es: 'Remoto', en: 'Remote' },
  'common.present': { es: 'Presente', en: 'Present' },
  'common.untranslated': { es: 'Sin traducir', en: 'Not translated yet' },
} satisfies Record<string, DictEntry>
