/** Blog (/articles y /articles/:slug). Dueño desde la ola 5: P5. Títulos, resúmenes y cuerpos salen de la base. */
import type { DictEntry } from './index'

export default {
  'articles.title': { es: 'Artículos', en: 'Articles' },
  'articles.count.one': { es: '{n} artículo', en: '{n} article' },
  'articles.count.other': { es: '{n} artículos', en: '{n} articles' },
  'articles.readingTime': { es: '{n} min de lectura', en: '{n} min read' },
  'articles.back': { es: 'Todos los artículos', en: 'All articles' },
  'articles.empty': { es: 'Todavía no hay artículos publicados.', en: 'No articles published yet.' },
  'articles.noMatch': { es: 'Ningún artículo coincide con este filtro.', en: 'No article matches this filter.' },
  'articles.filtered': { es: 'Con {name}', en: 'With {name}' },
  'articles.clear': { es: 'Ver todos', en: 'See all' },
  'articles.published': { es: 'Publicado', en: 'Published' },
  'articles.reading': { es: 'Lectura', en: 'Reading' },
  'articles.techs': { es: 'Tecnologías', en: 'Technologies' },
  'articles.project': { es: 'Obra relacionada', en: 'Related work' },
  'articles.more': { es: 'Más artículos', en: 'More articles' },
  'articles.previous': { es: 'Anterior', en: 'Previous' },
  'articles.next': { es: 'Siguiente', en: 'Next' },
  'articles.code': { es: 'Código', en: 'Code' },
  'articles.codeLang': { es: 'Código {lang}', en: '{lang} code' },
} satisfies Record<string, DictEntry>
