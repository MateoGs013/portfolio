/** Obra (/projects): facetas, galería y conteo. Dueño: P2. */
import type { DictEntry } from './index'

export default {
  'work.filters': { es: 'Filtrar la obra', en: 'Filter the work' },
  'work.all': { es: 'Todas', en: 'All' },
  'work.stack': { es: 'Con {name}', en: 'With {name}' },
  'work.clearStack': { es: 'Quitar el filtro {name}', en: 'Remove the {name} filter' },
  'work.gallery': { es: 'Obras', en: 'Works' },
  'work.count.one': { es: '{n} obra', en: '{n} work' },
  'work.count.other': { es: '{n} obras', en: '{n} works' },
  'work.empty': { es: 'Ninguna obra coincide con este filtro.', en: 'No work matches this filter.' },
  'work.clear': { es: 'Ver toda la obra', en: 'See all the work' },
} satisfies Record<string, DictEntry>
