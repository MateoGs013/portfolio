/** Blog (/articles). F1 deja lo mínimo; dueño desde la ola 5: P5. */
import type { DictEntry } from './index'

export default {
  'articles.title': { es: 'Artículos', en: 'Articles' },
  'articles.readingTime': { es: '{n} min de lectura', en: '{n} min read' },
  'articles.back': { es: 'Todos los artículos', en: 'All articles' },
} satisfies Record<string, DictEntry>
