/** SEO: plantillas de título y del texto alternativo de la imagen OG. Los nombres y las descripciones salen de la base. Dueño desde la ola 6: X3. */
import type { DictEntry } from './index'

export default {
  'seo.title': { es: '{page} · {site}', en: '{page} · {site}' },
  // La imagen OG por defecto muestra el nombre y el titular: el alt dice lo mismo.
  'seo.ogAlt': { es: '{site}. {headline}', en: '{site}. {headline}' },
} satisfies Record<string, DictEntry>
