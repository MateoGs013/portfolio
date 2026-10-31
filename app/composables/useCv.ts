/**
 * CV Harvard ATS desde la base: el documento compuesto por `/api/cv` y los PDF publicados por
 * idioma (`contact.cv`). El visor, las descargas y el script del PDF leen lo mismo; acá no hay
 * contenido, solo de dónde sale.
 */
import type { CvDocument, Doc } from '~/lib/api'
import { langs, type Lang } from '~/lib/dict'
import { cachedApiData } from './useApi'

/** El CV del idioma de la página. */
export function useCv() {
  const { get, lang } = useApi()
  const key = computed(() => `cv:${lang.value}`)
  return useAsyncData(key, () => get<CvDocument>('/cv').then(r => r.data), { getCachedData: cachedApiData })
}

/** Un PDF publicado: la ruta pública y el nombre con el que se guarda. */
export interface CvFile {
  href: string
  name: string
}

export type CvFiles = Partial<Record<Lang, CvFile>>

/** `contact.cv` en un idioma, o nada si el campo está vacío. */
function cvFileOf(doc: Doc): CvFile | undefined {
  const value = doc.fields.find(field => field.name === 'cv')?.value
  const href = typeof value === 'string' ? value.trim() : ''
  if (!href) return undefined
  return { href, name: href.split('/').pop() ?? href }
}

/**
 * Los PDF de los dos idiomas, para descargar el del idioma activo y enlazar el otro. Una sola clave:
 * la respuesta no depende del idioma de la página.
 */
export function useCvFiles() {
  const { get } = useApi()
  return useAsyncData('cv:files', async () => {
    const docs = await Promise.all(langs.map(l => get<Doc>('/docs/contact', {}, l).then(r => [l, cvFileOf(r.data)] as const)))
    const files = Object.fromEntries(docs.filter(([, file]) => file)) as CvFiles
    // Sin PDF propio en inglés, la API repite el de ES: no se ofrece como «el otro idioma».
    if (files.es && files.en?.href === files.es.href) delete files.en
    return files
  }, { getCachedData: cachedApiData })
}

/** Nombre del archivo sin extensión: el título del documento mientras se imprime. */
export function cvBaseName(file: CvFile | undefined): string | undefined {
  return file?.name.replace(/\.pdf$/i, '')
}
