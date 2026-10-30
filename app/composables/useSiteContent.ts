/**
 * Documentos del sitio (`about`, `contact`) como mapa nombre → valor, ya resuelto en el idioma de la
 * página. Una clave por documento e idioma: cabecera, pie, SEO y páginas comparten la misma carga.
 */
import type { Doc, DocFieldValue, DocKey } from '~/lib/api'
import { cachedApiData } from './useApi'

export interface SiteDoc {
  /** `about.headline`, `contact.email`… Un campo vacío no está en el mapa. */
  values: Record<string, DocFieldValue>
  /** Campos que en inglés quedaron en español (para `lang="es"`). */
  untranslated: string[]
  updatedAt: string
}

function toSiteDoc(doc: Doc): SiteDoc {
  const values: Record<string, DocFieldValue> = {}
  for (const field of doc.fields) {
    const value = field.value as DocFieldValue
    if (Array.isArray(value) ? value.length > 0 : value.trim() !== '') values[field.name] = value
  }
  return { values, untranslated: doc.untranslated, updatedAt: doc.updatedAt }
}

export function useDoc(key: DocKey) {
  const { get, lang } = useApi()
  const cacheKey = computed(() => `doc:${key}:${lang.value}`)
  return useAsyncData(cacheKey, () => get<Doc>(`/docs/${key}`).then(r => toSiteDoc(r.data)), {
    getCachedData: cachedApiData,
  })
}

/** Un valor de documento como texto: las listas se unen con « · ». */
export function docText(doc: SiteDoc | null | undefined, name: string): string | null {
  const value = doc?.values[name]
  if (value === undefined) return null
  return Array.isArray(value) ? value.join(' · ') : value
}

/** Un valor de documento como lista: el texto suelto es una lista de un elemento. */
export function docList(doc: SiteDoc | null | undefined, name: string): string[] {
  const value = doc?.values[name]
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}
