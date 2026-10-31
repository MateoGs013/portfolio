/** Inicio (P1): rótulos de la obra seleccionada y del titular. Los textos salen de la base. */
import type { DictEntry } from './index'

export default {
  'home.featured': { es: 'Obra seleccionada', en: 'Selected work' },
  'home.allWork': { es: 'Ver toda la obra ({n})', en: 'See all work ({n})' },
  'home.availability': { es: 'Disponibilidad', en: 'Availability' },
} satisfies Record<string, DictEntry>
